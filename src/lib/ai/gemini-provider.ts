import type { AiChatMessage, AiChatContext, ParsedMovieIntent } from './types';

export class GeminiProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = 'gemini-2.5-flash') {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.model = model;
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Generates a conversational response using Gemini
   */
  public async chat(
    messages: AiChatMessage[],
    contextInfo?: AiChatContext,
    locale: string = 'en'
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key is not configured.');
    }

    const isZh = locale === 'zh-TW' || locale.startsWith('zh');
    const langName = isZh ? 'Taiwan Traditional Chinese (正體中文 / 臺灣繁體)' : 'English (en-US)';

    const zhTaiwanCinemaInstructions = isZh
      ? `
CRITICAL TAIWAN TRADITIONAL CHINESE CINEMA RULES:
- You must strictly use natural, authentic Taiwan Traditional Chinese (繁體中文 / 臺灣用語). NEVER use Simplified Chinese (簡體中文) or Mainland China terminology.
- Always use authoritative Taiwan theatrical release titles for films and series (e.g. use 《全面啟動》 instead of 《盜夢空間》, 《星際效應》 instead of 《星際穿越》, 《駭客任務》 instead of 《黑客帝國》, 《捍衛戰士：獨行俠》 instead of 《壯志凌雲2》, 《神鬼奇航》 instead of 《加勒比海盜》, 《天外奇蹟》 instead of 《飛屋環遊記》).
- If the official Taiwan title differs or might be ambiguous, format as: 《台灣片名》 (Original English Title).
- Use Taiwan cinema vocabulary: 片單 (watchlist), 片庫 (library), 影集 (TV series), 演員/主演 (actors/cast), 導演 (director), 票房 (box office), 預告片 (trailer), 紀錄片 (documentary).
- The brand name MARKD must always remain MARKD.
`
      : '';

    const systemPrompt = `You are the MARKD Cinema AI Companion, a sophisticated, knowledgeable film curator and discovery assistant.
You help users explore movies, directors, themes, and personalized recommendations.
Current media context (if any): ${JSON.stringify(contextInfo || {})}.

CRITICAL INSTRUCTIONS:
1. You must respond 100% in ${langName}.
2. Keep your answers concise, engaging, and directly helpful (typically 2-4 short paragraphs max).
3. Do not output giant walls of raw text or lists with hundreds of bullet points.
4. Use clean markdown formatting (bolding, headers, subtle bullet points).
${zhTaiwanCinemaInstructions}`;

    const formattedContents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: isZh ? '收到，我已就緒，將以專業臺灣電影用語為您提供精準解析與推薦。' : 'Understood. I am ready to assist you with cinematic insights and personalized recommendations.' }],
      },
      ...messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
    ];

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: formattedContents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const json = await response.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Generates 3-4 suggested follow-up questions
   */
  public async generateSuggestions(
    contextInfo?: AiChatContext,
    messages: AiChatMessage[] = [],
    locale: string = 'en'
  ): Promise<string[]> {
    if (!this.isAvailable()) return [];

    const isZh = locale === 'zh-TW' || locale.startsWith('zh');
    const langName = isZh ? 'Taiwan Traditional Chinese (繁體中文)' : 'English (en-US)';

    const systemPrompt = `You are a helpful assistant for a movie/TV show tracking app called MARKD.
Generate exactly 3 or 4 suggested follow-up questions that the user can click to ask about the movie or TV show.
Current title context: ${JSON.stringify(contextInfo || {})}.

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON array of strings (e.g. ["question 1", "question 2", "question 3"]).
2. Do not include markdown code block syntax (like \`\`\`json) or any additional explanatory text.
3. Every suggestion must be in ${langName}.
4. Keep the questions short, natural, engaging, and under 15 words each.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'user', parts: [{ text: 'Generate 3 to 4 suggested follow-up questions.' }] },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300,
          },
        }),
      });

      if (!response.ok) return [];

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 4);
      }
    } catch {
      // Fallback
    }
    return [];
  }

  /**
   * Parses natural language query intent for hybrid recommendation engine
   */
  public async parseIntent(userQuery: string, locale: string = 'en'): Promise<ParsedMovieIntent | null> {
    if (!this.isAvailable()) return null;

    const systemPrompt = `Analyze the user's movie query and extract structured recommendation parameters.
Output a JSON object with:
{
  "genres": number[], // Array of TMDB genre IDs matching intent: 28 (Action), 12 (Adventure), 16 (Animation), 35 (Comedy), 80 (Crime), 99 (Documentary), 18 (Drama), 10751 (Family), 14 (Fantasy), 36 (History), 27 (Horror), 10402 (Music), 9648 (Mystery), 10749 (Romance), 878 (Sci-Fi), 53 (Thriller), 10752 (War), 37 (Western)
  "moods": string[], // e.g. ["emotional", "mind-bending", "cozy", "dark", "fast-paced", "slow-burn"]
  "themes": string[], // e.g. ["time travel", "space", "artificial intelligence", "heist"]
  "maxRuntime": number | null, // e.g. 120 if under 2 hours requested
  "referenceTitles": string[], // e.g. ["Interstellar", "Arrival"]
  "pacing": "fast" | "slow" | "balanced" | null,
  "isSeekingRecommendations": boolean // true if looking for movie/show recommendations
}
Return ONLY valid JSON. No markdown codeblocks.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'user', parts: [{ text: `User query: "${userQuery}"` }] },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 400,
          },
        }),
      });

      if (!response.ok) return null;

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      return JSON.parse(cleanJson) as ParsedMovieIntent;
    } catch {
      return null;
    }
  }
}
