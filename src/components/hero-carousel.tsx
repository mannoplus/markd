'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ChevronLeft, ChevronRight, Play, Plus, Check, Star, Calendar, Film } from 'lucide-react';
import { IMAGE_SIZES } from '@/lib/tmdb';
import type { TMDBTrendingResult } from '@/types';
import { useTranslations, useLocale } from 'next-intl';
import { classifyMovieDna, translateDnaTrait } from '@/lib/taste-engine';
import { upsertMediaItem } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';

interface HeroCarouselProps {
  movies: TMDBTrendingResult[];
  onPlayTrailer?: (item: TMDBTrendingResult) => void;
}

export function HeroCarousel({ movies, onPlayTrailer }: HeroCarouselProps) {
  const t = useTranslations('Home');
  const locale = useLocale();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [watchlistMap, setWatchlistMap] = useState<Record<number, boolean>>({});

  const slideCount = Math.min(movies.length, 6);
  const activeMovies = movies.slice(0, slideCount);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slideCount);
  }, [slideCount]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? slideCount - 1 : prev - 1));
  }, [slideCount]);

  // Auto-play interval with pause-on-hover
  useEffect(() => {
    if (isHovered || slideCount <= 1) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 6500);

    return () => clearInterval(timer);
  }, [isHovered, slideCount, nextSlide]);

  if (!activeMovies || activeMovies.length === 0) return null;

  const currentMovie = activeMovies[currentIndex] || activeMovies[0];
  const dna = classifyMovieDna(currentMovie);

  const rawDate = currentMovie.release_date || currentMovie.first_air_date;
  const year = rawDate ? new Date(rawDate).getFullYear() : null;
  const rating = currentMovie.vote_average ? currentMovie.vote_average.toFixed(1) : null;
  const mediaTypeLabel = currentMovie.media_type === 'tv' ? 'TV Series' : 'Movie';

  const handleToggleWatchlist = async (movie: TMDBTrendingResult) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/${locale}/login`;
      return;
    }

    const currentStatus = watchlistMap[movie.id];
    const nextStatus = !currentStatus;

    setWatchlistMap((prev) => ({ ...prev, [movie.id]: nextStatus }));

    try {
      await upsertMediaItem({
        tmdb_id: movie.id,
        media_type: (movie.media_type as any) || 'movie',
        title: movie.title || movie.name || '',
        poster_path: movie.poster_path,
        status: nextStatus ? 'plan_to_watch' : 'dropped',
        rating: null,
        season_progress: null,
        episode_progress: null,
      });
    } catch (e) {
      console.error(e);
      setWatchlistMap((prev) => ({ ...prev, [movie.id]: currentStatus }));
    }
  };

  return (
    <div
      className="relative min-h-[560px] md:min-h-[700px] w-full flex items-end pb-16 overflow-hidden group select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Multi-Slide Crossfading Backdrops */}
      {activeMovies.map((movie, index) => {
        const isActive = index === currentIndex;
        const url = movie.backdrop_path
          ? `${IMAGE_SIZES.backdrop.original}${movie.backdrop_path}`
          : null;

        if (!url) return null;

        return (
          <div
            key={movie.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-65 z-0 scale-100' : 'opacity-0 -z-10 scale-105 pointer-events-none'
            }`}
          >
            <Image
              src={url}
              alt={movie.title || movie.name || ''}
              fill
              className="object-cover object-top transition-transform duration-1000"
              priority={index === 0}
            />
          </div>
        );
      })}

      {/* Layered Gradient Vignettes (Slate/Zinc Dark Tone) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12] via-[#0B0D12]/70 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D12] via-[#0B0D12]/75 to-transparent hidden md:block z-10 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0B0D12]/80 to-transparent z-10 pointer-events-none" />

      {/* Slide Content Layer */}
      <div className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-start gap-5">
        <div key={currentMovie.id} className="fade-in max-w-3xl space-y-4">
          
          {/* Metadata Row: Year, Rating, Media Type & Clean Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {year && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.07] px-2.5 py-1 text-xs font-semibold text-zinc-300 border border-white/[0.08] backdrop-blur-md">
                <Calendar className="h-3 w-3 text-zinc-400" />
                {year}
              </span>
            )}

            {rating && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.07] px-2.5 py-1 text-xs font-bold text-yellow-400 border border-white/[0.08] backdrop-blur-md">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {rating}
              </span>
            )}

            <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.07] px-2.5 py-1 text-xs font-semibold text-zinc-400 border border-white/[0.08] backdrop-blur-md">
              <Film className="h-3 w-3 text-zinc-400" />
              {mediaTypeLabel}
            </span>

            {/* Subtle DNA Tone Tags */}
            {dna.traits.slice(0, 3).map((trait) => (
              <span
                key={trait}
                className="hidden sm:inline-flex items-center rounded-md bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-zinc-300 border border-white/[0.07] backdrop-blur-md"
              >
                {translateDnaTrait(trait, locale)}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-foreground drop-shadow-2xl">
            {currentMovie.title || currentMovie.name}
          </h1>

          {/* Overview */}
          <p className="text-foreground-muted text-sm sm:text-base max-w-2xl line-clamp-3 leading-relaxed">
            {currentMovie.overview}
          </p>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            {onPlayTrailer && (
              <button
                onClick={() => onPlayTrailer(currentMovie)}
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-wider text-background hover:bg-foreground-muted transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Watch Trailer</span>
              </button>
            )}

            <button
              onClick={() => handleToggleWatchlist(currentMovie)}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 border cursor-pointer ${
                watchlistMap[currentMovie.id]
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-background-elevated/70 border-border/40 text-foreground hover:bg-background-elevated hover:border-white/20'
              }`}
            >
              {watchlistMap[currentMovie.id] ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>{watchlistMap[currentMovie.id] ? 'In Watchlist' : 'Add to Watchlist'}</span>
            </button>

            <Link
              href={(currentMovie.media_type === 'tv' ? `/tv/${currentMovie.id}` : `/movie/${currentMovie.id}`) as string}
              className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] border border-border/40 px-5 py-3 text-xs font-bold text-foreground-muted hover:text-foreground hover:border-white/20 transition-all"
            >
              <span>{t('viewDetails')}</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrow Controls */}
      {slideCount > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-[#0b0d12]/70 text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-[#0b0d12] border border-white/10 backdrop-blur-md focus:outline-none cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-[#0b0d12]/70 text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-[#0b0d12] border border-white/10 backdrop-blur-md focus:outline-none cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Interactive Pagination Pills Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {activeMovies.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 focus:outline-none cursor-pointer ${
                  index === currentIndex
                    ? 'w-8 bg-white shadow-md'
                    : 'w-2 bg-white/25 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
