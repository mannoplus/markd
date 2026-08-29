/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AiChatMessage, AiChatContext, ParsedMovieIntent } from './types';

const DEFAULT_FREE_MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'minimax/minimax-m3:free',
  'minimax/minimax-m2.7:free',
  'z-ai/glm-5.2:free',
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-r1:free',
];

export class OpenRouterProvider {
  private apiKey: string;
  private primaryModel: string;
  private modelList: string[];

  constructor(apiKey?: string, models?: string | string[]) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';

    // Parse model configuration (supports comma-separated string or array)
    const envModels = process.env.OPENROUTER_MODELS || process.env.OPENROUTER_MODEL;
    if (Array.isArray(models) && models.length > 0) {
      this.modelList = models;
    } else if (typeof models === 'string' && models.trim()) {
      this.modelList = models.split(',').map((m) => m.trim()).filter(Boolean);
    } else if (envModels && envModels.trim()) {
      this.modelList = envModels.split(',').map((m) => m.trim()).filter(Boolean);
    } else {
      this.modelList = DEFAULT_FREE_MODELS;
    }

    this.primaryModel = this.modelList[0] || DEFAULT_FREE_MODELS[0];
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Helper to perform OpenRouter completion with automatic chunked fallback for >3 models
   */
  private async requestCompletion(
    messages: Array<{ role: string; content: string }>,
    temperature: number = 0.7,
    maxTokens: number = 1200,
    timeoutMs: number = 18000
  ): Promise<string> {
    // OpenRouter requires the 'models' parameter to contain at most 3 items per request
    const chunks: string[][] = [];
    for (let i = 0; i < this.modelList.length; i += 3) {
      chunks.push(this.modelList.slice(i, i + 3));
    }
    if (chunks.length === 0) chunks.push([this.primaryModel]);

    let lastError: Error | null = null;

    for (const chunk of chunks) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://markd.app',
            'X-Title': 'MARKD Movie Discovery',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: chunk[0],
            models: chunk,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
        }

