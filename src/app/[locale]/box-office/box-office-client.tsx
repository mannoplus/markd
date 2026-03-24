'use client';

import { useState } from 'react';
import { BoxOfficeTable } from '@/components/box-office-table';
import { BoxOfficeChart } from '@/components/box-office-chart';
import { BoxOfficeModal } from '@/components/box-office-modal';
import type { BoxOfficeMovie } from '@/types';
import { useTranslations } from 'next-intl';
import { BarChart3 } from 'lucide-react';

const REGIONS = ['US', 'TW', 'GB', 'JP', 'KR', 'CN', 'FR'] as const;
const REGION_KEYS: Record<string, string> = {
    US: 'regionUS',
    TW: 'regionTW',
    GB: 'regionGB',
    JP: 'regionJP',
    KR: 'regionKR',
    CN: 'regionCN',
    FR: 'regionFR',
};

interface BoxOfficeClientProps {
    allRegionData: Record<string, BoxOfficeMovie[]>;
    defaultRegion: string;
}

export function BoxOfficeClient({ allRegionData, defaultRegion }: BoxOfficeClientProps) {
    const t = useTranslations('BoxOffice');
    const [activeRegion, setActiveRegion] = useState(defaultRegion);
    const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

    const currentMovies = allRegionData[activeRegion] ?? [];

    return (
        <div className="pb-16 pt-24 sm:pt-28">
            {/* Main Content */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 relative z-20">

                {/* Region Tabs */}
                <div className="flex overflow-x-auto whitespace-nowrap items-center gap-2 pb-2 scrollbar-hide relative z-30">
                    {REGIONS.map((region) => (
                        <button
                            key={region}
                            onClick={() => setActiveRegion(region)}
                            className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-[var(--transition-fast)] ${activeRegion === region
                                ? 'bg-foreground text-background shadow-lg'
                                : 'bg-background-card text-foreground-muted border border-border hover:bg-background-elevated hover:text-foreground'
                                }`}
                        >
                            {t(REGION_KEYS[region])}
                        </button>
                    ))}
                </div>

                {/* Top 10 Section */}
                <section className="space-y-6">
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                {t('top10Title')}
                            </h2>
                            <p className="text-sm text-foreground-muted mt-1">
                                {t('top10Subtitle', { region: t(REGION_KEYS[activeRegion]) })}
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
                            <p className="text-foreground-muted">{t('noData')}</p>
                        </div>
                    )}
                </section>

                {/* Revenue Comparison Chart */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="h-6 w-6 text-foreground-subtle" />
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                {t('chartTitle')}
                            </h2>
                            <p className="text-sm text-foreground-muted mt-1">
                                {t('chartSubtitle')}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-[var(--radius-xl)] border border-border bg-background-card/50 p-6 sm:p-8">
                        <BoxOfficeChart regionData={allRegionData} />
                    </div>
                </section>

                {/* Last Updated */}
                <div className="flex items-center justify-center">
                    <p className="text-xs text-foreground-subtle">
                        {t('lastUpdated', { time: new Date().toLocaleString() })}
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
