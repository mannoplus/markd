// ===========================================
// MARKD — TMDB API Service Layer
// ===========================================
// All functions are server-side only (they use TMDB_API_KEY which is NOT
// prefixed with NEXT_PUBLIC_). Call these from Server Components, Route
// Handlers, or Server Actions.

import type {
    TMDBSearchResult,
    TMDBMovieDetails,
    TMDBTVDetails,
    TMDBCastMember,
    TMDBCrewMember,
    TMDBVideo,
    TMDBWatchProviderResult,
    TMDBTrendingResult,
    TMDBPersonDetails,
    MediaType,
} from '@/types';
import { getLocale } from 'next-intl/server';

// ---------- Constants ----------

const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY!;

/** Base URL for TMDB images — append poster_path / backdrop_path to this */
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

/** Common image size presets */
export const IMAGE_SIZES = {
    poster: {
        small: `${TMDB_IMAGE_BASE}/w185`,
        medium: `${TMDB_IMAGE_BASE}/w342`,
        large: `${TMDB_IMAGE_BASE}/w500`,
        original: `${TMDB_IMAGE_BASE}/original`,
    },
    backdrop: {
        small: `${TMDB_IMAGE_BASE}/w780`,
        large: `${TMDB_IMAGE_BASE}/w1280`,
        original: `${TMDB_IMAGE_BASE}/original`,
    },
    profile: {
        small: `${TMDB_IMAGE_BASE}/w185`,
        medium: `${TMDB_IMAGE_BASE}/h632`,
        original: `${TMDB_IMAGE_BASE}/original`,
    },
    logo: {
        small: `${TMDB_IMAGE_BASE}/w92`,
        medium: `${TMDB_IMAGE_BASE}/w154`,
        large: `${TMDB_IMAGE_BASE}/w300`,
    },
} as const;

// ---------- Helpers ----------

/**
 * Generic fetch wrapper with error handling and caching.
 * Next.js automatically caches fetch() in Server Components.
 */
async function tmdbFetch<T>(
    endpoint: string,
    params: Record<string, string> = {},
    revalidate: number = 3600 // cache for 1 hour by default
): Promise<T> {
    const locale = await getLocale();
    const language = locale === 'zh-TW' ? 'zh-TW' : 'en-US';

    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', API_KEY);
    url.searchParams.set('language', language);

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }

    const res = await fetch(url.toString(), {
        next: { revalidate },
    });

    if (!res.ok) {
        throw new Error(
            `TMDB API error: ${res.status} ${res.statusText} — ${endpoint}`
        );
    }

    return res.json() as Promise<T>;
}

// ---------- Public API ----------

/**
 * Search for movies AND TV shows simultaneously.
 * Filters out "person" results to keep media only.
 */
export async function searchMulti(
    query: string,
    page: number = 1
): Promise<{ results: TMDBSearchResult[]; total_pages: number; total_results: number }> {
    const data = await tmdbFetch<{
        results: TMDBSearchResult[];
        total_pages: number;
        total_results: number;
    }>('/search/multi', {
        query,
        page: String(page),
        include_adult: 'false',
    }, 600); // cache search results for 10 min

    // Filter out "person" results — we only want movies & TV
    return {
        ...data,
        results: data.results.filter(
            (item) => item.media_type === 'movie' || item.media_type === 'tv'
        ),
    };
}

/**
 * Get full details for a movie, including credits (cast, crew for director) and videos.
 */
export async function getMovieDetails(id: number): Promise<{
    details: TMDBMovieDetails;
    cast: TMDBCastMember[];
    director: TMDBCrewMember | null;
    trailer: TMDBVideo | null;
}> {
    const data = await tmdbFetch<
        TMDBMovieDetails & {
            credits: { cast: TMDBCastMember[]; crew: TMDBCrewMember[] };
            videos?: { results: TMDBVideo[] };
        }
    >(`/movie/${id}`, { append_to_response: 'credits,videos' });

    const { credits, videos, ...details } = data;

    const director = credits.crew.find((c) => c.job === 'Director') || null;
    const trailer = videos?.results?.find((v) => v.type === 'Trailer' && v.site === 'YouTube') || null;

    return {
        details,
        cast: credits.cast.slice(0, 15), // Top 15 billed cast
        director,
        trailer,
    };
}

/**
 * Get full details for a TV show, including credits (cast), creators, and videos.
 */
