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

function formatWeekChange(change?: number): { icon: any; color: string; text: string } {
    if (!change || change === 0) return { icon: Minus, color: 'text-foreground-muted', text: '—' };
    if (change > 0) return { icon: TrendingUp, color: 'text-emerald-500', text: `+${change.toFixed(1)}%` };
    return { icon: TrendingDown, color: 'text-red-500', text: `${change.toFixed(1)}%` };
}

function PosterView({ movie, size = 'small' }: { movie: BoxOfficeMovie, size?: 'small' | 'medium' }) {
    const [error, setError] = useState(false);
    const posterUrl = movie.poster_path ? `${IMAGE_SIZES.poster[size]}${movie.poster_path}` : null;

    if (!posterUrl || error) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-background-elevated to-background-card p-1 text-center">
                <span className="text-[10px] font-bold text-foreground-muted leading-tight uppercase selection:bg-accent/30 break-words">
                    {movie.title.split(' ').slice(0, 3).join(' ')}
                </span>
            </div>
        );
    }

    return (
        <Image
            src={posterUrl}
            alt={movie.title}
            fill
            className="object-cover transition-opacity duration-300"
            onError={() => setError(true)}
        />
    );
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

    const renderSortIcon = (columnKey: SortKey) => {
        if (sortConfig?.key !== columnKey) return null;
        return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline mb-0.5 ml-1" /> : <ChevronDown className="w-3 h-3 inline mb-0.5 ml-1" />;
    };

    return (
        <div className="space-y-3">
            {/* Desktop Header — hidden on mobile */}
            <div className="hidden md:grid md:grid-cols-[3rem_minmax(0,2fr)_1fr_1fr_1fr_5rem] gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                <button onClick={() => handleSort('rank')} className="text-left hover:text-foreground">#{renderSortIcon('rank')}</button>
                <span>{t('movie')}</span>
                <button onClick={() => handleSort('revenue')} className="text-right hover:text-foreground">{t('weeklyRevenue')}{renderSortIcon('revenue')}</button>
                <button onClick={() => handleSort('budget')} className="text-right hover:text-foreground">{t('budget')}{renderSortIcon('budget')}</button>
                <button onClick={() => handleSort('vote_average')} className="text-right hover:text-foreground">
                    {t('rating')} {renderSortIcon('vote_average')}
                </button>
                <span className="text-right">{t('weekChange')}</span>
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
                                <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-background-elevated border border-border/50">
                                    <PosterView movie={movie} size="small" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold truncate">{movie.title}</h3>
                                    <p className="text-xs text-foreground-muted truncate">{movie.director || 'Unknown'}</p>
                                </div>
                            </div>

                            {/* Weekly Revenue */}
                            <div className="text-right">
                                <div className="font-mono font-bold text-emerald-400">
                                    {formatCurrency(movie.weeklyRevenue || movie.revenue)}
                                </div>
                                <div className="text-[10px] text-foreground-muted uppercase tracking-wider">
                                    This Week
                                </div>
                            </div>

                            {/* Budget */}
                            <div className="text-right font-mono text-sm text-foreground-muted">
                                {formatCurrency(movie.budget)}
                            </div>

                            {/* Rating */}
                            <div className="flex items-center justify-end gap-1.5">
                                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                                <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                            </div>

                            {/* RT Score */}
                            {movie.omdbRtScore && (
                                <div className="flex items-center justify-end gap-1">
                                    <span role="img" aria-label="Rotten Tomatoes" className="text-base">🍅</span>
                                    <span className={`text-xs font-bold ${movie.rtStatus === 'fresh' ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {movie.omdbRtScore}
                                    </span>
                                </div>
                            )}

                            {/* Week Change */}
                            <div className="flex items-center justify-end">
                                {(() => {
                                    const { icon: Icon, color, text } = formatWeekChange(movie.weekChange);
                                    return (
                                        <div className={`flex items-center gap-1 ${color}`}>
                                            <Icon className="h-4 w-4" />
                                            <span className="text-xs font-semibold">{text}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Mobile layout */}
                        <div className="flex items-center gap-3 md:hidden">
                            {/* Rank */}
                            <span className={`text-xl font-black w-8 text-center ${movie.rank <= 3 ? 'text-foreground' : 'text-foreground-subtle'}`}>
                                {movie.rank}
                            </span>

                            {/* Poster */}
                            <div className="relative h-20 w-[54px] shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-background-elevated border border-border/50">
                                <PosterView movie={movie} size="small" />
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
                                        <div className={`flex items-center gap-1 font-bold ${movie.rtStatus === 'fresh' ? 'text-emerald-500' : 'text-red-500'}`}>
                                            <span role="img" aria-label="Rotten Tomatoes" className="text-[10px]">🍅</span>
                                            <span>{movie.omdbRtScore}</span>
                                        </div>
                                    )}
                                    {movie.release_date && (
                                        <span>{new Date(movie.release_date).getFullYear()}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    {(movie.weeklyRevenue || movie.revenue) > 0 && (
                                        <div className="flex flex-col">
                                            <span className="text-emerald-400 font-semibold">
                                                {formatCurrency(movie.weeklyRevenue || movie.revenue)}
                                            </span>
                                            <span className="text-[9px] text-foreground-muted uppercase tracking-wider">
                                                This Week
                                            </span>
                                        </div>
                                    )}
                                    {movie.weekChange !== undefined && movie.weekChange !== 0 && (
                                        <div className={`flex items-center gap-0.5 ${movie.weekChange > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {movie.weekChange > 0 ? (
                                                <TrendingUp className="h-3 w-3" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3" />
                                            )}
                                            <span className="font-semibold">{Math.abs(movie.weekChange).toFixed(1)}%</span>
                                        </div>
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
