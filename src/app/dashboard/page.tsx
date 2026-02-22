import { getUserMediaItems } from '@/app/actions';
import { redirect } from 'next/navigation';
import { MovieCard } from '@/components/movie-card';
import Link from 'next/link';
import { Eye, Clock, ChevronRight } from 'lucide-react';

export default async function DashboardPage() {
    const { data: items, error } = await getUserMediaItems();

    if (error === 'Not authenticated') {
        redirect('/login');
    }

    const watching = items?.filter(i => i.status === 'watching') || [];
    const planToWatch = items?.filter(i => i.status === 'plan_to_watch') || [];

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto space-y-12 fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Dashboard</h1>
                <Link
                    href="/library"
                    className="flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
                >
                    Full Library <ChevronRight className="h-4 w-4" />
                </Link>
            </div>

            {/* Currently Watching */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                    <Eye className="h-5 w-5 text-success" />
                    <h2 className="text-xl font-bold">Currently Watching</h2>
                    <span className="ml-2 rounded-full bg-background-elevated px-2 py-0.5 text-xs text-foreground-muted">
                        {watching.length}
                    </span>
                </div>

                {watching.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-6">
                        {watching.slice(0, 6).map(item => (
                            <MovieCard
                                key={`${item.media_type}-${item.tmdb_id}`}
                                id={item.tmdb_id}
                                title={item.title}
                                posterPath={item.poster_path}
                                voteAverage={item.rating || 0}
                                mediaType={item.media_type as any}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center glass border border-border rounded-xl">
                        <p className="text-foreground-muted text-sm">You are not currently watching anything.</p>
                        <Link href="/" className="mt-4 inline-block text-accent text-sm hover:underline">
                            Discover something new
                        </Link>
                    </div>
                )}
            </section>

            {/* Plan to Watch */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                    <Clock className="h-5 w-5 text-info" />
                    <h2 className="text-xl font-bold">Plan to Watch</h2>
                    <span className="ml-2 rounded-full bg-background-elevated px-2 py-0.5 text-xs text-foreground-muted">
                        {planToWatch.length}
                    </span>
                </div>

                {planToWatch.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-6">
                        {planToWatch.slice(0, 6).map(item => (
                            <MovieCard
                                key={`${item.media_type}-${item.tmdb_id}`}
                                id={item.tmdb_id}
                                title={item.title}
                                posterPath={item.poster_path}
                                voteAverage={item.rating || 0}
                                mediaType={item.media_type as any}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center glass border border-border rounded-xl">
                        <p className="text-foreground-muted text-sm">Your watchlist is empty.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
