'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Clapperboard, Tv, User as UserIcon, Loader2, CornerDownLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { IMAGE_SIZES } from '@/lib/tmdb';
import { useDebounce } from '@/hooks/use-debounce';
import { searchMultiWithPeopleAction } from '@/app/actions/discover';
import type { TMDBSearchResult } from '@/types';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

type ResultGroup = 'movies' | 'tv' | 'people';

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const t = useTranslations('Navigation');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<TMDBSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [activeIndex, setActiveIndex] = useState(-1);

    const debouncedQuery = useDebounce(query, 250);

    // Focus management + scroll lock
    useEffect(() => {
        if (isOpen) {
            const frame = requestAnimationFrame(() => inputRef.current?.focus());
            document.body.style.overflow = 'hidden';
            return () => {
                cancelAnimationFrame(frame);
                document.body.style.overflow = '';
            };
        }
    }, [isOpen]);

    // Fetch results
    useEffect(() => {
        let isMounted = true;
        if (!isOpen) return;

        async function doSearch() {
            if (debouncedQuery.trim().length < 2) {
                setResults([]);
                setActiveIndex(-1);
                return;
            }
            setIsLoading(true);
            try {
                const res = await searchMultiWithPeopleAction(debouncedQuery.trim());
                if (isMounted) {
                    setResults(res.results || []);
                    setActiveIndex(-1);
                }
            } catch (err) {
                console.error('Search query failed:', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        doSearch();
        return () => {
            isMounted = false;
        };
    }, [debouncedQuery, isOpen]);

    if (!isOpen) return null;

    const movies = results.filter((r) => r.media_type === 'movie').slice(0, 4);
    const tvShows = results.filter((r) => r.media_type === 'tv').slice(0, 4);
    const people = results.filter((r) => r.media_type === 'person').slice(0, 4);

    const groups: { id: ResultGroup; items: TMDBSearchResult[]; href: (r: TMDBSearchResult) => string; icon: typeof Clapperboard }[] = [
        { id: 'movies', items: movies, href: (r) => `/movie/${r.id}`, icon: Clapperboard },
        { id: 'tv', items: tvShows, href: (r) => `/tv/${r.id}`, icon: Tv },
        { id: 'people', items: people, href: (r) => `/person/${r.id}`, icon: UserIcon },
    ];
    const flat = groups.flatMap((g) => g.items);
    const hasResults = flat.length > 0;

    const moveFocus = (dir: 1 | -1) => {
        if (flat.length === 0) return;
        setActiveIndex((prev) => (prev + dir + flat.length) % flat.length);
    };

    const openActive = () => {
        if (activeIndex < 0 || activeIndex >= flat.length) return;
        const item = flat[activeIndex];
        const group = groups.find((g) => g.items.includes(item));
        if (group) {
            onClose();
            window.location.href = `/${group.href(item)}`;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            moveFocus(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            moveFocus(-1);
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            openActive();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[1100] flex flex-col items-center px-4 pt-[10vh] md:px-0"
            role="dialog"
            aria-modal="true"
            aria-label={t('search')}
        >
            {/* Backdrop */}
            <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-md" />

            {/* Panel */}
            <div className="relative flex max-h-[72vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface-secondary/95 shadow-elevated backdrop-blur-xl scale-in">
                {/* Header input */}
                <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-4">
                    <Search className="h-5 w-5 shrink-0 text-foreground-muted" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('searchPlaceholder')}
                        aria-label={t('searchPlaceholder')}
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full bg-transparent text-base text-foreground placeholder:text-foreground-subtle focus:outline-none"
                    />
                    <div className="flex shrink-0 items-center gap-2">
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-foreground-subtle" />}
                        <button
                            onClick={onClose}
                            aria-label="Close search"
                            className="rounded-md border border-border p-1.5 text-foreground-muted transition-colors hover:bg-background-elevated hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4">
                    {query.trim().length < 2 ? (
                        <div className="flex flex-col items-center gap-2 py-14 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background-elevated/60">
                                <Clapperboard className="h-6 w-6 text-foreground-subtle" />
                            </div>
                            <p className="mt-2 text-sm font-semibold text-foreground">
                                {t('searchInstructionsHeading')}
                            </p>
                            <p className="max-w-sm text-xs leading-relaxed text-foreground-subtle">
                                {t('searchInstructionsText')}
                            </p>
                        </div>
                    ) : isLoading && results.length === 0 ? (
                        <div className="space-y-4 py-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-14 w-10 shrink-0 rounded shimmer" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3.5 w-2/3 rounded shimmer" />
                                        <div className="h-2.5 w-1/3 rounded shimmer" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : !hasResults ? (
                        <div className="flex flex-col items-center gap-2 py-14 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background-elevated/60">
                                <Search className="h-6 w-6 text-foreground-subtle" />
                            </div>
                            <p className="mt-2 text-sm font-semibold text-foreground">{t('searchNoResults')}</p>
                            <p className="text-xs text-foreground-subtle">{t('searchNoResultsSub')}</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {groups.map((group) => {
                                if (group.items.length === 0) return null;
                                const Icon = group.icon;
                                return (
                                    <div key={group.id} className="space-y-1">
                                        <h3 className="eyebrow mb-2 flex items-center gap-2 px-1">
                                            <Icon className="h-3.5 w-3.5" />
                                            {group.id === 'movies'
                                                ? t('moviesColumn')
                                                : group.id === 'tv'
                                                    ? t('tvShowsColumn')
                                                    : t('peopleColumn')}
                                        </h3>
                                        <ul className="space-y-0.5">
                                            {group.items.map((item) => {
                                                const flatIndex = flat.indexOf(item);
                                                const isActive = activeIndex === flatIndex;
                                                const title = item.title || item.name || '';
                                                const subYear = (item.release_date || item.first_air_date || '').split('-')[0];

                                                return (
                                                    <li key={item.id}>
                                                        <Link
                                                            href={group.href(item) as Parameters<typeof Link>[0]['href']}
                                                            onClick={onClose}
                                                            onMouseEnter={() => setActiveIndex(flatIndex)}
                                                            className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
                                                                isActive ? 'bg-background-elevated' : 'hover:bg-background-elevated/70'
                                                            }`}
                                                        >
                                                            <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded border border-border bg-background-elevated">
                                                                {item.poster_path || item.profile_path ? (
                                                                    <Image
                                                                        src={`${IMAGE_SIZES.poster.small}${item.poster_path || item.profile_path}`}
                                                                        alt={title}
                                                                        fill
                                                                        sizes="40px"
                                                                        className="object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-full w-full items-center justify-center bg-background-elevated">
                                                                        <Icon className="h-4 w-4 text-foreground-subtle" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className={`truncate text-sm font-semibold ${isActive ? 'text-accent' : 'text-foreground'}`}>
                                                                    {title}
                                                                </p>
                                                                <p className="truncate text-xs text-foreground-subtle">
                                                                    {group.id === 'people'
                                                                        ? item.known_for_department || ''
                                                                        : subYear}
                                                                </p>
                                                            </div>
                                                            {isActive && (
                                                                <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-foreground-subtle" />
                                                            )}
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                );
                            })}
                            <p className="px-1 pt-1 text-[11px] text-foreground-subtle">
                                ↑↓ to navigate · Enter to open · Esc to close
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}