'use client';

import Image from 'next/image';
import { IMAGE_SIZES } from '@/lib/tmdb';
import type { BoxOfficeMovie } from '@/types';
import { useTranslations } from 'next-intl';

const REGION_COLORS: Record<string, string> = {
    US: '#6366f1',  // Indigo
    TW: '#f97316',  // Orange
    GB: '#ec4899',  // Pink
    JP: '#ef4444',  // Red
    KR: '#14b8a6',  // Teal
    FR: '#8b5cf6',  // Violet
};

const REGION_KEYS: Record<string, string> = {
    US: 'regionUS',
    TW: 'regionTW',
    GB: 'regionGB',
    JP: 'regionJP',
    KR: 'regionKR',
    FR: 'regionFR',
};

function formatCompact(value: number): string {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    if (value > 0) return `$${value.toLocaleString()}`;
    return '—';
}

interface BoxOfficeChartProps {
    regionData: Record<string, BoxOfficeMovie[]>;
}

export function BoxOfficeChart({ regionData }: BoxOfficeChartProps) {
    const t = useTranslations('BoxOffice');

    // Get top 5 movies from the first region (US) as baseline
    const baseRegion = 'US';
    const baseMovies = regionData[baseRegion]?.slice(0, 5) ?? [];

    if (baseMovies.length === 0) return null;

    // Find max revenue for scaling
    let maxRevenue = 0;
    for (const movies of Object.values(regionData)) {
        for (const movie of movies.slice(0, 5)) {
            if (movie.revenue > maxRevenue) maxRevenue = movie.revenue;
        }
    }

    // If no revenue data at all, use popularity for bar sizes
    const usePopularity = maxRevenue === 0;

    if (usePopularity) {
        maxRevenue = 0;
        for (const movies of Object.values(regionData)) {
            for (const movie of movies.slice(0, 5)) {
                if (movie.vote_average > maxRevenue) maxRevenue = movie.vote_average;
            }
        }
    }

    const regions = Object.keys(regionData);

    return (
        <div className="space-y-6">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3">
                {regions.map((region) => (
                    <div key={region} className="flex items-center gap-2 text-xs">
                        <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: REGION_COLORS[region] || '#888' }}
                        />
                        <span className="text-foreground-muted">
                            {t(REGION_KEYS[region] || region)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Chart Rows */}
            <div className="space-y-6">
                {baseMovies.map((movie, movieIdx) => {
                    return (
                        <div key={movie.id} className="slide-up" style={{ animationDelay: `${movieIdx * 100}ms`, animationFillMode: 'both' }}>
                            {/* Movie Label */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded-[4px]">
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
                                <span className="text-sm font-semibold truncate">{movie.title}</span>
                            </div>

                            {/* Bars per region */}
                            <div className="space-y-1.5 pl-10">
                                {regions.map((region, regionIdx) => {
                                    // Find matching movie in this region (might not exist)
                                    const regionMovie = regionData[region]?.find(m => m.id === movie.id);
                                    const value = regionMovie
                                        ? (usePopularity ? regionMovie.vote_average : regionMovie.revenue)
                                        : 0;

                                    const barWidth = maxRevenue > 0 ? Math.max((value / maxRevenue) * 100, 2) : 2;
                                    const color = REGION_COLORS[region] || '#888';

                                    return (
                                        <div key={region} className="flex items-center gap-2">
                                            <span className="w-6 text-[10px] font-bold text-foreground-subtle uppercase">
                                                {region}
                                            </span>
                                            <div className="flex-1 h-6 bg-background-elevated rounded-full overflow-hidden">
                                                <div
                                                    className="bar-animate h-full rounded-full flex items-center justify-end pr-2"
                                                    style={{
                                                        '--bar-width': `${barWidth}%`,
                                                        backgroundColor: color,
                                                        animationDelay: `${movieIdx * 100 + regionIdx * 50}ms`,
                                                    } as React.CSSProperties}
                                                >
                                                    {value > 0 && (
                                                        <span className="text-[10px] font-bold text-white whitespace-nowrap">
                                                            {usePopularity
                                                                ? `★ ${(value as number).toFixed(1)}`
                                                                : formatCompact(value)
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {usePopularity && (
                <p className="text-xs text-foreground-subtle italic">
                    {t('chartFallback')}
                </p>
            )}
        </div>
    );
}
