import { GeminiProvider } from './gemini-provider';
import { MockAiProvider } from './mock-provider';
import { HybridRecommendationEngine } from './hybrid-recommendation';
import { calculateUserTasteProfile, type UserTasteProfile } from '@/lib/taste-engine';
import { createClient } from '@/lib/supabase/server';
import type { AiChatRequest, AiChatResponse, AiRecommendationItem } from './types';

export class AiService {
  private static getProvider(): GeminiProvider | MockAiProvider {
    const gemini = new GeminiProvider();
    if (gemini.isAvailable()) {
      return gemini;
    }
    return new MockAiProvider();
  }

  /**
   * Loads the current user's media items and feedback for personalized taste profile
   */
  private static async getUserContext(): Promise<{
    profile: UserTasteProfile;
    mediaItems: any[];
  }> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          profile: calculateUserTasteProfile([], []),
          mediaItems: [],
        };
      }

      const [{ data: mediaItems }, { data: feedbackItems }] = await Promise.all([
        supabase.from('media_items').select('*').eq('user_id', user.id),
        supabase.from('taste_feedback').select('*').eq('user_id', user.id),
      ]);

      const items = mediaItems || [];
      const feedbacks = feedbackItems || [];

      return {
        profile: calculateUserTasteProfile(items, feedbacks),
        mediaItems: items,
      };
    } catch {
      return {
        profile: calculateUserTasteProfile([], []),
        mediaItems: [],
      };
    }
  }

  /**
   * Main chat completion handler
   */
  public static async chat(req: AiChatRequest): Promise<AiChatResponse> {
    const { messages = [], contextInfo, language = 'en', isSuggestions } = req;
    const provider = this.getProvider();
    const isGemini = provider instanceof GeminiProvider;

    // Handle suggestions-only request
    if (isSuggestions) {
      const suggestions = await provider.generateSuggestions(contextInfo, messages, language);
      return {
        text: '',
        suggestions,
        provider: isGemini ? 'gemini' : 'mock',
      };
    }

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

    // Parallel execution: Conversational LLM response + Hybrid Recommendations
    const [userContext, conversationalText] = await Promise.all([
      this.getUserContext(),
      provider.chat(messages, contextInfo, language),
    ]);

    let recommendations: AiRecommendationItem[] = [];

    // Parse intent to determine if recommendations should be fetched
    try {
      const intent = await provider.parseIntent(lastUserMsg, language);
      if (intent && (intent.isSeekingRecommendations || intent.referenceTitles.length > 0 || intent.genres.length > 0)) {
        recommendations = await HybridRecommendationEngine.getRecommendations(
          intent,
          userContext.profile,
          userContext.mediaItems,
          contextInfo,
          language
        );
      }
    } catch (e) {
      console.warn('Hybrid recommendation pipeline skipped:', e);
    }

    return {
      text: conversationalText,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      provider: isGemini ? 'gemini' : 'mock',
    };
  }

  /**
   * Quick suggestions generator
   */
  public static async generateSuggestions(
    contextInfo?: AiChatRequest['contextInfo'],
    messages: AiChatRequest['messages'] = [],
    language: string = 'en'
  ): Promise<string[]> {
    const provider = this.getProvider();
    return provider.generateSuggestions(contextInfo, messages, language);
  }
}
