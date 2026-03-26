/**
 * Trakt API Client for Movie Buzz & Reviews
 * Documentation: https://trakt.docs.apiary.io/
 */

const TRAKT_BASE_URL = 'https://api.trakt.tv';
const TRAKT_API_VERSION = '2';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'trakt-api-version': TRAKT_API_VERSION,
    'trakt-api-key': process.env.TRAKT_CLIENT_ID || '',
});

/**
 * Fetch Trending Movies (Buzz/Interest)
 * GET /movies/trending
 */
export async function getTraktTrending() {
    try {
        const response = await fetch(`${TRAKT_BASE_URL}/movies/trending?extended=full`, {
            headers: getHeaders(),
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        if (!response.ok) throw new Error(`Trakt API error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching Trakt trending:', error);
        return [];
    }
}

/**
 * Fetch Popular Movies
 * GET /movies/popular
 */
export async function getTraktPopular() {
    try {
        const response = await fetch(`${TRAKT_BASE_URL}/movies/popular?extended=full`, {
            headers: getHeaders(),
            next: { revalidate: 3600 }
        });
        if (!response.ok) throw new Error(`Trakt API error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching Trakt popular:', error);
        return [];
    }
}

/**
 * Fetch Anticipated Movies (Upcoming)
 * GET /movies/anticipated
 */
export async function getTraktAnticipated() {
    try {
        const response = await fetch(`${TRAKT_BASE_URL}/movies/anticipated?extended=full`, {
            headers: getHeaders(),
            next: { revalidate: 86400 } // Cache for 24 hours
        });
        if (!response.ok) throw new Error(`Trakt API error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching Trakt anticipated:', error);
        return [];
    }
}

/**
 * Fetch Movie Comments/Reviews
 * GET /movies/{id}/comments
 */
export async function getTraktComments(movieId: string | number) {
    try {
        const response = await fetch(`${TRAKT_BASE_URL}/movies/${movieId}/comments/newest?extended=full`, {
            headers: getHeaders(),
            next: { revalidate: 1800 } // Cache for 30 mins
        });
        if (!response.ok) throw new Error(`Trakt API error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching Trakt comments for ${movieId}:`, error);
        return [];
    }
}

/**
 * Fetch Recent Comments/Reviews (Global)
 * GET /comments/recent/movies
 */
export async function getTraktRecentComments(limit: number = 10) {
    try {
        const response = await fetch(`${TRAKT_BASE_URL}/comments/recent/movies?extended=full&limit=${limit}`, {
            headers: getHeaders(),
            next: { revalidate: 600 } // Cache for 10 mins
        });
        if (!response.ok) throw new Error(`Trakt API error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching Trakt recent comments:', error);
        return [];
    }
}

/**
 * Helper to get TMDB ID from Trakt object
 */
export function getTmdbId(movie: any): number | null {
    if (!movie) return null;
    return movie.ids?.tmdb || movie.movie?.ids?.tmdb || null;
}
