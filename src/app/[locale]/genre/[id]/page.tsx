import { getMediaByGenre } from '@/lib/tmdb';
import { MovieCard } from '@/components/movie-card';
import { SkeletonCard } from '@/components/skeletons';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export default async function GenrePage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ name?: string; type?: 'movie' | 'tv' }>;
}) {
    const { id } = await params;
    const { name, type = 'movie' } = await searchParams;
    const t = await getTranslations('Genre');

    if (!id || isNaN(Number(id))) {
        notFound();
    }

    const genreName = name || 'Category';

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto">
            <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold text-accent bg-accent/10 border border-accent/20 rounded-full mb-4">
                    {type === 'movie' ? t('movies') : t('tvShows')}
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                    {genreName}
                </h1>
                <p className="text-foreground-muted mt-2 text-lg">
                    {type === 'movie' ? t('discoverMovies') : t('discoverTv')}
                </p>
            </div>

            <Suspense fallback={
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6">
                    {Array.from({ length: 18 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            }>
                <GenreResults genreId={Number(id)} type={type} />
            </Suspense>
        </div>
    );
}

async function GenreResults({ genreId, type }: { genreId: number, type: 'movie' | 'tv' }) {
    const data = await getMediaByGenre(genreId, type);
    const t = await getTranslations('Genre');

    if (!data.results || data.results.length === 0) {
        return (
            <div className="text-center py-20 bg-background-elevated rounded-2xl border border-border">
                <h3 className="text-xl font-bold">{t('noResultsTitle')}</h3>
                <p className="text-foreground-muted mt-2">{type === 'movie' ? t('noResultsMovies') : t('noResultsTv')}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6">
            {data.results.map((item) => (
                <div key={item.id} className="fade-in">
                    <MovieCard
                        id={item.id}
                        title={item.title || item.name || 'Unknown'}
                        posterPath={item.poster_path}
                        voteAverage={item.vote_average}
                        mediaType={item.media_type}
                    />
                </div>
            ))}
        </div>
    );
}
