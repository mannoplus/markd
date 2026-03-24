// ===========================================
// MARKD — Shared Type Definitions
// ===========================================

/** Watch status options for a media item */
export type WatchStatus = 'plan_to_watch' | 'watching' | 'completed' | 'dropped';

/** Media type discriminator */
export type MediaType = 'movie' | 'tv';

// ---------- Database (Supabase) ----------

/** Row shape for the `media_items` table */
export interface MediaItem {
    id: string;
    created_at: string;
    user_id: string;
    tmdb_id: number;
    media_type: MediaType;
    title: string;
    poster_path: string | null;
    status: WatchStatus;
    rating: number | null;
    season_progress: number | null;
    episode_progress: number | null;
}

/** Payload when inserting/updating a media item (omit server-generated fields) */
export type MediaItemInsert = Omit<MediaItem, 'id' | 'created_at'>;
export type MediaItemUpdate = Partial<Omit<MediaItem, 'id' | 'created_at' | 'user_id'>>;

// ---------- TMDB API ----------

export interface TMDBSearchResult {
    id: number;
    media_type: 'movie' | 'tv' | 'person';
    title?: string;        // movies
    name?: string;         // tv shows
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    vote_average: number;
    release_date?: string; // movies
    first_air_date?: string; // tv shows
    genre_ids: number[];
}

export interface TMDBMovieDetails {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    runtime: number;
    vote_average: number;
    vote_count: number;
    genres: { id: number; name: string }[];
    tagline: string;
    status: string;
    revenue: number;
    budget: number;
}

export interface TMDBTVDetails {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    episode_run_time: number[];
    vote_average: number;
    vote_count: number;
    genres: { id: number; name: string }[];
    tagline: string;
    status: string;
    number_of_seasons: number;
    number_of_episodes: number;
    seasons: TMDBSeason[];
}

export interface TMDBSeason {
    id: number;
    season_number: number;
    name: string;
    episode_count: number;
    poster_path: string | null;
    air_date: string | null;
}

export interface TMDBCastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
}

export interface TMDBCrewMember {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
}

export interface TMDBVideo {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
}

export interface TMDBWatchProvider {
    logo_path: string;
    provider_id: number;
    provider_name: string;
    display_priority: number;
}

export interface TMDBWatchProviderResult {
    link: string;
    flatrate?: TMDBWatchProvider[];   // subscription streaming
    rent?: TMDBWatchProvider[];
    buy?: TMDBWatchProvider[];
    ads?: TMDBWatchProvider[];        // free with ads
}

export interface TMDBTrendingResult {
    id: number;
    media_type: 'movie' | 'tv';
    title?: string;
    name?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
    popularity: number;
}

export interface TMDBPersonDetails {
    id: number;
    name: string;
    biography: string;
    birthday: string | null;
    deathday: string | null;
    place_of_birth: string | null;
    profile_path: string | null;
    known_for_department: string;
    combined_credits: {
        cast: TMDBPersonCredit[];
    };
}

export interface TMDBPersonCredit {
    id: number;
    media_type: 'movie' | 'tv';
    title?: string; // for movies
    name?: string;  // for tv
    character: string;
    poster_path: string | null;
    release_date?: string; // for movies
    first_air_date?: string; // for tv
    vote_average: number;
    order?: number;
}

// ---------- Box Office ----------

export interface BoxOfficeMovie {
    id: number;
    rank: number;
    title: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    tagline: string;
    release_date: string;
    runtime: number;
    vote_average: number;
    vote_count: number;
    revenue: number;
    budget: number;
    popularity: number;
    genres: { id: number; name: string }[];
    director: string | null;
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    omdbRtScore?: string;
}

export interface BoxOfficeModalData extends BoxOfficeMovie {
    production_companies: { id: number; name: string }[];
    release_date_localized: Record<string, string>; // country_code -> date
    rating_mpaa: string | null;
    crew: { id: number; name: string; job: string; profile_path: string | null }[];
    images: {
        posters: { file_path: string }[];
        backdrops: { file_path: string }[];
    };
    videos: { key: string; name: string; type: string; site: string }[];
    omdb?: {
        imdbRating?: string;
        rottenTomatoes?: string;
        metacritic?: string;
    };
}
