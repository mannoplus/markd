/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { createClient } from '@/lib/supabase/server';
import { calculateUserTasteProfile, calculateMatchScore, type UserTasteProfile, type MovieDnaTrait } from '@/lib/taste-engine';
import { buildRecommendationReason, type StructuredReason } from '@/lib/personalization/reasons';
import { discoverMedia, getCategoryMedia } from '@/lib/tmdb';
import type { InteractionSignal } from '@/lib/personalization/signals';

export interface PersonalizedShelfItem {
  id: number;
  title: string;
  posterPath: string | null;
  backdropPath?: string | null;
  mediaType: 'movie' | 'tv';
  year?: string;
  rating?: number;
  matchScore: number;
  reason: string;
  structuredReason?: StructuredReason;
  primaryDna?: MovieDnaTrait;
}

export interface PersonalizedShelvesResult {
  isColdStart: boolean;
  activeMood?: string;
  userTasteSummary?: {
    topDnaTraits: string[];
    topDecades: string[];
    totalTracked: number;
    avgRating: number;
  };
  becauseYouLoved?: {
    referenceTitle: string;
    items: PersonalizedShelfItem[];
  };
  moodMatches?: {
    mood: string;
    items: PersonalizedShelfItem[];
  };
  watchlistGems?: PersonalizedShelfItem[];
  rewatchCandidates?: PersonalizedShelfItem[];
  starterCollections?: {
    titleKey: string;
    items: PersonalizedShelfItem[];
  }[];
}

/**
 * Records a batch of interaction signals
 */
export async function recordSignalsAction(signals: InteractionSignal[]): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !signals || signals.length === 0) {
      return { success: true };
    }

    // Process negative / explicit feedback signals to taste_feedback table
    const feedbackRows: any[] = [];

    for (const s of signals) {
      if (
        s.type === 'feedback.not_interested' ||
        s.type === 'feedback.not_my_type' ||
        s.type === 'feedback.less_like_this' ||
        s.type === 'feedback.already_watched'
      ) {
        if (s.tmdbId) {
          const signalType = s.type.replace('feedback.', '');
          feedbackRows.push({
            user_id: user.id,
            tmdb_id: s.tmdbId,
            media_type: s.mediaType || 'movie',
            signal_type: signalType,
          });
        }
      }
    }

    if (feedbackRows.length > 0) {
      await supabase.from('taste_feedback').upsert(feedbackRows, {
        onConflict: 'user_id,tmdb_id,media_type,signal_type',
        ignoreDuplicates: true,
      });
    }

    return { success: true };
  } catch (e) {
    console.error('Failed to record signals:', e);
    return { success: false };
  }
}

/**
 * Removes a taste feedback exclusion
 */
export async function removeTasteFeedbackAction(tmdbId: number, signalType: string): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    await supabase
      .from('taste_feedback')
      .delete()
      .eq('user_id', user.id)
      .eq('tmdb_id', tmdbId)
      .eq('signal_type', signalType);

    return { success: true };
  } catch (e) {
    console.error('Failed to remove taste feedback:', e);
    return { success: false };
  }
}

/**
 * Retrieves all active taste feedback exclusions for transparency modal
 */
export async function getTasteFeedbackExclusionsAction(): Promise<any[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('taste_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return data || [];
  } catch {
    return [];
  }
}

/**
 * Generates personalized companion shelves for the home page
 */
