'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Check } from 'lucide-react';

export interface GenreItemConfig {
  id: number;
  nameKey: string;
  defaultName: string;
  sampleMovie: string;
  posterPath: string;
}

export const ONBOARDING_18_GENRES: GenreItemConfig[] = [
  { id: 878, nameKey: 'sciFi', defaultName: 'Sci-Fi', sampleMovie: 'Dune: Part Two', posterPath: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg' },
  { id: 28, nameKey: 'action', defaultName: 'Action', sampleMovie: 'John Wick: Chapter 4', posterPath: '/vZloFAK7NKnMGKEslbb5VSAvqSQ.jpg' },
  { id: 18, nameKey: 'drama', defaultName: 'Drama', sampleMovie: 'Oppenheimer', posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg' },
  { id: 27, nameKey: 'horror', defaultName: 'Horror', sampleMovie: 'A Quiet Place: Day One', posterPath: '/yrpPYK2so95Y9BtNDHgSDWEcoR9.jpg' },
  { id: 53, nameKey: 'thriller', defaultName: 'Cyberpunk & Thriller', sampleMovie: 'Blade Runner 2049', posterPath: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg' },
  { id: 14, nameKey: 'fantasy', defaultName: 'Fantasy', sampleMovie: 'Avatar: The Way of Water', posterPath: '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg' },
  { id: 16, nameKey: 'animation', defaultName: 'Animation', sampleMovie: 'Spider-Man: Across the Spider-Verse', posterPath: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg' },
  { id: 35, nameKey: 'comedy', defaultName: 'Comedy', sampleMovie: 'Everything Everywhere All at Once', posterPath: '/rKgvtzOI0ZzpxtCHm9n4L1v9z9K.jpg' },
  { id: 80, nameKey: 'crime', defaultName: 'Crime', sampleMovie: 'The Dark Knight', posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg' },
  { id: 9648, nameKey: 'mystery', defaultName: 'Mystery', sampleMovie: 'Knives Out', posterPath: '/pThyQovXQrw2m0s9x82twj48Jq4.jpg' },
  { id: 10749, nameKey: 'romance', defaultName: 'Romance', sampleMovie: 'Past Lives', posterPath: '/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg' },
  { id: 12, nameKey: 'adventure', defaultName: 'Adventure', sampleMovie: 'Mad Max: Fury Road', posterPath: '/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg' },
  { id: 99, nameKey: 'documentary', defaultName: 'Documentary', sampleMovie: 'Free Solo', posterPath: '/v0m0h1d7z6Qz6sVp0u1Z5Vz1y4.jpg' },
  { id: 10751, nameKey: 'family', defaultName: 'Family', sampleMovie: 'Inside Out 2', posterPath: '/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg' },
  { id: 10402, nameKey: 'music', defaultName: 'Music', sampleMovie: 'Whiplash', posterPath: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg' },
  { id: 36, nameKey: 'history', defaultName: 'History', sampleMovie: 'Killers of the Flower Moon', posterPath: '/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg' },
  { id: 10752, nameKey: 'war', defaultName: 'War', sampleMovie: 'All Quiet on the Western Front', posterPath: '/hYqOjJ7Gh5fbqXrxlIao1g8cyeh.jpg' },
  { id: 37, nameKey: 'western', defaultName: 'Western', sampleMovie: 'Django Unchained', posterPath: '/7oWY8vdWW7TmTJb9ugMI0stgahY.jpg' },
];

interface StepGenresProps {
  selectedGenres: number[];
  onToggleGenre: (id: number, name: string) => void;
}

export function StepGenres({
  selectedGenres,
  onToggleGenre,
}: StepGenresProps) {
  const t = useTranslations('Onboarding');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredGenres = useMemo(() => {
    if (!searchFilter.trim()) return ONBOARDING_18_GENRES;
    const q = searchFilter.toLowerCase();
    return ONBOARDING_18_GENRES.filter((g) => {
      const translated = t(`genre_${g.nameKey}` as any) || g.defaultName;
      return translated.toLowerCase().includes(q) || g.defaultName.toLowerCase().includes(q);
    });
  }, [searchFilter, t]);

  return (
    <div className="space-y-6">
      {/* Header filter & real-time counter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-white border border-white/15">
            <span>{selectedGenres.length} {t('selected') || 'Selected'}</span>
            <span className="text-white/40">•</span>
            <span className={selectedGenres.length >= 3 ? 'text-emerald-400 font-extrabold' : 'text-white/70'}>
              {selectedGenres.length >= 3 ? (t('requirementMet') || '✓ Requirement met') : (t('minGenresReq') || 'Select at least 3')}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50 pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={t('searchGenresPlaceholder') || 'Filter genres...'}
            className="w-full pl-9 pr-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      {/* 18 Genre Poster Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {filteredGenres.map((genre) => {
          const isSelected = selectedGenres.includes(genre.id);
          const genreName = t(`genre_${genre.nameKey}` as any) || genre.defaultName;

          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => onToggleGenre(genre.id, genreName)}
              className={`group relative aspect-[4/5] sm:aspect-square flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl text-left overflow-hidden border transition-all duration-300 cursor-pointer select-none ${
                isSelected
                  ? 'bg-white/15 border-white ring-1 ring-white shadow-[0_0_24px_rgba(255,255,255,0.18)] scale-[1.02]'
                  : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
              }`}
            >
              {/* Background Poster Artwork */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-500 opacity-40 group-hover:opacity-65 group-hover:scale-105"
                style={{
                  backgroundImage: `url('https://image.tmdb.org/t/p/w500${genre.posterPath}')`,
                }}
              />

              {/* Gradient Scrim for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

              {/* Top Row: Checkmark indicator */}
              <div className="relative z-10 flex justify-end w-full">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center border transition-all duration-200 ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-md'
                      : 'border-white/30 bg-black/40 text-transparent group-hover:border-white/60'
                  }`}
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </div>

              {/* Bottom Label & Movie Anchor */}
              <div className="relative z-10 space-y-0.5">
                <span className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white line-clamp-1">
                  {genreName}
                </span>
                <span className="block text-[10px] text-white/60 font-medium truncate">
                  {genre.sampleMovie}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
