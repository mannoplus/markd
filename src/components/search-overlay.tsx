'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Clapperboard, Tv, User as UserIcon, Loader2 } from 'lucide-react';
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

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const t = useTranslations('Navigation');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<TMDBSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const debouncedQuery = useDebounce(query, 300);

    // Auto-focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Handle fetching results
    useEffect(() => {
        let isMounted = true;
        if (!isOpen) return;

        async function doSearch() {
            if (debouncedQuery.trim().length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const res = await searchMultiWithPeopleAction(debouncedQuery.trim());
                if (isMounted) {
                    setResults(res.results || []);
                }
            } catch (err) {
                console.error('Search query failed:', err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        doSearch();

        return () => {
            isMounted = false;
        };
    }, [debouncedQuery, isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    // Filter results into categories
    const movies = results.filter((r) => r.media_type === 'movie').slice(0, 5);
    const tvShows = results.filter((r) => r.media_type === 'tv').slice(0, 5);
    const actors = results.filter((r) => r.media_type === 'person').slice(0, 5);

    const hasResults = movies.length > 0 || tvShows.length > 0 || actors.length > 0;

    return (
        <div className="fixed inset-0 z-[1100] flex flex-col items-center pt-[12vh] px-4 md:px-0">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
            />

            {/* Panel */}
            <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-background-elevated shadow-2xl glass overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header Input */}
                <div className="relative flex items-center border-b border-border/80 px-4 py-4 flex-shrink-0">
                    <Search className="h-6 w-6 text-foreground-muted mr-3 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                        className="w-full bg-transparent text-lg text-foreground placeholder:text-foreground-subtle focus:outline-none"
                    />
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {isLoading && (
                            <Loader2 className="h-5 w-5 text-accent animate-spin" />
                        )}
                        <button
                            onClick={onClose}
                            className="rounded-full border border-border p-1.5 text-foreground-muted hover:text-foreground hover:bg-background transition-all focus:outline-none focus:ring-1 focus:ring-accent"
                            aria-label="Close search"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {query.trim().length < 2 ? (
                        <div className="py-12 text-center text-foreground-muted space-y-2">
                            <p className="text-base font-bold text-foreground">{t('searchInstructionsHeading')}</p>
                            <p className="text-sm max-w-sm mx-auto text-foreground-subtle">
                                {t('searchInstructionsText')}
                            </p>
                        </div>
                    ) : isLoading && results.length === 0 ? (
                        <div className="py-16 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 text-accent animate-spin" />
                        </div>
                    ) : !hasResults ? (
                        <div className="py-12 text-center text-foreground-muted space-y-1">
                            <p className="text-base font-bold text-foreground">{t('searchNoResults')}</p>
                            <p className="text-sm text-foreground-subtle">
                                {t('searchNoResultsSub')}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start divide-y md:divide-y-0 md:divide-x divide-border">
                            {/* Movies Column */}
                            <div className="space-y-3 pt-4 md:pt-0">
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground-subtle flex items-center gap-2">
                                    <Clapperboard className="h-4 w-4 text-blue-400" />
                                    <span>{t('moviesColumn')}</span>
                                </h3>
                                {movies.length === 0 ? (
                                    <p className="text-xs text-foreground-subtle">{t('noResultsColumn')}</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {movies.map((item) => (
                                            <li key={item.id}>
                                                <Link
                                                    href={`/movie/${item.id}`}
                                                    onClick={onClose}
                                                    className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-background/60 transition-colors group"
                                                >
                                                    <div className="relative h-12 w-8 bg-background border border-border/40 rounded overflow-hidden flex-shrink-0">
                                                        {item.poster_path ? (
                                                            <Image
                                                                src={`${IMAGE_SIZES.poster.small}${item.poster_path}`}
                                                                alt={item.title || ''}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground-subtle bg-background-elevated">
                                                                N/A
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-sm font-semibold truncate group-hover:text-accent transition-colors text-foreground">
                                                            {item.title}
                                                        </h4>
                                                        <p className="text-[11px] text-foreground-subtle font-medium">
                                                            {item.release_date?.split('-')[0] || ''}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* TV Shows Column */}
                            <div className="space-y-3 pt-4 md:pt-0 md:pl-6">
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground-subtle flex items-center gap-2">
                                    <Tv className="h-4 w-4 text-purple-400" />
                                    <span>{t('tvShowsColumn')}</span>
                                </h3>
                                {tvShows.length === 0 ? (
                                    <p className="text-xs text-foreground-subtle">{t('noResultsColumn')}</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {tvShows.map((item) => (
                                            <li key={item.id}>
                                                <Link
                                                    href={`/tv/${item.id}`}
                                                    onClick={onClose}
                                                    className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-background/60 transition-colors group"
                                                >
                                                    <div className="relative h-12 w-8 bg-background border border-border/40 rounded overflow-hidden flex-shrink-0">
                                                        {item.poster_path ? (
                                                            <Image
                                                                src={`${IMAGE_SIZES.poster.small}${item.poster_path}`}
                                                                alt={item.name || ''}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground-subtle bg-background-elevated">
                                                                N/A
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-sm font-semibold truncate group-hover:text-accent transition-colors text-foreground">
                                                            {item.name}
                                                        </h4>
                                                        <p className="text-[11px] text-foreground-subtle font-medium">
                                                            {item.first_air_date?.split('-')[0] || ''}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Actors Column */}
                            <div className="space-y-3 pt-4 md:pt-0 md:pl-6">
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground-subtle flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-amber-400" />
                                    <span>{t('peopleColumn')}</span>
                                </h3>
                                {actors.length === 0 ? (
                                    <p className="text-xs text-foreground-subtle">{t('noResultsColumn')}</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {actors.map((item) => (
                                            <li key={item.id}>
                                                <Link
                                                    href={`/person/${item.id}`}
                                                    onClick={onClose}
                                                    className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-background/60 transition-colors group"
                                                >
                                                    <div className="relative h-9 w-9 bg-background border border-border/40 rounded-full overflow-hidden flex-shrink-0">
                                                        {item.profile_path ? (
                                                            <Image
                                                                src={`${IMAGE_SIZES.profile.small}${item.profile_path}`}
                                                                alt={item.name || ''}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-foreground-subtle bg-background-elevated">
                                                                <UserIcon className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-sm font-semibold truncate group-hover:text-accent transition-colors text-foreground">
                                                            {item.name}
                                                        </h4>
                                                        <p className="text-[10px] uppercase font-bold text-foreground-subtle tracking-wider">
                                                            {item.known_for_department || ''}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
