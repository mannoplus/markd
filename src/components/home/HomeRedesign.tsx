'use client';

import { useState, useEffect } from 'react';
import { Play, RotateCw, Eye, HelpCircle, Film, MapPin, X, Loader2, ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { MovieCard } from '@/components/movie-card';
import { HeroCarousel } from '@/components/hero-carousel';
import type { TMDBTrendingResult, TMDBWatchProvider, TMDBWatchProviderResult } from '@/types';
import { useLocale, useTranslations } from 'next-intl';
import { useRegion } from '@/context/RegionContext';
import {
    getMediaTrailerAction,
    getNowPlayingAction,
    getWatchProvidersAction,
    getUpcomingMoviesAction,
    getUpcomingTVShowsAction,
    getTrendingAction,
    getStrictlyFreeQuotaAction,
    getUpcomingWithTrailersAction,
    getCategoryMediaAction,
    discoverMediaAction,
} from '@/app/actions/discover';

// Comprehensive Country list
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

const getProviderUrl = (name: string, fallback: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('netflix')) return 'https://www.netflix.com';
    if (lower.includes('amazon') || lower.includes('prime video')) return 'https://www.primevideo.com';
    if (lower.includes('apple tv') || lower.includes('apple')) return 'https://tv.apple.com';
    if (lower.includes('google play') || lower.includes('google')) return 'https://play.google.com/store/movies';
    if (lower.includes('youtube')) return 'https://www.youtube.com';
    if (lower.includes('disney')) return 'https://www.disneyplus.com';
    if (lower.includes('fandango') || lower.includes('vudu')) return 'https://www.vudu.com';
    if (lower.includes('hbo') || lower.includes('max')) return 'https://www.max.com';
    if (lower.includes('hulu')) return 'https://www.hulu.com';
    if (lower.includes('paramount')) return 'https://www.paramountplus.com';
    if (lower.includes('peacock')) return 'https://www.peacocktv.com';
    if (lower.includes('catchplay')) return 'https://www.catchplay.com';
    if (lower.includes('myvideo')) return 'https://www.myvideo.net.tw';
    if (lower.includes('friday')) return 'https://video.friday.tw';
    if (lower.includes('hami')) return 'https://hamivideo.hinet.net';
    if (lower.includes('line tv')) return 'https://www.linetv.tw';
    if (lower.includes('kktv')) return 'https://www.kktv.me';
    if (lower.includes('litv')) return 'https://www.litv.tv';
    return fallback || 'https://www.justwatch.com';
};

interface HomeRedesignProps {
    initialTrending: TMDBTrendingResult[];
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
    initialTrending,
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
    const locale = useLocale();
    const t = useTranslations('Home');
    const tNav = useTranslations('Navigation');
    const tNowShowing = useTranslations('nowShowing');

    const { region: globalRegion, setRegion: setGlobalRegion } = useRegion();
    const [trendingMedia, setTrendingMedia] = useState<TMDBTrendingResult[]>(initialTrending);
    const [trailerTab, setTrailerTab] = useState<'upcoming' | 'popular' | 'streaming' | 'rent' | 'theaters'>('upcoming');
    const [freeTab, setFreeTab] = useState<'movies' | 'tv'>('movies');

    // Section 1: Trailer Modal State
    const [activeTrailer, setActiveTrailer] = useState<{ id: number; type: 'movie' | 'tv'; title: string } | null>(null);
    const [youtubeKey, setYoutubeKey] = useState<string | null>(null);
    const [isLoadingTrailer, setIsLoadingTrailer] = useState<boolean>(false);

    // Section 1: Trailers Category Datasets
    const [popularTrailers, setPopularTrailers] = useState<TMDBTrendingResult[]>(initialPopularTrailers);
    const [streamingTrailers, setStreamingTrailers] = useState<TMDBTrendingResult[]>(initialStreamingTrailers);
    const [rentTrailers, setRentTrailers] = useState<TMDBTrendingResult[]>(initialRentTrailers);
    const [theaterTrailers, setTheaterTrailers] = useState<TMDBTrendingResult[]>(initialTheaterTrailers);

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

