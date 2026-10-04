'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '@/i18n/routing';
import { ChevronLeft, ChevronRight, Play, Plus, Check, Star, Calendar, Film } from 'lucide-react';
import { IMAGE_SIZES } from '@/lib/tmdb';
import type { TMDBTrendingResult, CarouselSlideItem } from '@/types';
import { useTranslations, useLocale } from 'next-intl';
import { classifyMovieDna, translateDnaTrait, type MovieDnaTrait } from '@/lib/taste-engine';
import { upsertMediaItem } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import {
  AmbientVideoPlayer,
  AMBIENT_TRAILER_FALLBACKS,
} from '@/components/hero-carousel/AmbientVideoPlayer';

export interface HeroCarouselProps {
  movies?: (TMDBTrendingResult | CarouselSlideItem)[];
  items?: CarouselSlideItem[];
  onPlayTrailer?: (item: TMDBTrendingResult) => void;
}

interface NormalizedSlide {
  id: string | number;
  title: string;
  synopsis: string;
  posterUrl: string;
  fallbackPosterUrl?: string;
  trailerSources?: { webm?: string; mp4?: string };
  year?: number | null;
  rating?: string | null;
  mediaType: 'movie' | 'tv';
  dnaTraits: MovieDnaTrait[];
  tmdbItem?: TMDBTrendingResult;
}

function normalizeSlideItem(
  item: TMDBTrendingResult | CarouselSlideItem,
  index: number
): NormalizedSlide {
  const isTMDB = 'media_type' in item || 'backdrop_path' in item;
  const tmdb = isTMDB ? (item as TMDBTrendingResult) : undefined;
  const custom = !isTMDB ? (item as CarouselSlideItem) : undefined;

  const title = tmdb?.title || tmdb?.name || custom?.title || '';
  const synopsis = tmdb?.overview || custom?.synopsis || '';
  const posterUrl =
    custom?.posterUrl ||
    (tmdb?.backdrop_path
      ? `${IMAGE_SIZES.backdrop.original}${tmdb.backdrop_path}`
      : tmdb?.poster_path
      ? `${IMAGE_SIZES.poster.original}${tmdb.poster_path}`
      : '');
  const fallbackPosterUrl =
    custom?.fallbackPosterUrl ||
    (tmdb?.backdrop_path ? `${IMAGE_SIZES.backdrop.small}${tmdb.backdrop_path}` : undefined);
  const trailerSources =
    item.trailerSources !== undefined
      ? item.trailerSources
      : AMBIENT_TRAILER_FALLBACKS[index % AMBIENT_TRAILER_FALLBACKS.length];

  const rawDate = tmdb?.release_date || tmdb?.first_air_date;
  const year = rawDate ? new Date(rawDate).getFullYear() : null;
  const rating = tmdb?.vote_average ? tmdb.vote_average.toFixed(1) : null;
  const mediaType = tmdb?.media_type || 'movie';
  const dnaTraits = tmdb ? classifyMovieDna(tmdb).traits : [];

  return {
    id: item.id,
    title,
    synopsis,
    posterUrl,
    fallbackPosterUrl,
    trailerSources,
    year,
    rating,
    mediaType,
    dnaTraits,
    tmdbItem: tmdb,
  };
}

