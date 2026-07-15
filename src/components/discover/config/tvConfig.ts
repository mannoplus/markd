import { DiscoverConfig } from './movieConfig';

export const tvConfig: DiscoverConfig = {
    mediaType: 'tv',
    categories: [
        { labelKey: 'popular', value: 'popular', endpoint: '/tv/popular', defaultSort: 'popularity.desc' },
        { labelKey: 'airing_today', value: 'airing_today', endpoint: '/tv/airing_today', defaultSort: 'first_air_date.desc' },
        { labelKey: 'on_tv', value: 'on_tv', endpoint: '/tv/on_the_air', defaultSort: 'popularity.desc' },
        { labelKey: 'top_rated', value: 'top_rated', endpoint: '/tv/top_rated', defaultSort: 'vote_average.desc' },
    ],
    sortFields: [
        { labelKey: 'sortPopularity', value: 'popularity' },
        { labelKey: 'sortRating', value: 'vote_average' },
        { labelKey: 'sortFirstAirDate', value: 'first_air_date' },
    ],
    defaultSort: 'popularity.desc',
};
