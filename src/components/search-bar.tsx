'use client';

import { Search, Clapperboard, Tv, Loader2, ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { searchMediaAction } from '@/app/actions';
import { useDebounce } from '@/hooks/use-debounce';
import Image from 'next/image';
import { IMAGE_SIZES } from '@/lib/tmdb';
import type { TMDBSearchResult } from '@/types';
import { Link } from '@/i18n/routing';

function SearchBarInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Input state
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [isFocused, setIsFocused] = useState(false);

    // Live results state
    const [results, setResults] = useState<TMDBSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLFormElement>(null);

    // 300ms debounce
    const debouncedQuery = useDebounce(query, 300);

    // Fetch recommendations
    useEffect(() => {
        let isMounted = true;

        async function fetchRecommendations() {
            if (debouncedQuery.trim().length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const searchResponse = await searchMediaAction(debouncedQuery.trim());
                if (isMounted) {
                    // Only show first 5 results in dropdown
                    setResults(searchResponse?.results?.slice(0, 5) || []);
                }
            } catch (error) {
                console.error("Live search failed:", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchRecommendations();

        return () => {
            isMounted = false;
        };
    }, [debouncedQuery]);

    // Handle clicks outside the dropdown to close it
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle Escape key
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsFocused(false);
                // Optionally unfocus the input element
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setIsFocused(false);
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    const showDropdown = isFocused && query.trim().length >= 2;

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-3xl mx-auto" ref={wrapperRef}>
            <div className="relative flex items-center z-50">
                <Search className="absolute left-6 h-5 w-5 text-foreground-muted" />
                <input
                    type="text"
                    name="q"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    placeholder="Search movies & TV shows..."
                    autoComplete="off"
                    aria-autocomplete="list"
                    className="w-full rounded-full border-2 border-border bg-background-elevated py-4 pl-14 pr-24 text-lg text-foreground placeholder:text-foreground-muted focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all shadow-sm"
                />

                {/* Loading Spinner within input */}
                {isLoading && (
                    <div className="absolute right-[110px]">
                        <Loader2 className="h-5 w-5 text-accent animate-spin" />
                    </div>
                )}

                <button
                    type="submit"
                    className="absolute right-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background hover:bg-foreground-muted transition-colors"
                >
                    Search
                </button>
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background-elevated border border-border rounded-xl shadow-2xl glass-panel overflow-hidden z-[100] fade-in">
                    {/* Empty State / Loading State */}
                    {results.length === 0 && !isLoading ? (
                        <div className="p-4 text-center text-sm text-foreground-muted">
                            No immediate recommendations found. Press Enter to full search.
                        </div>
                    ) : (
                        <ul role="listbox" className="max-h-[60vh] overflow-y-auto divide-y divide-border">
                            {results.map((item) => {
                                const releaseYear = item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || '';
                                const title = item.title || item.name || '';
                                const isMovie = item.media_type === 'movie';

                                return (
                                    <li key={`${item.media_type}-${item.id}`} role="option" aria-selected="false">
                                        <Link
                                            href={`/${item.media_type}/${item.id}`}
                                            onClick={() => setIsFocused(false)} // Close dropdown on click
                                            className="flex items-center gap-4 p-3 hover:bg-background-card transition-colors focus:bg-background-card focus:outline-none"
                                        >
                                            <div className="relative h-16 w-11 flex-shrink-0 bg-background rounded overflow-hidden">
                                                {item.poster_path ? (
                                                    <Image
                                                        src={`${IMAGE_SIZES.poster.small}${item.poster_path}`}
                                                        alt={title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-foreground-muted text-background">
                                                        {isMovie ? <Clapperboard className="h-4 w-4" /> : <Tv className="h-4 w-4" />}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-semibold truncate text-foreground">{title}</h4>
                                                    {releaseYear && (
                                                        <span className="text-xs text-foreground-muted font-medium px-1.5 py-0.5 rounded-[4px] bg-background-secondary border border-border flex-shrink-0">
                                                            {releaseYear}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted tracking-wide">
                                                    {isMovie ? (
                                                        <>
                                                            <Clapperboard className="h-3.5 w-3.5 text-blue-400" />
                                                            <span className="uppercase">Movie</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Tv className="h-3.5 w-3.5 text-purple-400" />
                                                            <span className="uppercase">TV Show</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                            {/* Option to see all results */}
                            <li className="bg-background-secondary/50 p-2">
                                <button
                                    onClick={handleSearch}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-medium text-accent hover:text-accent-muted p-2 rounded transition-colors group"
                                >
                                    <span>See all results for &quot;{query}&quot;</span>
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </button>
                            </li>
                        </ul>
                    )}
                </div>
            )}
        </form>
    );
}

export function SearchBar() {
    return (
        <Suspense
            fallback={
                <div className="h-16 w-full max-w-3xl mx-auto rounded-full bg-background-elevated animate-pulse border-2 border-border" />
            }
        >
            <SearchBarInner />
        </Suspense>
    );
}
