'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, Calendar, Clock, Film, Star, X } from 'lucide-react';
import { MovieDetail } from '@/types/cinema';
import { TAIWAN_AGE_RATINGS } from '@/lib/constants/regions';

interface MovieHeroProps {
  movie: MovieDetail;
}

export function MovieHero({ movie }: MovieHeroProps) {
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);

  // Format runtime (e.g. 166 -> "2h 46m")
  const hours = Math.floor(movie.durationMinutes / 60);
  const minutes = movie.durationMinutes % 60;
  const formattedRuntime = `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;

  const ratingMeta = TAIWAN_AGE_RATINGS[movie.rating] || TAIWAN_AGE_RATINGS['0+'];

  // Smooth scroll handler
  const handleScrollToShowtimes = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById('showtimes');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Sticky bottom CTA visibility control on scroll
  useEffect(() => {
    const handleScroll = () => {
      const heroEl = document.getElementById('movie-hero');
      const showtimesEl = document.getElementById('showtimes');
      if (!heroEl || !showtimesEl) return;

      const heroRect = heroEl.getBoundingClientRect();
      const showtimesRect = showtimesEl.getBoundingClientRect();

      // Show sticky CTA once hero is scrolled past, until reaching bottom of showtimes
      const passedHero = heroRect.bottom < 100;
      const reachedShowtimes = showtimesRect.top < window.innerHeight && showtimesRect.bottom > 200;

      setShowStickyCta(passedHero && !reachedShowtimes);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="movie-hero" className="relative w-full overflow-hidden bg-background">
      {/* Background Backdrop with Gradient Overlays */}
      <div className="absolute inset-0 h-[480px] sm:h-[580px] lg:h-[640px] w-full select-none">
        <Image
          src={movie.backdropUrl}
          alt={movie.titleZh}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top opacity-35 filter blur-[1px] brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-12 sm:pb-16">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12">
          {/* Movie Poster */}
          <div className="relative flex-shrink-0 w-52 sm:w-64 lg:w-72 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5 bg-zinc-900 group">
            <Image
              src={movie.posterUrl}
              alt={movie.titleZh}
              fill
              sizes="(max-width: 640px) 208px, (max-width: 1024px) 256px, 288px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {movie.rating && (
              <div className="absolute top-3 left-3 shadow-lg">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border backdrop-blur-md ${ratingMeta.bgClass} ${ratingMeta.textClass} ${ratingMeta.borderClass}`}
                  title={`${ratingMeta.nameZh} (${ratingMeta.descriptionZh})`}
                >
                  {ratingMeta.code} {ratingMeta.nameZh}
                </span>
              </div>
            )}
          </div>

          {/* Header Metadata & CTAs */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
            {/* Bilingual Titles */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
              {movie.titleZh}
            </h1>
            <p className="mt-1 text-lg sm:text-xl font-medium text-zinc-400">
              {movie.titleEn}
            </p>

            {/* Badges & Meta Line */}
            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-3 text-sm text-zinc-300">
              {/* Rating Badge */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${ratingMeta.bgClass} ${ratingMeta.textClass} ${ratingMeta.borderClass}`}
              >
                {ratingMeta.nameZh}
              </span>

              {/* Duration */}
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Clock className="w-4 h-4 text-zinc-400" />
                {formattedRuntime}
              </span>

              <span className="text-zinc-600">•</span>

              {/* Release Date */}
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Calendar className="w-4 h-4 text-zinc-400" />
                {movie.releaseDate} 上映
              </span>

              {movie.voteAverage && movie.voteAverage > 0 ? (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    {movie.voteAverage.toFixed(1)}
                  </span>
                </>
              ) : null}
            </div>

            {/* Genre Pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2">
              {movie.genres.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 backdrop-blur-sm"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Brief Synopsis Preview */}
            <p className="mt-4 text-sm sm:text-base text-zinc-300/90 leading-relaxed max-w-2xl line-clamp-3">
              {movie.synopsis}
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 w-full">
              {/* Main Showtimes CTA */}
              <a
                href="#showtimes"
                onClick={handleScrollToShowtimes}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-zinc-950 bg-white hover:bg-zinc-200 shadow-xl hover:shadow-white/10 transition-all duration-200 active:scale-95 group"
              >
                <Film className="w-5 h-5 text-zinc-950 group-hover:scale-110 transition-transform" />
                <span>查看場次 / Showtimes</span>
              </a>

              {/* Play Trailer Button */}
              {movie.trailerYoutubeId && (
                <button
                  type="button"
                  onClick={() => setShowTrailerModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-medium text-sm sm:text-base text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 shadow-md transition-all active:scale-95 group"
                >
                  <Play className="w-4 h-4 text-rose-500 fill-rose-500 group-hover:scale-110 transition-transform" />
                  <span>預告片 / Trailer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Dialog Modal */}
      {showTrailerModal && movie.trailerYoutubeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl aspect-video bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
            <button
              onClick={() => setShowTrailerModal(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-zinc-300 hover:text-white hover:bg-black/80 transition-colors"
              aria-label="Close Trailer"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${movie.trailerYoutubeId}?autoplay=1&rel=0`}
              title={`${movie.titleZh} Official Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* Sticky Mobile Showtimes CTA Bar */}
      {showStickyCta && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-zinc-950/95 border-t border-zinc-800/80 backdrop-blur-md md:hidden flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white truncate">{movie.titleZh}</span>
            <span className="text-xs text-zinc-400">{formattedRuntime} • {movie.genres[0]}</span>
          </div>
          <a
            href="#showtimes"
            onClick={handleScrollToShowtimes}
            className="flex-shrink-0 px-4 py-2.5 rounded-lg bg-white text-zinc-950 text-sm font-bold shadow-lg active:scale-95 transition-transform"
          >
            立即選位 / 場次
          </a>
        </div>
      )}
    </section>
  );
}
