export interface DiscoverFilterState {
    category: string;
    sort: string;
    region: string;
    release_types: string[]; // ['1', '2', ...]
    genres: string[]; // ['28', '12', ...]
    from_date: string;
    to_date: string;
    min_score: number;
    max_score: number;
    min_runtime: number;
    max_runtime: number;
    min_votes: number;
    availability: string; // 'any' | 'streaming' | 'theaters' | 'tv'
    show_me: string; // 'everything' | 'unseen'
    keywords: string; // keyword query string
    keyword_id: string; // keyword ID from TMDB
}

export const initialFilterState: DiscoverFilterState = {
    category: 'popular',
    sort: 'popularity.desc',
    region: '',
    release_types: [],
    genres: [],
    from_date: '',
    to_date: '',
    min_score: 0,
    max_score: 10,
    min_runtime: 0,
    max_runtime: 400,
    min_votes: 0,
    availability: 'any',
    show_me: 'everything',
    keywords: '',
    keyword_id: '',
};

/**
 * Builds API query parameters for TMDB /discover endpoint based on the filter state.
 */
export function buildDiscoverQueryParams(
    state: DiscoverFilterState,
    mediaType: 'movie' | 'tv'
): Record<string, string> {
    const params: Record<string, string> = {};

    // Sort
    if (state.sort) {
        params['sort_by'] = state.sort;
    }

    // Region
    if (state.region) {
        params['region'] = state.region;
        params['watch_region'] = state.region;
    }

    // Release types (only for movies, TV doesn't have theatrical release types)
    if (mediaType === 'movie' && state.release_types.length > 0) {
        params['with_release_type'] = state.release_types.join('|');
    }

    // Genres
    if (state.genres.length > 0) {
        params['with_genres'] = state.genres.join(',');
    }

    // Keywords
    if (state.keyword_id) {
        params['with_keywords'] = state.keyword_id;
    }

    // Release Date Range
    const datePrefix = mediaType === 'movie' ? 'primary_release_date' : 'first_air_date';
    if (state.from_date) {
        params[`${datePrefix}.gte`] = state.from_date;
    }
    if (state.to_date) {
        params[`${datePrefix}.lte`] = state.to_date;
    }

    // User Score
    if (state.min_score > 0 || state.max_score < 10) {
        params['vote_average.gte'] = String(state.min_score);
        params['vote_average.lte'] = String(state.max_score);
    }

    // Runtime
    if (state.min_runtime > 0 || state.max_runtime < 400) {
        params['with_runtime.gte'] = String(state.min_runtime);
        params['with_runtime.lte'] = String(state.max_runtime);
    }

    // Min votes
    if (state.min_votes > 0) {
        params['vote_count.gte'] = String(state.min_votes);
    }

    // Availability
    if (state.availability === 'streaming') {
        params['with_watch_monetization_types'] = 'flatrate';
        if (!params['watch_region']) {
            params['watch_region'] = 'US'; // default if none selected
        }
    } else if (state.availability === 'theaters' && mediaType === 'movie') {
        params['with_release_type'] = '2|3';
    } else if (state.availability === 'tv' && mediaType === 'tv') {
        // Airing on TV
        params['with_watch_monetization_types'] = 'flatrate|free|ads';
    }

    return params;
}

/**
 * Checks if any filters or manual sorting are active (non-default state).
 * Used to determine if we should fall back to plain category endpoints.
 */
export function isSidebarActive(
    state: DiscoverFilterState,
    defaultSort: string
): boolean {
    // If sort has changed from the category default
    if (state.sort !== defaultSort) return true;

    // Check if any other filters are active
    if (state.region !== '') return true;
    if (state.release_types.length > 0) return true;
    if (state.genres.length > 0) return true;
    if (state.from_date !== '') return true;
    if (state.to_date !== '') return true;
    if (state.min_score > 0 || state.max_score < 10) return true;
    if (state.min_runtime > 0 || state.max_runtime < 400) return true;
    if (state.min_votes > 0) return true;
    if (state.availability !== 'any') return true;
    if (state.show_me !== 'everything') return true;
    if (state.keywords !== '') return true;

    return false;
}
