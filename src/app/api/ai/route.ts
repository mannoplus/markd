import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { provider, apiKey, messages, model, isSuggestions, contextInfo, language } = body;

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key is required.' }, { status: 400 });
        }

        const isZh = language === 'zh-TW' || language === 'zh';
        const langName = isZh ? 'Traditional Chinese (zh-TW)' : 'English (en-US)';

        let finalMessages = [...(messages || [])];

        if (isSuggestions) {
            const systemPrompt = `You are a helpful assistant for a movie/TV show database tracking app called MARKD.
You must generate 3 or 4 suggested follow-up questions that the user can click to ask about the movie or TV show.
Current title context:
${JSON.stringify(contextInfo)}

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON array of strings (e.g. ["question 1", "question 2", "question 3"]).
2. Do not include markdown code block syntax (like \`\`\`json) or any additional explanatory text.
3. Every suggestion must be in ${langName}.
4. Keep the questions short, natural, and extremely relevant to the current conversation and media title.`;
            
            finalMessages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Generate 3 to 4 suggested follow-up questions based on the media details and conversation context.' }
            ];
        } else {
            const systemPrompt = `You are a helpful and knowledgeable entertainment expert assistant for MARKD (a movie and TV show tracking dashboard).
You are answering questions about the title: ${JSON.stringify(contextInfo)}.
CRITICAL INSTRUCTIONS:
1. You must respond 100% in ${langName}.
2. Keep your answers concise, engaging, and directly helpful.
3. Use markdown for structure if needed.`;
            
            finalMessages.unshift({ role: 'system', content: systemPrompt });
        }

        let responseText = '';
        
        // Forwarding to respective endpoint
        if (provider === 'openai' || provider === 'deepseek' || provider === 'mistral' || provider === 'kimi' || provider === 'qwen' || provider === 'meta' || provider === 'glm' || provider === 'grok') {
            let endpoint = 'https://api.openai.com/v1/chat/completions';
            let defaultModel = 'gpt-4o-mini';

            if (provider === 'deepseek') {
                endpoint = 'https://api.deepseek.com/chat/completions';
                defaultModel = 'deepseek-chat';
            } else if (provider === 'mistral') {
                endpoint = 'https://api.mistral.ai/v1/chat/completions';
                defaultModel = 'open-mistral-7b';
            } else if (provider === 'kimi') {
                endpoint = 'https://api.moonshot.cn/v1/chat/completions';
                defaultModel = 'moonshot-v1-8k';
            } else if (provider === 'qwen') {
                endpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
                defaultModel = 'qwen-turbo';
            } else if (provider === 'meta') {
                endpoint = 'https://api.groq.com/openapi/v1/chat/completions';
                defaultModel = 'llama3-8b-8192';
            } else if (provider === 'glm') {
                endpoint = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
                defaultModel = 'glm-4-flash';
            } else if (provider === 'grok') {
                endpoint = 'https://api.x.ai/v1/chat/completions';
                defaultModel = 'grok-beta';
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model || defaultModel,
                    messages: finalMessages,
                    temperature: isSuggestions ? 0.2 : 0.7,
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`LLM provider error (${response.status}): ${errText}`);
            }

            const json = await response.json();
            responseText = json.choices?.[0]?.message?.content || '';
        } else if (provider === 'anthropic') {
            const systemMsg = finalMessages.find(m => m.role === 'system')?.content || '';
            const userMsgs = finalMessages.filter(m => m.role !== 'system').map(m => ({
                role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
                content: m.content
            }));

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: model || 'claude-3-haiku-20240307',
                    system: systemMsg,
                    messages: userMsgs,
                    max_tokens: 1000,
                    temperature: isSuggestions ? 0.2 : 0.7,
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Anthropic error (${response.status}): ${errText}`);
            }

            const json = await response.json();
            responseText = json.content?.[0]?.text || '';
        } else if (provider === 'minimax') {
            const response = await fetch('https://api.minimax.chat/v1/text/chat-completion_v2', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model || 'abab6.5-chat',
                    messages: finalMessages.filter(m => m.role !== 'system'),
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`MiniMax error (${response.status}): ${errText}`);
            }

            const json = await response.json();
            responseText = json.choices?.[0]?.message?.content || '';
        } else {
            return NextResponse.json({ error: 'Unsupported provider.' }, { status: 400 });
        }

        return NextResponse.json({ text: responseText });
    } catch (e) {
        const error = e as Error;
        console.error('AI chat route error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
    }
}
