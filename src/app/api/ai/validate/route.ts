import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { provider, apiKey } = body;

        if (!apiKey) {
            return NextResponse.json({ valid: false, error: 'Key is empty' });
        }

        const messages = [{ role: 'user', content: 'Ping' }];
        let endpoint = '';
        let defaultModel = '';
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        let requestBody: {
            model?: string;
            messages?: { role: string; content: string }[];
            max_tokens?: number;
            temperature?: number;
        } = {};

        if (provider === 'openai' || provider === 'deepseek' || provider === 'mistral' || provider === 'kimi' || provider === 'qwen' || provider === 'meta' || provider === 'glm' || provider === 'grok') {
            endpoint = 'https://api.openai.com/v1/chat/completions';
            defaultModel = 'gpt-4o-mini';
            headers['Authorization'] = `Bearer ${apiKey}`;

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
                endpoint = 'https://api.groq.com/openai/v1/chat/completions';
                defaultModel = 'llama3-8b-8192';
            } else if (provider === 'glm') {
                endpoint = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
                defaultModel = 'glm-4-flash';
            } else if (provider === 'grok') {
                endpoint = 'https://api.x.ai/v1/chat/completions';
                defaultModel = 'grok-beta';
            }

            requestBody = {
                model: defaultModel,
                messages,
                max_tokens: 1,
                temperature: 0.0
            };
        } else if (provider === 'anthropic') {
            endpoint = 'https://api.anthropic.com/v1/messages';
            headers['x-api-key'] = apiKey;
            headers['anthropic-version'] = '2023-06-01';
            requestBody = {
                model: 'claude-3-haiku-20240307',
                messages,
                max_tokens: 1,
                temperature: 0.0
            };
        } else if (provider === 'minimax') {
            endpoint = 'https://api.minimax.chat/v1/text/chat-completion_v2';
            headers['Authorization'] = `Bearer ${apiKey}`;
            requestBody = {
                model: 'abab6.5-chat',
                messages,
                max_tokens: 1
            };
        } else {
            return NextResponse.json({ valid: false, error: 'Unsupported provider' }, { status: 400 });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            return NextResponse.json({ valid: true });
        } else {
            const text = await response.text();
            console.warn(`Validation failed for ${provider}:`, text);
            return NextResponse.json({ valid: false, error: `Status ${response.status}` });
        }
    } catch (e) {
        const error = e as Error;
        console.error('Validation route error:', error);
        return NextResponse.json({ valid: false, error: error.message || 'Error occurred' });
    }
}
