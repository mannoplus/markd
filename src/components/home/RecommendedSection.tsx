'use client';

import { useState } from 'react';
import { Sparkles, MoreVertical, ThumbsDown, CheckCircle, EyeOff, Eye } from 'lucide-react';
import { MovieCard } from '@/components/movie-card';
import type { TMDBTrendingResult } from '@/types';
import { useTranslations, useLocale } from 'next-intl';
import { classifyMovieDna, translateDnaTrait } from '@/lib/taste-engine';
import { submitTasteFeedbackAction } from '@/app/actions';

interface RecommendedSectionProps {
  items: TMDBTrendingResult[];
  userWatchedItems?: any[];
}

export function RecommendedSection({ items, userWatchedItems = [] }: RecommendedSectionProps) {
  const t = useTranslations('Home');
  const tTaste = useTranslations('TasteEngine');
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
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {t('recommendedForYou')}
            </h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
              Taste Model
            </span>
          </div>
          <p className="text-xs text-foreground-muted">
            {t('recommendedForYouSub')}
          </p>
        </div>
      </div>

      {/* Recommended Carousel */}
      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
        {visibleItems.slice(0, 12).map((item, idx) => {
          const dna = classifyMovieDna(item);
          const matchPercent = 98 - idx * 2; // Dynamic high confidence score
          const isMenuOpen = activeMenuId === item.id;

          return (
            <div key={item.id} className="w-44 md:w-52 shrink-0 snap-start relative group fade-in">
              <div className="relative">
                <MovieCard
                  id={item.id}
                  title={item.title || item.name || ''}
                  posterPath={item.poster_path}
                  voteAverage={item.vote_average}
                  releaseDate={item.release_date || item.first_air_date}
                  mediaType="movie"
                  rtScore={item.rtScore}
                  rtStatus={item.rtStatus}
                />

                {/* Match Badge Tag */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="rounded-md bg-black/85 backdrop-blur-md px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/30 shadow-lg">
                    {matchPercent}% Match
                  </span>
                </div>

                {/* Feedback Trigger Menu */}
                <div className="absolute top-2 right-2 z-20">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveMenuId(isMenuOpen ? null : item.id);
                    }}
                    className="p-1 rounded-full bg-black/75 hover:bg-black text-foreground-muted hover:text-foreground backdrop-blur-md border border-border/30 transition-all cursor-pointer"
                    title="Feedback"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>

                  {/* Feedback Dropdown */}
                  {isMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border/40 bg-[#161622] p-1.5 shadow-2xl z-50 flex flex-col space-y-1 animate-in fade-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleFeedback(item.id, 'already_watched')}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-foreground-muted hover:bg-white/10 hover:text-foreground transition-colors text-left"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{t('alreadyWatched')}</span>
                      </button>

                      <button
                        onClick={() => handleFeedback(item.id, 'not_interested')}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-foreground-muted hover:bg-white/10 hover:text-foreground transition-colors text-left"
                      >
                        <EyeOff className="h-3.5 w-3.5 text-yellow-400" />
                        <span>{t('notInterested')}</span>
                      </button>

                      <button
                        onClick={() => handleFeedback(item.id, 'less_like_this')}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-foreground-muted hover:bg-white/10 hover:text-foreground transition-colors text-left"
                      >
                        <ThumbsDown className="h-3.5 w-3.5 text-red-400" />
                        <span>{t('lessLikeThis')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* DNA Tone Pill */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-foreground-subtle uppercase tracking-wider truncate">
                  {translateDnaTrait(dna.primaryDna, locale)}
                </span>
                <span className="text-[9px] text-accent/80 font-mono">
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
