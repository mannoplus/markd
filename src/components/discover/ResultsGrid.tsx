'use client';

import { MovieCard } from '@/components/movie-card';
import { SkeletonCard } from '@/components/skeletons';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MediaItem {
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    media_type: 'movie' | 'tv';
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
}

interface ResultsGridProps {
    results: MediaItem[];
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    isFiltered: boolean;
}

export function ResultsGrid({
    results,
    isLoading,
    isError,
    onRetry,
    isFiltered,
}: ResultsGridProps) {
    const t = useTranslations('Discover');

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-2xl border border-error/20 bg-error/5 p-6 max-w-md mx-auto fade-in">
                <AlertCircle className="h-10 w-10 text-error animate-bounce" />
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">{t('errorHeading')}</h3>
                    <p className="text-sm text-foreground-muted">{t('errorText')}</p>
                </div>
                <button
                    type="button"
                    onClick={onRetry}
                    className="rounded-lg bg-error hover:bg-error/90 px-5 py-2 text-sm font-semibold text-white transition-colors"
                >
                    {t('retryButton')}
                </button>
            </div>
        );
    }

    if (isLoading && results.length === 0) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 rounded-2xl border border-border bg-background-card/40 p-8 max-w-md mx-auto fade-in">
                <AlertTriangle className="h-10 w-10 text-warning" />
                <h3 className="text-lg font-bold text-foreground">
                    {isFiltered ? t('narrowFiltersHeading') : t('noResultsHeading')}
                </h3>
                <p className="text-sm text-foreground-muted">
                    {isFiltered ? t('narrowFiltersText') : t('noResultsText')}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-6 fade-in">
            {results.map((item) => (
                <MovieCard
                    key={`${item.media_type}-${item.id}`}
                    id={item.id}
                    title={item.title || item.name || ''}
                    posterPath={item.poster_path}
                    mediaType={item.media_type}
                    voteAverage={item.vote_average}
                    releaseDate={item.release_date || item.first_air_date}
                />
            ))}
        </div>
    );
}
