'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, Check, ArrowRight, Heart, Compass } from 'lucide-react';
import { emitClientSignal, createSignal } from '@/lib/personalization/signals';

interface StarterFilm {
  id: number;
  title: string;
  year: string;
  posterPath: string;
  trait: string;
}

const STARTER_POPULAR_FILMS: StarterFilm[] = [
  { id: 157336, title: 'Interstellar', year: '2014', posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', trait: 'Mind-Bending' },
  { id: 329865, title: 'Arrival', year: '2016', posterPath: '/x2OAH0j2CSuZ1p777b7gXw6Nis2.jpg', trait: 'Thought-Provoking' },
  { id: 496243, title: 'Parasite', year: '2019', posterPath: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', trait: 'Dark Thriller' },
  { id: 372058, title: 'Your Name.', year: '2016', posterPath: '/q719jXXEzOoYaps6qFsxWa9Hqsi.jpg', trait: 'Emotional' },
  { id: 27205, title: 'Inception', year: '2010', posterPath: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', trait: 'Mind-Bending' },
  { id: 120467, title: 'The Grand Budapest Hotel', year: '2014', posterPath: '/eWdyYQreja6JGCzqHWX9ne3rNfo.jpg', trait: 'Visual Splendor' },
];

interface ColdStartCompanionProps {
  onUnlock?: (selectedIds: number[]) => void;
}

export function ColdStartCompanion({ onUnlock }: ColdStartCompanionProps) {
  const t = useTranslations('Companion');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);

  const toggleSelect = (id: number, title: string) => {
    let next: number[];
    if (selectedIds.includes(id)) {
      next = selectedIds.filter((item) => item !== id);
    } else {
      next = [...selectedIds, id];
      emitClientSignal(
        createSignal('movie.liked', {
          tmdbId: id,
          title,
          context: { surface: 'home' },
        })
      );
    }
    setSelectedIds(next);
  };

  const handleUnlock = () => {
    if (onUnlock) onUnlock(selectedIds);
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="w-full rounded-3xl bg-gradient-to-b from-[#121220] via-[#0c0c16] to-[#07070d] border border-border/40 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden select-none animate-in fade-in duration-500">
      {/* Glow decorative effects */}
      <div className="absolute top-0 right-0 h-64 w-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-0.5 text-xs font-black uppercase text-accent border border-accent/25 tracking-wider">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>{t('companionTitle')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t('coldStartTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted max-w-xl">
            {t('coldStartSubtitle')}
          </p>
        </div>

        {selectedIds.length > 0 && (
          <button
            onClick={handleUnlock}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-background font-black text-xs hover:bg-accent-hover transition-all cursor-pointer shadow-lg shadow-accent/25 active:scale-95 shrink-0"
          >
            <span>{t('unlockRecommendations')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Tappable Starter Cards */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider">
            {t('pickFavorites')} ({selectedIds.length}/3)
          </span>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-xs text-foreground-subtle hover:text-foreground transition-colors cursor-pointer"
          >
            {t('skipForNow')}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {STARTER_POPULAR_FILMS.map((film) => {
            const isSelected = selectedIds.includes(film.id);

            return (
              <button
                key={film.id}
                onClick={() => toggleSelect(film.id, film.title)}
                className={`relative rounded-2xl overflow-hidden p-3 text-left border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                  isSelected
                    ? 'bg-accent/20 border-accent shadow-lg shadow-accent/20 ring-1 ring-accent'
                    : 'bg-background-elevated/60 border-border/40 hover:border-accent/40 hover:bg-background-elevated'
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <span className="text-[10px] font-black uppercase text-accent/80 tracking-wider">
                    {film.trait}
                  </span>
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-accent text-background border-accent'
                        : 'bg-background-elevated border-border/50 text-transparent'
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-foreground line-clamp-1">
                    {film.title}
                  </h4>
                  <p className="text-[10px] text-foreground-muted">{film.year}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
