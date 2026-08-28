import { getUserMediaItems } from '@/app/actions';
import { redirect } from 'next/navigation';
import { MovieCard } from '@/components/movie-card';
import { Link } from '@/i18n/routing';
import { Eye, Clock, ChevronRight, Sparkles, Compass } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';
import { getPersonalizedHomeShelvesAction } from '@/app/actions/personalization';
import { CompanionShelf } from '@/components/companion/CompanionShelf';
import { translateDnaTrait, type MovieDnaTrait } from '@/lib/taste-engine';
import { DashboardOnboardingSync } from '@/components/dashboard/DashboardOnboardingSync';

export default async function DashboardPage() {
    const { data: items, error } = await getUserMediaItems();
    const t = await getTranslations('Dashboard');
    const tCompanion = await getTranslations('Companion');
    const locale = await getLocale();

    if (error === 'Not authenticated') {
        redirect('/login');
    }

    const watching = items?.filter(i => i.status === 'watching') || [];
    const planToWatch = items?.filter(i => i.status === 'plan_to_watch') || [];

    let shelves = undefined;
    try {
        shelves = await getPersonalizedHomeShelvesAction(locale);
    } catch (e) {
        console.warn('Dashboard shelves skipped:', e);
    }

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 max-w-7xl mx-auto space-y-16 fade-in animate-in slide-in-from-bottom-4 duration-500">
            <DashboardOnboardingSync />
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/40 pb-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3.5 py-1 text-xs font-black uppercase text-accent border border-accent/25 tracking-wider">
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                        <span>{tCompanion('companionTitle')}</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/60 pb-1">
                        {t('title')}
                    </h1>
                    <p className="text-foreground-muted text-sm md:text-base max-w-xl">
                        {t('subtitle')}
                    </p>
                </div>
                <Link
                    href="/library"
                    className="group flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent/80 transition-all bg-accent/10 hover:bg-accent/20 px-4 py-2 rounded-full backdrop-blur-sm self-start sm:self-auto"
                >
                    {t('fullLibrary')} <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>

            {/* Taste DNA Summary Banner */}
            {shelves?.userTasteSummary && shelves.userTasteSummary.topDnaTraits.length > 0 && (
                <div className="rounded-3xl bg-gradient-to-r from-[#121220] via-background-elevated/80 to-[#0c0c16] border border-border/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                    <div className="space-y-1.5">
                        <span className="text-xs font-black uppercase tracking-wider text-accent flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>{tCompanion('tasteProfileHeading')}</span>
                        </span>
                        <p className="text-xs text-foreground-muted">
                            {tCompanion('learningHint')}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {shelves.userTasteSummary.topDnaTraits.map((trait) => (
                            <span
                                key={trait}
                                className="px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-xs font-extrabold text-accent shadow-sm"
                            >
                                {translateDnaTrait(trait as MovieDnaTrait, locale)}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Personalized Recommendations Shelf */}
            {shelves?.tonightsPicks && shelves.tonightsPicks.length > 0 && (
                <CompanionShelf
                    title={tCompanion('tonightsPicks')}
                    subtitle={tCompanion('tonightsPicksSub')}
                    items={shelves.tonightsPicks}
                    surface="dashboard"
                />
            )}

            {/* Currently Watching */}
            <section className="space-y-8 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-success/10 rounded-xl">
                            <Eye className="h-6 w-6 text-success" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground/90">
                            {t('currentlyWatching')}
                        </h2>
                        <span className="ml-2 rounded-full bg-background-elevated px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border/50 shadow-sm">
                            {watching.length}
                        </span>
                    </div>
                </div>

                {watching.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-6">
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
                    <div className="flex flex-col items-center justify-center p-12 text-center border border-border/40 rounded-3xl bg-background-elevated/30 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-elevated/50 pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center space-y-4">
                            <div className="h-16 w-16 bg-background-card rounded-full flex items-center justify-center shadow-lg border border-border/50 mb-2 group-hover:scale-110 transition-transform duration-500">
                                <Eye className="h-8 w-8 text-foreground-subtle" />
                            </div>
                            <p className="text-foreground-muted text-lg font-medium max-w-md">
                                {t('notWatching')}
                            </p>
                            <Link
                                href="/"
                                className="mt-6 inline-flex items-center justify-center rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-black shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 hover:shadow-accent/40 hover:-translate-y-0.5"
                            >
                                {t('discoverNew')}
                            </Link>
                        </div>
                    </div>
                )}
            </section>

            {/* Plan to Watch */}
            <section className="space-y-8 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-info/10 rounded-xl">
                            <Clock className="h-6 w-6 text-info" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground/90">
                            {t('planToWatch')}
                        </h2>
                        <span className="ml-2 rounded-full bg-background-elevated px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border/50 shadow-sm">
                            {planToWatch.length}
                        </span>
                    </div>
                </div>

                {planToWatch.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-6">
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
                    <div className="flex flex-col items-center justify-center p-12 text-center border border-border/40 rounded-3xl bg-background-elevated/30 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-elevated/50 pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center space-y-4">
                            <div className="h-16 w-16 bg-background-card rounded-full flex items-center justify-center shadow-lg border border-border/50 mb-2 group-hover:scale-110 transition-transform duration-500">
                                <Clock className="h-8 w-8 text-foreground-subtle" />
                            </div>
                            <p className="text-foreground-muted text-lg font-medium max-w-md">
                                {t('watchlistEmpty')}
                            </p>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
