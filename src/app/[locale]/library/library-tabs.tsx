'use client';

import { useState } from 'react';
import { MovieCard } from '@/components/movie-card';
import type { WatchStatus } from '@/types';
import { Eye, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

const TABS: { value: WatchStatus, icon: React.ElementType }[] = [
    { value: 'watching', icon: Eye },
    { value: 'plan_to_watch', icon: Clock },
    { value: 'completed', icon: CheckCircle2 },
    { value: 'dropped', icon: XCircle },
];

export function LibraryTabs({ items }: { items: any[] }) {
    const [activeTab, setActiveTab] = useState<WatchStatus>('watching');
    const t = useTranslations('Library');

    const filteredItems = items.filter(item => item.status === activeTab);

    const getLabel = (value: WatchStatus) => {
        if (value === 'plan_to_watch') return t('planToWatch');
        return t(value);
    };

    return (
        <div className="space-y-8">
            {/* Tabs Navigation */}
            <div className="flex overflow-x-auto border-b border-border hide-scrollbar">
                {TABS.map(tab => {
                    const isActive = activeTab === tab.value;
                    const count = items.filter(item => item.status === tab.value).length;

                    return (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`flex items-center gap-2 px-4 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${isActive
                                ? 'border-accent text-accent'
                                : 'border-transparent text-foreground-muted hover:text-foreground hover:border-border-hover'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {getLabel(tab.value)}
                            <span className="ml-1 rounded-full bg-background-elevated px-2 py-0.5 text-xs">
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="fade-in">
                {filteredItems.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-6">
                        {filteredItems.map(item => (
                            <MovieCard
                                key={`${item.media_type}-${item.tmdb_id}`}
                                id={item.tmdb_id}
                                title={item.title}
                                posterPath={item.poster_path}
                                voteAverage={item.rating || 0}
                                releaseDate={undefined} // We don't save release date currently
                                mediaType={item.media_type as any}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center glass border border-border rounded-xl">
                        <p className="text-foreground-muted">{t('emptyCategory')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
