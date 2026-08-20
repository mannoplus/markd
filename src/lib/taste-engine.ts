/**
 * MARKD — Taste Engine & Movie DNA Classifier
 * Personal Cinema Companion Architecture
 */

import type { TMDBTrendingResult } from '@/types';

export type MovieDnaTrait =
  | 'emotional'
  | 'dark'
  | 'funny'
  | 'romantic'
  | 'violent'
  | 'fastPaced'
  | 'slowBurn'
  | 'mindBending'
  | 'suspenseful'
  | 'thoughtProvoking'
  | 'hopeful'
  | 'tragic'
  | 'characterDriven'
  | 'plotDriven'
  | 'actionHeavy'
  | 'dialogueHeavy'
  | 'cinematography'
  | 'soundtrack'
  | 'nostalgic'
  | 'psychological'
  | 'mystery'
  | 'sciFi'
  | 'fantasy'
  | 'historical'
  | 'political'
  | 'familyFriendly';

export interface MovieDnaAnalysis {
  traits: MovieDnaTrait[];
  primaryDna: MovieDnaTrait;
  intensity: number; // 1-10
  pacing: 'fast' | 'slow' | 'balanced';
  moodTags: string[];
}

export interface SessionTasteContext {
  activeMood?: string; // e.g. 'Mind-Bending', 'Cozy & Feel-Good', 'Atmospheric Slow-Burn', 'Under 2 Hours'
  maxRuntime?: number; // e.g. 115
  temporaryExcludedGenreIds?: number[];
  temporaryDismissedIds?: Set<number>;
  isExploreMode?: boolean; // Controlled exploration for novel discoveries
}

export interface UserTasteProfile {
  userId?: string;
  genreWeights: Record<number, number>; // genreId -> normalized weight (0 - 1)
  directorAffinities: Record<string, number>; // directorName -> weight
  dnaWeights: Record<MovieDnaTrait, number>; // trait -> weight
  preferredDecades: string[]; // e.g. ["2010s", "1990s"]
  avgRating: number;
  totalWatched: number;
  pacingPreference: 'fast' | 'slow' | 'balanced';
  dismissedTmdbIds: Set<number>;
  alreadyWatchedTmdbIds: Set<number>;
  notMyTypeIds: Set<number>;
  lessLikeThisTraits: Set<MovieDnaTrait>;
  sessionContext?: SessionTasteContext;
}

export interface RecommendationResult extends TMDBTrendingResult {
  matchScore: number; // e.g. 96
  matchReason: string;
  dnaTraits: MovieDnaTrait[];
  primaryDna: MovieDnaTrait;
  structuredReason?: {
    type: string;
    text: string;
    referenceTitle?: string;
  };
}

// Genre ID mapping for TMDB
export const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

/**
 * Classifies a movie or TV show into its multi-dimensional Movie DNA characteristics
 */
