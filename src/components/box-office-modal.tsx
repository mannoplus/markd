'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Star, TrendingUp, ExternalLink } from 'lucide-react';
import { IMAGE_SIZES } from '@/lib/tmdb';
import type { BoxOfficeModalData } from '@/types';
import { useTranslations, useLocale } from 'next-intl';
import { getBoxOfficeModalAction } from '@/app/actions';
import { formatCurrency as formatCurrencyUtil, formatNumber } from '@/lib/formatters';

export function BoxOfficeModal({ 
    movieId, 
    onClose 
}: { 
    movieId: number; 
    onClose: () => void 
}) {
    const t = useTranslations('BoxOffice');
    const tAccessibility = useTranslations('Accessibility');
    const locale = useLocale();
    const [data, setData] = useState<BoxOfficeModalData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        
        async function fetchDetails() {
            setLoading(true);
            try {
                const result = await getBoxOfficeModalAction(movieId);
                if (result) {
                    setData(result);
                }
            } catch (error) {
                console.error('Failed to load modal details', error);
            } finally {
                setLoading(false);
            }
        }
        
        fetchDetails();

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [movieId]);

    const formatCurrency = (val: number) => {
        if (!val || val <= 0) return '—';
        return formatCurrencyUtil(val, locale, 'USD');
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-label={data?.title || t('title')}
        >
            {/* Modal Overlay to close */}
            <div className="absolute inset-0" onClick={onClose} />
            
            {/* Modal Content */}
            <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-background-elevated rounded-[var(--radius-xl)] border border-border shadow-[var(--shadow-elevated)] slide-up z-10 scrollbar-hide">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    aria-label={tAccessibility('close')}
                    className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors backdrop-blur-md cursor-pointer"
                >
                    <X className="h-5 w-5" />
                </button>

                {loading ? (
                    <div className="w-full h-[600px] flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                ) : data ? (
                    <div className="flex flex-col">
                        {/* Hero Header Area */}
                        <div className="relative w-full h-64 sm:h-80 lg:h-96">
                            {data.backdrop_path ? (
                                <Image
                                    src={`${IMAGE_SIZES.backdrop.large}${data.backdrop_path}`}
                                    alt={data.title}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full bg-background-card" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-background-elevated via-background-elevated/80 to-transparent" />
                            
                            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 flex items-end gap-6">
                                <div className="hidden sm:block relative w-32 h-48 rounded-[var(--radius-lg)] overflow-hidden shadow-xl border border-border flex-shrink-0">
                                    {data.poster_path ? (
                                        <Image
                                            src={`${IMAGE_SIZES.poster.small}${data.poster_path}`}
                                            alt={data.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-background-card" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 pb-2">
                                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 truncate">
                                        {data.title}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-muted font-medium">
                                        <span>{new Date(data.release_date).getFullYear()}</span>
                                        {data.rating_mpaa && (
                                            <span className="px-1.5 py-0.5 border border-border rounded text-xs font-bold text-foreground-subtle">
                                                {data.rating_mpaa}
                                            </span>
                                        )}
                                        <span>• {data.runtime}{t('min')}</span>
                                        {data.genres.length > 0 && (
                                            <span className="hidden sm:inline">• {data.genres.map(g => g.name).join(', ')}</span>
                                        )}
                                    </div>
                                    <p className="mt-4 text-sm sm:text-base text-foreground-subtle line-clamp-2 max-w-3xl">
                                        {data.overview}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 sm:p-8 space-y-10">
                            
                            {/* Financial Data Grid */}
                            <section>
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                                    {t('financialPerformance')}
                                </h2>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-background-card/50 border border-border rounded-[var(--radius-lg)] p-4 flex flex-col justify-center">
                                        <span className="text-xs text-foreground-muted mb-1 uppercase tracking-wider font-semibold">{t('worldwideGross')}</span>
                                        <span className="text-2xl font-black font-mono text-emerald-400">
                                            {formatCurrency(data.revenue)}
                                        </span>
                                    </div>
                                    <div className="bg-background-card/50 border border-border rounded-[var(--radius-lg)] p-4 flex flex-col justify-center">
                                        <span className="text-xs text-foreground-muted mb-1 uppercase tracking-wider font-semibold">{t('productionBudget')}</span>
                                        <span className="text-2xl font-black font-mono text-blue-400">
                                            {formatCurrency(data.budget)}
                                        </span>
                                    </div>
                                    <div className="bg-background-card/50 border border-border rounded-[var(--radius-lg)] p-4 flex flex-col justify-center col-span-2 lg:col-span-2">
                                        <span className="text-xs text-foreground-muted mb-1 uppercase tracking-wider font-semibold">{t('estimatedRoi')}</span>
                                        <div className="flex items-center gap-3">
                                            {(() => {
                                                if (data.budget > 0 && data.revenue > 0) {
                                                    const profit = data.revenue - data.budget;
                                                    const roiPct = ((data.revenue / data.budget) * 100).toFixed(0);
                                                    const isProfit = profit >= 0;
                                                    return (
                                                        <>
                                                            <span className={`text-2xl font-black font-mono ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {isProfit ? '+' : ''}{formatCurrency(profit)}
                                                            </span>
                                                            <span className={`text-sm px-2 py-1 rounded bg-[#10b981]/10 ${isProfit ? 'text-emerald-400' : 'text-red-400 bg-red-500/10'}`}>
                                                                {roiPct}% {t('recoup')}
                                                            </span>
                                                        </>
                                                    );
                                                }
                                                return <span className="text-2xl font-black font-mono text-foreground-muted">—</span>;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Cast Row */}
                            {data.cast.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold mb-4">{t('topCast')}</h2>
                                    <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
                                        {data.cast.map(actor => (
                                            <div key={actor.id} className="w-24 flex-shrink-0 flex flex-col items-center text-center">
                                                <div className="relative w-16 h-16 rounded-full overflow-hidden mb-2 border border-border bg-background-card">
                                                    {actor.profile_path ? (
                                                        <Image
                                                            src={`${IMAGE_SIZES.profile.small}${actor.profile_path}`}
                                                            alt={actor.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-background-elevated flex items-center justify-center text-xl font-bold text-foreground-subtle">
                                                            {actor.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-sm font-semibold leading-tight">{actor.name}</span>
                                                <span className="text-xs text-foreground-muted mt-1 leading-tight">{actor.character}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                            
                            {/* Technical details grid */}
                            <section className="grid sm:grid-cols-2 gap-8">
                                <div>
                                    <h2 className="text-lg font-bold mb-4 border-b border-border pb-2">{t('production')}</h2>
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex justify-between">
                                            <span className="text-foreground-muted">{t('director')}</span>
                                            <span className="font-semibold text-right">{data.director || '—'}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-foreground-muted">{t('distributorStudios')}</span>
                                            <span className="font-semibold text-right max-w-[60%] truncate" title={data.production_companies.map(c => c.name).join(', ')}>
                                                {data.production_companies[0]?.name || '—'}
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold mb-4 border-b border-border pb-2">{t('criticalReception')}</h2>
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex items-center justify-between">
                                            <span className="text-foreground-muted flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                {t('tmdbUserScore')}
                                            </span>
                                            <span className="font-bold">{data.vote_average.toFixed(1)} <span className="text-xs font-normal text-foreground-subtle">({formatNumber(data.vote_count, locale)})</span></span>
                                        </li>
                                        {/* Rotten Tomatoes */}
                                        {data.omdb?.rottenTomatoes && (
                                            <li className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg p-3 -mx-1">
                                                <span className="text-foreground flex items-center gap-2 font-semibold">
                                                    <span role="img" aria-label="Rotten Tomatoes" className="text-lg">🍅</span>
                                                    {t('rottenTomatoes')}
                                                </span>
                                                <div className="flex flex-col items-end">
                                                    <span className="font-black text-lg text-red-500">{data.omdb.rottenTomatoes}</span>
                                                    <span className="text-[10px] text-foreground-muted uppercase tracking-wider">Tomatometer</span>
                                                </div>
                                            </li>
                                        )}
                                        {/* OMDb Ratings */}
                                        {data.omdb?.imdbRating && (
                                            <li className="flex items-center justify-between">
                                                <span className="text-foreground-muted">IMDb</span>
                                                <span className="font-bold text-foreground">{data.omdb.imdbRating}/10</span>
                                            </li>
                                        )}
                                        {data.omdb?.metacritic && (
                                            <li className="flex items-center justify-between">
                                                <span className="text-foreground-muted">Metacritic</span>
                                                <span className="font-bold text-green-500">{data.omdb.metacritic}/100</span>
                                            </li>
                                        )}
                                        {!data.omdb?.rottenTomatoes && !data.omdb?.imdbRating && !data.omdb?.metacritic && (
                                            <li className="flex items-center justify-between text-foreground-subtle">
                                                <span>{t('rottenTomatoes')}</span>
                                                <span className="italic text-xs">{t('availableViaOmdb')}</span>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </section>

                            <div className="flex justify-center pt-4">
                                <a 
                                    href={`/movie/${data.id}`}
                                    className="px-6 py-3 bg-foreground text-background rounded-full font-bold flex items-center gap-2 hover:bg-white/90 transition-colors"
                                >
                                    {t('viewFullMoviePage')}
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>

                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-foreground-muted">{t('failedToLoad')}</div>
                )}
            </div>
        </div>
    );
}
