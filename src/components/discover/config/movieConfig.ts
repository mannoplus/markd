export interface DiscoverCategory {
    labelKey: string;
    value: string;
    endpoint: string;
    defaultSort: string;
}

export interface SortField {
    labelKey: string;
    value: string; // e.g. 'popularity', 'vote_average', 'primary_release_date' or 'first_air_date'
}

export interface DiscoverConfig {
    mediaType: 'movie' | 'tv';
    categories: DiscoverCategory[];
    sortFields: SortField[];
    defaultSort: string;
}

export const movieConfig: DiscoverConfig = {
    mediaType: 'movie',
    categories: [
        { labelKey: 'popular', value: 'popular', endpoint: '/movie/popular', defaultSort: 'popularity.desc' },
        { labelKey: 'now_playing', value: 'now_playing', endpoint: '/movie/now_playing', defaultSort: 'primary_release_date.desc' },
        { labelKey: 'upcoming', value: 'upcoming', endpoint: '/movie/upcoming', defaultSort: 'popularity.desc' },
        { labelKey: 'top_rated', value: 'top_rated', endpoint: '/movie/top_rated', defaultSort: 'vote_average.desc' },
    ],
    sortFields: [
        { labelKey: 'sortPopularity', value: 'popularity' },
        { labelKey: 'sortRating', value: 'vote_average' },
        { labelKey: 'sortReleaseDate', value: 'primary_release_date' },
    ],
    defaultSort: 'popularity.desc',
};
