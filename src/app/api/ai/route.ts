import { NextResponse } from 'next/server';
import { AiService } from '@/lib/ai/ai-service';
import type { AiChatRequest } from '@/lib/ai/types';

export async function POST(request: Request) {
  try {
    const body: AiChatRequest = await request.json();
    const result = await AiService.chat(body);
    return NextResponse.json(result);
  } catch (e) {
    const error = e as Error;
    console.error('AI route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process AI request.' },
      { status: 500 }
    );
  }
}
