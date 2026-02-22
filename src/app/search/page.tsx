import { searchMulti } from '@/lib/tmdb';
import { MovieCard } from '@/components/movie-card';
import { SearchBar } from '@/components/search-bar';

// Set route to dynamic to handle searchParams updates
export const dynamic = 'force-dynamic';

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    // In Next.js 15, searchParams is a Promise
    const resolvedParams = await searchParams;
    const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : '';

    let results = null;
    if (query) {
        results = await searchMulti(query);
    }

    return (
        <div className="space-y-12 pb-16 pt-8">
            <section className="flex flex-col items-center justify-center space-y-8 pt-8 pb-12">
                <div className="space-y-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Search MARKD</h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        Find your next favorite movie or TV show to track.
                    </p>
                </div>
                <div className="w-full px-4">
                    <SearchBar />
                </div>
            </section>

            {query && results && (
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold tracking-tight">
                        Results for "{query}"
                    </h2>

                    {results.results.length === 0 ? (
                        <div className="text-foreground-muted py-24 text-center">
                            <p className="text-xl font-medium">No results found.</p>
                            <p className="mt-2">Try adjusting your search terms.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {results.results.map((item) => (
                                <MovieCard
                                    key={`${item.media_type}-${item.id}`}
                                    id={item.id}
                                    title={item.title || item.name || ''}
                                    posterPath={item.poster_path}
                                    voteAverage={item.vote_average}
                                    releaseDate={item.release_date || item.first_air_date}
                                    mediaType={item.media_type as 'movie' | 'tv'}
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
