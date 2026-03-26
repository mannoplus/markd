'use client';

import { useState } from 'react';
import { BoxOfficeTable } from '@/components/box-office-table';
import { BoxOfficeModal } from '@/components/box-office-modal';
import { MovieBuzzReviews } from '@/components/movie-buzz-reviews';
import type { BoxOfficeMovie } from '@/types';
import { useTranslations } from 'next-intl';
import { Calendar, TrendingUp, Clock } from 'lucide-react';

const TIME_PERIODS = ['daily', 'weekly', 'monthly'] as const;
type TimePeriod = typeof TIME_PERIODS[number];

const PERIOD_KEYS: Record<TimePeriod, string> = {
    daily: 'Daily',
    weekly: 'Weekly', 
    monthly: 'Monthly',
};

interface BoxOfficeClientProps {
    boxOfficeData: Record<TimePeriod, BoxOfficeMovie[]>;
    defaultPeriod: TimePeriod;
}

export function BoxOfficeClient({ boxOfficeData, defaultPeriod }: BoxOfficeClientProps) {
    const t = useTranslations('BoxOffice');
    const [activePeriod, setActivePeriod] = useState<TimePeriod>(defaultPeriod);
    const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

    const currentMovies = boxOfficeData[activePeriod] ?? [];

    const getPeriodIcon = (period: TimePeriod) => {
        switch (period) {
            case 'daily': return <Calendar className="h-4 w-4" />;
            case 'weekly': return <TrendingUp className="h-4 w-4" />;
            case 'monthly': return <Clock className="h-4 w-4" />;
        }
    };

    const getPeriodDescription = (period: TimePeriod) => {
        switch (period) {
            case 'daily': return 'March 26, 2026 • Daily Gross';
            case 'weekly': return 'Week of Mar 20-26, 2026 • Weekly Gross';
            case 'monthly': return 'March 2026 • Monthly Cumulative';
        }
    };

    return (
        <div className="pb-16 pt-24 sm:pt-28">
            {/* Main Content */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 relative z-20">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">US Box Office</h1>
                    <p className="text-lg text-foreground-muted">
                        Real-time box office tracking for the United States
                    </p>
                </div>

                {/* Time Period Tabs */}
                <div className="flex justify-center">
                    <div className="flex overflow-x-auto whitespace-nowrap items-center gap-2 pb-2 scrollbar-hide relative z-30 bg-background-card rounded-full p-2 border border-border">
                        {TIME_PERIODS.map((period) => (
                            <button
                                key={period}
                                onClick={() => setActivePeriod(period)}
                                className={`shrink-0 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-[var(--transition-fast)] flex items-center gap-2 ${activePeriod === period
                                    ? 'bg-foreground text-background shadow-lg'
                                    : 'bg-transparent text-foreground-muted hover:bg-background-elevated hover:text-foreground'
                                    }`}
                            >
                                {getPeriodIcon(period)}
                                {PERIOD_KEYS[period]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Box Office Section */}
                <section className="space-y-6">
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                Top 10 Movies • {PERIOD_KEYS[activePeriod]}
                            </h2>
                            <p className="text-sm text-foreground-muted mt-1">
                                {getPeriodDescription(activePeriod)}
                            </p>
                        </div>
                    </div>

                    {currentMovies.length > 0 ? (
                        <BoxOfficeTable 
                            movies={currentMovies} 
                            onMovieSelect={(id) => setSelectedMovieId(id)} 
                        />
                    ) : (
                        <div className="rounded-[var(--radius-lg)] border border-border bg-background-card p-12 text-center">
                            <p className="text-foreground-muted">No data available for this time period</p>
                        </div>
                    )}
                </section>

                {/* Movie Buzz & Reviews Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-accent" />
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                Movie Buzz & Reviews
                            </h2>
                            <p className="text-sm text-foreground-muted mt-1">
                                Trending films, fresh community reviews, and anticipated releases
                            </p>
                        </div>
                    </div>

                    <div className="rounded-[var(--radius-xl)] border border-border bg-background-card/30 p-4 sm:p-2">
                        <MovieBuzzReviews />
                    </div>
                </section>

                {/* Last Updated */}
                <div className="flex items-center justify-center">
                    <p className="text-xs text-foreground-subtle flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        Data verified: {currentMovies[0]?.lastUpdated 
                            ? new Date(currentMovies[0].lastUpdated).toLocaleString() 
                            : new Date().toLocaleString()}
                    </p>
                </div>
            </div>

            {selectedMovieId && (
                <BoxOfficeModal 
                    movieId={selectedMovieId} 
                    onClose={() => setSelectedMovieId(null)} 
                />
            )}
        </div>
    );
}
