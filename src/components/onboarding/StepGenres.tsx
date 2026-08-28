'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Film, Tv, Check } from 'lucide-react';

interface Genre {
  id: number;
  name: string;
}

interface StepGenresProps {
  movieGenres: Genre[];
  tvGenres: Genre[];
  selectedMovieGenres: number[];
  selectedTvGenres: number[];
  onToggleMovieGenre: (id: number, name: string) => void;
  onToggleTvGenre: (id: number, name: string) => void;
}

export function StepGenres({
  movieGenres,
  tvGenres,
  selectedMovieGenres,
  selectedTvGenres,
  onToggleMovieGenre,
  onToggleTvGenre,
}: StepGenresProps) {
  const t = useTranslations('Onboarding');
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'movie' | 'tv'>('movie');

  const filteredMovieGenres = useMemo(() => {
    if (!searchFilter.trim()) return movieGenres;
    const q = searchFilter.toLowerCase();
    return movieGenres.filter((g) => g.name.toLowerCase().includes(q));
  }, [movieGenres, searchFilter]);

  const filteredTvGenres = useMemo(() => {
    if (!searchFilter.trim()) return tvGenres;
    const q = searchFilter.toLowerCase();
    return tvGenres.filter((g) => g.name.toLowerCase().includes(q));
  }, [tvGenres, searchFilter]);

  return (
    <div className="space-y-6">
      {/* Search Filter & Group Switcher */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Tab switch */}
        <div className="inline-flex rounded-xl bg-background-elevated p-1 border border-border/40">
          <button
            type="button"
            onClick={() => setActiveTab('movie')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'movie'
                ? 'bg-foreground text-background shadow-md'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <Film className="h-3.5 w-3.5" />
            <span>{t('movieGenres')}</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                selectedMovieGenres.length >= 3
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-background/40 text-foreground-muted'
              }`}
            >
              {selectedMovieGenres.length}/3
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tv')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'tv'
                ? 'bg-foreground text-background shadow-md'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <Tv className="h-3.5 w-3.5" />
            <span>{t('tvGenres')}</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                selectedTvGenres.length >= 3
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-background/40 text-foreground-muted'
              }`}
            >
              {selectedTvGenres.length}/3
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-muted" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={t('searchGenresPlaceholder')}
            className="w-full pl-9 pr-3 py-2 bg-background-elevated border border-border/40 rounded-xl text-xs text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Genre Chips Grid */}
      <div className="min-h-[220px]">
        {activeTab === 'movie' ? (
          <div className="flex flex-wrap gap-2.5">
            {filteredMovieGenres.map((genre) => {
              const isSelected = selectedMovieGenres.includes(genre.id);
              return (
                <button
                  key={`movie-${genre.id}`}
                  type="button"
                  onClick={() => onToggleMovieGenre(genre.id, genre.name)}
                  className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-accent text-background border-accent font-bold shadow-md shadow-accent/20'
                      : 'bg-background-elevated/80 border-border/40 text-foreground-muted hover:text-foreground hover:border-accent/40 hover:bg-background-elevated'
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-md flex items-center justify-center text-[10px] transition-colors ${
                      isSelected
                        ? 'bg-background text-foreground'
                        : 'border border-border/60 text-transparent group-hover:border-foreground-muted'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span>{genre.name}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {filteredTvGenres.map((genre) => {
              const isSelected = selectedTvGenres.includes(genre.id);
              return (
                <button
                  key={`tv-${genre.id}`}
                  type="button"
                  onClick={() => onToggleTvGenre(genre.id, genre.name)}
                  className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-accent text-background border-accent font-bold shadow-md shadow-accent/20'
                      : 'bg-background-elevated/80 border-border/40 text-foreground-muted hover:text-foreground hover:border-accent/40 hover:bg-background-elevated'
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-md flex items-center justify-center text-[10px] transition-colors ${
                      isSelected
                        ? 'bg-background text-foreground'
                        : 'border border-border/60 text-transparent group-hover:border-foreground-muted'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span>{genre.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
