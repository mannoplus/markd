'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { TMDBTrendingResult } from '@/types';
import { getUserMediaItems } from '@/app/actions';
import {
    getWatchRegionsAction,
    getGenresAction,
    discoverMediaAction,
    getCategoryMediaAction,
} from '@/app/actions/discover';
import { movieConfig } from './config/movieConfig';
import { tvConfig } from './config/tvConfig';
import { CategoryDropdown } from './CategoryDropdown';
import { DiscoverSidebar } from './DiscoverSidebar';
import { SortSection } from './SortSection';
import { WhereToWatchSection } from './WhereToWatchSection';
import { FiltersSection } from './FiltersSection';
import { ResultsGrid } from './ResultsGrid';
import { LoadMoreButton } from './LoadMoreButton';
import { useDebounce } from '@/hooks/use-debounce';
import {
    DiscoverFilterState,
    initialFilterState,
    buildDiscoverQueryParams,
    isSidebarActive,
} from './utils/buildDiscoverQuery';

interface DiscoverPageProps {
    mediaType: 'movie' | 'tv';
}

export function DiscoverPage({ mediaType }: DiscoverPageProps) {
    const t = useTranslations('Discover');
    const config = mediaType === 'movie' ? movieConfig : tvConfig;

    // Supabase Auth State
    const [user, setUser] = useState<User | null>(null);
    const [userWatchedIds, setUserWatchedIds] = useState<Set<number>>(new Set());

    // API options state
    const [regions, setRegions] = useState<{ iso_3166_1: string; english_name: string; native_name: string }[]>([]);
    const [genresList, setGenresList] = useState<{ id: number; name: string }[]>([]);

    // Loading & Error States
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isError, setIsError] = useState(false);

    // Grid results pagination
    const [results, setResults] = useState<TMDBTrendingResult[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters internal state
    const [filters, setFilters] = useState<DiscoverFilterState>(initialFilterState);

    // Reference to check previous category to determine manual sort clobbering
    const prevCategoryRef = useRef<string>('popular');

    // Debounced values for range inputs to prevent request-per-pixel trigger
    const debouncedMinScore = useDebounce(filters.min_score, 400);
    const debouncedMaxScore = useDebounce(filters.max_score, 400);
    const debouncedMinRuntime = useDebounce(filters.min_runtime, 400);
    const debouncedMaxRuntime = useDebounce(filters.max_runtime, 400);
    const debouncedMinVotes = useDebounce(filters.min_votes, 400);

    // Initial load: Fetch dropdown metadata and sync URL search params
    useEffect(() => {
        const supabase = createClient();

        // Check user session
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
            if (data.user) {
                getUserMediaItems().then(({ data: items }) => {
                    if (items) {
                        const ids = new Set(
                            items
                                .filter((item) => item.media_type === mediaType)
                                .map((item) => item.tmdb_id)
                        );
                        setUserWatchedIds(ids);
                    }
                });
            }
        });

        // Load Watch Regions & Genres
        Promise.all([getWatchRegionsAction(), getGenresAction(mediaType)])
            .then(([fetchedRegions, fetchedGenres]) => {
                setRegions(fetchedRegions);
                setGenresList(fetchedGenres);
            })
            .catch((err) => {
                console.error('Failed to fetch filter metadata:', err);
            });

        // Read initial state from URL on mount
        const searchParams = new URLSearchParams(window.location.search);
        const parsedFilters: DiscoverFilterState = { ...initialFilterState };

        if (searchParams.get('category')) parsedFilters.category = searchParams.get('category')!;
        if (searchParams.get('sort')) parsedFilters.sort = searchParams.get('sort')!;
        if (searchParams.get('region')) parsedFilters.region = searchParams.get('region')!;
        if (searchParams.get('release_types')) {
            parsedFilters.release_types = searchParams.get('release_types')!.split('|');
        }
        if (searchParams.get('genres')) {
            parsedFilters.genres = searchParams.get('genres')!.split(',');
        }
        if (searchParams.get('from_date')) parsedFilters.from_date = searchParams.get('from_date')!;
        if (searchParams.get('to_date')) parsedFilters.to_date = searchParams.get('to_date')!;
        if (searchParams.get('min_score')) parsedFilters.min_score = Number(searchParams.get('min_score'));
        if (searchParams.get('max_score')) parsedFilters.max_score = Number(searchParams.get('max_score'));
        if (searchParams.get('min_runtime')) parsedFilters.min_runtime = Number(searchParams.get('min_runtime'));
        if (searchParams.get('max_runtime')) parsedFilters.max_runtime = Number(searchParams.get('max_runtime'));
        if (searchParams.get('min_votes')) parsedFilters.min_votes = Number(searchParams.get('min_votes'));
        if (searchParams.get('availability')) parsedFilters.availability = searchParams.get('availability')!;
        if (searchParams.get('show_me')) parsedFilters.show_me = searchParams.get('show_me')!;

        // Adjust category default sort if sort is omitted
        if (!searchParams.get('sort')) {
            const cat = config.categories.find((c) => c.value === parsedFilters.category) || config.categories[0];
            parsedFilters.sort = cat.defaultSort;
        }

        setFilters(parsedFilters);
        prevCategoryRef.current = parsedFilters.category;
        setIsInitialLoad(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mediaType]);

    // Handle filter serialization & data fetching
    useEffect(() => {
        if (isInitialLoad) return;

        // Reset page to 1 on filter state change
        setPage(1);

        // Serialize current filter state to the URL search params (replaceState)
        const params = new URLSearchParams();
        if (filters.category !== 'popular') params.set('category', filters.category);
        if (filters.sort !== config.defaultSort) params.set('sort', filters.sort);
        if (filters.region) params.set('region', filters.region);
        if (filters.release_types.length > 0) params.set('release_types', filters.release_types.join('|'));
        if (filters.genres.length > 0) params.set('genres', filters.genres.join(','));
        if (filters.from_date) params.set('from_date', filters.from_date);
        if (filters.to_date) params.set('to_date', filters.to_date);
        if (filters.min_score > 0) params.set('min_score', String(filters.min_score));
        if (filters.max_score < 10) params.set('max_score', String(filters.max_score));
        if (filters.min_runtime > 0) params.set('min_runtime', String(filters.min_runtime));
        if (filters.max_runtime < 400) params.set('max_runtime', String(filters.max_runtime));
        if (filters.min_votes > 0) params.set('min_votes', String(filters.min_votes));
        if (filters.availability !== 'any') params.set('availability', filters.availability);
        if (filters.show_me !== 'everything') params.set('show_me', filters.show_me);

        const newSearch = params.toString();
        const nextUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
        window.history.replaceState(null, '', nextUrl);

        fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        filters.category,
        filters.sort,
        filters.region,
        filters.release_types,
        filters.genres,
        filters.from_date,
        filters.to_date,
        filters.availability,
        filters.show_me,
        debouncedMinScore,
        debouncedMaxScore,
        debouncedMinRuntime,
        debouncedMaxRuntime,
        debouncedMinVotes,
    ]);

    // Perform TMDB query
    const fetchPage = async (targetPage: number, resetResults: boolean) => {
        setIsError(false);
        if (resetResults) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const activeCategory = config.categories.find((c) => c.value === filters.category) || config.categories[0];
            const isSidebarActiveState = isSidebarActive(filters, activeCategory.defaultSort);

            let data;
            if (isSidebarActiveState) {
                // If any sidebar filters or sorting are active, query discover
                const queryParams = buildDiscoverQueryParams(filters, mediaType);
                queryParams['page'] = String(targetPage);
                data = await discoverMediaAction(mediaType, queryParams);
            } else {
                // Otherwise fallback to plain category endpoint
                data = await getCategoryMediaAction(activeCategory.endpoint, targetPage);
            }

            if (resetResults) {
                setResults(data.results || []);
            } else {
                setResults((prev) => [...prev, ...(data.results || [])]);
            }
            setTotalPages(data.total_pages || 1);
        } catch (error) {
            console.error('Fetch discovery data failed:', error);
            setIsError(true);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    // Load More action handler
    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPage(nextPage, false);
    };

    const handleCategoryChange = (newCategory: string) => {
        const prevCategory = prevCategoryRef.current;
        const prevCatConfig = config.categories.find((c) => c.value === prevCategory) || config.categories[0];
        const nextCatConfig = config.categories.find((c) => c.value === newCategory) || config.categories[0];

        let targetSort = filters.sort;

        // Reset sort to category natural default UNLESS the user has manually set a non-default sort
        if (filters.sort === prevCatConfig.defaultSort) {
            targetSort = nextCatConfig.defaultSort;
        }

        prevCategoryRef.current = newCategory;
        setFilters((prev) => ({
            ...prev,
            category: newCategory,
            sort: targetSort,
        }));
    };

    const handleFilterUpdate = (updatedFields: Partial<DiscoverFilterState>) => {
        setFilters((prev) => ({ ...prev, ...updatedFields }));
    };

    // Post-filter matching Unseen Only option on the client side
    const displayResults = filters.show_me === 'unseen'
        ? results.filter((item) => !userWatchedIds.has(item.id))
        : results;

    const isFiltered = isSidebarActive(filters, config.defaultSort);

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen">
            {/* Top Navigation Category Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        {mediaType === 'movie' ? t('moviesTitle') : t('tvShowsTitle')}
                    </h1>
                    <p className="text-sm text-foreground-muted">
                        {mediaType === 'movie' ? t('moviesSub') : t('tvShowsSub')}
                    </p>
                </div>
                <CategoryDropdown
                    categories={config.categories}
                    activeValue={filters.category}
                    onChange={handleCategoryChange}
                />
            </div>

            {/* Main Workspace Layout */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Responsive Filter & Sort Sidebar */}
                <DiscoverSidebar>
                    <SortSection
                        sortFields={config.sortFields}
                        activeSort={filters.sort}
                        onChange={(sort) => handleFilterUpdate({ sort })}
                    />
                    <div className="border-t border-border/60 my-4" />
                    <WhereToWatchSection
                        regions={regions}
                        selectedRegion={filters.region}
                        onRegionChange={(region) => handleFilterUpdate({ region })}
                        selectedReleaseTypes={filters.release_types}
                        onReleaseTypesChange={(release_types) => handleFilterUpdate({ release_types })}
                        mediaType={mediaType}
                    />
                    <div className="border-t border-border/60 my-4" />
                    <FiltersSection
                        genresList={genresList}
                        state={filters}
                        onChange={handleFilterUpdate}
                        isUserLoggedIn={!!user}
                        mediaType={mediaType}
                    />
                </DiscoverSidebar>

                {/* Grid Results Content Pane */}
                <div className="flex-1 w-full space-y-6">
                    <ResultsGrid
                        results={displayResults}
                        isLoading={isLoading}
                        isError={isError}
                        onRetry={() => fetchPage(page, false)}
                        isFiltered={isFiltered}
                    />

                    {!isLoading && results.length > 0 && (
                        <LoadMoreButton
                            onClick={handleLoadMore}
                            isLoading={isLoadingMore}
                            disabled={isLoading}
                            isLastPage={page >= totalPages}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