    // Section 1: Hover Trailer Video Preview States
    const [hoveredTrailerId, setHoveredTrailerId] = useState<number | null>(null);
    const [hoveredTrailerKey, setHoveredTrailerKey] = useState<string | null>(null);

    const handleTrailerMouseEnter = async (item: TMDBTrendingResult) => {
        setHoveredTrailerId(item.id);
        if (item.trailerKey) {
            setHoveredTrailerKey(item.trailerKey);
        } else {
            setHoveredTrailerKey(null);
            try {
                const key = await getMediaTrailerAction(item.media_type || 'movie', item.id);
                setHoveredTrailerId((currentId) => {
                    if (currentId === item.id) {
                        setHoveredTrailerKey(key);
                    }
                    return currentId;
                });
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleTrailerMouseLeave = () => {
        setHoveredTrailerId(null);
        setHoveredTrailerKey(null);
    };

    // Section 5: Free Providers State
    const [freeMovies, setFreeMovies] = useState<TMDBTrendingResult[]>(initialFreeMovies);
    const [freeShows, setFreeShows] = useState<TMDBTrendingResult[]>(initialFreeShows);
    const [isLoadingFree, setIsLoadingFree] = useState<boolean>(false);
    const [activeFreeItem, setActiveFreeItem] = useState<TMDBTrendingResult | null>(null);
    const [freeProviders, setFreeProviders] = useState<TMDBWatchProviderResult | null>(null);
    const [isLoadingProviders, setIsLoadingProviders] = useState<boolean>(false);

    // Section Loaders during Global Region changes
    const [isLoadingTrending, setIsLoadingTrending] = useState<boolean>(false);
    const [isLoadingTrailers, setIsLoadingTrailers] = useState<boolean>(false);
    const [isLoadingUpcomingMovies, setIsLoadingUpcomingMovies] = useState<boolean>(false);
    const [isLoadingUpcomingShows, setIsLoadingUpcomingShows] = useState<boolean>(false);

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
    // Section 0: Carousel 5-minute background refresh (linked to globalRegion)
    // ----------------------------------------------------
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const [movies, shows] = await Promise.all([
                    getTrendingAction('movie', 'day', globalRegion, locale),
                    getTrendingAction('tv', 'day', globalRegion, locale),
                ]);

                const mix: TMDBTrendingResult[] = [];
                for (let i = 0; i < 6; i++) {
                    if (movies[i]) {
                        mix.push({ ...movies[i], media_type: 'movie' });
                    }
                    if (shows[i]) {
                        mix.push({ ...shows[i], media_type: 'tv' });
                    }
                }

                if (mix.length > 0) {
                    setTrendingMedia(enrichClientRTScores(mix));
                }
            } catch (e) {
                console.error('Failed to background auto-update trending carousel:', e);
            }
        }, 300000); // 5 minutes