        const json = await response.json();
        const content = json.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('OpenRouter returned empty response message.');
        }

        return content;
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          lastError = new Error(`OpenRouter request timed out after ${timeoutMs / 1000}s.`);
        } else {
          lastError = err;
        }
      }
    }

    throw lastError || new Error('OpenRouter completions failed across all model chunks.');
  }

  /**
   * Generates conversational response using OpenRouter Free Tier models
   */
  public async chat(
    messages: AiChatMessage[],
    contextInfo?: AiChatContext,
    locale: string = 'en'
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('OpenRouter API key is not configured.');
    }

    const isZh = locale === 'zh-TW' || locale.startsWith('zh');
    const langName = isZh ? 'Taiwan Traditional Chinese (正體中文 / 臺灣繁體)' : 'English (en-US)';

    const zhTaiwanCinemaInstructions = isZh
      ? `
CRITICAL TAIWAN TRADITIONAL CHINESE CINEMA RULES:
- You must strictly use natural, authentic Taiwan Traditional Chinese (繁體中文 / 臺灣用語). NEVER use Simplified Chinese (簡體中文) or Mainland China terminology.
- Always use authoritative Taiwan theatrical release titles for films and series (e.g. 《全面啟動》, 《星際效應》, 《駭客任務》, 《捍衛戰士：獨行俠》, 《神鬼奇航》, 《天外奇蹟》).
- If the official Taiwan title differs or might be ambiguous, format as: 《台灣片名》 (Original English Title).
- Use Taiwan cinema vocabulary: 片單 (watchlist), 片庫 (library), 影集 (TV series), 演員/主演 (actors/cast), 導演 (director), 票房 (box office), 預告片 (trailer), 紀錄片 (documentary).
- The brand name MARKD must always remain MARKD.
`
      : '';

    const systemPrompt = `You are MARKD, a sophisticated, knowledgeable film curator and discovery assistant.
You help users explore movies, directors, cinematic themes, endings, analysis, and personalized recommendations.
Current media context (if any): ${JSON.stringify(contextInfo || {})}.

CRITICAL INSTRUCTIONS:
1. You must respond 100% in ${langName}.
2. Keep your answers concise, engaging, and directly helpful (typically 2-4 short paragraphs max).
3. Do not output giant walls of raw text or unstructured lists.
4. Use clean markdown formatting (bolding, headers, subtle bullet points).
${zhTaiwanCinemaInstructions}`;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role,
          content: m.content,
        })),
    ];

    return this.requestCompletion(formattedMessages, 0.7, 1200, 18000);
  }

  /**
   * Generates suggested follow-up queries using OpenRouter
   */
  public async generateSuggestions(
    contextInfo?: AiChatContext,
    messages: AiChatMessage[] = [],
    locale: string = 'en'
  ): Promise<string[]> {
    if (!this.isAvailable()) {
      return this.getFallbackSuggestions(contextInfo, locale);
    }

    const isZh = locale === 'zh-TW' || locale.startsWith('zh');
    const prompt = `Based on the following movie and conversation context, provide 3 to 4 short, engaging follow-up questions or prompts a user might want to ask next.
Media: ${JSON.stringify(contextInfo || {})}
Recent Messages: ${JSON.stringify(messages.slice(-3))}

Respond ONLY with a JSON array of strings in ${isZh ? 'Taiwan Traditional Chinese (繁體中文)' : 'English'}.
Example: ["What are the core themes?", "Explain the ending", "Who was the cinematographer?"]`;

    try {
      const raw = await this.requestCompletion([{ role: 'user', content: prompt }], 0.7, 300, 10000);
      const cleanJson = raw.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 4);
      }
    } catch {
      // Fallback
    }

    return this.getFallbackSuggestions(contextInfo, locale);
  }

  /**
   * Parse user intent for hybrid recommendation matching
   */
  public async parseIntent(userQuery: string, locale: string = 'en'): Promise<ParsedMovieIntent | null> {
    if (!this.isAvailable()) return null;

    const prompt = `Analyze this user query for movie/TV recommendations: "${userQuery}".
Extract intent as a JSON object with schema:
{
  "genres": number[], // TMDB genre IDs (e.g. 28 Action, 12 Adventure, 16 Animation, 35 Comedy, 80 Crime, 99 Documentary, 18 Drama, 10751 Family, 14 Fantasy, 36 History, 27 Horror, 10402 Music, 9648 Mystery, 10749 Romance, 878 Sci-Fi, 53 Thriller)
  "moods": string[],
  "themes": string[],
  "referenceTitles": string[],
  "isSeekingRecommendations": boolean
}
Respond with JSON only.`;

    try {
      const raw = await this.requestCompletion([{ role: 'user', content: prompt }], 0.2, 400, 10000);
      const cleanJson = raw.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      return JSON.parse(cleanJson);
    } catch {
      return null;
    }
  }

  private getFallbackSuggestions(contextInfo?: AiChatContext, locale: string = 'en'): string[] {
    const isZh = locale === 'zh-TW' || locale.startsWith('zh');
    if (contextInfo?.title) {
      return isZh
        ? [
            `《${contextInfo.title}》的核心主題是什麼？`,
            `解析《${contextInfo.title}》的結局涵義`,
            `這部作品的導演是誰？還有哪些代表作？`,
            `在哪裡可以線上觀看《${contextInfo.title}》？`,
          ]
        : [
            `What are the core themes of ${contextInfo.title}?`,
            `Explain the ending and symbolism`,
            `Who directed ${contextInfo.title} and what else did they make?`,
            `Where can I stream ${contextInfo.title}?`,
          ];
    }

    return isZh
      ? [
          '有什麼高評價的科幻懸疑電影？',
          '推薦適合週末放鬆的暖心影集',
          '解析諾蘭電影中的時間哲學',
          '✨ 免費線上觀看片單',
        ]
      : [
          'Recommend mind-bending sci-fi thrillers',
          'What are the best cozy drama series?',
          'What are the core themes of Inception?',
          '✨ Free to watch movies & shows',
        ];
  }
}