export async function getTVDetails(id: number): Promise<{
    details: TMDBTVDetails;
    cast: TMDBCastMember[];
    director: { id: number; name: string; profile_path: string | null } | null;
    trailer: TMDBVideo | null;
}> {
    const data = await tmdbFetch<
        TMDBTVDetails & {
            credits: { cast: TMDBCastMember[]; crew: TMDBCrewMember[] };
            videos?: { results: TMDBVideo[] };
            created_by?: { id: number; name: string; profile_path: string | null }[];
        }
    >(`/tv/${id}`, { append_to_response: 'credits,videos' });

    const { credits, videos, created_by, ...details } = data;

    // For TV, "Director" isn't always primary. "Created By" is better, or Executive Producer.
    const creator = (created_by && created_by.length > 0) ? created_by[0] : null;

    const trailer = videos?.results?.find((v) => v.type === 'Trailer' && v.site === 'YouTube') || null;

    return {
        details,
        cast: credits.cast.slice(0, 15),
        director: creator,
        trailer,
    };
}

/**
 * Get watch/streaming providers for a movie or TV show.
 * Filters to the configured region (NEXT_PUBLIC_WATCH_REGION).
 */
export async function getWatchProviders(
    id: number,
    type: MediaType
): Promise<TMDBWatchProviderResult | null> {
    const region =
        process.env.NEXT_PUBLIC_WATCH_REGION || 'US';

    const data = await tmdbFetch<{
        results: Record<string, TMDBWatchProviderResult>;
    }>(`/${type}/${id}/watch/providers`);

    return data.results[region] ?? null;
}

/**
 * Get trending movies or TV shows (this week).
 */
export async function getTrending(
    type: 'movie' | 'tv' | 'all' = 'all',
    timeWindow: 'day' | 'week' = 'week'
): Promise<TMDBTrendingResult[]> {
    const data = await tmdbFetch<{ results: TMDBTrendingResult[] }>(
        `/trending/${type}/${timeWindow}`,
        {},
        1800 // cache trending for 30 min
    );
    return data.results;
}

/**
 * Get movies currently playing in theaters.
 */
export async function getNowPlaying(
    region: string = 'TW'
): Promise<TMDBTrendingResult[]> {
    const data = await tmdbFetch<{ results: TMDBTrendingResult[] }>(
        `/movie/now_playing`,
        { region },
        3600 // cache for 1 hour
    );

    // Map media_type manually since now_playing doesn't include it but our UI expects it
    return data.results.map(movie => ({
        ...movie,
        media_type: 'movie'
    }));
}

/**
 * Get upcoming movies.
 */
export async function getUpcomingMovies(
    region: string = 'TW'
): Promise<TMDBTrendingResult[]> {
    const data = await tmdbFetch<{ results: TMDBTrendingResult[] }>(
        `/movie/upcoming`,
        { region },
        3600 // cache for 1 hour
    );

    return data.results.map(movie => ({
        ...movie,
        media_type: 'movie'
    }));
}

/**
 * Get upcoming TV shows (airing in the next 7 days).
 */
export async function getUpcomingTVShows(
    region: string = 'TW'
): Promise<TMDBTrendingResult[]> {
    const timezone = region === 'US' ? 'America/New_York' : 'Asia/Taipei';
    const data = await tmdbFetch<{ results: TMDBTrendingResult[] }>(
        `/tv/on_the_air`,
        { timezone },
        3600 // cache for 1 hour
    );

    return data.results.map(tv => ({
        ...tv,
        media_type: 'tv'
    }));
}

/**
 * Convenience: fetch details + watch providers in parallel.
 * Returns everything the Details page needs in one call.
 */
export async function getFullMediaDetails(id: number, type: MediaType) {
    if (type === 'movie') {
        const [movieData, providers] = await Promise.all([
            getMovieDetails(id),
            getWatchProviders(id, 'movie'),
        ]);
        return { ...movieData, providers, mediaType: 'movie' as const };
    }

    const [tvData, providers] = await Promise.all([
        getTVDetails(id),
        getWatchProviders(id, 'tv'),
    ]);
    return { ...tvData, providers, mediaType: 'tv' as const };
}

/**
 * Get details for a person (cast/crew) including their combined filmography.
 */
export async function getPersonDetails(id: number): Promise<TMDBPersonDetails> {
    const data = await tmdbFetch<TMDBPersonDetails>(
        `/person/${id}`,
        { append_to_response: 'combined_credits' }
    );
    return data;
}

/**
 * Discover movies or TV shows by a specific genre ID.
 */
export async function getMediaByGenre(
    genreId: number,
    type: 'movie' | 'tv',
    page: number = 1
): Promise<{ results: TMDBTrendingResult[]; total_pages: number }> {
    const data = await tmdbFetch<{ results: TMDBTrendingResult[]; total_pages: number }>(
        `/discover/${type}`,
        {
            with_genres: String(genreId),
            page: String(page),
            sort_by: 'popularity.desc',
            include_adult: 'false',
        },
        3600
    );

    // Map media_type manually since discover doesn't include it natively for single-type queries
    return {
        ...data,
        results: data.results.map(item => ({
            ...item,
            media_type: type
        }))
    };
}
