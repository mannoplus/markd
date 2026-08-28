'use server';

import { createClient } from '@/lib/supabase/server';
import type { OnboardingState } from '@/lib/onboarding/types';
import type { ShadowProfile } from '@/lib/onboarding/shadow';

/** Server-side sanitization for shadow profile data (no PII, bounded sizes). */
function sanitizeShadow(shadow: ShadowProfile): ShadowProfile {
  const cleanTitles = (arr: unknown) =>
    Array.isArray(arr)
      ? (arr as ShadowProfile['likedTitles'])
          .filter(
            (t): t is NonNullable<ShadowProfile['likedTitles'][number]> =>
              !!t &&
              typeof t === 'object' &&
              typeof t.id === 'number' &&
              Number.isFinite(t.id) &&
              typeof t.title === 'string'
          )
          .map((t) => ({
            id: Math.trunc(t.id),
            title: t.title.slice(0, 300),
            type: t.type === 'tv' ? ('tv' as const) : ('movie' as const),
            year: typeof t.year === 'string' ? t.year.slice(0, 10) : undefined,
            posterPath: typeof t.posterPath === 'string' ? t.posterPath.slice(0, 300) : null,
            voteAverage:
              typeof t.voteAverage === 'number' && Number.isFinite(t.voteAverage)
                ? t.voteAverage
                : undefined,
          }))
          .slice(0, 100)
      : [];

  const cleanPrefs: Record<string, string> = {};
  if (shadow.preferences && typeof shadow.preferences === 'object') {
    for (const [k, v] of Object.entries(shadow.preferences as Record<string, unknown>).slice(0, 50)) {
      if (typeof k === 'string' && k.length > 0 && k.length <= 100 && typeof v === 'string' && v.length <= 100) {
        cleanPrefs[k] = v;
      }
    }
  }

  return {
    genres: Array.isArray(shadow.genres)
      ? shadow.genres
          .filter((g) => typeof g === 'number' && Number.isFinite(g))
          .map((g) => Math.trunc(g))
          .slice(0, 50)
      : [],
    likedTitles: cleanTitles(shadow.likedTitles),
    dislikedTitles: cleanTitles(shadow.dislikedTitles),
    preferences: cleanPrefs,
    lastUpdated: typeof shadow.lastUpdated === 'string' ? shadow.lastUpdated.slice(0, 40) : '',
  };
}

/**
 * Merge strategy: union of preference data. Explicit onboarding selections
 * take precedence over shadow-profile data; within the shadow profile the
 * most recent `lastUpdated` timestamp wins on conflicts.
 */
function mergeShadowIntoState(state: OnboardingState, shadow: ShadowProfile): OnboardingState {
  // Union genres — explicit onboarding genre order (state) comes first.
  const stateGenres = state.genres?.movie ?? [];
  const mergedGenres = Array.from(new Set([...stateGenres, ...shadow.genres]));

  // Union favorite titles by id — explicit selections overwrite shadow entries.
  const titlesById = new Map<number, NonNullable<OnboardingState['favoriteTitles']>[number]>();
  for (const t of shadow.likedTitles) {
    titlesById.set(t.id, {
      id: t.id,
      title: t.title,
      type: t.type,
      year: t.year,
      posterPath: t.posterPath,
      voteAverage: t.voteAverage,
    });
  }
  for (const t of state.favoriteTitles ?? []) titlesById.set(t.id, t);
  const mergedTitles = Array.from(titlesById.values());

  // Merge taste answers: explicit onboarding answers take precedence.
  const answerByQuestion = new Map<string, string>();
  for (const [questionId, answerId] of Object.entries(shadow.preferences)) {
    answerByQuestion.set(questionId, answerId);
  }
  for (const a of state.tasteAnswers ?? []) answerByQuestion.set(a.questionId, a.answerId);
  const mergedAnswers = Array.from(answerByQuestion.entries()).map(([questionId, answerId]) => ({
    questionId,
    answerId,
  }));

  // Only keep shadow genre names for genres that survived the merge.
  const genreNamesById = new Map<number, string>();
  const stateNames = state.genreNames?.movie ?? [];
  stateGenres.forEach((id, i) => {
    if (stateNames[i]) genreNamesById.set(id, stateNames[i]);
  });

  return {
    genres: { movie: mergedGenres, tv: state.genres?.tv ?? [] },
    genreNames: {
      movie: mergedGenres.map((id) => genreNamesById.get(id) ?? String(id)),
      tv: state.genreNames?.tv ?? [],
    },
    favoriteTitles: mergedTitles,
    tasteAnswers: mergedAnswers,
    currentStep: state.currentStep ?? 1,
  };
}

/**
 * Fetches a trending/popular poster for each requested genre (used by the
 * onboarding genre-selection screen). Queries TMDB discover with
 * `sort_by: popularity.desc` per genre and returns the first result that
 * has poster artwork. One genre failing never breaks the others.
 */
export async function getTrendingGenrePostersAction(
  genreIds: number[]
): Promise<Record<number, string>> {
  const posters: Record<number, string> = {};
  if (!Array.isArray(genreIds) || genreIds.length === 0) return posters;

  const { discoverMedia } = await import('@/lib/tmdb');

  await Promise.all(
    genreIds
      .filter((id) => Number.isFinite(id))
      .slice(0, 25)
      .map(async (genreId) => {
        try {
          const res = await discoverMedia('movie', {
            with_genres: String(Math.trunc(genreId)),
            sort_by: 'popularity.desc',
            'vote_count.gte': '100',
            include_adult: 'false',
          });
          const top = (res.results || []).find((m) => m.poster_path);
          if (top?.poster_path) {
            posters[genreId] = top.poster_path;
          }
        } catch (e) {
          // Isolated failure: this genre simply falls back to its static poster.
          console.warn(`Failed to fetch trending poster for genre ${genreId}:`, e);
        }
      })
  );

  return posters;
}