export function classifyMovieDna(item: any): MovieDnaAnalysis {
  const genreIds: number[] = item.genre_ids || (item.genres ? item.genres.map((g: any) => g.id) : []);
  const title = (item.title || item.name || '').toLowerCase();
  const overview = (item.overview || '').toLowerCase();
  const runtime = item.runtime || 110;
  const rating = item.vote_average || 7.0;

  const detectedTraits: Set<MovieDnaTrait> = new Set();
  const moodTags: string[] = [];

  // 1. Sci-Fi & Mind-Bending
  if (genreIds.includes(878)) {
    detectedTraits.add('sciFi');
    if (
      overview.includes('time') ||
      overview.includes('reality') ||
      overview.includes('memory') ||
      overview.includes('dimension') ||
      overview.includes('simulation') ||
      overview.includes('quantum') ||
      title.includes('inception') ||
      title.includes('interstellar') ||
      title.includes('matrix') ||
      title.includes('tenet') ||
      title.includes('arrival')
    ) {
      detectedTraits.add('mindBending');
      detectedTraits.add('thoughtProvoking');
      moodTags.push('Mind-Bending');
    }
  }

  // 2. Psychological & Mystery
  if (genreIds.includes(9648) || overview.includes('detective') || overview.includes('murder') || overview.includes('investigate')) {
    detectedTraits.add('mystery');
    detectedTraits.add('suspenseful');
    if (overview.includes('mind') || overview.includes('sanity') || overview.includes('obsession') || overview.includes('secrets')) {
      detectedTraits.add('psychological');
      detectedTraits.add('thoughtProvoking');
    }
  }

  // 3. Dark & Thriller
  if (genreIds.includes(53) || genreIds.includes(27) || genreIds.includes(80)) {
    if (genreIds.includes(27)) {
      detectedTraits.add('dark');
      detectedTraits.add('suspenseful');
      moodTags.push('Edge-of-Seat');
    }
    if (overview.includes('kill') || overview.includes('revenge') || overview.includes('criminal') || overview.includes('syndicate')) {
      detectedTraits.add('dark');
      detectedTraits.add('violent');
    }
  }

  // 4. Emotional & Romance & Tragic
  if (genreIds.includes(10749) || (genreIds.includes(18) && (overview.includes('love') || overview.includes('relationship') || overview.includes('grief')))) {
    detectedTraits.add('emotional');
    if (genreIds.includes(10749)) detectedTraits.add('romantic');
    if (overview.includes('loss') || overview.includes('death') || overview.includes('tragedy') || overview.includes('terminal')) {
      detectedTraits.add('tragic');
    } else {
      detectedTraits.add('characterDriven');
    }
  }

  // 5. Funny & Hopeful & Family
  if (genreIds.includes(35) || genreIds.includes(10751) || genreIds.includes(16)) {
    if (genreIds.includes(35)) detectedTraits.add('funny');
    if (genreIds.includes(10751) || genreIds.includes(16)) detectedTraits.add('familyFriendly');
    detectedTraits.add('hopeful');
    moodTags.push('Feel-Good');
  }

  // 6. Action Heavy & Fast Paced
  if (genreIds.includes(28) || genreIds.includes(12)) {
    detectedTraits.add('actionHeavy');
    detectedTraits.add('plotDriven');
    if (runtime < 125) {
      detectedTraits.add('fastPaced');
    }
  }

  // 7. Pacing Calculation
  let pacing: 'fast' | 'slow' | 'balanced' = 'balanced';
  if (runtime > 140 || (genreIds.includes(18) && !genreIds.includes(28))) {
    detectedTraits.add('slowBurn');
    pacing = 'slow';
  } else if (genreIds.includes(28) && runtime < 115) {
    detectedTraits.add('fastPaced');
    pacing = 'fast';
  }

  // 8. Visuals & Cinematography
  if (rating >= 7.8 || genreIds.includes(14) || genreIds.includes(878) || genreIds.includes(36)) {
    detectedTraits.add('cinematography');
    moodTags.push('Visual Splendor');
  }

  // 9. Historical & Politics
  if (genreIds.includes(36) || genreIds.includes(10752)) {
    detectedTraits.add('historical');
    detectedTraits.add('political');
  }

  // Ensure minimum traits
  if (detectedTraits.size === 0) {
    detectedTraits.add('characterDriven');
    detectedTraits.add('thoughtProvoking');
  }

  const traitsList = Array.from(detectedTraits);
  const primaryDna = traitsList[0] || 'thoughtProvoking';

  return {
    traits: traitsList.slice(0, 5),
    primaryDna,
    intensity: Math.min(10, Math.max(1, Math.round(rating))),
    pacing,
    moodTags: moodTags.length > 0 ? moodTags : ['Thought-Provoking'],
  };
}

/**
 * Calculates a persistent User Taste Profile Vector from user media items and feedback
 */
