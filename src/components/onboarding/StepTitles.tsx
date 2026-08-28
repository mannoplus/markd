'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Search, Loader2, X, Check, Film, Tv } from 'lucide-react';
import { searchMultiWithPeopleAction } from '@/app/actions/discover';
import { IMAGE_SIZES } from '@/lib/tmdb';
import type { FavoriteTitleItem } from '@/lib/onboarding/types';

interface StepTitlesProps {
  favoriteTitles: FavoriteTitleItem[];
  onToggleTitle: (item: FavoriteTitleItem) => void;
  onRemoveTitle: (id: number) => void;
}

export function StepTitles({
  favoriteTitles,
  onToggleTitle,
  onRemoveTitle,
}: StepTitlesProps) {
  const t = useTranslations('Onboarding');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FavoriteTitleItem[]>([]);
  const [popularDefaults, setPopularDefaults] = useState<FavoriteTitleItem[]>([]);

  // Load starter popular recommendations on mount so the user has immediate options
  useEffect(() => {
    let isMounted = true;
    async function loadDefaults() {
      try {
        const res = await searchMultiWithPeopleAction('Inception');
        if (!isMounted) return;
        const formatted: FavoriteTitleItem[] = (res.results || [])
          .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
          .slice(0, 12)
          .map((r) => ({
            id: r.id,
            title: r.title || r.name || '',
            type: (r.media_type || 'movie') as 'movie' | 'tv',
            year: (r.release_date || r.first_air_date || '').substring(0, 4),
            posterPath: r.poster_path,
            voteAverage: r.vote_average,
          }));
        setPopularDefaults(formatted);
      } catch (e) {
        console.warn('Failed to fetch default onboarding titles:', e);
      }
    }
    loadDefaults();
    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced search handler
  const executeSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await searchMultiWithPeopleAction(query.trim());
      const filtered: FavoriteTitleItem[] = (res.results || [])
        .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
        .slice(0, 18)
        .map((r) => ({
          id: r.id,
          title: r.title || r.name || '',
          type: (r.media_type || 'movie') as 'movie' | 'tv',
          year: (r.release_date || r.first_air_date || '').substring(0, 4),
          posterPath: r.poster_path,
          voteAverage: r.vote_average,
        }));
      setSearchResults(filtered);
    } catch (e) {
      console.error('Failed to search titles:', e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

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

  const displayedItems = searchQuery.trim() ? searchResults : popularDefaults;

  return (
    <div className="space-y-6">
      {/* Selected Picks Tray */}
      {favoriteTitles.length > 0 && (
        <div className="rounded-2xl bg-[#12121f] border border-border/40 p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-foreground">
              {t('yourPicks', { count: favoriteTitles.length })}
            </span>
            <span
              className={`text-xs font-bold ${
                favoriteTitles.length >= 3 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {favoriteTitles.length >= 3
                ? '✓ Requirement met'
                : `${3 - favoriteTitles.length} more needed`}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {favoriteTitles.map((title) => (
              <div
                key={`picked-${title.type}-${title.id}`}
                className="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-xl bg-accent text-background text-xs font-bold shadow-md shadow-accent/20 animate-in fade-in zoom-in-95 duration-200"
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
                  className="p-1 rounded-md hover:bg-black/20 transition-colors"
                  aria-label={t('removePick', { title: title.title })}
                >
                  <X className="h-3 w-3 stroke-[3]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchTitlesPlaceholder')}
          className="w-full pl-10 pr-10 py-3 bg-background-elevated border border-border/40 rounded-xl text-sm text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:border-accent transition-colors shadow-inner"
        />
        {isSearching ? (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-accent" />
        ) : searchQuery.trim() ? (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-background transition-colors text-foreground-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* Results Grid */}
      <div className="min-h-[300px]">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-16 text-foreground-muted space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <span className="text-xs font-semibold">{t('searchingTitles')}</span>
          </div>
        ) : displayedItems.length === 0 && searchQuery.trim() ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 border border-border/30 rounded-2xl bg-background-elevated/30">
            <p className="text-sm font-semibold text-foreground-muted">
              {t('noTitlesFound', { query: searchQuery })}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {displayedItems.map((item) => {
              const isSelected = favoriteTitles.some((t) => t.id === item.id);
              return (
                <div
                  key={`title-${item.type}-${item.id}`}
                  onClick={() => onToggleTitle(item)}
                  className={`group relative flex flex-col rounded-xl overflow-hidden border cursor-pointer select-none transition-all duration-200 ${
                    isSelected
                      ? 'border-accent ring-2 ring-accent/40 shadow-lg shadow-accent/20 -translate-y-1 bg-[#161626]'
                      : 'border-border/40 bg-background-card hover:border-border-hover hover:shadow-md'
                  }`}
                >
                  {/* Poster Image */}
                  <div
                    className="relative w-full overflow-hidden bg-background-elevated"
                    style={{ aspectRatio: '2/3' }}
                  >
                    {item.posterPath ? (
                      <Image
                        src={`${IMAGE_SIZES.poster.small}${item.posterPath}`}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 150px, 200px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-2 text-center text-[11px] text-foreground-muted font-bold">
                        {item.title}
                      </div>
                    )}

                    {/* Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                    {/* Media Type Badge */}
                    <span className="absolute top-2 left-2 rounded-md bg-black/70 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-foreground-muted flex items-center gap-1 border border-white/10">
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

                    {/* Checkmark overlay */}
                    <div
                      className={`absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-accent text-background shadow-md scale-100'
                          : 'bg-black/60 text-transparent border border-white/20 scale-90 group-hover:border-white/60'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  </div>

                  {/* Title & Info */}
                  <div className="p-2.5 space-y-0.5 flex-1 flex flex-col justify-between">
                    <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-foreground-muted font-medium">
                      {item.year || '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
