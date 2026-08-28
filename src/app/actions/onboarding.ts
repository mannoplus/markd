'use server';

import { createClient } from '@/lib/supabase/server';
import type { OnboardingState } from '@/lib/onboarding/types';

export async function mergeOnboardingPreferencesAction(state: OnboardingState): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'User is not authenticated' };
    }

    // 1. Insert Favorite Titles as rated media_items
    if (state.favoriteTitles && state.favoriteTitles.length > 0) {
      const mediaRows = state.favoriteTitles.map((t) => ({
        user_id: user.id,
        tmdb_id: t.id,
        media_type: t.type,
        title: t.title,
        poster_path: t.posterPath || null,
        status: 'completed',
        rating: 9, // Strong seed rating for the taste engine
      }));

      const { error: mediaError } = await supabase
        .from('media_items')
        .upsert(mediaRows, {
          onConflict: 'user_id,tmdb_id,media_type',
          ignoreDuplicates: false,
        });

      if (mediaError) {
        console.warn('Failed to upsert onboarding media items:', mediaError);
      }
    }

    // 2. Synthesize Taste DNA & Preferences from Questions
    const dnaWeights: Record<string, number> = {};
    let personalityArchetype = 'Cinema Explorer';
    let pacingAffinity = 'balanced';
    let emotionalScale = 6;
    let darknessScale = 5;

    for (const ans of state.tasteAnswers || []) {
      switch (ans.questionId) {
        case 'friday_mood':
          if (ans.answerId === 'thriller') {
            dnaWeights['gripping'] = 0.85;
            dnaWeights['dark'] = 0.75;
            darknessScale = 7;
          } else if (ans.answerId === 'comedy') {
            dnaWeights['feel-good'] = 0.9;
            dnaWeights['whimsical'] = 0.75;
            darknessScale = 2;
          } else if (ans.answerId === 'drama') {
            dnaWeights['intimate'] = 0.85;
            dnaWeights['melancholic'] = 0.7;
            emotionalScale = 8;
          } else if (ans.answerId === 'action') {
            dnaWeights['fast-paced'] = 0.9;
            dnaWeights['explosive'] = 0.8;
            pacingAffinity = 'fast-paced';
          }
          break;

        case 'rewatch_vibe':
          if (ans.answerId === 'scifi') {
            dnaWeights['mind-bending'] = 0.9;
            dnaWeights['philosophical'] = 0.8;
          } else if (ans.answerId === 'mystery') {
            dnaWeights['gritty'] = 0.85;
            dnaWeights['cerebral'] = 0.8;
          } else if (ans.answerId === 'nostalgic') {
            dnaWeights['nostalgic'] = 0.9;
            dnaWeights['heartfelt'] = 0.85;
          } else if (ans.answerId === 'heist') {
            dnaWeights['stylized'] = 0.85;
            dnaWeights['clever'] = 0.8;
          }
          break;

        case 'taste_style':
          if (ans.answerId === 'blockbusters') {
            personalityArchetype = 'Blockbuster Enthusiast';
          } else if (ans.answerId === 'hidden_gems') {
            personalityArchetype = 'Hidden Gem Hunter';
            dnaWeights['independent'] = 0.85;
          } else if (ans.answerId === 'arthouse') {
            personalityArchetype = 'Auteur Cinephile';
            dnaWeights['poetic'] = 0.85;
            dnaWeights['visionary'] = 0.85;
          } else if (ans.answerId === 'eclectic') {
            personalityArchetype = 'Eclectic Explorer';
          }
          break;

        case 'priority_factor':
          if (ans.answerId === 'plot_twists') {
            dnaWeights['unpredictable'] = 0.9;
          } else if (ans.answerId === 'character_depth') {
            dnaWeights['character-driven'] = 0.9;
            emotionalScale = Math.max(emotionalScale, 8);
          } else if (ans.answerId === 'visuals') {
            dnaWeights['visual-splendor'] = 0.95;
          } else if (ans.answerId === 'entertainment') {
            pacingAffinity = 'fast-paced';
          }
          break;
      }
    }

    // 3. Upsert Taste Profile
    const favoriteGenres = [
      ...(state.genreNames?.movie || []),
      ...(state.genreNames?.tv || []),
    ];

    const { error: tasteError } = await supabase
      .from('taste_profiles')
      .upsert(
        {
          user_id: user.id,
          favorite_genres: favoriteGenres,
          dna_weights: dnaWeights,
          pacing_affinity: pacingAffinity,
          emotional_scale: emotionalScale,
          darkness_scale: darknessScale,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (tasteError) {
      console.warn('Failed to upsert taste profile:', tasteError);
    }

    // 4. Update User Profile Archetype
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: user.id,
          personality_archetype: personalityArchetype,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.warn('Failed to update user profile archetype:', profileError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error merging onboarding preferences:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
