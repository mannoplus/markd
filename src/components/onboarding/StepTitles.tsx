'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Search, Loader2, X, Check, Film, Tv } from 'lucide-react';
import { getOnboardingRecommendationsAction } from '@/app/actions/onboarding';
import { IMAGE_SIZES } from '@/lib/tmdb';
import type { FavoriteTitleItem } from '@/lib/onboarding/types';

interface StepTitlesProps {
  selectedGenres: number[];
  favoriteTitles: FavoriteTitleItem[];
  onToggleTitle: (item: FavoriteTitleItem) => void;
  onRemoveTitle: (id: number) => void;
}

export function StepTitles({
  selectedGenres,
  favoriteTitles,
  onToggleTitle,
  onRemoveTitle,
}: StepTitlesProps) {
  const t = useTranslations('Onboarding');
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FavoriteTitleItem[]>([]);
  const [genreTitles, setGenreTitles] = useState<FavoriteTitleItem[]>([]);
  const [isLoadingGenreTitles, setIsLoadingGenreTitles] = useState(true);

  // Dynamically load 12 movie recommendations aligned with Step 1 genre selections
  useEffect(() => {
    let isMounted = true;
    async function loadGenreRecs() {
      setIsLoadingGenreTitles(true);
      try {
        const titles = await getOnboardingRecommendationsAction({
          genreIds: selectedGenres,
          locale,
        });
        if (isMounted) {
          setGenreTitles(titles);
        }
      } catch (e) {
        console.warn('Failed to fetch dynamic genre recommendations:', e);
      } finally {
        if (isMounted) {
          setIsLoadingGenreTitles(false);
        }
      }
    }
    loadGenreRecs();
    return () => {
      isMounted = false;
    };
  }, [selectedGenres, locale]);

  // Debounced search handler
  const executeSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const res = await getOnboardingRecommendationsAction({
          query: query.trim(),
          locale,
        });
        setSearchResults(res);
      } catch (e) {
        console.error('Failed to search titles:', e);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [locale]
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const timer = setTimeout(() => {
      executeSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, executeSearch]);

  const displayedItems = searchQuery.trim() ? searchResults : genreTitles;

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchTitlesPlaceholder') || 'Search for movies or shows...'}
          className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium py-3.5 pl-11 pr-11 rounded-2xl focus:outline-none focus:border-white focus:bg-white/15 transition-all placeholder:text-white/40 shadow-none text-sm"
        />
        {isSearching ? (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-white" />
        ) : searchQuery.trim() ? (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* Your Picks Tray */}
      <section className="w-full space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm md:text-base font-bold text-white tracking-wide">
            {t('yourPicksTitle') || 'Your Picks'} ({favoriteTitles.length}/3)
          </h2>
          <span
            className={`text-xs font-semibold ${
              favoriteTitles.length >= 3 ? 'text-emerald-400' : 'text-white/60'
            }`}
          >
            {favoriteTitles.length >= 3
              ? (t('requirementMet') || '✓ Requirement met')
              : (t('minTitlesReq') || 'Select at least 3')}
          </span>
        </div>

        {favoriteTitles.length === 0 ? (
          <div className="h-24 md:h-28 w-full border border-dashed border-white/20 rounded-2xl flex items-center justify-center bg-white/5 backdrop-blur-md text-white/50 text-xs md:text-sm">
            <span>{t('selectTitlesBelow') || 'Select titles below to anchor your taste'}</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-md">
            {favoriteTitles.map((title) => (
              <div
                key={`picked-${title.type}-${title.id}`}
                className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-xl bg-white text-black text-xs font-bold shadow-lg shadow-white/10 animate-in fade-in zoom-in-95 duration-200"
              >
                <span className="truncate max-w-[160px]">{title.title}</span>
                {title.year && (
                  <span className="text-[10px] opacity-75 font-semibold">
                    ({title.year})
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveTitle(title.id)}
                  className="p-1 rounded-lg hover:bg-black/10 transition-colors"
                  aria-label={t('removePick', { title: title.title }) || 'Remove'}
                >
                  <X className="h-3 w-3 stroke-[3]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Balanced 12-Card Dynamic Media Grid */}
      <section className="w-full min-h-[360px]">
        {isLoadingGenreTitles && !searchQuery.trim() ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/60 space-y-3">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
            <span className="text-xs font-semibold tracking-wider uppercase">
              {t('loadingRecommendations') || 'Curating recommendations for your genres…'}
            </span>
          </div>
        ) : isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/60 space-y-3">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
            <span className="text-xs font-semibold tracking-wider uppercase">
              {t('searchingTitles') || 'Searching titles…'}
            </span>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 border border-white/10 rounded-2xl bg-white/5">
            <p className="text-sm font-semibold text-white/70">
              {t('noTitlesFound', { query: searchQuery }) || 'No titles found.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
            {displayedItems.slice(0, 12).map((item) => {
              const isSelected = favoriteTitles.some((t) => t.id === item.id);

              return (
                <div
                  key={`media-card-${item.type}-${item.id}`}
                  onClick={() => onToggleTitle(item)}
                  className={`group relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-300 border ${
                    isSelected
                      ? 'border-white bg-white/10 ring-1 ring-white shadow-[0_0_24px_rgba(255,255,255,0.2)] scale-[1.02]'
                      : 'border-white/15 bg-white/5 hover:border-white/40 hover:bg-white/10'
                  }`}
                >
                  {/* Poster Image */}
                  {item.posterPath ? (
                    <Image
                      src={`${IMAGE_SIZES.poster.medium}${item.posterPath}`}
                      alt={item.title}
                      fill
                      className={`object-cover transition-all duration-500 ${
                        isSelected
                          ? 'opacity-95 scale-105'
                          : 'opacity-75 group-hover:opacity-100 group-hover:scale-105'
                      }`}
                      sizes="(max-width: 640px) 160px, (max-width: 1024px) 220px, 260px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-3 text-center text-xs text-white/70 font-bold bg-white/5">
                      {item.title}
                    </div>
                  )}

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                  {/* Media Type Badge */}
                  <span className="absolute top-3 left-3 rounded-md bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white/80 flex items-center gap-1 border border-white/10 pointer-events-none">
                    {item.type === 'tv' ? (
                      <>
                        <Tv className="h-2.5 w-2.5" /> TV
                      </>
                    ) : (
                      <>
                        <Film className="h-2.5 w-2.5" /> Movie
                      </>
                    )}
                  </span>

                  {/* Top-Right Selection Checkmark */}
                  <div
                    className={`absolute top-3 right-3 w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-md'
                        : 'border-white/30 bg-black/40 text-transparent backdrop-blur-md group-hover:border-white/80'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>

                  {/* Bottom Title Bar */}
                  <div className="absolute bottom-0 left-0 right-0 p-3.5 bg-black/50 backdrop-blur-md border-t border-white/10 space-y-0.5">
                    <p className="text-xs font-bold text-white truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-white/60 font-medium">
                      {item.year || '—'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
