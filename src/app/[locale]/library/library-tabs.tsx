'use client';

import { useState, useMemo } from 'react';
import { MovieCard } from '@/components/movie-card';
import type { WatchStatus } from '@/types';
import { Eye, Clock, CheckCircle2, XCircle, LayoutGrid, Grid3X3, List, Star, Filter, ArrowUpDown, Plus, FolderPlus, Trash2, ExternalLink } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { createCustomListAction, deleteMediaItem } from '@/app/actions';
import { IMAGE_SIZES } from '@/lib/tmdb';

type ViewMode = 'editorial' | 'compact' | 'list';
type SortOption = 'added_desc' | 'rating_desc' | 'title_asc' | 'rating_asc';

interface CustomList {
  id: string;
  title: string;
  description?: string;
  items?: any[];
}

export function LibraryTabs({ items }: { items: any[] }) {
  const [activeTab, setActiveTab] = useState<WatchStatus | 'rated' | 'lists'>('watching');
  const [viewMode, setViewMode] = useState<ViewMode>('editorial');
  const [sortBy, setSortBy] = useState<SortOption>('added_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [customLists, setCustomLists] = useState<CustomList[]>([
    { id: '1', title: 'Top 10 Nolan Masterpieces', description: 'Personal definitive ranking', items: [] },
    { id: '2', title: 'Rainy Night Cozy Animation', description: 'Ghibli and Makoto Shinkai essentials', items: [] },
  ]);

  const t = useTranslations('Library');
  const tViews = useTranslations('LibraryViews');
  const locale = useLocale();

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
    } catch (e) {
      console.error(e);
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Filter by tab
    if (activeTab === 'rated') {
      result = result.filter((i) => i.rating && i.rating > 0);
    } else if (activeTab !== 'lists') {
      result = result.filter((i) => i.status === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => (i.title || '').toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'rating_asc') return (a.rating || 0) - (b.rating || 0);
      if (sortBy === 'title_asc') return (a.title || '').localeCompare(b.title || '');
      // default added_desc
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return result;
  }, [items, activeTab, searchQuery, sortBy]);

  const TABS = [
    { value: 'watching' as const, label: t('watching'), icon: Eye, count: items.filter((i) => i.status === 'watching').length },
    { value: 'plan_to_watch' as const, label: t('planToWatch'), icon: Clock, count: items.filter((i) => i.status === 'plan_to_watch').length },
    { value: 'completed' as const, label: t('completed'), icon: CheckCircle2, count: items.filter((i) => i.status === 'completed').length },
    { value: 'dropped' as const, label: t('dropped'), icon: XCircle, count: items.filter((i) => i.status === 'dropped').length },
    { value: 'rated' as const, label: t('rated') || 'Rated', icon: Star, count: items.filter((i) => i.rating && i.rating > 0).length },
    { value: 'lists' as const, label: tViews('customLists') || 'Collections', icon: FolderPlus, count: customLists.length },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter & View Mode Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-4">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-accent text-background shadow-lg shadow-white/10 scale-105'
                    : 'text-foreground-muted hover:bg-background-elevated hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${isActive ? 'bg-black/20 text-background font-black' : 'bg-background-elevated text-foreground-subtle'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode & Sort Controls */}
        {activeTab !== 'lists' && (
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-border/40 bg-background-elevated px-3 py-2 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="added_desc">{tViews('sortAddedDesc')}</option>
              <option value="rating_desc">{tViews('sortRatingDesc')}</option>
              <option value="title_asc">{tViews('sortTitleAsc')}</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl bg-background-elevated p-1 border border-border/40">
              <button
                onClick={() => setViewMode('editorial')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'editorial' ? 'bg-accent text-background' : 'text-foreground-muted hover:text-foreground'}`}
                title={tViews('gridView')}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'compact' ? 'bg-accent text-background' : 'text-foreground-muted hover:text-foreground'}`}
                title={tViews('compactView')}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-accent text-background' : 'text-foreground-muted hover:text-foreground'}`}
                title={tViews('listView')}
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">{tViews('customLists')}</h2>
            <button
              onClick={() => setIsCreateListOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-black uppercase tracking-wider text-background hover:bg-accent-hover transition-colors shadow-lg cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{tViews('createNewList')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {customLists.map((list) => (
              <div key={list.id} className="rounded-2xl border border-border/40 bg-[#0f0f18] p-6 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-foreground">{list.title}</h3>
                  <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent">
                    Public
                  </span>
                </div>
                {list.description && (
                  <p className="text-xs text-foreground-muted leading-relaxed">{list.description}</p>
                )}
                <div className="pt-2 text-xs font-mono text-foreground-subtle">
                  {list.items?.length || 0} Films in collection
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredAndSortedItems.length > 0 ? (
        /* MEDIA ITEMS VIEW (Editorial Grid / Compact / List) */
        <div className="fade-in">
          {viewMode === 'editorial' && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-6">
              {filteredAndSortedItems.map((item) => (
                <div key={`${item.media_type}-${item.tmdb_id}`} className="space-y-2 relative group">
                  <MovieCard
                    id={item.tmdb_id}
                    title={item.title}
                    posterPath={item.poster_path}
                    voteAverage={item.rating || 0}
                    releaseDate={undefined}
                    mediaType={item.media_type as any}
                  />
                  {item.rating && (
                    <div className="absolute top-2 left-2 rounded-md bg-black/85 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono font-bold text-yellow-400 border border-yellow-500/30">
                      ★ {item.rating}/10
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {viewMode === 'compact' && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 sm:gap-4">
              {filteredAndSortedItems.map((item) => (
                <Link
                  key={`${item.media_type}-${item.tmdb_id}`}
                  href={`/${item.media_type}/${item.tmdb_id}`}
                  className="aspect-[2/3] rounded-xl overflow-hidden bg-background-elevated relative group border border-border/30 hover:border-accent/50 transition-transform hover:scale-105"
                >
                  {item.poster_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${IMAGE_SIZES.poster.small}${item.poster_path}`}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-center p-2 text-foreground-muted">
                      {item.title}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="rounded-2xl border border-border/40 bg-[#0d0d16] overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-background-elevated text-foreground-subtle border-b border-border/40 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Title</th>
                    <th className="py-3.5 px-4 font-bold">Type</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold">Your Rating</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredAndSortedItems.map((item) => (
                    <tr key={`${item.media_type}-${item.tmdb_id}`} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground flex items-center gap-3">
                        <div className="h-10 w-7 rounded overflow-hidden bg-background-elevated shrink-0">
                          {item.poster_path && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`${IMAGE_SIZES.poster.small}${item.poster_path}`}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <Link href={`/${item.media_type}/${item.tmdb_id}`} className="hover:text-accent truncate max-w-xs">
                          {item.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-foreground-muted uppercase font-mono">{item.media_type}</td>
                      <td className="py-3 px-4">
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-foreground capitalize">
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-yellow-400">
                        {item.rating ? `★ ${item.rating}/10` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/${item.media_type}/${item.tmdb_id}`}
                          className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground inline-flex"
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
        <div className="py-24 text-center glass border border-border/40 rounded-2xl">
          <p className="text-foreground-muted text-sm">{t('emptyCategory')}</p>
        </div>
      )}

      {/* Modal: Create Custom Collection */}
      {isCreateListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCreateListOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-[#141420] border border-border p-6 shadow-2xl z-10 space-y-5">
            <h3 className="font-bold text-lg text-foreground">{tViews('createNewList')}</h3>

            <form onSubmit={handleCreateList} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground-muted uppercase">{tViews('listName')}</label>
                <input
                  type="text"
                  required
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="e.g. Masterpiece Sci-Fi"
                  className="w-full rounded-xl border border-border/40 bg-background-elevated px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground-muted uppercase">{tViews('listDescription')}</label>
                <textarea
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  rows={3}
                  placeholder="Describe your collection..."
                  className="w-full rounded-xl border border-border/40 bg-background-elevated px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateListOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-foreground-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-accent px-5 py-2 text-xs font-black uppercase text-background hover:bg-accent-hover transition-colors shadow-lg cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
