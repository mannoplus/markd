'use server';

import {
    getWatchRegions,
    getGenresList,
    discoverMedia,
    getCategoryMedia,
    searchMultiWithPeople,
    searchKeywords,
    getMediaTrailer,
    getWatchProviders,
    getNowPlaying,
    getUpcomingMovies,
    getUpcomingTVShows,
    getTrending,
} from '@/lib/tmdb';

export async function getWatchRegionsAction() {
    try {
        return await getWatchRegions();
    } catch (error) {
        console.error('Failed to fetch watch regions action:', error);
        throw error;
    }
}

export async function getGenresAction(type: 'movie' | 'tv') {
    try {
        return await getGenresList(type);
    } catch (error) {
        console.error(`Failed to fetch genres list action for ${type}:`, error);
        throw error;
    }
}

export async function discoverMediaAction(type: 'movie' | 'tv', params: Record<string, string>) {
    try {
        return await discoverMedia(type, params);
    } catch (error) {
        console.error(`Failed to discover media action for ${type}:`, error);
        throw error;
    }
}

export async function getCategoryMediaAction(endpoint: string, page: number = 1) {
    try {
        return await getCategoryMedia(endpoint, page);
    } catch (error) {
        console.error(`Failed to fetch category media action for ${endpoint}:`, error);
        throw error;
    }
}

export async function searchMultiWithPeopleAction(query: string, page: number = 1) {
    try {
        return await searchMultiWithPeople(query, page);
    } catch (error) {
        console.error('Failed to perform multi search with people action:', error);
        return { results: [], total_pages: 0, total_results: 0 };
    }
}

export async function searchKeywordsAction(query: string) {
    try {
        return await searchKeywords(query);
    } catch (error) {
        console.error('Failed to search keywords action:', error);
        return [];
    }
}

export async function getMediaTrailerAction(type: 'movie' | 'tv', id: number) {
    try {
        return await getMediaTrailer(type, id);
    } catch (error) {
        console.error('Failed getMediaTrailerAction:', error);
        return null;
    }
}

export async function getNowPlayingAction(region: string) {
    try {
        return await getNowPlaying(region);
    } catch (error) {
        console.error('Failed getNowPlayingAction:', error);
        return [];
    }
}

export async function getWatchProvidersAction(id: number, type: 'movie' | 'tv', region: string = 'US') {
    try {
        return await getWatchProviders(id, type === 'movie' ? 'movie' : 'tv');
    } catch (error) {
        console.error('Failed getWatchProvidersAction:', error);
        return null;
    }
}

export async function getUpcomingMoviesAction(region: string) {
    try {
        return await getUpcomingMovies(region);
    } catch (error) {
        console.error('Failed getUpcomingMoviesAction:', error);
        return [];
    }
}

export async function getUpcomingTVShowsAction(region: string) {
    try {
        return await getUpcomingTVShows(region);
    } catch (error) {
        console.error('Failed getUpcomingTVShowsAction:', error);
        return [];
    }
}

export async function getTrendingAction(type: 'movie' | 'tv', timeWindow: 'day' | 'week' = 'day') {
    try {
        return await getTrending(type, timeWindow);
    } catch (error) {
        console.error(`Failed getTrendingAction for ${type}:`, error);
        return [];
    }
}

export async function fetchStrictlyFreeQuota(type: 'movie' | 'tv', startPage: number = 1, quota: number = 15) {
    let page = startPage;
    const results: any[] = [];
    while (results.length < quota && page <= 50) {
        try {
            const data = await discoverMedia(type, {
                with_watch_monetization_types: 'free|ads',
                watch_region: 'US',
                sort_by: 'popularity.desc',
                page: String(page)
            });
            const candidates = data.results || [];
            const checked = await Promise.all(
                candidates.map(async (item) => {
                    try {
                        const providers = await getWatchProviders(item.id, type);
                        if (providers) {
                            const hasFree = (providers.ads && providers.ads.length > 0) ||
                                            (providers.free && providers.free.length > 0);
                            if (hasFree) return item;
                        }
                    } catch (e) {
                        console.error(`Failed to filter watch provider in loop for ${item.id}:`, e);
                    }
                    return null;
                })
            );
            for (const item of checked) {
                if (item && !results.some(r => r.id === item.id)) {
                    results.push(item);
                }
            }
        } catch (e) {
            console.error(`Error in fetchStrictlyFreeQuota loop:`, e);
        }
        page++;
    }
    return results.slice(0, quota);
}

export async function getStrictlyFreeQuotaAction(type: 'movie' | 'tv', startPage: number = 1) {
    try {
        return await fetchStrictlyFreeQuota(type, startPage, 15);
    } catch (error) {
        console.error('Failed getStrictlyFreeQuotaAction:', error);
        return [];
    }
}

export async function getUpcomingWithTrailersAction(type: 'movie' | 'tv') {
    try {
        const raw = type === 'movie' ? await getUpcomingMovies('TW') : await getUpcomingTVShows('TW');
        const checked = await Promise.all(
            raw.map(async (item) => {
                const trailerKey = await getMediaTrailer(type, item.id);
                if (trailerKey) {
                    return { ...item, trailerKey, media_type: type };
                }
                return null;
            })
        );
        return checked.filter((item): item is any => item !== null);
    } catch (e) {
        console.error(`Failed to fetch upcoming trailers for ${type}:`, e);
        return [];
    }
}