export function HeroCarousel({ movies, items, onPlayTrailer }: HeroCarouselProps) {
  const t = useTranslations('Home');
  const locale = useLocale();

  const containerRef = useRef<HTMLElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isInViewport, setIsInViewport] = useState(true);
  const [watchlistMap, setWatchlistMap] = useState<Record<string | number, boolean>>({});

  const rawList = items && items.length > 0 ? items : (movies || []);
  const slideCount = Math.min(rawList.length, 10);
  const activeSlides = rawList.slice(0, slideCount).map(normalizeSlideItem);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slideCount);
  }, [slideCount]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? slideCount - 1 : prev - 1));
  }, [slideCount]);

  // Viewport IntersectionObserver: Pause video when hero visibility drops below 20%
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsInViewport(entry.isIntersecting && entry.intersectionRatio >= 0.2);
        }
      },
      {
        threshold: [0, 0.2, 0.5, 1.0],
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Auto-play interval with pause-on-hover and reduced-motion respect
  useEffect(() => {
    if (isHovered || slideCount <= 1 || !isInViewport) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const timer = setInterval(() => nextSlide(), 8000);
    return () => clearInterval(timer);
  }, [isHovered, slideCount, nextSlide, isInViewport]);

  if (!activeSlides || activeSlides.length === 0) return null;

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];
  const mediaTypeLabel = currentSlide.mediaType === 'tv' ? 'TV Series' : 'Movie';

  const handleToggleWatchlist = async (slide: NormalizedSlide) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.assign(`/${locale}/login`);
      return;
    }

    const currentStatus = watchlistMap[slide.id];
    const nextStatus = !currentStatus;

    setWatchlistMap((prev) => ({ ...prev, [slide.id]: nextStatus }));

    try {
      await upsertMediaItem({
        tmdb_id: typeof slide.id === 'number' ? slide.id : parseInt(String(slide.id), 10) || 0,
        media_type: slide.mediaType,
        title: slide.title,
        poster_path: slide.posterUrl,
        status: nextStatus ? 'plan_to_watch' : 'dropped',
        rating: null,
        season_progress: null,
        episode_progress: null,
      });
    } catch (e) {
      console.error(e);
      setWatchlistMap((prev) => ({ ...prev, [slide.id]: currentStatus }));
    }
  };

  return (
    <section
      ref={containerRef}
      aria-label="Featured films"
      className="group film-grain relative flex min-h-[540px] w-full items-end overflow-hidden pb-16 md:min-h-[680px]"
      style={{ position: 'relative', overflow: 'hidden' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* =========================================================================
          LAYER 1: Media Canvas (z-index: 0, pointer-events: none)
          - Static Poster Image (LCP fallback, 0ms, CLS = 0)
          - Ambient Video Player (<video> crossfading 0 -> 1 after 600ms grace timer)
         ========================================================================= */}
      {activeSlides.map((slide, index) => {
        const isActive = index === currentIndex;
        const isPrefetch = index === (currentIndex + 1) % slideCount;

        if (!slide.posterUrl) return null;

        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-0' : 'pointer-events-none opacity-0 -z-10'
            }`}
            style={{
              zIndex: isActive ? 0 : -10,
              pointerEvents: 'none',
            }}
          >
            <AmbientVideoPlayer
              posterUrl={slide.posterUrl}
              fallbackPosterUrl={slide.fallbackPosterUrl}
              title={slide.title}
              isActive={isActive}
              isInViewport={true}
              trailerSources={slide.trailerSources}
              priority={index === 0}
              isPrefetch={isPrefetch}
            />
          </div>
        );
      })}

      {/* =========================================================================
          LAYER 2: Scrim / Contrast Gradient (z-index: 1, pointer-events: none)
          - Permanent dual-gradient overlay satisfying WCAG 2.1 AA contrast requirements
            (minimum 4.5:1 ratio for body text, 3:1 for large display titles)
         ========================================================================= */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.55) 60%, rgba(0, 0, 0, 0.95) 100%), linear-gradient(90deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-28 bg-gradient-to-b from-background/80 to-transparent"
        style={{ zIndex: 1, pointerEvents: 'none' }}
        aria-hidden="true"
      />

      {/* =========================================================================
          LAYER 3: Interactive Foreground (z-index: 2, pointer-events: auto)
          - Renders movie title, badges, ratings, synopsis, and primary CTAs
         ========================================================================= */}
      <div
        className="relative z-[2] mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pointer-events-auto"
        style={{ zIndex: 2, pointerEvents: 'auto' }}
      >
        <div key={currentSlide.id} className="max-w-3xl space-y-5 fade-in">
          {/* Metadata rail */}
          <div className="flex flex-wrap items-center gap-2">
            {currentSlide.year && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-black/60 px-2.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-md shadow-sm">
                <Calendar className="h-3 w-3 text-white/70" />
                {currentSlide.year}
              </span>
            )}
            {currentSlide.rating && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-black/60 px-2.5 py-1 text-xs font-bold text-amber-400 backdrop-blur-md shadow-sm">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {currentSlide.rating}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-black/60 px-2.5 py-1 text-xs font-semibold text-white/80 backdrop-blur-md shadow-sm">
              <Film className="h-3 w-3 text-white/70" />
              {mediaTypeLabel}
            </span>
            {currentSlide.dnaTraits.slice(0, 2).map((trait) => (
              <span
                key={trait}
                className="hidden rounded-md border border-white/20 bg-black/60 px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur-md sm:inline-flex shadow-sm"
              >
                {translateDnaTrait(trait, locale)}
              </span>
            ))}
          </div>

          {/* Title - WCAG 2.1 AA compliant typography with deep drop-shadow */}
          <h1 className="title-cinematic text-4xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] sm:text-5xl md:text-6xl text-white font-extrabold tracking-tight">
            {currentSlide.title}
          </h1>

          {/* Overview / Synopsis */}
          <p className="line-clamp-3 max-w-2xl text-sm leading-relaxed text-zinc-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-base font-normal">
            {currentSlide.synopsis}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onPlayTrailer && currentSlide.tmdbItem && (
              <button
                onClick={() => onPlayTrailer(currentSlide.tmdbItem!)}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-zinc-200 hover:shadow-elevated active:scale-95"
              >
                <Play className="h-4 w-4 fill-current" />
                {t('watchTrailer')}
              </button>
            )}

            <button
              onClick={() => handleToggleWatchlist(currentSlide)}
              className={`inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-full border text-[12px] font-medium uppercase tracking-wider transition-all duration-200 ease-out active:scale-95 ${
                watchlistMap[currentSlide.id]
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : 'border-white/30 bg-black/50 backdrop-blur-md text-white hover:bg-white/20 hover:border-white/50 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]'
              }`}
            >
              {watchlistMap[currentSlide.id] ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <Plus className="h-4 w-4 shrink-0" />
              )}
              <span>
                {watchlistMap[currentSlide.id] ? t('inWatchlist') : t('addToWatchlist')}
              </span>
            </button>

            <Link
              href={
                (currentSlide.mediaType === 'tv'
                  ? `/tv/${currentSlide.id}`
                  : `/movie/${currentSlide.id}`) as string
              }
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-3 text-xs font-bold text-zinc-300 transition-colors hover:text-white hover:bg-white/10"
            >
              {t('viewDetails')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          Carousel Navigation Controls (Layer 3, z-index: 2, pointer-events: auto)
         ========================================================================= */}
      {slideCount > 1 && (
        <div className="z-[2] pointer-events-auto" style={{ zIndex: 2 }}>
          <button
            onClick={prevSlide}
            aria-label={t('previousSlide')}
            className="absolute left-4 top-1/2 z-[2] -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-2.5 text-white opacity-0 backdrop-blur-md transition-all hover:bg-black/90 hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100 hover:scale-105 active:scale-95"
            style={{ zIndex: 2 }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label={t('nextSlide')}
            className="absolute right-4 top-1/2 z-[2] -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-2.5 text-white opacity-0 backdrop-blur-md transition-all hover:bg-black/90 hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100 hover:scale-105 active:scale-95"
            style={{ zIndex: 2 }}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Pagination + slide indicator pills */}
          <div
            className="absolute bottom-6 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-2"
            style={{ zIndex: 2 }}
          >
            {activeSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={t('slideOf', { current: index + 1, total: slideCount })}
                aria-current={index === currentIndex ? 'true' : undefined}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-7 bg-white shadow-sm'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}