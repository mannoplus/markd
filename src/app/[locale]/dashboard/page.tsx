import { getUserMediaItems } from '@/app/actions';
import { redirect } from 'next/navigation';
import { MovieCard } from '@/components/movie-card';
import { Link } from '@/i18n/routing';
import { Eye, Clock, ChevronRight, Film, Tv } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';

export default async function DashboardPage() {
    const { data: items, error } = await getUserMediaItems();
    const t = await getTranslations('Dashboard');
    const locale = await getLocale();

    if (error === 'Not authenticated') {
        redirect(`/${locale}/login`);
    }

    const watching = items?.filter(i => i.status === 'watching') || [];
    const planToWatch = items?.filter(i => i.status === 'plan_to_watch') || [];

    return (
        <div className="min-h-screen pt-32 pb-28 px-6 max-w-7xl mx-auto space-y-24 fade-in animate-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <header className="space-y-5">
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
                    {t('title')}
                </h1>
                <p className="text-foreground-muted text-base md:text-lg max-w-lg leading-relaxed">
                    {t('subtitle')}
                </p>
                <Link
                    href="/library"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent/80 transition-all bg-accent/10 hover:bg-accent/20 px-4 py-2 rounded-full self-start"
                >
                    {t('fullLibrary')} <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </header>

            {/* Currently Watching */}
            <section className="space-y-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-success/10 rounded-xl">
                        <Eye className="h-5 w-5 text-success" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground/90">
                        {t('currentlyWatching')}
                    </h2>
                    <span className="rounded-full bg-background-elevated px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border/50">
                        {watching.length}
                    </span>
                </div>

                {watching.length > 0 ? (
                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {watching.slice(0, 6).map(item => (
                            <div key={`${item.media_type}-${item.tmdb_id}`} className="transition-transform duration-300 hover:-translate-y-2">
                                <MovieCard
                                    id={item.tmdb_id}
                                    title={item.title}
                                    posterPath={item.poster_path}
                                    voteAverage={item.rating || 0}
                                    mediaType={item.media_type as any}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-16 text-center border border-border/30 rounded-3xl bg-background-elevated/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-elevated/30 pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center space-y-5">
                            <div className="h-16 w-16 bg-background-card rounded-full flex items-center justify-center shadow-sm border border-border/40 group-hover:scale-110 transition-transform duration-500">
                                <Eye className="h-7 w-7 text-foreground-subtle" />
                            </div>
                            <p className="text-foreground-muted text-base font-medium max-w-sm">
                                {t('notWatching')}
                            </p>
                            <Link
                                href="/"
                                className="mt-4 inline-flex items-center justify-center rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-black shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 hover:shadow-accent/40 hover:-translate-y-0.5"
                            >
                                {t('discoverNew')}
                            </Link>
                        </div>
                    </div>
                )}
            </section>

            {/* Plan to Watch */}
            <section className="space-y-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-info/10 rounded-xl">
                        <Clock className="h-5 w-5 text-info" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground/90">
                        {t('planToWatch')}
                    </h2>
                    <span className="rounded-full bg-background-elevated px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border/50">
                        {planToWatch.length}
                    </span>
                </div>

                {planToWatch.length > 0 ? (
                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {planToWatch.slice(0, 6).map(item => (
                            <div key={`${item.media_type}-${item.tmdb_id}`} className="transition-transform duration-300 hover:-translate-y-2">
                                <MovieCard
                                    id={item.tmdb_id}
                                    title={item.title}
                                    posterPath={item.poster_path}
                                    voteAverage={item.rating || 0}
                                    mediaType={item.media_type as any}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-16 text-center border border-border/30 rounded-3xl bg-background-elevated/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-elevated/30 pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center space-y-5">
                            <div className="h-16 w-16 bg-background-card rounded-full flex items-center justify-center shadow-sm border border-border/40 group-hover:scale-110 transition-transform duration-500">
                                <Clock className="h-7 w-7 text-foreground-subtle" />
                            </div>
                            <p className="text-foreground-muted text-base font-medium max-w-sm">
                                {t('watchlistEmpty')}
                            </p>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
