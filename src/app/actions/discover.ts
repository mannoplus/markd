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
} from '@/lib/tmdb';
import type { TMDBTrendingResult } from '@/types';

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

export async function getCategoryMediaAction(endpoint: string, page: number = 1, region?: string, lang?: string) {
    try {
        return await getCategoryMedia(endpoint, page, region, lang);
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

export async function getNowPlayingAction(region: string, lang?: string) {
    try {
        return await getNowPlaying(region, lang);
    } catch (error) {
        console.error('Failed getNowPlayingAction:', error);
        return [];
    }
}

export async function getWatchProvidersAction(id: number, type: 'movie' | 'tv', region: string = 'US', lang?: string) {
    try {
        return await getWatchProviders(id, type === 'movie' ? 'movie' : 'tv', region);
    } catch (error) {
        console.error('Failed getWatchProvidersAction:', error);
        return null;
    }
}

export async function getUpcomingMoviesAction(region: string, lang?: string) {
    try {
        return await getUpcomingMovies(region, lang);
    } catch (error) {
        console.error('Failed getUpcomingMoviesAction:', error);
        return [];
    }
}

export async function getUpcomingTVShowsAction(region: string, lang?: string) {
    try {
        return await getUpcomingTVShows(region, lang);
    } catch (error) {
        console.error('Failed getUpcomingTVShowsAction:', error);
        return [];
    }
}

export async function getTrendingAction(type: 'movie' | 'tv', timeWindow: 'day' | 'week' = 'day', region: string = 'TW', lang?: string) {
    try {
        const params: Record<string, string> = {
            region,
            watch_region: region,
            sort_by: 'popularity.desc',
        };
        if (lang) {
            params.language = lang;
        }
        const data = await discoverMedia(type, params);
        return data.results || [];
    } catch (error) {
        console.error(`Failed getTrendingAction for ${type}:`, error);
        return [];
    }
}

export async function fetchStrictlyFreeQuota(type: 'movie' | 'tv', startPage: number = 1, quota: number = 15, region: string = 'TW', lang?: string) {
    let page = startPage;
    const results: TMDBTrendingResult[] = [];
    while (results.length < quota && page <= 50) {
        try {
            const params: Record<string, string> = {
                with_watch_monetization_types: 'free|ads',
                watch_region: region,
                sort_by: 'popularity.desc',
                page: String(page)
            };
            if (lang) {
                params.language = lang;
            }
            const data = await discoverMedia(type, params);
            const candidates = data.results || [];
            const checked = await Promise.all(
                candidates.map(async (item) => {
                    try {
                        const providers = await getWatchProviders(item.id, type, region);
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

export async function getStrictlyFreeQuotaAction(type: 'movie' | 'tv', startPage: number = 1, region: string = 'TW', lang?: string) {
    try {
        return await fetchStrictlyFreeQuota(type, startPage, 15, region, lang);
    } catch (error) {
        console.error('Failed getStrictlyFreeQuotaAction:', error);
        return [];
    }
}

export async function getUpcomingWithTrailersAction(type: 'movie' | 'tv', region: string = 'TW', lang?: string) {
    try {
        const raw = type === 'movie' ? await getUpcomingMovies(region, lang) : await getUpcomingTVShows(region, lang);
        const checked = await Promise.all(
            raw.map(async (item) => {
                const trailerKey = await getMediaTrailer(type, item.id);
                if (trailerKey) {
                    return { ...item, trailerKey, media_type: type };
                }
                return null;
            })
        );
        return checked.filter((item): item is TMDBTrendingResult & { trailerKey: string; media_type: 'movie' | 'tv' } => item !== null);
    } catch (e) {
        console.error(`Failed to fetch upcoming trailers for ${type}:`, e);
        return [];
    }
}


