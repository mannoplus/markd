import { getFullMediaDetails, TMDB_IMAGE_BASE, IMAGE_SIZES } from '@/lib/tmdb';
import { ProviderBadge } from '@/components/provider-badge';
import { StatusSelector } from '@/components/status-selector';
import { Star, Clock, Calendar, Tv } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getUserMediaItem, upsertMediaItem, deleteMediaItem } from '@/app/actions';
import { getTranslations } from 'next-intl/server';

export default async function TVDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const t = await getTranslations('MediaDetails');

    if (!id || isNaN(Number(id))) {
        notFound();
    }

    try {
        const tv = await getFullMediaDetails(Number(id), 'tv');
        const { data: userItem } = await getUserMediaItem(Number(id), 'tv');
        const { cast, providers } = tv;
        const details = tv.details as any;

        const backdropUrl = details.backdrop_path
            ? `${IMAGE_SIZES.backdrop.original}${details.backdrop_path}`
            : null;

        const posterUrl = details.poster_path
            ? `${IMAGE_SIZES.poster.large}${details.poster_path}`
            : null;

        const releaseYear = (details as any).first_air_date?.split('-')[0];

        // For TV shows, runtime is usually an array of episode runtimes.
        const runtimes = (details as any).episode_run_time || [];
        const runtime = runtimes.length > 0 ? runtimes[0] : 0;
        const hours = Math.floor(runtime / 60);
        const minutes = runtime % 60;
        const runtimeStr = hours > 0 ? `${hours}h ${minutes}m` : (minutes > 0 ? `${minutes}m` : null);

        const numberOfSeasons = (details as any).number_of_seasons || 0;
        const numberOfEpisodes = (details as any).number_of_episodes || 0;

        return (
            <div className="min-h-screen pb-16">
                {/* Hero Backdrop */}
                <div className="relative h-[40vh] md:h-[60vh] w-full">
                    {backdropUrl ? (
                        <>
                            <Image
                                src={backdropUrl}
                                alt={(details as any).name || ''}
                                fill
                                className="object-cover object-top"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-background-elevated" />
                    )}
                </div>

                {/* Content Container */}
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Poster column */}
                        <div className="w-40 sm:w-48 md:w-72 shrink-0">
                            {posterUrl ? (
                                <Image
                                    src={posterUrl}
                                    alt={(details as any).name || ''}
                                    width={300}
                                    height={450}
                                    className="rounded-xl shadow-2xl glass-panel w-full"
                                    priority
                                />
                            ) : (
                                <div className="w-full aspect-[2/3] bg-background-elevated rounded-xl shadow-2xl glass-panel" />
                            )}
                        </div>

                        {/* Details column */}
                        <div className="flex-1 space-y-6 pt-4 md:pt-32">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                                    {(details as any).name}
                                </h1>
                                {tv.director && (
                                    <div className="mt-2 text-foreground-muted font-medium">
                                        {t('createdBy')}{' '}
                                        <Link
                                            href={`/person/${tv.director.id}`}
                                            className="text-accent hover:underline focus:outline-none"
                                        >
                                            {tv.director.name}
                                        </Link>
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-4 text-foreground-muted mt-4 text-sm font-medium">
                                    {releaseYear && (
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4" />
                                            <span>{releaseYear}</span>
                                        </div>
                                    )}
                                    {runtimeStr && (
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-4 w-4" />
                                            <span>{runtimeStr} / ep</span>
                                        </div>
                                    )}
                                    {numberOfSeasons > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <Tv className="h-4 w-4" />
                                            <span>
                                                {numberOfSeasons} {numberOfSeasons === 1 ? t('season') : t('seasons')}
                                                {' '}({numberOfEpisodes} {t('ep')})
                                            </span>
                                        </div>
                                    )}
                                    {details.vote_average > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                            <span>{details.vote_average.toFixed(1)} / 10</span>
                                        </div>
                                    )}
                                </div>

                                {details.genres && details.genres.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {details.genres.map((g: any) => (
                                            <Link
                                                key={g.id}
                                                href={`/genre/${g.id}?name=${encodeURIComponent(g.name)}&type=tv`}
                                                className="px-2.5 py-1 text-xs font-semibold rounded-full bg-background-elevated border border-border hover:bg-background-card hover:border-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                                            >
                                                {g.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {tv.trailer && (
                                <div className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden glass-panel border border-border mt-6">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${tv.trailer.key}`}
                                        title={`${details.name} Trailer`}
                                        className="absolute top-0 left-0 w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}

                            {details.overview && (
                                <div className="space-y-2 max-w-3xl">
                                    <h3 className="text-lg font-bold">{t('synopsis')}</h3>
                                    <p className="text-foreground-muted leading-relaxed">
                                        {details.overview}
                                    </p>
                                </div>
                            )}

                            {/* Status Tracking */}
                            <div className="pt-4 border-t border-border max-w-md">
                                <StatusSelector
                                    currentStatus={userItem?.status as any || null}
                                    currentRating={userItem?.rating || null}
                                    currentSeason={userItem?.season_progress || null}
                                    currentEpisode={userItem?.episode_progress || null}
                                    mediaType="tv"
                                    totalSeasons={details.number_of_seasons}
                                    onUpdate={async (data) => {
                                        'use server';
                                        return await upsertMediaItem({
                                            tmdb_id: details.id,
                                            media_type: 'tv',
                                            title: details.name,
                                            poster_path: details.poster_path,
                                            ...data,
                                        });
                                    }}
                                    onRemove={
                                        async () => {
                                            'use server';
                                            return await deleteMediaItem(details.id, 'tv');
                                        }
                                    }
                                />
                            </div>

                            {/* Watch Providers */}
                            {providers && (providers.flatrate || providers.rent || providers.buy) && (
                                <div className="space-y-4 pt-6">
                                    <h3 className="text-lg font-bold">{t('whereToWatch')}</h3>
                                    <div className="flex flex-wrap gap-6">
                                        {providers.flatrate && (
                                            <div className="space-y-2">
                                                <span className="text-xs text-foreground-muted font-medium uppercase tracking-wider">{t('stream')}</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {providers.flatrate.map(p => (
                                                        <ProviderBadge key={p.provider_id} provider={p} link={providers.link} title={details.name} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {providers.rent && (
                                            <div className="space-y-2">
                                                <span className="text-xs text-foreground-muted font-medium uppercase tracking-wider">{t('rent')}</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {providers.rent.map(p => (
                                                        <ProviderBadge key={p.provider_id} provider={p} link={providers.link} title={details.name} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {providers.buy && (
                                            <div className="space-y-2">
                                                <span className="text-xs text-foreground-muted font-medium uppercase tracking-wider">{t('buy')}</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {providers.buy.map(p => (
                                                        <ProviderBadge key={p.provider_id} provider={p} link={providers.link} title={details.name} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cast Section */}
                    {cast && cast.length > 0 && (
                        <div className="mt-16 space-y-6">
                            <h2 className="text-2xl font-bold tracking-tight">{t('topCast')}</h2>
                            <div className="flex overflow-x-auto gap-4 pb-6 snap-x -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                                {cast.map(person => (
                                    <Link key={person.id} href={`/person/${person.id}`} className="w-32 shrink-0 snap-start space-y-2 group fade-in transition-transform hover:scale-105 block">
                                        {person.profile_path ? (
                                            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-background-elevated shadow-[var(--shadow-card)] ring-1 ring-border group-hover:ring-border-hover transition-all">
                                                <Image
                                                    src={`${IMAGE_SIZES.profile.small}${person.profile_path}`}
                                                    alt={person.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-[2/3] w-full rounded-lg bg-background-elevated border border-border flex items-center justify-center group-hover:border-border-hover transition-colors">
                                                <span className="text-xs text-foreground-muted text-center px-2">{person.name}</span>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-semibold truncate group-hover:text-foreground transition-colors" title={person.name}>{person.name}</p>
                                            <p className="text-xs text-foreground-muted truncate" title={person.character}>{person.character}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error(error);
        notFound();
    }
}
