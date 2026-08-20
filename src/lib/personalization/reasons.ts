/**
 * MARKD — Structured Recommendation Explanation Engine
 * Produces honest, human, non-hallucinated explanations grounded in real data.
 */

import { classifyMovieDna, translateDnaTrait, type MovieDnaTrait, type UserTasteProfile } from '@/lib/taste-engine';

export type ReasonType =
  | 'similar_to_loved'
  | 'dna_match'
  | 'director_affinity'
  | 'watchlist_gem'
  | 'mood_match'
  | 'rewatch_candidate'
  | 'quick_watch'
  | 'critically_acclaimed';

export interface StructuredReason {
  type: ReasonType;
  primaryTrait?: MovieDnaTrait;
  referenceTitle?: string;
  directorName?: string;
  mood?: string;
  text: string;
}

/**
 * Builds a structured, explainable reason for a movie recommendation
 */
export function buildRecommendationReason(
  movie: any,
  profile: UserTasteProfile,
  userMediaItems: any[] = [],
  activeMood?: string,
  locale: string = 'en'
): StructuredReason {
  const isZh = locale === 'zh-TW' || locale.startsWith('zh');
  const dna = classifyMovieDna(movie);
  const primaryTrait = dna.primaryDna;
  const traitLabel = translateDnaTrait(primaryTrait, locale);

  // 1. Check if matching tonight's active session mood
  if (activeMood && activeMood !== 'all') {
    if (isZh) {
      return {
        type: 'mood_match',
        mood: activeMood,
        primaryTrait,
        text: `契合您今晚想看的「${activeMood}」氛圍`,
      };
    }
    return {
      type: 'mood_match',
      mood: activeMood,
      primaryTrait,
      text: `Matches tonight's "${activeMood}" mood`,
    };
  }

  // 2. Check if item is already a high-rated favorite or rewatch candidate
  const existingItem = userMediaItems.find((i) => i.tmdb_id === movie.id);
  if (existingItem) {
    if (existingItem.status === 'completed' && existingItem.rating && existingItem.rating >= 8) {
      if (isZh) {
        return {
          type: 'rewatch_candidate',
          referenceTitle: existingItem.title,
          text: `您曾給予此作 ${existingItem.rating} 分極高評價，值得再次回味`,
        };
      }
      return {
        type: 'rewatch_candidate',
        referenceTitle: existingItem.title,
        text: `Rated ${existingItem.rating}/10 by you — a nostalgic favorite to revisit`,
      };
    }
    if (existingItem.status === 'plan_to_watch') {
      if (isZh) {
        return {
          type: 'watchlist_gem',
          text: `藏於您待播片單中的高評分佳作`,
        };
      }
      return {
        type: 'watchlist_gem',
        text: `A top-rated gem waiting in your watchlist`,
      };
    }
  }

  // 3. Check for strong similarity to a favorite movie in user history
  const favoriteItems = userMediaItems.filter(
    (i) => (i.rating && i.rating >= 8) || i.status === 'completed'
  );

  const matchedFavorite = favoriteItems.find((fav) => {
    const favDna = classifyMovieDna(fav);
    return favDna.traits.includes(primaryTrait) || favDna.primaryDna === primaryTrait;
  });

  if (matchedFavorite) {
    if (isZh) {
      return {
        type: 'similar_to_loved',
        referenceTitle: matchedFavorite.title,
        primaryTrait,
        text: `因為您喜愛《${matchedFavorite.title}》，延續「${traitLabel}」核心氛圍`,
      };
    }
    return {
      type: 'similar_to_loved',
      referenceTitle: matchedFavorite.title,
      primaryTrait,
      text: `Because you loved ${matchedFavorite.title}, sharing its ${traitLabel} tone`,
    };
  }

  // 4. Runtime constraint under 2 hours
  if (movie.runtime && movie.runtime <= 110 && (primaryTrait === 'fastPaced' || primaryTrait === 'thoughtProvoking')) {
    if (isZh) {
      return {
        type: 'quick_watch',
        primaryTrait,
        text: `片長僅 ${movie.runtime} 分鐘，節奏俐落且兼具「${traitLabel}」`,
      };
    }
    return {
      type: 'quick_watch',
      primaryTrait,
      text: `Under 2 hours (${movie.runtime}m) with captivating ${traitLabel} pacing`,
    };
  }

  // 5. Default DNA & Taste Alignment
  if (isZh) {
    return {
      type: 'dna_match',
      primaryTrait,
      text: `契合您對「${traitLabel}」與高品質敘事的偏好`,
    };
  }
  return {
    type: 'dna_match',
    primaryTrait,
    text: `Matches your affinity for ${traitLabel} storytelling`,
  };
}
