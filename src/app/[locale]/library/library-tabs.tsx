'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { MovieCard } from '@/components/movie-card';
import { EmptyState } from '@/components/empty-state';
import type { WatchStatus } from '@/types';
import {
    Eye, Clock, CheckCircle2, XCircle, LayoutGrid, Grid3X3, List, Star,
    ArrowUpDown, Plus, FolderPlus, Search, ExternalLink, X, Film, Tv,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { createCustomListAction } from '@/app/actions';
import { IMAGE_SIZES } from '@/lib/tmdb';

type ViewMode = 'editorial' | 'compact' | 'list';
type SortOption = 'added_desc' | 'rating_desc' | 'rating_asc' | 'title_asc';

interface CustomList {
    id: string;
    title: string;
    description?: string;
    items?: unknown[];
}

interface LibraryItem {
    id: string;
    created_at: string;
    tmdb_id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_path: string | null;
    status: WatchStatus;
    rating: number | null;
}

export function LibraryTabs({ items }: { items: LibraryItem[] }) {
    const [activeTab, setActiveTab] = useState<WatchStatus | 'rated' | 'lists'>('watching');
    const [viewMode, setViewMode] = useState<ViewMode>('editorial');
    const [sortBy, setSortBy] = useState<SortOption>('added_desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateListOpen, setIsCreateListOpen] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [newListDesc, setNewListDesc] = useState('');
    const [customLists, setCustomLists] = useState<CustomList[]>([]);
    const modalRef = useRef<HTMLDivElement>(null);

    const t = useTranslations('Library');
    const tViews = useTranslations('LibraryViews');
    const locale = useLocale();

    useEffect(() => {
        if (!isCreateListOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsCreateListOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isCreateListOpen]);

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListTitle.trim()) return;

        try {
            const res = await createCustomListAction({
                title: newListTitle,
                description: newListDesc,
                is_public: true,
            });

            if (res.data) {
                setCustomLists((prev) => [res.data, ...prev]);
            } else {
                setCustomLists((prev) => [
                    { id: String(Date.now()), title: newListTitle, description: newListDesc, items: [] },
                    ...prev,
                ]);
            }
            setNewListTitle('');
            setNewListDesc('');
            setIsCreateListOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredAndSortedItems = useMemo(() => {
        let result = [...items];

        if (activeTab === 'rated') {
            result = result.filter((i) => i.rating && i.rating > 0);
        } else if (activeTab !== 'lists') {
            result = result.filter((i) => i.status === activeTab);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter((i) => (i.title || '').toLowerCase().includes(q));
        }

        result.sort((a, b) => {
            if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
            if (sortBy === 'rating_asc') return (a.rating || 0) - (b.rating || 0);
            if (sortBy === 'title_asc') return (a.title || '').localeCompare(b.title || '');
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });

        return result;
    }, [items, activeTab, searchQuery, sortBy]);

    const TABS: { value: WatchStatus | 'rated' | 'lists'; label: string; icon: typeof Eye; count: number }[] = [
        { value: 'watching', label: t('watching'), icon: Eye, count: items.filter((i) => i.status === 'watching').length },
        { value: 'plan_to_watch', label: t('planToWatch'), icon: Clock, count: items.filter((i) => i.status === 'plan_to_watch').length },
        { value: 'completed', label: t('completed'), icon: CheckCircle2, count: items.filter((i) => i.status === 'completed').length },
        { value: 'dropped', label: t('dropped'), icon: XCircle, count: items.filter((i) => i.status === 'dropped').length },
        { value: 'rated', label: t('rated') || 'Rated', icon: Star, count: items.filter((i) => i.rating && i.rating > 0).length },
        { value: 'lists', label: tViews('customLists') || 'Collections', icon: FolderPlus, count: customLists.length },
    ];

    return (
        <div className="space-y-8">
            {/* Top Filter & View Mode Controls Bar */}
            <div className="flex flex-col gap-4 border-b border-border/40 pb-6 lg:flex-row lg:items-end lg:justify-between">
                {/* Navigation Tabs */}
                <div role="tablist" aria-label={t('title')} className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.value;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.value}
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setActiveTab(tab.value)}
                                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors ${
                                    isActive
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'border-border bg-background-elevated/60 text-foreground-muted hover:border-border-hover hover:text-foreground'
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span>{tab.label}</span>
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isActive ? 'bg-background/15 text-background' : 'bg-background-highlight text-foreground-subtle'}`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Toolbar */}
                {activeTab !== 'lists' && (
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={tViews('search') || 'Search your library…'}
                                aria-label={tViews('search') || 'Search your library'}
                                className="w-44 rounded-lg border border-border bg-background-elevated py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-foreground-subtle focus:border-border-active focus:outline-none sm:w-52"
                            />
                        </div>

                        {/* Sort */}
                        <div className="relative">
                            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                aria-label={tViews('sortBy')}
                                className="appearance-none rounded-lg border border-border bg-background-elevated py-2 pl-9 pr-8 text-xs font-semibold text-foreground focus:border-border-active focus:outline-none"
                            >
                                <option value="added_desc">{tViews('sortAddedDesc')}</option>
                                <option value="rating_desc">{tViews('sortRatingDesc')}</option>
                                <option value="title_asc">{tViews('sortTitleAsc')}</option>
                                <option value="rating_asc">★ {tViews('sortRatingDesc')}</option>
                            </select>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center rounded-lg border border-border bg-background-elevated p-0.5">
                            <button
                                onClick={() => setViewMode('editorial')}
                                aria-pressed={viewMode === 'editorial'}
                                aria-label={tViews('gridView')}
                                className={`rounded-md p-2 transition-colors ${viewMode === 'editorial' ? 'bg-foreground text-background' : 'text-foreground-muted hover:text-foreground'}`}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('compact')}
                                aria-pressed={viewMode === 'compact'}
                                aria-label={tViews('compactView')}
                                className={`rounded-md p-2 transition-colors ${viewMode === 'compact' ? 'bg-foreground text-background' : 'text-foreground-muted hover:text-foreground'}`}
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                aria-pressed={viewMode === 'list'}
                                aria-label={tViews('listView')}
                                className={`rounded-md p-2 transition-colors ${viewMode === 'list' ? 'bg-foreground text-background' : 'text-foreground-muted hover:text-foreground'}`}
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Tab Content */}
            {activeTab === 'lists' ? (
                /* CUSTOM LISTS VIEW */
                <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <span className="eyebrow">{tViews('customLists')}</span>
                        <button
                            onClick={() => setIsCreateListOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-2 text-xs font-bold text-background transition-colors hover:bg-foreground/90"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>{tViews('createNewList')}</span>
                        </button>
                    </div>

                    {customLists.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {customLists.map((list) => (
                                <div key={list.id} className="card space-y-3 p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-base font-bold text-foreground">{list.title}</h3>
                                        <span className="shrink-0 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                                            {tViews('public')}
                                        </span>
                                    </div>
                                    {list.description && (
                                        <p className="line-clamp-2 text-xs leading-relaxed text-foreground-muted">{list.description}</p>
                                    )}
                                    <div className="pt-1 text-[11px] font-medium text-foreground-subtle">
                                        {t('filmsInCollection', { count: list.items?.length || 0 })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={FolderPlus}
                            title={tViews('createNewList')}
                            description={t('emptyCategory')}
                            actionLabel={tViews('createNewList')}
                            onAction={() => setIsCreateListOpen(true)}
                        />
                    )}
                </div>
            ) : filteredAndSortedItems.length > 0 ? (
                <div className="fade-in">
                    {viewMode === 'editorial' && (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-6">
                            {filteredAndSortedItems.map((item) => (
                                <div key={item.id}>
                                    <MovieCard
                                        id={item.tmdb_id}
                                        title={item.title}
                                        posterPath={item.poster_path}
                                        voteAverage={item.rating || undefined}
                                        mediaType={item.media_type}
                                        status={item.status}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {viewMode === 'compact' && (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 sm:gap-4">
                            {filteredAndSortedItems.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/${item.media_type}/${item.tmdb_id}`}
                                    className="group relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-background-elevated transition-colors hover:border-border-hover"
                                >
                                    {item.poster_path ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={`${IMAGE_SIZES.poster.small}${item.poster_path}`}
                                            alt={item.title}
                                            className="h-full w-full object-cover transition-transform duration-[var(--transition-base)] group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-foreground-muted">
                                            {item.title}
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}

                    {viewMode === 'list' && (
                        <div className="overflow-hidden rounded-lg border border-border bg-surface-secondary">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border bg-background-elevated text-[10px] uppercase tracking-widest text-foreground-subtle">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 font-bold">{t('listTitle')}</th>
                                        <th scope="col" className="px-4 py-3 font-bold">{t('listType')}</th>
                                        <th scope="col" className="px-4 py-3 font-bold">{t('listStatus')}</th>
                                        <th scope="col" className="px-4 py-3 font-bold">{t('listRating')}</th>
                                        <th scope="col" className="px-4 py-3 text-right font-bold">{t('listActions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {filteredAndSortedItems.map((item) => (
                                        <tr key={item.id} className="transition-colors hover:bg-background-elevated/60">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-11 w-8 shrink-0 overflow-hidden rounded bg-background-elevated">
                                                        {item.poster_path && (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={`${IMAGE_SIZES.poster.small}${item.poster_path}`}
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                            />
                                                        )}
                                                    </div>
                                                    <Link href={`/${item.media_type}/${item.tmdb_id}`} className="max-w-[220px] truncate font-semibold text-foreground transition-colors hover:text-accent">
                                                        {item.title}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-foreground-muted">
                                                <span className="inline-flex items-center gap-1 uppercase">
                                                    {item.media_type === 'tv' ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                                                    {item.media_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusPill status={item.status} />
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-gold-star">
                                                {item.rating ? `★ ${item.rating}/10` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`/${item.media_type}/${item.tmdb_id}`}
                                                    aria-label={t('listActions')}
                                                    className="inline-flex rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-background-highlight hover:text-foreground"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <EmptyState
                    icon={activeTab === 'rated' ? Star : Film}
                    title={t(activeTab === 'rated' ? 'rated' : 'emptyCategory')}
                    description={searchQuery ? `${t('emptyCategory')} — "${searchQuery}"` : t('emptyCategory')}
                />
            )}

            {/* Modal: Create Custom Collection */}
            {isCreateListOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setIsCreateListOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="create-list-title"
                        className="relative z-10 w-full max-w-md space-y-5 rounded-xl border border-border bg-surface-secondary p-6 shadow-elevated fade-in"
                    >
                        <div className="flex items-center justify-between">
                            <h3 id="create-list-title" className="text-lg font-bold text-foreground">
                                {tViews('createNewList')}
                            </h3>
                            <button
                                onClick={() => setIsCreateListOpen(false)}
                                aria-label={t('listActions')}
                                className="rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-background-elevated hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateList} className="space-y-4">
                            <div className="space-y-1.5">
                                <label htmlFor="list-title" className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
                                    {tViews('listName')}
                                </label>
                                <input
                                    id="list-title"
                                    type="text"
                                    required
                                    value={newListTitle}
                                    onChange={(e) => setNewListTitle(e.target.value)}
                                    placeholder={locale === 'zh-TW' ? '例如：科幻神作選' : 'e.g. Masterpiece Sci-Fi'}
                                    className="w-full rounded-lg border border-border bg-background-elevated px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:border-border-active focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="list-desc" className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
                                    {tViews('listDescription')}
                                </label>
                                <textarea
                                    id="list-desc"
                                    value={newListDesc}
                                    onChange={(e) => setNewListDesc(e.target.value)}
                                    rows={3}
                                    placeholder={locale === 'zh-TW' ? '描述您的片單…' : 'Describe your collection…'}
                                    className="w-full rounded-lg border border-border bg-background-elevated px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:border-border-active focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateListOpen(false)}
                                    className="rounded-lg px-4 py-2 text-xs font-bold text-foreground-muted transition-colors hover:text-foreground"
                                >
                                    {t('listCancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-foreground px-5 py-2 text-xs font-bold uppercase tracking-wider text-background transition-colors hover:bg-foreground/90"
                                >
                                    {t('listCreate')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusPill({ status }: { status: WatchStatus }) {
    const t = useTranslations('Library');
    const config: Record<WatchStatus, { labelKey: string; color: string }> = {
        plan_to_watch: { labelKey: 'planToWatch', color: 'border-info/30 bg-info/10 text-info' },
        watching: { labelKey: 'watching', color: 'border-success/30 bg-success/10 text-success' },
        completed: { labelKey: 'completed', color: 'border-accent-muted/40 bg-accent-muted/10 text-accent' },
        dropped: { labelKey: 'dropped', color: 'border-error/30 bg-error/10 text-error' },
    };
    const { labelKey, color } = config[status];
    return (
        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${color}`}>
            {t(labelKey)}
        </span>
    );
}