'use client';

import { useState } from 'react';
import { MovieCard } from '@/components/movie-card';
import type { WatchStatus } from '@/types';
import { Eye, Clock, CheckCircle2, XCircle } from 'lucide-react';

const TABS: { value: WatchStatus, label: string, icon: React.ElementType }[] = [
    { value: 'watching', label: 'Watching', icon: Eye },
    { value: 'plan_to_watch', label: 'Plan to Watch', icon: Clock },
    { value: 'completed', label: 'Completed', icon: CheckCircle2 },
    { value: 'dropped', label: 'Dropped', icon: XCircle },
];

export function LibraryTabs({ items }: { items: any[] }) {
    const [activeTab, setActiveTab] = useState<WatchStatus>('watching');

    const filteredItems = items.filter(item => item.status === activeTab);

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
                            {tab.label}
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
                        <p className="text-foreground-muted">No items in this category yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
