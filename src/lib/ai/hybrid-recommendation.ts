import { discoverMedia, searchMulti } from '@/lib/tmdb';
import { 
  classifyMovieDna, 
  calculateMatchScore, 
  translateDnaTrait, 
  type UserTasteProfile 
} from '@/lib/taste-engine';
import type { AiRecommendationItem, AiChatContext, ParsedMovieIntent } from './types';

export class HybridRecommendationEngine {
  /**
   * Orchestrates candidate retrieval, deterministic DNA scoring, and non-hallucinated explanation generation
   */
  public static async getRecommendations(
    intent: ParsedMovieIntent,
    profile: UserTasteProfile,
    userMediaItems: any[] = [],
    contextInfo?: AiChatContext,
    locale: string = 'en'
  ): Promise<AiRecommendationItem[]> {
    const isZh = locale === 'zh-TW' || locale.startsWith('zh');
    const targetLang = isZh ? 'zh-TW' : 'en-US';
    const candidatePool: any[] = [];
    const seenIds = new Set<number>();

    // 1. If reference titles exist, retrieve them to extract recommendations
    if (intent.referenceTitles && intent.referenceTitles.length > 0) {
      for (const title of intent.referenceTitles.slice(0, 2)) {
        try {
          const searchRes = await searchMulti(title, 1);
          const topMatch = searchRes?.results?.find((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
          if (topMatch && topMatch.id) {
            const genreIds = topMatch.genre_ids || [];
            if (genreIds.length > 0) {
              const related = await discoverMedia('movie', {
                with_genres: genreIds.slice(0, 2).join(','),
                sort_by: 'vote_average.desc',
                'vote_count.gte': '400',
                language: targetLang,
              });
              if (related?.results) {
                related.results.forEach((r: any) => {
                  if (r.id !== topMatch.id && !seenIds.has(r.id)) {
                    seenIds.add(r.id);
                    candidatePool.push({ ...r, referenceTitle: topMatch.title || topMatch.name });
                  }
                });
              }
            }
          }
        } catch {
          // Continue with fallback discovery
        }
      }
    }

    // 2. Discover based on extracted genres & parameters
    if (candidatePool.length < 8) {
      try {
        const genreStr = intent.genres && intent.genres.length > 0 
          ? intent.genres.slice(0, 2).join(',') 
          : '878,18';

        const discoverRes = await discoverMedia('movie', {
          with_genres: genreStr,
          sort_by: 'popularity.desc',
          'vote_count.gte': '200',
          language: targetLang,
        });

        if (discoverRes?.results) {
          discoverRes.results.forEach((r: any) => {
            if (!seenIds.has(r.id)) {
              seenIds.add(r.id);
              candidatePool.push(r);
            }
          });
        }
      } catch (e) {
        console.error('Discover candidate error:', e);
      }
    }

    // 3. Fallback: Trending if candidates are still sparse
    if (candidatePool.length === 0) {
      try {
        const fallbackRes = await discoverMedia('movie', {
          sort_by: 'vote_average.desc',
          'vote_count.gte': '1000',
          language: targetLang,
        });
        if (fallbackRes?.results) {
          fallbackRes.results.forEach((r: any) => candidatePool.push(r));
        }
      } catch {
        // Safe fallback
      }
    }

    // 4. Deterministic Scoring & Filtering
    const scoredCandidates = candidatePool
      .filter((movie) => {
        // Exclude dismissed items
        if (profile.dismissedTmdbIds && profile.dismissedTmdbIds.has(movie.id)) {
          return false;
        }
        // Exclude current media context title if chatting on a details page
        if (contextInfo?.id && movie.id === contextInfo.id) {
          return false;
        }
        return true;
      })
      .map((movie) => {
        const matchScore = calculateMatchScore(movie, profile);
        const dna = classifyMovieDna(movie);

        // Generate non-hallucinated, structured reason
        let matchReason = '';
        const traitName = translateDnaTrait(dna.primaryDna, locale);

        if (movie.referenceTitle) {
          matchReason = isZh
            ? `與《${movie.referenceTitle}》擁有相近的「${traitName}」敘事氛圍與核心哲思。`
            : `Shares the captivating "${traitName}" atmosphere and philosophical tone of ${movie.referenceTitle}.`;
        } else {
          const highRatedHistory = userMediaItems.find(
            (i) => (i.rating && i.rating >= 8) || i.status === 'completed'
          );

          if (highRatedHistory) {
            matchReason = isZh
              ? `契合您對《${highRatedHistory.title}》的喜愛，具備同等的「${traitName}」特質。`
              : `Matches your high rating for ${highRatedHistory.title}, featuring rich ${traitName} storytelling.`;
          } else {
            matchReason = isZh
              ? `高度符合您偏好的「${traitName}」風格與高評價口碑。`
              : `Matches your taste for ${traitName} storytelling and acclaimed world-building.`;
          }
        }

        const year = movie.release_date
          ? String(new Date(movie.release_date).getFullYear())
          : movie.first_air_date
          ? String(new Date(movie.first_air_date).getFullYear())
          : undefined;

        const item: AiRecommendationItem = {
          id: movie.id,
          title: movie.title || movie.name || 'Untitled',
          year,
          posterPath: movie.poster_path || null,
          backdropPath: movie.backdrop_path || null,
          voteAverage: movie.vote_average ? parseFloat(movie.vote_average.toFixed(1)) : undefined,
          matchScore,
          matchReason,
          primaryDna: dna.primaryDna,
          mediaType: movie.first_air_date ? 'tv' : 'movie',
        };

        return { item, matchScore };
      });

    // Sort by match score descending and pick top 3
    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);
    return scoredCandidates.slice(0, 3).map((c) => c.item);
  }
}
