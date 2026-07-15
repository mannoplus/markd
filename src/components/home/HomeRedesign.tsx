'use client';

import { useState, useEffect } from 'react';
import { Play, RotateCw, Eye, HelpCircle, Film, MapPin, X, Loader2, ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { MovieCard } from '@/components/movie-card';
import type { TMDBTrendingResult, TMDBWatchProvider, TMDBWatchProviderResult } from '@/types';
import {
    getMediaTrailerAction,
    getNowPlayingAction,
    getWatchProvidersAction,
    getUpcomingMoviesAction,
    getUpcomingTVShowsAction,
} from '@/app/actions/discover';

// Comprehensive Country list in requested order:
// Taiwan, United States, China, Japan, UK, France, Germany, South Korea, Australia, Brazil, Mexico, Spain, Italy, Russia, Indonesia, India
// followed by Canada, New Zealand, Singapore, Hong Kong, Malaysia, Thailand, Vietnam, Philippines, Netherlands, Sweden, Switzerland, Argentina, South Africa
const CINEMA_COUNTRIES = [
    { name: 'Taiwan', code: 'TW' },
    { name: 'United States', code: 'US' },
    { name: 'China', code: 'CN' },
    { name: 'Japan', code: 'JP' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'France', code: 'FR' },
    { name: 'Germany', code: 'DE' },
    { name: 'South Korea', code: 'KR' },
    { name: 'Australia', code: 'AU' },
    { name: 'Brazil', code: 'BR' },
    { name: 'Mexico', code: 'MX' },
    { name: 'Spain', code: 'ES' },
    { name: 'Italy', code: 'IT' },
    { name: 'Russia', code: 'RU' },
    { name: 'Indonesia', code: 'ID' },
    { name: 'India', code: 'IN' },
    { name: 'Canada', code: 'CA' },
    { name: 'New Zealand', code: 'NZ' },
    { name: 'Singapore', code: 'SG' },
    { name: 'Hong Kong', code: 'HK' },
    { name: 'Malaysia', code: 'MY' },
    { name: 'Thailand', code: 'TH' },
    { name: 'Vietnam', code: 'VN' },
    { name: 'Philippines', code: 'PH' },
    { name: 'Netherlands', code: 'NL' },
    { name: 'Sweden', code: 'SE' },
    { name: 'Switzerland', code: 'CH' },
    { name: 'Argentina', code: 'AR' },
    { name: 'South Africa', code: 'ZA' },
];

interface HomeRedesignProps {
    initialNowPlaying: TMDBTrendingResult[];
    initialPopularTrailers: TMDBTrendingResult[];
    initialStreamingTrailers: TMDBTrendingResult[];
    initialRentTrailers: TMDBTrendingResult[];
    initialTheaterTrailers: TMDBTrendingResult[];
    initialUpcomingMovies: TMDBTrendingResult[];
    initialUpcomingShows: TMDBTrendingResult[];
    initialFreeMovies: TMDBTrendingResult[];
    initialFreeShows: TMDBTrendingResult[];
}

export function HomeRedesign({
    initialNowPlaying,
    initialPopularTrailers,
    initialStreamingTrailers,
    initialRentTrailers,
    initialTheaterTrailers,
    initialUpcomingMovies,
    initialUpcomingShows,
    initialFreeMovies,
    initialFreeShows,
}: HomeRedesignProps) {
    // ----------------------------------------------------
    // Client State
    // ----------------------------------------------------
    const [trailerTab, setTrailerTab] = useState<'upcoming' | 'popular' | 'streaming' | 'rent' | 'theaters'>('upcoming');
    const [cinemaCountry, setCinemaCountry] = useState<string>('TW');
    const [freeTab, setFreeTab] = useState<'movies' | 'tv'>('movies');

    // Section 1: Trailer Modal State
    const [activeTrailer, setActiveTrailer] = useState<{ id: number; type: 'movie' | 'tv'; title: string } | null>(null);
    const [youtubeKey, setYoutubeKey] = useState<string | null>(null);
    const [isLoadingTrailer, setIsLoadingTrailer] = useState<boolean>(false);

    // Section 2: Cinema State
    const [nowPlayingMovies, setNowPlayingMovies] = useState<TMDBTrendingResult[]>(initialNowPlaying);
    const [isLoadingCinemas, setIsLoadingCinemas] = useState<boolean>(false);

    // Section 3 & 4: Upcoming Feeds State
    const [upcomingMovies, setUpcomingMovies] = useState<TMDBTrendingResult[]>(initialUpcomingMovies);
    const [upcomingMoviesTime, setUpcomingMoviesTime] = useState<number>(0);
    const [isUpdatingMovies, setIsUpdatingMovies] = useState<boolean>(false);

    const [upcomingShows, setUpcomingShows] = useState<TMDBTrendingResult[]>(initialUpcomingShows);
    const [upcomingShowsTime, setUpcomingShowsTime] = useState<number>(0);
    const [isUpdatingShows, setIsUpdatingShows] = useState<boolean>(false);

    // Section 5: Free Providers State
    const [activeFreeItem, setActiveFreeItem] = useState<TMDBTrendingResult | null>(null);
    const [freeProviders, setFreeProviders] = useState<TMDBWatchProviderResult | null>(null);
    const [isLoadingProviders, setIsLoadingProviders] = useState<boolean>(false);

    // ----------------------------------------------------
    // Helper to calculate client-side synthetic RT score
    // ----------------------------------------------------
    const enrichClientRTScores = (items: TMDBTrendingResult[]) => {
        return items.map((item) => {
            const cleanTitle = (item.title || item.name || '').replace(/^["']+|["']+$/g, '');
            const syntheticScore = Math.round(item.vote_average * 10) || 75;
            return {
                ...item,
                title: cleanTitle,
                rtScore: `${syntheticScore}%`,
                rtStatus: (syntheticScore >= 60 ? 'fresh' : 'rotten') as 'fresh' | 'rotten',
            };
        });
    };

    // ----------------------------------------------------
    // Section 1: Trailer Action Trigger
    // ----------------------------------------------------
    const handleTrailerClick = async (item: TMDBTrendingResult) => {
        const type = item.media_type || 'movie';
        setActiveTrailer({
            id: item.id,
            type: type === 'tv' ? 'tv' : 'movie',
            title: item.title || item.name || 'Trailer',
        });
        setIsLoadingTrailer(true);
        setYoutubeKey(null);
        try {
            const key = await getMediaTrailerAction(type === 'tv' ? 'tv' : 'movie', item.id);
            setYoutubeKey(key);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingTrailer(false);
        }
    };

    // ----------------------------------------------------
    // Section 2: Cinema Country Click handler
    // ----------------------------------------------------
    const handleCountryClick = async (code: string) => {
        setCinemaCountry(code);
        setIsLoadingCinemas(true);
        try {
            const data = await getNowPlayingAction(code);
            setNowPlayingMovies(enrichClientRTScores(data.slice(0, 8)));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingCinemas(false);
        }
    };

    // ----------------------------------------------------
    // Section 2: Background auto-refresh for In Cinemas every 6 hours
    // ----------------------------------------------------
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const data = await getNowPlayingAction(cinemaCountry);
                setNowPlayingMovies(enrichClientRTScores(data.slice(0, 8)));
            } catch (e) {
                console.error('Failed to background auto-update cinemas:', e);
            }
        }, 21600000); // 6 hours

        return () => clearInterval(interval);
    }, [cinemaCountry]);

    // ----------------------------------------------------
    // Section 3 & 4: Caching & Auto/Manual Update timers
    // ----------------------------------------------------
    useEffect(() => {
        // Load stored Upcoming Movies cache if less than 12 hours old
        const cachedMovies = localStorage.getItem('upcoming_movies_data');
        const cachedMoviesTime = localStorage.getItem('upcoming_movies_time');
        if (cachedMovies && cachedMoviesTime) {
            const age = Date.now() - Number(cachedMoviesTime);
            if (age < 12 * 60 * 60 * 1000) {
                setUpcomingMovies(JSON.parse(cachedMovies));
                setUpcomingMoviesTime(Number(cachedMoviesTime));
            } else {
                localStorage.setItem('upcoming_movies_data', JSON.stringify(initialUpcomingMovies));
                const now = Date.now();
                localStorage.setItem('upcoming_movies_time', String(now));
                setUpcomingMoviesTime(now);
            }
        } else {
            localStorage.setItem('upcoming_movies_data', JSON.stringify(initialUpcomingMovies));
            const now = Date.now();
            localStorage.setItem('upcoming_movies_time', String(now));
            setUpcomingMoviesTime(now);
        }

        // Load stored Upcoming TV Shows cache if less than 12 hours old
        const cachedShows = localStorage.getItem('upcoming_shows_data');
        const cachedShowsTime = localStorage.getItem('upcoming_shows_time');
        if (cachedShows && cachedShowsTime) {
            const age = Date.now() - Number(cachedShowsTime);
            if (age < 12 * 60 * 60 * 1000) {
                setUpcomingShows(JSON.parse(cachedShows));
                setUpcomingShowsTime(Number(cachedShowsTime));
            } else {
                localStorage.setItem('upcoming_shows_data', JSON.stringify(initialUpcomingShows));
                const now = Date.now();
                localStorage.setItem('upcoming_shows_time', String(now));
                setUpcomingShowsTime(now);
            }
        } else {
            localStorage.setItem('upcoming_shows_data', JSON.stringify(initialUpcomingShows));
            const now = Date.now();
            localStorage.setItem('upcoming_shows_time', String(now));
            setUpcomingShowsTime(now);
        }
    }, [initialUpcomingMovies, initialUpcomingShows]);

    // Interval checks for auto-updates every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const moviesTime = localStorage.getItem('upcoming_movies_time');
            if (moviesTime && Date.now() - Number(moviesTime) >= 12 * 60 * 60 * 1000) {
                triggerMoviesUpdate();
            }
            const showsTime = localStorage.getItem('upcoming_shows_time');
            if (showsTime && Date.now() - Number(showsTime) >= 12 * 60 * 60 * 1000) {
                triggerShowsUpdate();
            }
        }, 60000);

        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const triggerMoviesUpdate = async () => {
        setIsUpdatingMovies(true);
        try {
            const data = await getUpcomingMoviesAction('TW');
            const enriched = enrichClientRTScores(data.slice(0, 10));
            setUpcomingMovies(enriched);
            const now = Date.now();
            localStorage.setItem('upcoming_movies_data', JSON.stringify(enriched));
            localStorage.setItem('upcoming_movies_time', String(now));
            setUpcomingMoviesTime(now);
        } catch (e) {
            console.error(e);
        } finally {
            setIsUpdatingMovies(false);
        }
    };

    const triggerShowsUpdate = async () => {
        setIsUpdatingShows(true);
        try {
            const data = await getUpcomingTVShowsAction('TW');
            const enriched = enrichClientRTScores(data.slice(0, 10));
            setUpcomingShows(enriched);
            const now = Date.now();
            localStorage.setItem('upcoming_shows_data', JSON.stringify(enriched));
            localStorage.setItem('upcoming_shows_time', String(now));
            setUpcomingShowsTime(now);
        } catch (e) {
            console.error(e);
        } finally {
            setIsUpdatingShows(false);
        }
    };

    // ----------------------------------------------------
    // Section 5: Free watch providers toggle handler
    // ----------------------------------------------------
    const handleFreeItemClick = async (item: TMDBTrendingResult) => {
        setActiveFreeItem(item);
        setIsLoadingProviders(true);
        setFreeProviders(null);
        try {
            const providers = await getWatchProvidersAction(item.id, freeTab === 'movies' ? 'movie' : 'tv');
            setFreeProviders(providers);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingProviders(false);
        }
    };

    // Dynamic mixed list for the "Upcoming" trailers tab
    const upcomingTrailers: TMDBTrendingResult[] = [];
    for (let i = 0; i < 5; i++) {
        if (initialUpcomingMovies[i]) {
            upcomingTrailers.push({ ...initialUpcomingMovies[i], media_type: 'movie' });
        }
        if (initialUpcomingShows[i]) {
            upcomingTrailers.push({ ...initialUpcomingShows[i], media_type: 'tv' });
        }
    }

    const currentTrailers =
        trailerTab === 'upcoming' ? upcomingTrailers :
        trailerTab === 'popular' ? initialPopularTrailers :
        trailerTab === 'streaming' ? initialStreamingTrailers :
        trailerTab === 'rent' ? initialRentTrailers :
        initialTheaterTrailers;

    const currentFreeItems =
        freeTab === 'movies' ? initialFreeMovies :
        initialFreeShows;

    return (
        <div className="space-y-20 pb-24 relative">
            
            {/* ====================================================
                SECTION 1: LATEST TRAILERS
               ==================================================== */}
            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight">Latest Trailers</h2>
                        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent font-sans">Hot</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {(['upcoming', 'popular', 'streaming', 'rent', 'theaters'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setTrailerTab(tab)}
                                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                                    trailerTab === tab
                                        ? 'bg-accent text-background shadow-lg shadow-accent/20'
                                        : 'bg-background-elevated text-foreground-muted hover:bg-background-elevated-hover hover:text-foreground'
                                }`}
                            >
                                {tab === 'upcoming' && 'Upcoming'}
                                {tab === 'popular' && 'Popular'}
                                {tab === 'streaming' && 'Streaming on TV'}
                                {tab === 'rent' && 'For Rent'}
                                {tab === 'theaters' && 'In Theaters'}
                            </button>
                        ))}
                    </div>

                    <Link
                        href="/movies?category=popular"
                        className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                    >
                        See More →
                    </Link>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                    {currentTrailers.slice(0, 10).map((item: TMDBTrendingResult) => (
                        <div
                            key={item.id}
                            onClick={() => handleTrailerClick(item)}
                            className="w-[280px] sm:w-[320px] shrink-0 snap-start group relative rounded-2xl overflow-hidden bg-background-elevated/40 border border-border/40 hover:border-accent/40 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl"
                        >
                            <div className="aspect-video w-full bg-background-elevated relative overflow-hidden">
                                {item.backdrop_path ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={`https://image.tmdb.org/t/p/w780${item.backdrop_path}`}
                                        alt={item.title || item.name || ''}
                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-foreground-subtle">
                                        <Film className="h-8 w-8" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                                    <div className="rounded-full bg-accent p-3.5 text-background shadow-xl scale-95 group-hover:scale-110 transition-transform duration-300">
                                        <Play className="h-5 w-5 fill-current" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 space-y-1 bg-[#12121a]">
                                <h3 className="font-bold text-sm truncate group-hover:text-accent transition-colors">
                                    {item.title || item.name}
                                </h3>
                                <p className="text-[11px] text-foreground-muted font-sans">
                                    {item.release_date || item.first_air_date || 'Coming Soon'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ====================================================
                SECTION 2: IN CINEMAS (UI OVERHAUL)
               ==================================================== */}
            <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight">In Cinemas</h2>
                        <span className="flex items-center gap-1 text-xs text-foreground-muted">
                            <MapPin className="h-3 w-3 text-accent" />
                            Showing in Theaters
                        </span>
                    </div>
                    <Link
                        href={`/movies?category=now_playing&region=${cinemaCountry}`}
                        className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                    >
                        See More →
                    </Link>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Compact Modern Dropdown & Update Control bar */}
                    <div className="flex flex-wrap items-center gap-3 bg-[#12121a] border border-border/40 rounded-2xl p-4 self-start">
                        <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Region:</span>
                        <div className="relative">
                            <select
                                value={cinemaCountry}
                                onChange={(e) => handleCountryClick(e.target.value)}
                                className="appearance-none bg-background-elevated border border-border/40 rounded-xl pl-4 pr-10 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-accent cursor-pointer min-w-[180px] transition-all"
                            >
                                {CINEMA_COUNTRIES.map((c) => (
                                    <option key={c.code} value={c.code} className="bg-[#1c1c28]">
                                        {c.name} ({c.code})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-muted pointer-events-none" />
                        </div>

                        <button
                            onClick={() => handleCountryClick(cinemaCountry)}
                            disabled={isLoadingCinemas}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-background-elevated transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isLoadingCinemas ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <RotateCw className="h-3 w-3" />
                            )}
                            Update
                        </button>
                    </div>

                    {/* Movie Grid (Capacity expanded to display up to 8 movies) */}
                    <div className="relative min-h-[300px]">
                        {isLoadingCinemas ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-2xl z-10">
                                <Loader2 className="h-8 w-8 text-accent animate-spin" />
                            </div>
                        ) : null}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                            {nowPlayingMovies.map((movie: TMDBTrendingResult) => (
                                <div key={movie.id} className="fade-in">
                                    <MovieCard
                                        id={movie.id}
                                        title={movie.title || movie.name || ''}
                                        posterPath={movie.poster_path}
                                        voteAverage={movie.vote_average}
                                        releaseDate={movie.release_date || movie.first_air_date}
                                        mediaType="movie"
                                        rtScore={movie.rtScore}
                                        rtStatus={movie.rtStatus}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ====================================================
                SECTION 3: UPCOMING MOVIES
               ==================================================== */}
            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Upcoming Movies</h2>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                            <span>
                                Last updated:{' '}
                                {upcomingMoviesTime > 0
                                    ? new Date(upcomingMoviesTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : 'Updating...'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={triggerMoviesUpdate}
                            disabled={isUpdatingMovies}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-background-elevated transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isUpdatingMovies ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <RotateCw className="h-3 w-3" />
                            )}
                            Update
                        </button>

                        <Link
                            href="/movies?category=upcoming"
                            className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                        >
                            See More →
                        </Link>
                    </div>
                </div>

                <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                    {upcomingMovies.map((movie: TMDBTrendingResult) => (
                        <div key={movie.id} className="w-[160px] sm:w-[200px] shrink-0 snap-start">
                            <MovieCard
                                        id={movie.id}
                                        title={movie.title || movie.name || ''}
                                        posterPath={movie.poster_path}
                                        voteAverage={movie.vote_average}
                                        releaseDate={movie.release_date || movie.first_air_date}
                                        mediaType="movie"
                                        rtScore={movie.rtScore}
                                        rtStatus={movie.rtStatus}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* ====================================================
                SECTION 4: UPCOMING TV SHOWS
               ==================================================== */}
            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Upcoming TV Shows</h2>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                            <span>
                                Last updated:{' '}
                                {upcomingShowsTime > 0
                                    ? new Date(upcomingShowsTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : 'Updating...'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={triggerShowsUpdate}
                            disabled={isUpdatingShows}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-background-elevated transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isUpdatingShows ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <RotateCw className="h-3 w-3" />
                            )}
                            Update
                        </button>

                        <Link
                            href="/tv-shows?category=upcoming"
                            className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                        >
                            See More →
                        </Link>
                    </div>
                </div>

                <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                    {upcomingShows.map((show: TMDBTrendingResult) => (
                        <div key={show.id} className="w-[160px] sm:w-[200px] shrink-0 snap-start">
                            <MovieCard
                                id={show.id}
                                title={show.title || show.name || ''}
                                posterPath={show.poster_path}
                                voteAverage={show.vote_average}
                                releaseDate={show.release_date || show.first_air_date}
                                mediaType="tv"
                                rtScore={show.rtScore}
                                rtStatus={show.rtStatus}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* ====================================================
                SECTION 5: FREE TO WATCH (100% FREE ONLY)
               ==================================================== */}
            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight">Free to Watch</h2>
                        <div className="flex rounded-full bg-background-elevated p-1">
                            <button
                                onClick={() => setFreeTab('movies')}
                                className={`rounded-full px-4 py-1 text-xs font-bold transition-all ${
                                    freeTab === 'movies'
                                        ? 'bg-accent text-background shadow-md'
                                        : 'text-foreground-muted hover:text-foreground'
                                }`}
                            >
                                Movies
                            </button>
                            <button
                                onClick={() => setFreeTab('tv')}
                                className={`rounded-full px-4 py-1 text-xs font-bold transition-all ${
                                    freeTab === 'tv'
                                        ? 'bg-accent text-background shadow-md'
                                        : 'text-foreground-muted hover:text-foreground'
                                }`}
                            >
                                TV Shows
                            </button>
                        </div>
                    </div>

                    <Link
                        href={(freeTab === 'movies' ? `/movies?availability=free` : `/tv-shows?availability=free`) as string}
                        className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                    >
                        See More →
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {currentFreeItems.slice(0, 10).map((item: TMDBTrendingResult) => (
                        <div
                            key={item.id}
                            onClick={() => handleFreeItemClick(item)}
                            className="bg-[#12121a] border border-border/40 hover:border-accent/40 rounded-2xl p-4 space-y-3 cursor-pointer group transition-all hover:scale-[1.02] shadow-lg flex flex-col justify-between"
                        >
                            <div className="space-y-2">
                                <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-background-elevated relative">
                                    {item.poster_path ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                                            alt={item.title || item.name || ''}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-foreground-subtle">
                                            <HelpCircle className="h-8 w-8" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 rounded-md bg-emerald-500/95 px-2 py-0.5 text-[9px] font-bold text-background uppercase tracking-wider font-sans">
                                        Free
                                    </div>
                                </div>
                                <h3 className="font-bold text-xs truncate group-hover:text-accent transition-colors">
                                    {item.title || item.name}
                                </h3>
                            </div>

                            <div className="bg-background-elevated rounded-xl p-2.5 text-[10px] text-foreground-muted text-center flex items-center justify-center gap-1.5 hover:bg-background-elevated-hover transition-colors">
                                <Eye className="h-3 w-3 text-accent" />
                                <span>Free Streaming Info</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ====================================================
                SECTION 1 MODAL: TRAILER VIDEO LIGHTBOX
               ==================================================== */}
            {activeTrailer ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setActiveTrailer(null)}
                    />
                    
                    {/* Content Panel */}
                    <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-[#12121a] border border-border shadow-2xl z-10 flex items-center justify-center">
                        <button
                            onClick={() => setActiveTrailer(null)}
                            className="absolute top-4 right-4 z-20 rounded-full bg-black/60 p-2 text-foreground hover:bg-black/80 hover:text-accent transition-all"
                            aria-label="Close Trailer"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {isLoadingTrailer ? (
                            <div className="flex flex-col items-center gap-3 text-foreground-muted">
                                <Loader2 className="h-8 w-8 text-accent animate-spin" />
                                <span className="text-xs font-semibold font-sans">Loading Trailer...</span>
                            </div>
                        ) : youtubeKey ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0`}
                                title={activeTrailer.title}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <div className="text-center p-6 space-y-2">
                                <Film className="h-12 w-12 text-foreground-subtle mx-auto mb-2" />
                                <h3 className="font-bold text-sm text-foreground">No Trailer Found</h3>
                                <p className="text-xs text-foreground-muted max-w-xs">
                                    We couldn&apos;t find an official YouTube trailer for &ldquo;{activeTrailer.title}&rdquo;.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {/* ====================================================
                SECTION 5 MODAL: FREE STREAMING WATCH PROVIDERS
               ==================================================== */}
            {activeFreeItem ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setActiveFreeItem(null)}
                    />

                    {/* Modal Card */}
                    <div className="relative w-full max-w-md rounded-2xl bg-[#1c1c28] border border-border p-6 shadow-2xl z-10 space-y-6">
                        <button
                            onClick={() => setActiveFreeItem(null)}
                            className="absolute top-4 right-4 rounded-full bg-background-elevated p-2 text-foreground-muted hover:text-foreground transition-all"
                            aria-label="Close Watch Details"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="flex gap-4">
                            <div className="w-[80px] shrink-0 aspect-[2/3] bg-background-elevated rounded-lg overflow-hidden relative border border-border/40">
                                {activeFreeItem.poster_path ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={`https://image.tmdb.org/t/p/w185${activeFreeItem.poster_path}`}
                                        alt={activeFreeItem.title || activeFreeItem.name || ''}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-foreground-subtle">
                                        <HelpCircle className="h-6 w-6" />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1 text-left min-w-0">
                                <h3 className="font-bold text-base text-foreground truncate pr-6">
                                    {activeFreeItem.title || activeFreeItem.name}
                                </h3>
                                <p className="text-xs text-foreground-muted font-sans">
                                    {activeFreeItem.release_date || activeFreeItem.first_air_date || 'Upcoming'}
                                </p>
                                <div className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-wider font-sans">
                                    Free Stream Options
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border/40 pt-4 space-y-4">
                            <h4 className="text-xs font-bold text-foreground-muted uppercase tracking-wider">
                                Streaming Free In US
                            </h4>

                            {isLoadingProviders ? (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="h-6 w-6 text-accent animate-spin" />
                                </div>
                            ) : freeProviders && (freeProviders.ads || freeProviders.free) ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        {[...(freeProviders.ads || []), ...(freeProviders.free || [])].map((prov: TMDBWatchProvider) => (
                                            <div
                                                key={prov.provider_id}
                                                className="flex items-center gap-2.5 rounded-xl bg-background-elevated p-2 border border-border/20"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={`https://image.tmdb.org/t/p/original${prov.logo_path}`}
                                                    alt={prov.provider_name}
                                                    className="h-6 w-6 rounded-md object-contain"
                                                />
                                                <span className="text-[10px] font-semibold text-foreground truncate">
                                                    {prov.provider_name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-foreground-muted leading-relaxed font-sans">
                                        This title is available free with ads or through public broadcasting providers. Click the button below to view official playback links.
                                    </p>
                                </div>
                            ) : freeProviders && freeProviders.flatrate ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        {freeProviders.flatrate.map((prov: TMDBWatchProvider) => (
                                            <div
                                                key={prov.provider_id}
                                                className="flex items-center gap-2.5 rounded-xl bg-background-elevated p-2 border border-border/20"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={`https://image.tmdb.org/t/p/original${prov.logo_path}`}
                                                    alt={prov.provider_name}
                                                    className="h-6 w-6 rounded-md object-contain"
                                                />
                                                <span className="text-[10px] font-semibold text-foreground truncate">
                                                    {prov.provider_name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="rounded-lg bg-yellow-500/10 p-2.5 border border-yellow-500/20 text-[10px] text-yellow-400 font-sans">
                                        No 100% free streams found. Displaying standard subscription flatrate providers as a backup.
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg bg-background-elevated p-4 text-center text-xs text-foreground-muted border border-border/20 font-sans">
                                    No streaming details found for this title in your region.
                                </div>
                            )}

                            {freeProviders && freeProviders.link ? (
                                <a
                                    href={freeProviders.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex items-center justify-center rounded-xl bg-accent py-3 text-xs font-bold text-background hover:bg-accent-hover transition-colors shadow-md font-sans"
                                >
                                    Watch on JustWatch
                                </a>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}

        </div>
    );
}