export function calculateUserTasteProfile(
  mediaItems: any[] = [],
  feedbackItems: any[] = [],
  sessionContext?: SessionTasteContext
): UserTasteProfile {
  const genreCounts: Record<number, number> = {};
  const dnaCounts: Record<MovieDnaTrait, number> = {} as any;
  const decadeCounts: Record<string, number> = {};
  let totalRatingSum = 0;
  let ratedCount = 0;

  const dismissedTmdbIds = new Set<number>();
  const alreadyWatchedTmdbIds = new Set<number>();
  const notMyTypeIds = new Set<number>();
  const lessLikeThisTraits = new Set<MovieDnaTrait>();

  // Process Negative / Explicit Feedback
  feedbackItems.forEach((f) => {
    if (f.signal_type === 'not_interested') {
      dismissedTmdbIds.add(f.tmdb_id);
    } else if (f.signal_type === 'not_my_type') {
      notMyTypeIds.add(f.tmdb_id);
      dismissedTmdbIds.add(f.tmdb_id);
    } else if (f.signal_type === 'less_like_this') {
      dismissedTmdbIds.add(f.tmdb_id);
    } else if (f.signal_type === 'already_watched') {
      alreadyWatchedTmdbIds.add(f.tmdb_id);
    }
  });

  // Process Tracked Library Media
  mediaItems.forEach((item) => {
    if (item.status === 'completed' || item.status === 'watching') {
      alreadyWatchedTmdbIds.add(item.tmdb_id);
    }

    const ratingWeight = item.rating ? item.rating / 5 : item.status === 'completed' ? 1.5 : 1.0;

    if (item.rating) {
      totalRatingSum += item.rating;
      ratedCount++;
    }

    // Classify Movie DNA
    const dna = classifyMovieDna(item);
    dna.traits.forEach((t) => {
      dnaCounts[t] = (dnaCounts[t] || 0) + ratingWeight;
    });

    // Genres
    const gIds = item.genre_ids || (item.genres ? item.genres.map((g: any) => g.id) : []);
    gIds.forEach((gid: number) => {
      genreCounts[gid] = (genreCounts[gid] || 0) + ratingWeight;
    });

    // Approximate Decade
    if (item.created_at || item.releaseDate || item.release_date) {
      const year = new Date(item.releaseDate || item.release_date || item.created_at).getFullYear();
      if (year) {
        const decade = `${Math.floor(year / 10) * 10}s`;
        decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
      }
    }
  });

  // Calculate top decades
  const preferredDecades = Object.entries(decadeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([d]) => d);

  // Normalize Genre Weights
  const maxGenreScore = Math.max(...Object.values(genreCounts), 1);
  const normalizedGenres: Record<number, number> = {};
  Object.entries(genreCounts).forEach(([gid, count]) => {
    normalizedGenres[Number(gid)] = count / maxGenreScore;
  });

  return {
    genreWeights: normalizedGenres,
    directorAffinities: {},
    dnaWeights: dnaCounts,
    preferredDecades: preferredDecades.length > 0 ? preferredDecades : ['2020s', '2010s', '2000s'],
    avgRating: ratedCount > 0 ? parseFloat((totalRatingSum / ratedCount).toFixed(1)) : 8.0,
    totalWatched: mediaItems.filter((i) => i.status === 'completed').length,
    pacingPreference: 'balanced',
    dismissedTmdbIds,
    alreadyWatchedTmdbIds,
    notMyTypeIds,
    lessLikeThisTraits,
    sessionContext,
  };
}

/**
 * Calculates a match score percentage (e.g. 98%) between a movie and a user taste profile
 */
