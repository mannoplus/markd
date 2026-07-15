'use server';

import {
    getWatchRegions,
    getGenresList,
    discoverMedia,
    getCategoryMedia,
    searchMultiWithPeople,
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
