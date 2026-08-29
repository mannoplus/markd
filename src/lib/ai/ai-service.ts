import { OpenRouterProvider } from './openrouter-provider';
import { GeminiProvider } from './gemini-provider';
import { MockAiProvider } from './mock-provider';
import { DirectLookupEngine } from './direct-lookup';
import { HybridRecommendationEngine } from './hybrid-recommendation';
import { calculateUserTasteProfile, type UserTasteProfile } from '@/lib/taste-engine';
import { createClient } from '@/lib/supabase/server';
import type { AiChatRequest, AiChatResponse, AiRecommendationItem } from './types';

export class AiService {
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
   * Main 3-tier chat handler
   * - Tier 1: Direct API Lookup (Zero LLM cost)
   * - Tier 2: Primary AI (OpenRouter Free Tier)
   * - Tier 3: Fallback AI (Google Gemini)
   */
  public static async chat(req: AiChatRequest): Promise<AiChatResponse> {
    const { messages = [], contextInfo, language = 'en', region = 'US', isSuggestions } = req;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || req.message || '';

    // Handle suggestions-only request
    if (isSuggestions) {
      return this.handleSuggestionsRequest(contextInfo, messages, language);
    }

    // -------------------------------------------------------------
    // TIER 1: Direct API Lookup (Zero LLM Cost)
    // -------------------------------------------------------------
    if (lastUserMsg && DirectLookupEngine.isDirectQuery(lastUserMsg)) {
      try {
        const directResponse = await DirectLookupEngine.execute(lastUserMsg, contextInfo, language, region);
        if (directResponse) {
          return directResponse;
        }
      } catch (directErr) {
        console.warn('Tier 1 Direct API lookup failed, falling through to AI tiers:', directErr);
      }
    }

    // -------------------------------------------------------------
    // TIER 2: Primary AI (OpenRouter Free Tier)
    // -------------------------------------------------------------
    const openRouter = new OpenRouterProvider();
    if (openRouter.isAvailable()) {
      try {
        const [userContext, conversationalText] = await Promise.all([
          this.getUserContext(),
          openRouter.chat(messages, contextInfo, language),
        ]);

        let recommendations: AiRecommendationItem[] = [];
        try {
          const intent = await openRouter.parseIntent(lastUserMsg, language);
          if (intent && (intent.isSeekingRecommendations || intent.referenceTitles.length > 0 || intent.genres.length > 0)) {
            recommendations = await HybridRecommendationEngine.getRecommendations(
              intent,
              userContext.profile,
              userContext.mediaItems,
              contextInfo,
              language
            );
          }
        } catch (intentErr) {
          console.warn('OpenRouter intent parsing skipped:', intentErr);
        }

        return {
          text: conversationalText,
          recommendations: recommendations.length > 0 ? recommendations : undefined,
          provider: 'openrouter',
          tier: 2,
        };
      } catch (openRouterErr) {
        console.warn('Tier 2 (OpenRouter) failed or encountered error/timeout. Seamlessly routing to Tier 3 (Gemini Fallback)...', openRouterErr);
      }
    }

    // -------------------------------------------------------------
    // TIER 3: Fallback AI (Google Gemini)
    // -------------------------------------------------------------
    const gemini = new GeminiProvider();
    if (gemini.isAvailable()) {
      try {
        const [userContext, conversationalText] = await Promise.all([
          this.getUserContext(),
          gemini.chat(messages, contextInfo, language),
        ]);

        let recommendations: AiRecommendationItem[] = [];
        try {
          const intent = await gemini.parseIntent(lastUserMsg, language);
          if (intent && (intent.isSeekingRecommendations || intent.referenceTitles.length > 0 || intent.genres.length > 0)) {
            recommendations = await HybridRecommendationEngine.getRecommendations(
              intent,
              userContext.profile,
              userContext.mediaItems,
              contextInfo,
              language
            );
          }
        } catch (intentErr) {
          console.warn('Gemini intent parsing skipped:', intentErr);
        }

        return {
          text: conversationalText,
          recommendations: recommendations.length > 0 ? recommendations : undefined,
          provider: 'gemini',
          tier: 3,
        };
      } catch (geminiErr) {
        console.warn('Tier 3 (Gemini) failed:', geminiErr);
      }
    }

    // -------------------------------------------------------------
    // Tier Fallback: Mock AI Provider
    // -------------------------------------------------------------
    const mock = new MockAiProvider();
    const conversationalText = await mock.chat(messages, contextInfo, language);
    return {
      text: conversationalText,
      provider: 'mock',
    };
  }

  /**
   * Helper to handle suggestions generation with tier routing
   */
  private static async handleSuggestionsRequest(
    contextInfo?: AiChatRequest['contextInfo'],
    messages: AiChatRequest['messages'] = [],
    language: string = 'en'
  ): Promise<AiChatResponse> {
    const openRouter = new OpenRouterProvider();
    if (openRouter.isAvailable()) {
      try {
        const suggestions = await openRouter.generateSuggestions(contextInfo, messages, language);
        return {
          text: '',
          suggestions,
          provider: 'openrouter',
          tier: 2,
        };
      } catch (e) {
        console.warn('OpenRouter suggestions failed, falling back to Gemini:', e);
      }
    }

    const gemini = new GeminiProvider();
    if (gemini.isAvailable()) {
      try {
        const suggestions = await gemini.generateSuggestions(contextInfo, messages, language);
        return {
          text: '',
          suggestions,
          provider: 'gemini',
          tier: 3,
        };
      } catch (e) {
        console.warn('Gemini suggestions failed:', e);
      }
    }

    const mock = new MockAiProvider();
    const suggestions = await mock.generateSuggestions(contextInfo, messages, language);
    return {
      text: '',
      suggestions,
      provider: 'mock',
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
    const res = await this.handleSuggestionsRequest(contextInfo, messages, language);
    return res.suggestions || [];
  }
}