export async function getPersonalizedHomeShelvesAction(
  locale: string = 'en',
  sessionMood?: string,
  region: string = 'TW'
): Promise<PersonalizedShelvesResult> {
  const isZh = locale === 'zh-TW' || locale.startsWith('zh');
  const targetLang = isZh ? 'zh-TW' : 'en-US';

  // 1. Fetch user data if authenticated
  let mediaItems: any[] = [];
  let feedbackItems: any[] = [];
  let user: any = null;

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData.user;

    if (user) {
      const [{ data: userMedia }, { data: userFeedback }] = await Promise.all([
        supabase.from('media_items').select('*').eq('user_id', user.id),
        supabase.from('taste_feedback').select('*').eq('user_id', user.id),
      ]);
      mediaItems = userMedia || [];
      feedbackItems = userFeedback || [];
    }
  } catch (e) {
    console.warn('Personalization user lookup skipped:', e);
  }

  const profile: UserTasteProfile = calculateUserTasteProfile(mediaItems, feedbackItems, {
    activeMood: sessionMood,
    isExploreMode: true,
  });

  const isColdStart = mediaItems.length < 3;

  // 2. Cold Start Flow (New or Low-Data Users)
  if (isColdStart) {
    const [acclaimedSciFi, feelGoodDrama] = await Promise.all([
      discoverMedia('movie', { with_genres: '878,18', 'vote_count.gte': '500', sort_by: 'vote_average.desc', language: targetLang }),
      discoverMedia('movie', { with_genres: '35,18', 'vote_count.gte': '400', sort_by: 'vote_average.desc', language: targetLang }),
    ]);

    const formatCandidates = (list: any[]) =>
      (list || []).slice(0, 10).map((m) => {
        const struct = buildRecommendationReason(m, profile, mediaItems, sessionMood, locale);
        return {
          id: m.id,
          title: m.title || m.name,
          posterPath: m.poster_path,
          backdropPath: m.backdrop_path,
          mediaType: (m.media_type || 'movie') as 'movie' | 'tv',
          year: (m.release_date || m.first_air_date || '').substring(0, 4),
          rating: m.vote_average,
          matchScore: calculateMatchScore(m, profile),
          reason: struct.text,
          structuredReason: struct,
        };
      });

    return {
      isColdStart: true,
      activeMood: sessionMood,
      starterCollections: [
        {
          titleKey: 'curatedStarter',
          items: formatCandidates(acclaimedSciFi?.results || []),
        },
        {
          titleKey: 'moodCozy',
          items: formatCandidates(feelGoodDrama?.results || []),
        },
      ],
    };
  }

  // 3. Returning User with Rich Data
  // Build discovery queries based on top user genres & DNA
  const topGenreIds = Object.entries(profile.genreWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => id);

  const topGenreStr = topGenreIds.length > 0 ? topGenreIds.join(',') : '878,18';

  const [topDiscover, moodDiscover, trending] = await Promise.all([
    discoverMedia('movie', {
      with_genres: topGenreStr,
      'vote_count.gte': '350',
      sort_by: 'popularity.desc',
      region,
      watch_region: region,
      language: targetLang,
    }),
    sessionMood && sessionMood !== 'all'
      ? discoverMedia('movie', {
          sort_by: 'vote_average.desc',
          'vote_count.gte': '300',
          region,
          watch_region: region,
          language: targetLang,
        })
      : Promise.resolve(null),
    discoverMedia('movie', { region, watch_region: region, sort_by: 'popularity.desc', language: targetLang }),
  ]);

  // Merge candidate pool
  const candidateMap = new Map<number, any>();
  const addCandidates = (items: any[]) => {
    items?.forEach((item) => {
      if (!profile.dismissedTmdbIds.has(item.id) && !profile.notMyTypeIds.has(item.id)) {
        candidateMap.set(item.id, item);
      }
    });
  };

  addDiscover: {
    addCandidates(topDiscover?.results || []);
    addCandidates(trending?.results || []);
    if (moodDiscover?.results) addCandidates(moodDiscover.results);
  }

  const allCandidates = Array.from(candidateMap.values());

  // Rank Because You Loved candidates dynamically based on user's top favorite / highest rated media
  let becauseYouLoved: PersonalizedShelvesResult['becauseYouLoved'] = undefined;
  const sortedFavorites = [...mediaItems]
    .filter((i) => (i.rating && i.rating >= 7) || i.status === 'completed')
    .sort((a, b) => (b.rating || 8) - (a.rating || 8));

  const topFavorite = sortedFavorites[0] || mediaItems[0];

  if (topFavorite) {
    let favoriteRecs: any[] = [];
    try {
      const type = topFavorite.media_type || 'movie';
      const [recData, simData] = await Promise.all([
        getCategoryMedia(`/${type}/${topFavorite.tmdb_id}/recommendations`, 1, region, targetLang).catch(() => ({ results: [] })),
        getCategoryMedia(`/${type}/${topFavorite.tmdb_id}/similar`, 1, region, targetLang).catch(() => ({ results: [] })),
      ]);
      favoriteRecs = [...(recData?.results || []), ...(simData?.results || [])];
    } catch (e) {
      console.warn('Failed to fetch specific recommendations for favorite:', e);
    }

    // Combine specific recommendations with candidate pool
    const combinedBecauseCandidates = [...favoriteRecs, ...allCandidates];
    const seenIds = new Set<number>([topFavorite.tmdb_id]);

    const similarItems: PersonalizedShelfItem[] = combinedBecauseCandidates
      .filter((m) => {
        if (!m || !m.id || seenIds.has(m.id)) return false;
        if (profile.dismissedTmdbIds.has(m.id) || profile.notMyTypeIds.has(m.id)) return false;
        seenIds.add(m.id);
        return true;
      })
      .map((m) => {
        const struct = buildRecommendationReason(m, profile, mediaItems, undefined, locale);
        return {
          id: m.id,
          title: m.title || m.name,
          posterPath: m.poster_path,
          backdropPath: m.backdrop_path,
          mediaType: (m.media_type || 'movie') as 'movie' | 'tv',
          year: (m.release_date || m.first_air_date || '').substring(0, 4),
          rating: m.vote_average,
          matchScore: calculateMatchScore(m, profile),
          reason: struct.text,
          structuredReason: struct,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    if (similarItems.length > 0) {
      becauseYouLoved = {
        referenceTitle: topFavorite.title,
        items: similarItems,
      };
    }
  }

  // Watchlist Hidden Gems
  const planToWatch = mediaItems.filter((i) => i.status === 'plan_to_watch');
  const watchlistGems: PersonalizedShelfItem[] = planToWatch.slice(0, 8).map((m) => {
    const struct = buildRecommendationReason({ id: m.tmdb_id, ...m }, profile, mediaItems, undefined, locale);
    return {
      id: m.tmdb_id,
      title: m.title,
      posterPath: m.poster_path,
      mediaType: (m.media_type || 'movie') as 'movie' | 'tv',
      rating: m.rating || 8.0,
      matchScore: calculateMatchScore({ id: m.tmdb_id, ...m }, profile),
      reason: struct.text,
      structuredReason: struct,
    };
  });

  // Rewatch Candidates
  const rewatchables = mediaItems.filter((i) => (i.rating && i.rating >= 8) || i.status === 'completed');
  const rewatchCandidates: PersonalizedShelfItem[] = rewatchables.slice(0, 8).map((m) => {
    const struct = buildRecommendationReason({ id: m.tmdb_id, ...m }, profile, mediaItems, undefined, locale);
    return {
      id: m.tmdb_id,
      title: m.title,
      posterPath: m.poster_path,
      mediaType: (m.media_type || 'movie') as 'movie' | 'tv',
      rating: m.rating || 9.0,
      matchScore: 98,
      reason: struct.text,
      structuredReason: struct,
    };
  });

  return {
    isColdStart: false,
    activeMood: sessionMood,
    userTasteSummary: {
      topDnaTraits: Object.entries(profile.dnaWeights)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([trait]) => trait),
      topDecades: profile.preferredDecades,
      totalTracked: mediaItems.length,
      avgRating: profile.avgRating,
    },
    becauseYouLoved,
    watchlistGems: watchlistGems.length > 0 ? watchlistGems : undefined,
    rewatchCandidates: rewatchCandidates.length > 0 ? rewatchCandidates : undefined,
  };
}