export function calculateMatchScore(movie: any, profile: UserTasteProfile): number {
  if (profile.notMyTypeIds?.has(movie.id) || profile.dismissedTmdbIds?.has(movie.id)) {
    return 30; // Strictly penalized if explicitly dismissed
  }

  const dna = classifyMovieDna(movie);
  let score = 72; // Base confidence score

  // 1. DNA Trait Match Boost (Cosine-style additive weighting)
  dna.traits.forEach((trait) => {
    if (profile.dnaWeights[trait]) {
      score += Math.min(5, profile.dnaWeights[trait] * 1.5);
    }
  });

  // 2. Genre Alignment Boost
  const genreIds = movie.genre_ids || (movie.genres ? movie.genres.map((g: any) => g.id) : []);
  genreIds.forEach((gid: number) => {
    if (profile.genreWeights[gid]) {
      score += profile.genreWeights[gid] * 4;
    }
  });

  // 3. TMDB Quality / Community Consensus Boost
  if (movie.vote_average) {
    if (movie.vote_average >= 8.2) score += 9;
    else if (movie.vote_average >= 7.4) score += 5;
    else if (movie.vote_average < 6.0) score -= 10;
  }

  // 4. Preferred Decade Boost
  const year = movie.release_date || movie.first_air_date ? new Date(movie.release_date || movie.first_air_date).getFullYear() : null;
  if (year) {
    const decade = `${Math.floor(year / 10) * 10}s`;
    if (profile.preferredDecades.includes(decade)) {
      score += 4;
    }
  }

  // 5. Active Session Mood Alignment
  if (profile.sessionContext?.activeMood && profile.sessionContext.activeMood !== 'all') {
    const moodLower = profile.sessionContext.activeMood.toLowerCase();
    if (
      (moodLower.includes('mind-bending') && dna.traits.includes('mindBending')) ||
      (moodLower.includes('cozy') && (dna.traits.includes('funny') || dna.traits.includes('hopeful'))) ||
      (moodLower.includes('slow-burn') && dna.traits.includes('slowBurn')) ||
      (moodLower.includes('dark') && (dna.traits.includes('dark') || dna.traits.includes('suspenseful'))) ||
      (moodLower.includes('emotional') && dna.traits.includes('emotional')) ||
      (moodLower.includes('action') && dna.traits.includes('actionHeavy')) ||
      (moodLower.includes('visual') && dna.traits.includes('cinematography'))
    ) {
      score += 8;
    }
  }

  // 6. Controlled Exploration Bonus (Prevent narrow filter bubble)
  if (profile.sessionContext?.isExploreMode) {
    score += (Math.sin(movie.id || 1) * 3);
  }

  // Cap score realistically between 74% and 99%
  return Math.min(99, Math.max(74, Math.round(score)));
}

/**
 * DNA Trait Translation Helper
 */
export function translateDnaTrait(trait: MovieDnaTrait, locale: string = 'en'): string {
  const isZh = locale === 'zh-TW' || locale.startsWith('zh');
  const dict: Record<MovieDnaTrait, { en: string; zh: string }> = {
    emotional: { en: 'Emotional Depth', zh: '情感共鳴' },
    dark: { en: 'Dark & Gritty', zh: '冷冽暗黑' },
    funny: { en: 'Witty Comedy', zh: '幽默詼諧' },
    romantic: { en: 'Romantic', zh: '浪漫深情' },
    violent: { en: 'Visceral Intensity', zh: '張力震撼' },
    fastPaced: { en: 'Fast-Paced', zh: '明快節奏' },
    slowBurn: { en: 'Atmospheric Slow-Burn', zh: '沉浸慢熱' },
    mindBending: { en: 'Mind-Bending', zh: '燒腦反轉' },
    suspenseful: { en: 'Nail-Biting Suspense', zh: '極限懸疑' },
    thoughtProvoking: { en: 'Thought-Provoking', zh: '哲思啟迪' },
    hopeful: { en: 'Inspiring & Hopeful', zh: '溫暖希望' },
    tragic: { en: 'Tragic Bittersweet', zh: '淒美哀傷' },
    characterDriven: { en: 'Character-Driven', zh: '細膩角色' },
    plotDriven: { en: 'Intricate Plot', zh: '精巧佈局' },
    actionHeavy: { en: 'Spectacle & Action', zh: '視覺震撼' },
    dialogueHeavy: { en: 'Dialogue-Rich', zh: '精采台詞' },
    cinematography: { en: 'Stunning Cinematography', zh: '絕美攝影' },
    soundtrack: { en: 'Iconic Score', zh: '動人配樂' },
    nostalgic: { en: 'Nostalgic Vibe', zh: '復古情懷' },
    psychological: { en: 'Psychological Depth', zh: '心理深意' },
    mystery: { en: 'Enigmatic Mystery', zh: '層層謎團' },
    sciFi: { en: 'Speculative Sci-Fi', zh: '前瞻科幻' },
    fantasy: { en: 'World-Building Fantasy', zh: '奇幻史詩' },
    historical: { en: 'Historical Epic', zh: '史詩歷史' },
    political: { en: 'Political Intrigue', zh: '政治博弈' },
    familyFriendly: { en: 'All-Ages Friendly', zh: '闔家共賞' },
  };

  return isZh ? dict[trait]?.zh || trait : dict[trait]?.en || trait;
}
