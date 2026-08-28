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

  // Auto-play interval with pause-on-hover and reduced-motion respect
  useEffect(() => {
    if (isHovered || slideCount <= 1) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const timer = setInterval(() => nextSlide(), 7000);
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
      window.location.assign(`/${locale}/login`);
      return;
    }

    const currentStatus = watchlistMap[movie.id];
    const nextStatus = !currentStatus;

    setWatchlistMap((prev) => ({ ...prev, [movie.id]: nextStatus }));

    try {
      await upsertMediaItem({
        tmdb_id: movie.id,
        media_type: movie.media_type || 'movie',
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
    <section
      aria-label="Featured films"
      className="group film-grain relative flex min-h-[540px] w-full items-end overflow-hidden pb-16 md:min-h-[680px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Crossfading backdrops */}
      {activeMovies.map((movie, index) => {
        const isActive = index === currentIndex;
        const url = movie.backdrop_path
          ? `${IMAGE_SIZES.backdrop.original}${movie.backdrop_path}`
          : null;
        if (!url) return null;

        return (
          <div
            key={movie.id}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-60' : 'pointer-events-none opacity-0'
            }`}
          >
            <Image
              src={url}
              alt={movie.title || movie.name || ''}
              fill
              priority={index === 0}
              className="object-cover object-top"
            />
          </div>
        );
      })}

      {/* Layered scrims — keep text legible, keep the image alive */}
      <div className="pointer-events-none absolute inset-0 z-10 scrim-bottom" />
      <div className="pointer-events-none absolute inset-0 z-10 hidden bg-gradient-to-r from-background via-background/70 to-transparent md:block" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-background/80 to-transparent" />

      {/* Content */}
      <div className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div key={currentMovie.id} className="max-w-3xl space-y-5 fade-in">
          {/* Metadata rail */}
          <div className="flex flex-wrap items-center gap-2">
            {year && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-black/45 px-2.5 py-1 text-xs font-semibold text-foreground-secondary backdrop-blur-md">
                <Calendar className="h-3 w-3 text-foreground-subtle" />
                {year}
              </span>
            )}
            {rating && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-black/45 px-2.5 py-1 text-xs font-bold text-gold-star backdrop-blur-md">
                <Star className="h-3 w-3 fill-gold-star text-gold-star" />
                {rating}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-black/45 px-2.5 py-1 text-xs font-semibold text-foreground-muted backdrop-blur-md">
              <Film className="h-3 w-3 text-foreground-subtle" />
              {mediaTypeLabel}
            </span>
            {dna.traits.slice(0, 2).map((trait) => (
              <span
                key={trait}
                className="hidden rounded-md border border-border bg-black/45 px-2.5 py-1 text-xs font-medium text-foreground-muted backdrop-blur-md sm:inline-flex"
              >
                {translateDnaTrait(trait, locale)}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="title-cinematic text-4xl drop-shadow-2xl sm:text-5xl md:text-6xl">
            {currentMovie.title || currentMovie.name}
          </h1>

          {/* Overview */}
          <p className="line-clamp-3 max-w-2xl text-sm leading-relaxed text-foreground-muted sm:text-base">
            {currentMovie.overview}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onPlayTrailer && (
              <button
                onClick={() => onPlayTrailer(currentMovie)}
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-wider text-background transition-all hover:bg-foreground-secondary hover:shadow-elevated"
              >
                <Play className="h-4 w-4 fill-current" />
                {t('watchTrailer')}
              </button>
            )}

            <button
              onClick={() => handleToggleWatchlist(currentMovie)}
              className={`inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-full border text-[12px] font-medium uppercase tracking-wider transition-all duration-200 ease-out ${
                watchlistMap[currentMovie.id]
                  ? 'border-success/40 bg-success/15 text-success hover:bg-success/25 hover:shadow-[0_0_12px_rgba(34,197,94,0.18)]'
                  : 'border-white/15 bg-white/5 backdrop-blur-sm text-foreground hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.12)]'
              }`}
            >
              {watchlistMap[currentMovie.id] ? (
                <Check className="h-4 w-4 shrink-0" />
              ) : (
                <Plus className="h-4 w-4 shrink-0" />
              )}
              <span>
                {watchlistMap[currentMovie.id] ? t('inWatchlist') : t('addToWatchlist')}
              </span>
            </button>

            <Link
              href={(currentMovie.media_type === 'tv' ? `/tv/${currentMovie.id}` : `/movie/${currentMovie.id}`) as string}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-3 text-xs font-bold text-foreground-muted transition-colors hover:text-foreground"
            >
              {t('viewDetails')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Controls */}
      {slideCount > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label={t('previousSlide')}
            className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full border border-border bg-black/45 p-2.5 text-foreground opacity-0 backdrop-blur-md transition-all hover:bg-black/70 hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label={t('nextSlide')}
            className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full border border-border bg-black/45 p-2.5 text-foreground opacity-0 backdrop-blur-md transition-all hover:bg-black/70 hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Pagination + slide counter */}
          <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
            {activeMovies.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={t('slideOf', { current: index + 1, total: slideCount })}
                aria-current={index === currentIndex ? 'true' : undefined}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'w-7 bg-foreground' : 'w-1.5 bg-foreground/30 hover:bg-foreground/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}