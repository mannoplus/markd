'use client';

import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { Star, Clock, DollarSign } from 'lucide-react';
import { IMAGE_SIZES } from '@/lib/tmdb';
import type { BoxOfficeMovie } from '@/types';
import { useTranslations } from 'next-intl';

function formatCurrency(value: number): string {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    if (value > 0) return `$${value.toLocaleString()}`;
    return '—';
}

interface BoxOfficeHeroProps {
    movie: BoxOfficeMovie;
}

export function BoxOfficeHero({ movie }: BoxOfficeHeroProps) {
    const t = useTranslations('BoxOffice');
    const backdropUrl = movie.backdrop_path
        ? `${IMAGE_SIZES.backdrop.original}${movie.backdrop_path}`
        : null;

    return (
        <div className="relative h-[55vh] md:h-[75vh] w-full flex items-end pb-12 overflow-hidden">
            {/* Backdrop Image */}
            {backdropUrl && (
                <div className="absolute inset-0">
                    <Image
                        src={backdropUrl}
                        alt={movie.title}
                        fill
                        className="object-cover object-top"
                        priority
                    />
                </div>
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent hidden md:block pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-start gap-5">
                {/* Rank Badge */}
                <div className="rank-glow inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md border border-white/20">
                    <span className="text-2xl font-black text-white">#1</span>
                    <span className="text-sm font-medium text-white/80">{t('numberOne')}</span>
                </div>

                <div className="fade-in max-w-3xl space-y-4">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-xl">
                        {movie.title}
                    </h1>

                    {movie.tagline && (
                        <p className="text-foreground-muted text-lg italic">
                            &ldquo;{movie.tagline}&rdquo;
                        </p>
                    )}

                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        {/* Rating */}
                        <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                        </div>

                        {/* Revenue */}
                        {movie.revenue > 0 && (
                            <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                                <DollarSign className="h-4 w-4 text-emerald-400" />
                                <span className="font-semibold text-emerald-400">{formatCurrency(movie.revenue)}</span>
                                <span className="text-foreground-muted">{t('totalGross')}</span>
                            </div>
                        )}

                        {/* Runtime */}
                        {movie.runtime > 0 && (
                            <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                                <Clock className="h-4 w-4 text-foreground-muted" />
                                <span>{movie.runtime} {t('min')}</span>
                            </div>
                        )}

                        {/* Director */}
                        {movie.director && (
                            <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                                <span className="text-foreground-muted">{t('director')}:</span>
                                <span className="font-semibold">{movie.director}</span>
                            </div>
                        )}
                    </div>

                    {/* Overview */}
                    <p className="text-foreground-muted text-base max-w-2xl line-clamp-3">
                        {movie.overview}
                    </p>

                    {/* CTA */}
                    <div className="flex gap-4 pt-2">
                        <Link
                            href={`/movie/${movie.id}`}
                            className="inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-all hover:bg-foreground-muted hover:scale-105"
                        >
                            {t('viewDetails')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
