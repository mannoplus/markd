'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { Play, Sparkles, Star, Plus, Check, Film, Clock, Calendar } from 'lucide-react';
import { IMAGE_SIZES } from '@/lib/tmdb';
import type { TMDBTrendingResult } from '@/types';
import { useTranslations, useLocale } from 'next-intl';
import { classifyMovieDna, translateDnaTrait } from '@/lib/taste-engine';
import { upsertMediaItem } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';

interface PersonalizedHeroProps {
  movie: TMDBTrendingResult;
  matchScore?: number;
  matchReason?: string;
  onPlayTrailer?: (item: TMDBTrendingResult) => void;
}

export function PersonalizedHero({
  movie,
  matchScore = 98,
  matchReason,
  onPlayTrailer,
}: PersonalizedHeroProps) {
  const t = useTranslations('Home');
  const tTaste = useTranslations('TasteEngine');
  const tMedia = useTranslations('MediaDetails');
  const locale = useLocale();

  const [isInLibrary, setIsInLibrary] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const dna = classifyMovieDna(movie);
  const rawDate = movie.release_date || movie.first_air_date;
  const year = rawDate ? new Date(rawDate).getFullYear() : null;
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '8.2';

  const backdropUrl = movie.backdrop_path
    ? `${IMAGE_SIZES.backdrop.original}${movie.backdrop_path}`
    : null;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        // Check if in library from localStorage cache or state
        const saved = localStorage.getItem(`markd_library_${data.user.id}_${movie.id}`);
        if (saved) setIsInLibrary(true);
      }
    });
  }, [movie.id]);

  const handleToggleWatchlist = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/${locale}/login`;
      return;
    }

    setIsUpdating(true);
    const nextState = !isInLibrary;
    setIsInLibrary(nextState);

    try {
      await upsertMediaItem({
        tmdb_id: movie.id,
        media_type: (movie.media_type as any) || 'movie',
        title: movie.title || movie.name || '',
        poster_path: movie.poster_path,
        status: nextState ? 'plan_to_watch' : 'dropped',
        rating: null,
        season_progress: null,
        episode_progress: null,
      });
      localStorage.setItem(`markd_library_${user.id}_${movie.id}`, nextState ? 'true' : '');
    } catch (e) {
      console.error(e);
      setIsInLibrary(!nextState);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative min-h-[580px] md:min-h-[720px] w-full flex items-end pb-16 overflow-hidden">
      {/* Background Backdrop with Multi-layer Obsidian Vignettes */}
      {backdropUrl && (
        <div className="absolute inset-0 z-0">
          <Image
            src={backdropUrl}
            alt={movie.title || movie.name || ''}
            fill
            className="object-cover object-top opacity-55 scale-105 transition-transform duration-1000"
            priority
          />
        </div>
      )}

      {/* Layered Obsidian Gradient Masks */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-[#08080c]/65 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#08080c] via-[#08080c]/70 to-transparent hidden md:block z-10 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-[#08080c]/80 to-transparent z-10 pointer-events-none" />

      {/* Content Layer */}
      <div className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-end gap-8 fade-in">
        {/* Left/Main Column */}
        <div className="max-w-3xl space-y-4">
          {/* Spotlight Badges & Match Score */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-accent border border-accent/25 backdrop-blur-md shadow-lg shadow-white/5">
              <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
              <span>{t('heroBadge')}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-extrabold text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
              <span>{matchScore}% {t('matchScore')}</span>
            </div>

            {rating && (
              <div className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-yellow-400 backdrop-blur-md border border-border/30">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span>{rating}</span>
              </div>
            )}
          </div>

          {/* Contextual Reason Banner */}
          {matchReason && (
            <p className="text-xs font-semibold text-accent/90 italic tracking-wide">
              &ldquo;{matchReason}&rdquo;
            </p>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-foreground drop-shadow-2xl">
            {movie.title || movie.name}
          </h1>

          {/* DNA Traits Pill Rail */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {dna.traits.slice(0, 4).map((trait) => (
              <span
                key={trait}
                className="rounded-lg bg-white/8 px-2.5 py-1 text-[11px] font-bold text-foreground-secondary border border-white/10 backdrop-blur-sm tracking-wide"
              >
                {translateDnaTrait(trait, locale)}
              </span>
            ))}
            {year && (
              <span className="flex items-center gap-1 text-xs text-foreground-muted ml-1">
                <Calendar className="h-3 w-3" />
                {year}
              </span>
            )}
          </div>

          {/* Overview */}
          <p className="text-foreground-muted text-sm sm:text-base max-w-2xl line-clamp-3 leading-relaxed">
            {movie.overview}
          </p>

          {/* Primary & Secondary Action Rail */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            {onPlayTrailer && (
              <button
                onClick={() => onPlayTrailer(movie)}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xs font-black uppercase tracking-wider text-background hover:bg-accent-hover transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Watch Trailer</span>
              </button>
            )}

            <button
              onClick={handleToggleWatchlist}
              disabled={isUpdating}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all active:scale-95 border cursor-pointer ${
                isInLibrary
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-background-elevated/70 border-border/40 text-foreground hover:bg-background-elevated hover:border-accent/40'
              }`}
            >
              {isInLibrary ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>{isInLibrary ? 'In Watchlist' : 'Add to Watchlist'}</span>
            </button>

            <Link
              href={(movie.media_type === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`) as string}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-border/40 px-5 py-3 text-xs font-bold text-foreground-muted hover:text-foreground hover:border-accent/40 transition-all"
            >
              <span>{t('viewDetails')}</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Floating Poster Hologram Treatment (Desktop) */}
        {movie.poster_path && (
          <div className="hidden lg:block w-48 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/15 relative hover:scale-105 transition-transform duration-500 bg-background-elevated">
            <Image
              src={`${IMAGE_SIZES.poster.medium}${movie.poster_path}`}
              alt={movie.title || movie.name || ''}
              fill
              className="object-cover"
              sizes="200px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
}
