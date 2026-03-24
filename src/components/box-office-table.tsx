'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown } from 'lucide-react';
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

interface BoxOfficeTableProps {
    movies: BoxOfficeMovie[];
    onMovieSelect?: (id: number) => void;
}

type SortKey = 'rank' | 'revenue' | 'budget' | 'vote_average' | 'omdbRtScore';

export function BoxOfficeTable({ movies, onMovieSelect }: BoxOfficeTableProps) {
    const t = useTranslations('BoxOffice');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

    const sortedMovies = [...movies].sort((a, b) => {
        if (!sortConfig) return 0;
        
        let aVal: any = a[sortConfig.key];
        let bVal: any = b[sortConfig.key];

        // Handle string parsing for RT Score (e.g. "95%")
        if (sortConfig.key === 'omdbRtScore') {
            aVal = aVal ? parseInt(aVal.replace('%', '')) : -1;
            bVal = bVal ? parseInt(bVal.replace('%', '')) : -1;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: SortKey) => {
        setSortConfig(current => {
            if (!current || current.key !== key) return { key, direction: 'desc' };
            if (current.direction === 'desc') return { key, direction: 'asc' };
            return null; // Reset sort
        });
    };

    const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
        if (sortConfig?.key !== columnKey) return null;
        return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline mb-0.5 ml-1" /> : <ChevronDown className="w-3 h-3 inline mb-0.5 ml-1" />;
    };

    return (
        <div className="space-y-3">
            {/* Desktop Header — hidden on mobile */}
            <div className="hidden md:grid md:grid-cols-[3rem_minmax(0,2fr)_1fr_1fr_1fr_5rem] gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                <button onClick={() => handleSort('rank')} className="text-left hover:text-foreground">#<SortIcon columnKey="rank" /></button>
                <span>{t('movie')}</span>
                <button onClick={() => handleSort('revenue')} className="text-right hover:text-foreground">{t('revenue')}<SortIcon columnKey="revenue" /></button>
                <button onClick={() => handleSort('budget')} className="text-right hover:text-foreground">{t('budget')}<SortIcon columnKey="budget" /></button>
                <button onClick={() => handleSort('vote_average')} className="text-right hover:text-foreground">
                    {t('rating')} <SortIcon columnKey="vote_average" />
                </button>
                <span className="text-right">{t('trend')}</span>
            </div>

            {/* Movie Rows */}
            {sortedMovies.map((movie, index) => {
                const rowHandlers = onMovieSelect ? {
                    onClick: () => onMovieSelect(movie.id),
                } : {};

                return (
                <button
                    key={movie.id}
                    {...rowHandlers}
                    className="slide-up block w-full text-left group"
                    style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
                    id={`box-office-row-${movie.id}`}
                >
                    <div className="rounded-[var(--radius-lg)] border border-border bg-background-card/50 px-4 py-3 transition-all duration-[var(--transition-base)] hover:bg-background-elevated hover:border-border-hover hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5">
                        {/* Desktop layout */}
                        <div className="hidden md:grid md:grid-cols-[3rem_minmax(0,2fr)_1fr_1fr_1fr_4rem_4rem] gap-4 items-center">
                            {/* Rank */}
                            <span className={`text-2xl font-black ${movie.rank <= 3 ? 'text-foreground' : 'text-foreground-subtle'}`}>
                                {movie.rank}
                            </span>

                            {/* Movie Info */}
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-[var(--radius-sm)]">
                                    {movie.poster_path ? (
                                        <Image
                                            src={`${IMAGE_SIZES.poster.small}${movie.poster_path}`}
                                            alt={movie.title}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-background-elevated" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-semibold truncate group-hover:text-accent transition-colors">
                                        {movie.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-foreground-muted mt-0.5">
                                        {movie.release_date && (
                                            <span>{new Date(movie.release_date).getFullYear()}</span>
                                        )}
                                        {movie.runtime > 0 && (
                                            <span>• {movie.runtime}{t('min')}</span>
                                        )}
                                        {movie.director && (
                                            <span className="hidden lg:inline">• {movie.director}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Revenue */}
                            <div className="text-right">
                                <span className={`font-semibold ${movie.revenue > 0 ? 'text-emerald-400' : 'text-foreground-subtle'}`}>
                                    {formatCurrency(movie.revenue)}
                                </span>
                            </div>

                            {/* Budget */}
                            <div className="text-right">
                                <span className="text-foreground-muted">
                                    {formatCurrency(movie.budget)}
                                </span>
                            </div>

                            {/* Ratings (TMDB + RT) */}
                            <div className="flex flex-col items-end justify-center gap-1.5 min-w-0">
                                <div className="flex items-center gap-1">
                                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
                                    <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                                </div>
                                {movie.omdbRtScore && (
                                    <div className={`flex items-center gap-1 text-[11px] font-bold ${movie.rtStatus === 'rotten' ? 'text-green-500' : 'text-red-500'}`}>
                                        <span role="img" aria-label="Rotten Tomatoes">🍅</span>
                                        <span>{movie.omdbRtScore}</span>
                                    </div>
                                )}
                            </div>

                            {/* Trend (placeholder — week-over-week) */}
                            <div className="flex items-center justify-end">
                                {movie.rank <= 3 ? (
                                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                                ) : movie.rank >= 8 ? (
                                    <TrendingDown className="h-4 w-4 text-red-400" />
                                ) : (
                                    <Minus className="h-4 w-4 text-foreground-subtle" />
                                )}
                            </div>
                        </div>

                        {/* Mobile layout */}
                        <div className="flex items-center gap-3 md:hidden">
                            {/* Rank */}
                            <span className={`text-xl font-black w-8 text-center ${movie.rank <= 3 ? 'text-foreground' : 'text-foreground-subtle'}`}>
                                {movie.rank}
                            </span>

                            {/* Poster */}
                            <div className="relative h-20 w-[54px] shrink-0 overflow-hidden rounded-[var(--radius-sm)]">
                                {movie.poster_path ? (
                                    <Image
                                        src={`${IMAGE_SIZES.poster.small}${movie.poster_path}`}
                                        alt={movie.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-background-elevated" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1 space-y-1">
                                <h3 className="font-semibold text-sm truncate">{movie.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                                        <span>{movie.vote_average.toFixed(1)}</span>
                                    </div>
                                    {movie.omdbRtScore && (
                                        <div className={`flex items-center gap-1 font-bold ${movie.rtStatus === 'rotten' ? 'text-green-500' : 'text-red-500'}`}>
                                            <span role="img" aria-label="Rotten Tomatoes" className="text-[10px]">🍅</span>
                                            <span>{movie.omdbRtScore}</span>
                                        </div>
                                    )}
                                    {movie.release_date && (
                                        <span>{new Date(movie.release_date).getFullYear()}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    {movie.revenue > 0 && (
                                        <span className="text-emerald-400 font-semibold">
                                            {formatCurrency(movie.revenue)}
                                        </span>
                                    )}
                                    {movie.budget > 0 && (
                                        <span className="text-foreground-subtle">
                                            {t('budget')}: {formatCurrency(movie.budget)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </button>
                );
            })}
        </div>
    );
}

/* ---- Skeleton ---- */
export function BoxOfficeTableSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-[var(--radius-lg)] border border-border bg-background-card/50 px-4 py-3"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded shimmer" />
                        <div className="h-16 w-11 rounded shimmer shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-2/3 rounded shimmer" />
                            <div className="h-3 w-1/3 rounded shimmer" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
