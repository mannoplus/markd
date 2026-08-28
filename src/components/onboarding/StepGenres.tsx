'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

export interface GenreItemConfig {
  id: number;
  nameKey: string;
  defaultName: string;
  posterPath: string;
}

export const ONBOARDING_18_GENRES: GenreItemConfig[] = [
  { id: 878, nameKey: 'sciFi', defaultName: 'Sci-Fi', posterPath: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg' },
  { id: 28, nameKey: 'action', defaultName: 'Action', posterPath: '/2tFqvUzOGAxl1ryI3gQBvIzj8pD.jpg' },
  { id: 18, nameKey: 'drama', defaultName: 'Drama', posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg' },
  { id: 27, nameKey: 'horror', defaultName: 'Horror', posterPath: '/b33nnKl1GSFbao4l3f2cB4q981p.jpg' },
  { id: 53, nameKey: 'thriller', defaultName: 'Thriller', posterPath: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg' },
  { id: 14, nameKey: 'fantasy', defaultName: 'Fantasy', posterPath: '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg' },
  { id: 16, nameKey: 'animation', defaultName: 'Animation', posterPath: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg' },
  { id: 35, nameKey: 'comedy', defaultName: 'Comedy', posterPath: '/5dsfK9xIbesmM27P7BtpP5T65m7.jpg' },
  { id: 80, nameKey: 'crime', defaultName: 'Crime', posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg' },
  { id: 9648, nameKey: 'mystery', defaultName: 'Mystery', posterPath: '/pThyQovXQrw2m0s9x82twj48Jq4.jpg' },
  { id: 10749, nameKey: 'romance', defaultName: 'Romance', posterPath: '/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg' },
  { id: 12, nameKey: 'adventure', defaultName: 'Adventure', posterPath: '/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg' },
  { id: 99, nameKey: 'documentary', defaultName: 'Documentary', posterPath: '/ovmEofMiMhne0ocU2hBrLr4sQmB.jpg' },
  { id: 10751, nameKey: 'family', defaultName: 'Family', posterPath: '/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg' },
  { id: 10402, nameKey: 'music', defaultName: 'Music', posterPath: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg' },
  { id: 36, nameKey: 'history', defaultName: 'History', posterPath: '/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg' },
  { id: 10752, nameKey: 'war', defaultName: 'War', posterPath: '/hYqOjJ7Gh5fbqXrxlIao1g8cyeh.jpg' },
  { id: 37, nameKey: 'western', defaultName: 'Western', posterPath: '/7oWY8vdWW7TmTJb9ugMI0stgahY.jpg' },
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

  return (
    <div className="space-y-6">
      {/* Real-time counter */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-white border border-white/15">
          <span>{selectedGenres.length} {t('selected') || 'Selected'}</span>
          <span className="text-white/40">•</span>
          <span className={selectedGenres.length >= 3 ? 'text-emerald-400 font-extrabold' : 'text-white/70'}>
            {selectedGenres.length >= 3 ? (t('requirementMet') || '✓ Requirement met') : (t('minGenresReq') || 'Select at least 3')}
          </span>
        </div>
      </div>

      {/* 18 Genre Poster Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {ONBOARDING_18_GENRES.map((genre) => {
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

              {/* Bottom Label */}
              <div className="relative z-10">
                <span className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                  {genreName}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