        return () => clearInterval(interval);
    }, [globalRegion, locale]);

    // ----------------------------------------------------
    // Section 1: Latest Trailers 5-Minute Background Sync (linked to globalRegion)
    // ----------------------------------------------------
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const [movies, shows] = await Promise.all([
                    getUpcomingWithTrailersAction('movie', globalRegion, locale),
                    getUpcomingWithTrailersAction('tv', globalRegion, locale),
                ]);

                if (movies.length > 0) {
                    const enrichedMovies = enrichClientRTScores(movies.slice(0, 10));
                    setUpcomingMovies(enrichedMovies);
                    const now = Date.now();
                    localStorage.setItem('upcoming_movies_data', JSON.stringify(enrichedMovies));
                    localStorage.setItem('upcoming_movies_time', String(now));
                    setUpcomingMoviesTime(now);
                }
                if (shows.length > 0) {
                    const enrichedShows = enrichClientRTScores(shows.slice(0, 10));
                    setUpcomingShows(enrichedShows);
                    const now = Date.now();
                    localStorage.setItem('upcoming_shows_data', JSON.stringify(enrichedShows));
                    localStorage.setItem('upcoming_shows_time', String(now));
                    setUpcomingShowsTime(now);
                }
            } catch (e) {
                console.error('Failed to background sync trailers:', e);
            }
        }, 300000); // 5 minutes

        return () => clearInterval(interval);
    }, [globalRegion, locale]);

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
    // Section 2: Cinema Manual Update handler
    // ----------------------------------------------------
    const triggerCinemasUpdate = async () => {
        setIsLoadingCinemas(true);
        try {
            const data = await getNowPlayingAction(globalRegion, locale);
            setNowPlayingMovies(enrichClientRTScores(data));
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
                const data = await getNowPlayingAction(globalRegion, locale);
                setNowPlayingMovies(enrichClientRTScores(data));
            } catch (e) {
                console.error('Failed to background auto-update cinemas:', e);
            }
        }, 21600000); // 6 hours

        return () => clearInterval(interval);
    }, [globalRegion, locale]);

    // ----------------------------------------------------
    // Section 3 & 4: Caching & Auto/Manual Update timers
    // ----------------------------------------------------
    useEffect(() => {
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
    }, [globalRegion, locale]);

    const triggerMoviesUpdate = async () => {
        setIsUpdatingMovies(true);
        try {
            const data = await getUpcomingMoviesAction(globalRegion, locale);
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
            const data = await getUpcomingTVShowsAction(globalRegion, locale);
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
    // Section 5: Free content randomized pagination updates (Strict 15-item quota)
    // ----------------------------------------------------
    const triggerFreeUpdate = async () => {
        setIsLoadingFree(true);
        try {
            const randomPage = Math.floor(Math.random() * 20) + 1;
            const type = freeTab === 'movies' ? 'movie' : 'tv';
            const data = await getStrictlyFreeQuotaAction(type, randomPage, globalRegion, locale);
            const enriched = enrichClientRTScores(data);
            if (freeTab === 'movies') {
                setFreeMovies(enriched);
            } else {
                setFreeShows(enriched);
            }
        } catch (e) {
            console.error('Failed to update free media:', e);
        } finally {
            setIsLoadingFree(false);
        }
    };

    const handleFreeItemClick = async (item: TMDBTrendingResult) => {
        setActiveFreeItem(item);
        setIsLoadingProviders(true);
        setFreeProviders(null);
        try {
            const providers = await getWatchProvidersAction(item.id, freeTab === 'movies' ? 'movie' : 'tv', globalRegion, locale);
            setFreeProviders(providers);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingProviders(false);
        }
    };

    // ----------------------------------------------------
    // Dynamic Global Region Change handler
    // ----------------------------------------------------
    const handleGlobalRegionChange = async (newRegion: string) => {
        setGlobalRegion(newRegion);
        setIsLoadingTrending(true);
        setIsLoadingTrailers(true);
        setIsLoadingCinemas(true);
        setIsLoadingUpcomingMovies(true);
        setIsLoadingUpcomingShows(true);
        setIsLoadingFree(true);

        try {
            const [
                trendingMovies,
                trendingShows,
                nowPlaying,
                popularTrailersData,
                streamingTrailersData,
                rentTrailersData,
                theaterTrailersData,
                upcomingMoviesData,
                upcomingShowsData,
                freeMoviesData,
                freeShowsData,
            ] = await Promise.all([
                getTrendingAction('movie', 'day', newRegion, locale),
                getTrendingAction('tv', 'day', newRegion, locale),
                getNowPlayingAction(newRegion, locale),
                getCategoryMediaAction('/movie/popular', 1, newRegion, locale),
                discoverMediaAction('movie', { with_watch_monetization_types: 'flatrate', watch_region: newRegion, sort_by: 'popularity.desc', language: locale === 'zh-TW' ? 'zh-TW' : 'en-US' }),
                discoverMediaAction('movie', { with_watch_monetization_types: 'rent', watch_region: newRegion, sort_by: 'popularity.desc', language: locale === 'zh-TW' ? 'zh-TW' : 'en-US' }),
                getCategoryMediaAction('/movie/now_playing', 1, newRegion, locale),
                getUpcomingWithTrailersAction('movie', newRegion, locale),
                getUpcomingWithTrailersAction('tv', newRegion, locale),
                getStrictlyFreeQuotaAction('movie', 1, newRegion, locale),
                getStrictlyFreeQuotaAction('tv', 1, newRegion, locale),
            ]);

            // Carousel mix (6 movies + 6 shows)
            const mix: TMDBTrendingResult[] = [];
            for (let i = 0; i < 6; i++) {
                if (trendingMovies[i]) mix.push({ ...trendingMovies[i], media_type: 'movie' });
                if (trendingShows[i]) mix.push({ ...trendingShows[i], media_type: 'tv' });
            }
            setTrendingMedia(enrichClientRTScores(mix));
            setIsLoadingTrending(false);

            // In Cinemas
            setNowPlayingMovies(enrichClientRTScores(nowPlaying));
            setIsLoadingCinemas(false);

            // Trailers Categories
            setPopularTrailers(popularTrailersData.results || []);
            setStreamingTrailers(streamingTrailersData.results || []);
            setRentTrailers(rentTrailersData.results || []);
            setTheaterTrailers(theaterTrailersData.results || []);
            setIsLoadingTrailers(false);

            // Upcoming Movies
            const enrichedUpcomingMovies = enrichClientRTScores(upcomingMoviesData.slice(0, 10));
            setUpcomingMovies(enrichedUpcomingMovies);
            const now = Date.now();
            localStorage.setItem('upcoming_movies_data', JSON.stringify(enrichedUpcomingMovies));
            localStorage.setItem('upcoming_movies_time', String(now));
            setUpcomingMoviesTime(now);
            setIsLoadingUpcomingMovies(false);

            // Upcoming Shows
            const enrichedUpcomingShows = enrichClientRTScores(upcomingShowsData.slice(0, 10));
            setUpcomingShows(enrichedUpcomingShows);
            localStorage.setItem('upcoming_shows_data', JSON.stringify(enrichedUpcomingShows));
            localStorage.setItem('upcoming_shows_time', String(now));
            setUpcomingShowsTime(now);
            setIsLoadingUpcomingShows(false);

            // Free to watch
            setFreeMovies(enrichClientRTScores(freeMoviesData));
            setFreeShows(enrichClientRTScores(freeShowsData));
            setIsLoadingFree(false);
        } catch (e) {
            console.error('Failed to change global region:', e);
            setIsLoadingTrending(false);
            setIsLoadingTrailers(false);
            setIsLoadingCinemas(false);
            setIsLoadingUpcomingMovies(false);
            setIsLoadingUpcomingShows(false);
            setIsLoadingFree(false);
        }
    };

    // Dynamic mixed list for "Upcoming" trailers
    const upcomingTrailers: TMDBTrendingResult[] = [];
    for (let i = 0; i < 6; i++) {
        if (upcomingMovies[i]) {
            upcomingTrailers.push({ ...upcomingMovies[i], media_type: 'movie' });
        }
        if (upcomingShows[i]) {
            upcomingTrailers.push({ ...upcomingShows[i], media_type: 'tv' });
        }
    }

    const currentTrailers =
        trailerTab === 'upcoming' ? upcomingTrailers :
        trailerTab === 'popular' ? popularTrailers :
        trailerTab === 'streaming' ? streamingTrailers :
        trailerTab === 'rent' ? rentTrailers :
        theaterTrailers;

    const currentFreeItems =
        freeTab === 'movies' ? freeMovies :
        freeShows;

    return (
        <div className="pb-16 -mt-16 sm:-mt-20 relative">
            {/* ====================================================
                SECTION 0: DYNAMIC CAROUSEL
               ==================================================== */}
            <div className="relative min-h-[350px]">
                {isLoadingTrending ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-30">
                        <Loader2 className="h-10 w-10 text-accent animate-spin" />
                    </div>
                ) : null}
                <HeroCarousel movies={trendingMedia} />
            </div>

            {/* Main Content Area */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 relative z-20 space-y-20 pb-24">

                {/* ====================================================
                    SECTION 1: LATEST TRAILERS
                   ==================================================== */}
                <section className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {t('latestTrailers') || 'Latest Trailers'}
                            </h2>
                            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent font-sans">Hot</span>
                        </div>

                        <div className="flex flex-nowrap md:flex-wrap items-center gap-2 overflow-x-auto md:overflow-visible scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
                            {(['upcoming', 'popular', 'streaming', 'rent', 'theaters'] as const).map((tab) => {
                                const getTabLabel = () => {
                                    switch (tab) {
                                        case 'upcoming': return tNowShowing('upcoming');
                                        case 'popular': return tNowShowing('popular');
                                        case 'streaming': return tNowShowing('onTv');
                                        case 'rent': return tNowShowing('forRent');
                                        case 'theaters': return tNowShowing('inTheaters');
                                        default: return tab;
                                    }
                                };
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setTrailerTab(tab)}
                                        className={`rounded-full px-3 py-1.5 md:px-4 text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap shrink-0 ${
                                            trailerTab === tab
                                                ? 'bg-accent text-background shadow-lg shadow-accent/20'
                                                : 'bg-background-elevated text-foreground-muted hover:bg-background-elevated-hover hover:text-foreground'
                                        }`}
                                    >
                                        {getTabLabel()}
                                    </button>
                                );
                            })}
                        </div>

                        <Link
                            href="/movies?category=popular"
                            className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                        >
                            {t('seeMore') || 'See More'} →
                        </Link>
                    </div>

                    <div className="relative min-h-[160px]">
                        {isLoadingTrailers ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-2xl z-10">
                                <Loader2 className="h-8 w-8 text-accent animate-spin" />
                            </div>
                        ) : null}
                        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                            {currentTrailers.slice(0, 10).map((item: TMDBTrendingResult) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleTrailerClick(item)}
                                    onMouseEnter={() => handleTrailerMouseEnter(item)}
                                    onMouseLeave={handleTrailerMouseLeave}
                                    className="w-64 md:w-80 shrink-0 snap-start group relative rounded-2xl overflow-hidden bg-background-elevated/40 border border-border/40 hover:border-accent/40 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl"
                                >
                                    <div className="w-full bg-background-elevated relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                        {hoveredTrailerId === item.id && hoveredTrailerKey ? (
                                            <iframe
                                                src={`https://www.youtube.com/embed/${hoveredTrailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${hoveredTrailerKey}&rel=0&playsinline=1`}
                                                title={item.title || item.name || ''}
                                                className="absolute inset-0 h-full w-full object-cover pointer-events-none transition-opacity duration-300"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            />
                                        ) : (
                                            <>
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
                                            </>
                                        )}
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
                    </div>
                </section>

                {/* ====================================================
                    SECTION 2: IN CINEMAS
                   ==================================================== */}
                <section className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {t('inCinemas') || 'In Cinemas'}
                            </h2>
                            <span className="flex items-center gap-1 text-xs text-foreground-muted">
                                <MapPin className="h-3 w-3 text-accent" />
                                {tNowShowing('inTheaters') || 'Showing in Theaters'}
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={triggerCinemasUpdate}
                                disabled={isLoadingCinemas}
                                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-background-elevated transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isLoadingCinemas ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <RotateCw className="h-3 w-3" />
                                )}
                                {t('updateBtn') || 'Update'}
                            </button>

                            <Link
                                href={`/movies?category=now_playing&region=${globalRegion}`}
                                className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                            >
                                {t('seeMore') || 'See More'} →
                            </Link>
                        </div>
                    </div>

                    <div className="relative min-h-[300px]">
                        {isLoadingCinemas ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-2xl z-10">
                                <Loader2 className="h-8 w-8 text-accent animate-spin" />
                            </div>
                        ) : null}
                        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                            {nowPlayingMovies.map((movie: TMDBTrendingResult) => (
                                <div key={movie.id} className="w-40 md:w-48 shrink-0 snap-start fade-in">
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
                </section>

                {/* ====================================================
                    SECTION 3: UPCOMING MOVIES
                   ==================================================== */}
                <section className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {t('upcomingMovies') || 'Upcoming Movies'}
                            </h2>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-foreground-muted tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                <span className="uppercase">
                                    {tNowShowing('lastUpdated') || 'Last updated'}:
                                </span>
                                <span className="font-sans font-medium text-foreground-muted">
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
                                {t('updateBtn') || 'Update'}
                            </button>

                            <Link
                                href="/movies?category=upcoming"
                                className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                            >
                                {t('seeMore') || 'See More'} →
                            </Link>
                        </div>
                    </div>

                    <div className="relative">
                        {isLoadingUpcomingMovies ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-2xl z-10">
                                <Loader2 className="h-8 w-8 text-accent animate-spin" />
                            </div>
                        ) : null}
                        <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                            {upcomingMovies.map((movie: TMDBTrendingResult) => (
                                <div key={movie.id} className="w-40 md:w-48 shrink-0 snap-start">
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
                </section>

                {/* ====================================================
                    SECTION 4: UPCOMING TV SHOWS
                   ==================================================== */}
                <section className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {t('upcomingTvShows') || 'Upcoming TV Shows'}
                            </h2>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-foreground-muted tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                <span className="uppercase">
                                    {tNowShowing('lastUpdated') || 'Last updated'}:
                                </span>
                                <span className="font-sans font-medium text-foreground-muted">
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
                                {t('updateBtn') || 'Update'}
                            </button>

                            <Link
                                href="/tv-shows?category=upcoming"
                                className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                            >
                                {t('seeMore') || 'See More'} →
                            </Link>
                        </div>
                    </div>

                    <div className="relative">
                        {isLoadingUpcomingShows ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-2xl z-10">
                                <Loader2 className="h-8 w-8 text-accent animate-spin" />
                            </div>
                        ) : null}
                        <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                            {upcomingShows.map((show: TMDBTrendingResult) => (
                                <div key={show.id} className="w-40 md:w-48 shrink-0 snap-start">
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
                    </div>
                </section>

                {/* ====================================================
                    SECTION 5: FREE TO WATCH (100% FREE ONLY)
                   ==================================================== */}
                <section className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {t('freeToWatch') || 'Free to Watch'}
                            </h2>
                            <div className="flex rounded-full bg-background-elevated p-1">
                                <button
                                    onClick={() => setFreeTab('movies')}
                                    className={`rounded-full px-4 py-1 text-xs font-bold transition-all ${
                                        freeTab === 'movies'
                                            ? 'bg-accent text-background shadow-md'
                                            : 'text-foreground-muted hover:text-foreground'
                                    }`}
                                >
                                    {tNav('movies')}
                                </button>
                                <button
                                    onClick={() => setFreeTab('tv')}
                                    className={`rounded-full px-4 py-1 text-xs font-bold transition-all ${
                                        freeTab === 'tv'
                                            ? 'bg-accent text-background shadow-md'
                                            : 'text-foreground-muted hover:text-foreground'
                                    }`}
                                >
                                    {tNav('tvShows')}
                                </button>
                            </div>

                            {/* Rotation Update Trigger next to toggle */}
                            <button
                                onClick={triggerFreeUpdate}
                                disabled={isLoadingFree}
                                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1 text-[11px] font-semibold text-foreground hover:bg-background-elevated transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isLoadingFree ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <RotateCw className="h-3 w-3" />
                                )}
                                {t('updateBtn') || 'Update'}
                            </button>
                        </div>

                        <Link
                            href={(freeTab === 'movies' ? `/movies?availability=free` : `/tv-shows?availability=free`) as string}
                            className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                        >
                            {t('seeMore') || 'See More'} →
                        </Link>
                    </div>

                    <div className="relative min-h-[250px]">
                        {isLoadingFree ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-2xl z-10">
                                <Loader2 className="h-8 w-8 text-accent animate-spin" />
                            </div>
                        ) : null}
                        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                            {currentFreeItems.map((item: TMDBTrendingResult) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleFreeItemClick(item)}
                                    className="w-40 md:w-48 shrink-0 snap-start bg-[#12121a] border border-border/40 hover:border-accent/40 rounded-2xl p-4 space-y-3 cursor-pointer group transition-all hover:scale-[1.02] shadow-lg flex flex-col justify-between"
                                >
                                    <div className="space-y-2">
                                        <div className="w-full rounded-xl overflow-hidden bg-background-elevated relative border border-border/20" style={{ aspectRatio: '2/3' }}>
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
                                                {t('freeToWatch') || 'Free'}
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
                    </div>
                </section>

                {/* ====================================================
                    SECTION 6: FOOTER REGION FILTER
                   ==================================================== */}
                <section className="border-t border-border/40 pt-8 mt-12 flex flex-col items-center justify-center space-y-4">
                    <div className="flex flex-col items-center space-y-1">
                        <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">
                            {t('globalRegionFilter') || 'Global Region Filter'}
                        </span>
                        <h3 className="text-xs text-foreground-muted text-center">
                            {t('regionSelectSub') || 'Select region to localize theatrical, trending, trailers, and streaming options'}
                        </h3>
                    </div>

                    <div className="relative">
                        <select
                            value={globalRegion}
                            onChange={(e) => handleGlobalRegionChange(e.target.value)}
                            className="appearance-none bg-background-elevated border border-border/40 rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:border-accent cursor-pointer min-w-[200px] transition-all text-center shadow-lg hover:border-accent/40"
                        >
                            {CINEMA_COUNTRIES.map((c) => (
                                <option key={c.code} value={c.code} className="bg-[#1c1c28] text-left">
                                    {t(`region${c.code}`) || c.name} ({c.code})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-muted pointer-events-none" />
                    </div>
                </section>

                {/* ====================================================
                    SECTION 1 MODAL: TRAILER VIDEO LIGHTBOX
                   ==================================================== */}
                {activeTrailer ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div 
                            className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity duration-300"
                            onClick={() => setActiveTrailer(null)}
                        />
                        
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
                        <div 
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
                            onClick={() => setActiveFreeItem(null)}
                        />

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
                                                <a
                                                    key={prov.provider_id}
                                                    href={getProviderUrl(prov.provider_name, freeProviders.link || '')}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2.5 rounded-xl bg-background-elevated p-2 border border-border/20 hover:border-accent/40 transition-colors cursor-pointer"
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
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ) : freeProviders && freeProviders.flatrate ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            {freeProviders.flatrate.map((prov: TMDBWatchProvider) => (
                                                <a
                                                    key={prov.provider_id}
                                                    href={getProviderUrl(prov.provider_name, freeProviders.link || '')}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2.5 rounded-xl bg-background-elevated p-2 border border-border/20 hover:border-accent/40 transition-colors cursor-pointer"
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
                                                </a>
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

                                <Link
                                    href={freeTab === 'movies' ? `/movie/${activeFreeItem.id}` : `/tv/${activeFreeItem.id}`}
                                    onClick={() => setActiveFreeItem(null)}
                                    className="w-full inline-flex items-center justify-center rounded-xl bg-accent py-3 text-xs font-bold text-background hover:bg-accent-hover transition-colors shadow-md font-sans"
                                >
                                    View Movie Details
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : null}

            </div>
        </div>
    );
}