export async function mergeOnboardingPreferencesAction(
  rawState: OnboardingState,
  shadow?: ShadowProfile | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'User is not authenticated' };
    }

    // 0. Sanitize + merge the unauthenticated Shadow Profile (if any).
    //    Merge strategy: explicit onboarding selections take precedence,
    //    otherwise fall back to shadow data; arrays are unioned by id.
    const state = shadow
      ? mergeShadowIntoState(rawState, sanitizeShadow(shadow))
      : rawState;

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

const CURATED_FALLBACK_TITLES = [
  { id: 693134, title: 'Dune: Part Two', type: 'movie' as const, year: '2024', posterPath: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', voteAverage: 8.2 },
  { id: 872585, title: 'Oppenheimer', type: 'movie' as const, year: '2023', posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', voteAverage: 8.1 },
  { id: 569094, title: 'Spider-Man: Across the Spider-Verse', type: 'movie' as const, year: '2023', posterPath: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', voteAverage: 8.4 },
  { id: 157336, title: 'Interstellar', type: 'movie' as const, year: '2014', posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', voteAverage: 8.4 },
  { id: 27205, title: 'Inception', type: 'movie' as const, year: '2010', posterPath: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', voteAverage: 8.4 },
  { id: 155, title: 'The Dark Knight', type: 'movie' as const, year: '2008', posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', voteAverage: 8.5 },
  { id: 496243, title: 'Parasite', type: 'movie' as const, year: '2019', posterPath: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', voteAverage: 8.5 },
  { id: 603692, title: 'John Wick: Chapter 4', type: 'movie' as const, year: '2023', posterPath: '/vZloFAK7NKnMGKEslbb5VSAvqSQ.jpg', voteAverage: 7.8 },
  { id: 329865, title: 'Arrival', type: 'movie' as const, year: '2016', posterPath: '/x2OAH0j2CSuZ1p777b7gXw6Nis2.jpg', voteAverage: 7.9 },
  { id: 545611, title: 'Everything Everywhere All at Once', type: 'movie' as const, year: '2022', posterPath: '/rKgvtzOI0ZzpxtCHm9n4L1v9z9K.jpg', voteAverage: 7.8 },
  { id: 335984, title: 'Blade Runner 2049', type: 'movie' as const, year: '2017', posterPath: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', voteAverage: 8.0 },
  { id: 1022789, title: 'Inside Out 2', type: 'movie' as const, year: '2024', posterPath: '/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg', voteAverage: 7.6 },
];

export async function getOnboardingRecommendationsAction(params: {
  genreIds?: number[];
  query?: string;
  locale?: string;
}): Promise<import('@/lib/onboarding/types').FavoriteTitleItem[]> {
  const { genreIds = [], query, locale } = params;
  const seenIds = new Set<number>();
  const results: import('@/lib/onboarding/types').FavoriteTitleItem[] = [];

  const { searchMultiWithPeople, discoverMedia } = await import('@/lib/tmdb');

  // Case 1: Search query supplied by user
  if (query && query.trim().length > 0) {
    try {
      const searchRes = await searchMultiWithPeople(query.trim(), 1);
      for (const item of searchRes.results || []) {
        if (!item.id || seenIds.has(item.id)) continue;
        if (!item.poster_path) continue;
        if (item.media_type !== 'movie' && item.media_type !== 'tv') continue;

        seenIds.add(item.id);
        results.push({
          id: item.id,
          title: item.title || item.name || '',
          type: (item.media_type || 'movie') as 'movie' | 'tv',
          year: (item.release_date || item.first_air_date || '').substring(0, 4),
          posterPath: item.poster_path,
          voteAverage: item.vote_average,
        });

        if (results.length >= 12) break;
      }
      return results;
    } catch (e) {
      console.error('Failed to search titles for onboarding:', e);
    }
  }

  // Case 2: Dynamic discovery based on Step 1 selected genre IDs
  if (genreIds.length > 0) {
    try {
      const genreString = genreIds.slice(0, 4).join('|');
      const lang = locale === 'zh-TW' ? 'zh-TW' : 'en-US';

      const [movieData, tvData] = await Promise.all([
        discoverMedia('movie', {
          with_genres: genreString,
          sort_by: 'popularity.desc',
          'vote_count.gte': '150',
          language: lang,
        }),
        discoverMedia('tv', {
          with_genres: genreString,
          sort_by: 'popularity.desc',
          'vote_count.gte': '100',
          language: lang,
        }),
      ]);

      // Interleave movies and tv shows matching the user's genre selection
      const pool = [...(movieData.results || []), ...(tvData.results || [])];
      // Sort by popularity / rating
      pool.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      for (const item of pool) {
        if (!item.id || seenIds.has(item.id)) continue;
        if (!item.poster_path) continue;

        seenIds.add(item.id);
        results.push({
          id: item.id,
          title: item.title || item.name || '',
          type: (item.media_type || 'movie') as 'movie' | 'tv',
          year: (item.release_date || item.first_air_date || '').substring(0, 4),
          posterPath: item.poster_path,
          voteAverage: item.vote_average,
        });

        if (results.length >= 12) break;
      }
    } catch (e) {
      console.error('Failed to discover genre recommendations for onboarding:', e);
    }
  }

  // Backfill if needed to ensure strictly 12 items with zero duplicates
  for (const fallback of CURATED_FALLBACK_TITLES) {
    if (results.length >= 12) break;
    if (!seenIds.has(fallback.id)) {
      seenIds.add(fallback.id);
      results.push(fallback);
    }
  }

  return results.slice(0, 12);
}
