'use client';

import { useState } from 'react';
import { Sparkles, MoreVertical, ThumbsDown, CheckCircle, EyeOff } from 'lucide-react';
import { MovieCard } from '@/components/movie-card';
import { SectionHeader } from '@/components/section-header';
import type { TMDBTrendingResult } from '@/types';
import { useTranslations, useLocale } from 'next-intl';
import { classifyMovieDna, translateDnaTrait } from '@/lib/taste-engine';
import { submitTasteFeedbackAction } from '@/app/actions';

interface RecommendedSectionProps {
  items: TMDBTrendingResult[];
}

export function RecommendedSection({ items }: RecommendedSectionProps) {
  const t = useTranslations('Home');
  const locale = useLocale();

  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const handleFeedback = async (
    tmdbId: number,
    signal: 'not_interested' | 'already_watched' | 'not_my_type' | 'less_like_this'
  ) => {
    setHiddenIds((prev) => new Set([...prev, tmdbId]));
    setActiveMenuId(null);
    try {
      await submitTasteFeedbackAction({
        tmdb_id: tmdbId,
        media_type: 'movie',
        signal_type: signal,
      });
    } catch (e) {
      console.error('Failed to submit feedback:', e);
    }
  };

  const visibleItems = items.filter((item) => !hiddenIds.has(item.id));
  if (visibleItems.length === 0) return null;

  return (
    <section className="space-y-5" aria-label={t('recommendedForYou')}>
      <SectionHeader
        eyebrow="Personalized"
        title={t('recommendedForYou')}
        description={t('recommendedForYouSub')}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
          <Sparkles className="h-3.5 w-3.5" />
          {t('matchScore')}
        </span>
      </SectionHeader>

      <div className="media-rail -mx-4 px-4 sm:mx-0 sm:px-0">
        {visibleItems.slice(0, 12).map((item, idx) => {
          const dna = classifyMovieDna(item);
          const matchPercent = 98 - idx * 2;
          const isMenuOpen = activeMenuId === item.id;

          return (
            <div key={item.id} className="relative w-36 md:w-44">
              <MovieCard
                id={item.id}
                title={item.title || item.name || ''}
                posterPath={item.poster_path}
                voteAverage={item.vote_average}
                releaseDate={item.release_date || item.first_air_date}
                mediaType="movie"
                rtScore={item.rtScore}
                rtStatus={item.rtStatus}
                matchPercent={matchPercent}
              />

              {/* Feedback menu */}
              <div className="absolute right-1.5 top-9 z-20">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveMenuId(isMenuOpen ? null : item.id);
                  }}
                  aria-label={t('lessLikeThis')}
                  aria-expanded={isMenuOpen}
                  className="rounded-md bg-black/60 p-1 text-foreground-muted backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-foreground"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>

                {isMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-30 mt-1 w-48 origin-top-right rounded-lg border border-border bg-surface-secondary/95 p-1.5 shadow-elevated backdrop-blur-xl scale-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      role="menuitem"
                      onClick={() => handleFeedback(item.id, 'already_watched')}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-background-elevated"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-success" />
                      {t('alreadyWatched')}
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => handleFeedback(item.id, 'not_interested')}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-background-elevated"
                    >
                      <EyeOff className="h-3.5 w-3.5 text-warning" />
                      {t('notInterested')}
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => handleFeedback(item.id, 'less_like_this')}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-background-elevated"
                    >
                      <ThumbsDown className="h-3.5 w-3.5 text-error" />
                      {t('lessLikeThis')}
                    </button>
                  </div>
                )}
              </div>

              {/* DNA tone */}
              <div className="flex items-center justify-between gap-2 px-0.5 pt-1.5">
                <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
                  {translateDnaTrait(dna.primaryDna, locale)}
                </span>
                <span className="shrink-0 text-[10px] font-medium text-foreground-subtle">
                  ★ {item.vote_average?.toFixed(1) || '8.0'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}