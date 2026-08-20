'use client';

import { useState, useEffect } from 'react';
import { Play, RotateCw, HelpCircle, Film, MapPin, X, Loader2, ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { MovieCard } from '@/components/movie-card';
import { HeroCarousel } from '@/components/hero-carousel';
import { SectionHeader } from '@/components/section-header';
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
import { CompanionShelf } from '@/components/companion/CompanionShelf';
import { MoodMatcherBar } from '@/components/companion/MoodMatcherBar';
import { ColdStartCompanion } from '@/components/companion/ColdStartCompanion';
import { TasteControlModal } from '@/components/companion/TasteControlModal';
import { getPersonalizedHomeShelvesAction, type PersonalizedShelvesResult } from '@/app/actions/personalization';

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
    initialShelves?: PersonalizedShelvesResult;
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
    initialShelves,
}: HomeRedesignProps) {
    // ----------------------------------------------------
    // Client State
    // ----------------------------------------------------
    const locale = useLocale();
    const t = useTranslations('Home');
    const tNav = useTranslations('Navigation');
    const tNowShowing = useTranslations('nowShowing');
    const tCompanion = useTranslations('Companion');

    const { region: globalRegion, setRegion: setGlobalRegion } = useRegion();
    const [trendingMedia, setTrendingMedia] = useState<TMDBTrendingResult[]>(initialTrending);
    const [trailerTab, setTrailerTab] = useState<'upcoming' | 'popular' | 'streaming' | 'rent' | 'theaters'>('upcoming');
    const [freeTab, setFreeTab] = useState<'movies' | 'tv'>('movies');

    // Companion Shelves & Mood State
    const [shelves, setShelves] = useState<PersonalizedShelvesResult | undefined>(initialShelves);
    const [activeMood, setActiveMood] = useState<string>('all');
    const [isControlsOpen, setIsControlsOpen] = useState<boolean>(false);
    const [isLoadingShelves, setIsLoadingShelves] = useState<boolean>(false);

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
    // Companion: Mood & Shelf Handler
    // ----------------------------------------------------
    const handleMoodSelect = async (moodKey: string) => {
        setActiveMood(moodKey);
        setIsLoadingShelves(true);
        try {
            const data = await getPersonalizedHomeShelvesAction(locale, moodKey, globalRegion);
            setShelves(data);
        } catch (e) {
            console.error('Failed to update mood shelves:', e);
        } finally {
            setIsLoadingShelves(false);
        }
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
        <div className="relative -mt-16 sm:-mt-20">
            {/* ====================================================
                SECTION 0: DYNAMIC MULTI-ITEM HERO CAROUSEL
               ==================================================== */}
            <div className="relative min-h-[540px]">
                {isLoadingTrending ? (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                        <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
                    </div>
                ) : null}
                <HeroCarousel
                    movies={trendingMedia}
                    onPlayTrailer={(item) => handleTrailerClick(item)}
                />
            </div>

            {/* Main Editorial Content Area */}
            <div className="relative z-20 mx-auto max-w-7xl space-y-16 px-4 pb-24 pt-14 sm:px-6 sm:space-y-20 lg:px-8">

                {/* ====================================================
                    SECTION 0.5: PERSONAL CINEMA COMPANION & MOOD
                   ==================================================== */}
                <div className="space-y-12">
                    <MoodMatcherBar
                        activeMood={activeMood}
                        onSelectMood={handleMoodSelect}
                        onOpenControls={() => setIsControlsOpen(true)}
                    />

                    {shelves?.isColdStart && (
                        <ColdStartCompanion
                            onUnlock={async () => {
                                setIsLoadingShelves(true);
                                try {
                                    const data = await getPersonalizedHomeShelvesAction(locale, activeMood, globalRegion);
                                    setShelves(data);
                                } finally {
                                    setIsLoadingShelves(false);
                                }
                            }}
                        />
                    )}

                    {shelves?.tonightsPicks && shelves.tonightsPicks.length > 0 && (
                        <CompanionShelf
                            title={tCompanion('tonightsPicks')}
                            subtitle={tCompanion('tonightsPicksSub')}
                            items={shelves.tonightsPicks}
                            badgeText={tCompanion('companionTitle')}
                        />
                    )}

                    {shelves?.becauseYouLoved && (
                        <CompanionShelf
                            title={tCompanion('becauseYouLoved', { title: shelves.becauseYouLoved.referenceTitle })}
                            subtitle={tCompanion('becauseYouLovedSub')}
                            items={shelves.becauseYouLoved.items}
                        />
                    )}

                    {shelves?.watchlistGems && (
                        <CompanionShelf
                            title={tCompanion('watchlistGems')}
                            subtitle={tCompanion('watchlistGemsSub')}
                            items={shelves.watchlistGems}
                        />
                    )}

                    {shelves?.rewatchCandidates && (
                        <CompanionShelf
                            title={tCompanion('rewatchCandidates')}
                            subtitle={tCompanion('rewatchCandidatesSub')}
                            items={shelves.rewatchCandidates}
                        />
                    )}
                </div>

                {/* ====================================================
                    SECTION 1: LATEST TRAILERS
                   ==================================================== */}
                <section className="space-y-5">
                    <SectionHeader
                        eyebrow="Trailers"
                        title={t('latestTrailers') || 'Latest Trailers'}
                        actionHref="/movies?category=popular"
                        actionLabel={t('seeMore') || 'See More'}
                    >
                        <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide md:overflow-visible">
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
                                        className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                                            trailerTab === tab
                                                ? 'bg-foreground text-background'
                                                : 'bg-background-elevated/70 text-foreground-muted hover:bg-background-elevated hover:text-foreground'
                                        }`}
                                    >
                                        {getTabLabel()}
                                    </button>
                                );
                            })}
                        </div>
                    </SectionHeader>

                    <div className="relative">
                        {isLoadingTrailers && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm">
                                <Loader2 className="h-7 w-7 animate-spin text-foreground-muted" />
                            </div>
                        )}
                        <div className="media-rail -mx-4 px-4 sm:mx-0 sm:px-0">
                            {currentTrailers.slice(0, 10).map((item: TMDBTrendingResult) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleTrailerClick(item)}
                                    onMouseEnter={() => handleTrailerMouseEnter(item)}
                                    onMouseLeave={handleTrailerMouseLeave}
                                    className="group relative w-64 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-background-card transition-all duration-[var(--transition-base)] hover:border-border-hover hover:shadow-elevated md:w-80"
                                >
                                    <div className="relative w-full overflow-hidden bg-background-elevated" style={{ aspectRatio: '16/9' }}>
                                        {hoveredTrailerId === item.id && hoveredTrailerKey ? (
                                            <iframe
                                                src={`https://www.youtube.com/embed/${hoveredTrailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${hoveredTrailerKey}&rel=0&playsinline=1`}
                                                title={item.title || item.name || ''}
                                                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            />
                                        ) : (
                                            <>
                                                {item.backdrop_path ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={`https://image.tmdb.org/t/p/w780${item.backdrop_path}`}
                                                        alt={item.title || item.name || ''}
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-foreground-subtle">
                                                        <Film className="h-8 w-8" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity group-hover:bg-black/50">
                                                    <span className="flex h-11 w-11 scale-90 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform duration-[var(--transition-base)] group-hover:scale-100">
                                                        <Play className="h-4 w-4 fill-current" />
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="space-y-0.5 p-3.5">
                                        <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-accent">
                                            {item.title || item.name}
                                        </h3>
                                        <p className="text-[11px] text-foreground-muted">
                                            {item.release_date || item.first_air_date || t('upcomingMovies') || 'Coming Soon'}
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
                <section className="space-y-5">
                    <SectionHeader
                        eyebrow="Theatrical"
                        title={t('inCinemas') || 'In Cinemas'}
                        actionHref={`/movies?category=now_playing&region=${globalRegion}`}
                        actionLabel={t('seeMore') || 'See More'}
                    >
                        <span className="inline-flex items-center gap-1.5 text-xs text-foreground-muted">
                            <MapPin className="h-3.5 w-3.5" />
                            {tNowShowing('inTheaters') || 'Showing in Theaters'}
                        </span>
                        <button
                            onClick={triggerCinemasUpdate}
                            disabled={isLoadingCinemas}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background-elevated px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-highlight disabled:opacity-50"
                        >
                            {isLoadingCinemas ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RotateCw className="h-3.5 w-3.5" />
                            )}
                            {t('updateBtn') || 'Update'}
                        </button>
                    </SectionHeader>

                    <div className="relative">
                        {isLoadingCinemas && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm">
                                <Loader2 className="h-7 w-7 animate-spin text-foreground-muted" />
                            </div>
                        )}
                        <div className="media-rail -mx-4 px-4 sm:mx-0 sm:px-0">
                            {nowPlayingMovies.map((movie: TMDBTrendingResult) => (
                                <div key={movie.id} className="w-36 md:w-44 fade-in">
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
                <section className="space-y-5">
                    <SectionHeader
                        eyebrow="Coming Soon"
                        title={t('upcomingMovies') || 'Upcoming Movies'}
                        actionHref="/movies?category=upcoming"
                        actionLabel={t('seeMore') || 'See More'}
                    >
                        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-foreground-subtle">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                            {tNowShowing('lastUpdated') || 'Last updated'}:
                            <span className="font-medium normal-case">
                                {upcomingMoviesTime > 0
                                    ? new Date(upcomingMoviesTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : 'Updating...'}
                            </span>
                        </span>
                        <button
                            onClick={triggerMoviesUpdate}
                            disabled={isUpdatingMovies}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background-elevated px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-highlight disabled:opacity-50"
                        >
                            {isUpdatingMovies ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RotateCw className="h-3.5 w-3.5" />
                            )}
                            {t('updateBtn') || 'Update'}
                        </button>
                    </SectionHeader>

                    <div className="relative">
                        {isLoadingUpcomingMovies && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm">
                                <Loader2 className="h-7 w-7 animate-spin text-foreground-muted" />
                            </div>
                        )}
                        <div className="media-rail -mx-4 px-4 sm:mx-0 sm:px-0">
                            {upcomingMovies.map((movie: TMDBTrendingResult) => (
                                <div key={movie.id} className="w-36 md:w-44">
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
                <section className="space-y-5">
                    <SectionHeader
                        eyebrow="Coming Soon"
                        title={t('upcomingTvShows') || 'Upcoming TV Shows'}
                        actionHref="/tv-shows?category=upcoming"
                        actionLabel={t('seeMore') || 'See More'}
                    >
                        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-foreground-subtle">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-info" />
                            {tNowShowing('lastUpdated') || 'Last updated'}:
                            <span className="font-medium normal-case">
                                {upcomingShowsTime > 0
                                    ? new Date(upcomingShowsTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : 'Updating...'}
                            </span>
                        </span>
                        <button
                            onClick={triggerShowsUpdate}
                            disabled={isUpdatingShows}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background-elevated px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-highlight disabled:opacity-50"
                        >
                            {isUpdatingShows ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RotateCw className="h-3.5 w-3.5" />
                            )}
                            {t('updateBtn') || 'Update'}
                        </button>
                    </SectionHeader>

                    <div className="relative">
                        {isLoadingUpcomingShows && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm">
                                <Loader2 className="h-7 w-7 animate-spin text-foreground-muted" />
                            </div>
                        )}
                        <div className="media-rail -mx-4 px-4 sm:mx-0 sm:px-0">
                            {upcomingShows.map((show: TMDBTrendingResult) => (
                                <div key={show.id} className="w-36 md:w-44">
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
                <section className="space-y-5">
                    <SectionHeader
                        eyebrow="Free"
                        title={t('freeToWatch') || 'Free to Watch'}
                        actionHref={(freeTab === 'movies' ? `/movies?availability=free` : `/tv-shows?availability=free`) as string}
                        actionLabel={t('seeMore') || 'See More'}
                    >
                        <div className="flex rounded-lg border border-border bg-background-elevated p-0.5">
                            <button
                                onClick={() => setFreeTab('movies')}
                                className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition-colors ${
                                    freeTab === 'movies'
                                        ? 'bg-foreground text-background'
                                        : 'text-foreground-muted hover:text-foreground'
                                }`}
                            >
                                {tNav('movies')}
                            </button>
                            <button
                                onClick={() => setFreeTab('tv')}
                                className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition-colors ${
                                    freeTab === 'tv'
                                        ? 'bg-foreground text-background'
                                        : 'text-foreground-muted hover:text-foreground'
                                }`}
                            >
                                {tNav('tvShows')}
                            </button>
                        </div>
                        <button
                            onClick={triggerFreeUpdate}
                            disabled={isLoadingFree}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background-elevated px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-highlight disabled:opacity-50"
                        >
                            {isLoadingFree ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RotateCw className="h-3.5 w-3.5" />
                            )}
                            {t('updateBtn') || 'Update'}
                        </button>
                    </SectionHeader>

                    <div className="relative">
                        {isLoadingFree && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm">
                                <Loader2 className="h-7 w-7 animate-spin text-foreground-muted" />
                            </div>
                        )}
                        <div className="media-rail -mx-4 px-4 sm:mx-0 sm:px-0">
                            {currentFreeItems.map((item: TMDBTrendingResult) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleFreeItemClick(item)}
                                    className="group w-36 shrink-0 cursor-pointer space-y-2.5 md:w-44"
                                >
                                    <div className="relative overflow-hidden rounded-lg border border-border bg-background-card transition-all duration-[var(--transition-base)] group-hover:-translate-y-1 group-hover:border-border-hover group-hover:shadow-elevated" style={{ aspectRatio: '2/3' }}>
                                        {item.poster_path ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                                                alt={item.title || item.name || ''}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-foreground-subtle">
                                                <HelpCircle className="h-8 w-8" />
                                            </div>
                                        )}
                                        <span className="absolute left-1.5 top-1.5 rounded-md bg-success/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-background backdrop-blur-sm">
                                            {t('freeBadge') || 'Free'}
                                        </span>
                                    </div>
                                    <h3 className="truncate text-xs font-semibold transition-colors group-hover:text-accent">
                                        {item.title || item.name}
                                    </h3>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ====================================================
                    SECTION 6: FOOTER REGION FILTER
                   ==================================================== */}
                <section className="flex flex-col items-center justify-center gap-4 border-t border-border/40 pt-10">
                    <div className="flex flex-col items-center gap-1 text-center">
                        <span className="eyebrow">
                            {t('globalRegionFilter') || 'Global Region Filter'}
                        </span>
                        <h3 className="lede">
                            {t('regionSelectSub') || 'Select region to localize theatrical, trending, trailers, and streaming options'}
                        </h3>
                    </div>

                    <div className="relative">
                        <select
                            value={globalRegion}
                            onChange={(e) => handleGlobalRegionChange(e.target.value)}
                            aria-label={t('globalRegionFilter') || 'Global Region Filter'}
                            className="min-w-[220px] cursor-pointer appearance-none rounded-lg border border-border bg-background-elevated py-2.5 pl-4 pr-10 text-center text-xs font-bold text-foreground transition-colors hover:border-border-hover focus:border-border-active focus:outline-none"
                        >
                            {CINEMA_COUNTRIES.map((c) => (
                                <option key={c.code} value={c.code} className="bg-background-elevated text-left">
                                    {t(`region${c.code}`) || c.name} ({c.code})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
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
                        
                        <div className="relative z-10 flex aspect-video w-full max-w-4xl items-center justify-center overflow-hidden rounded-xl border border-border bg-background-card shadow-elevated">
                            <button
                                onClick={() => setActiveTrailer(null)}
                                className="absolute right-4 top-4 z-20 rounded-full bg-black/60 p-2 text-foreground transition-colors hover:bg-black/80 hover:text-accent"
                                aria-label={t('closeTrailer') || 'Close Trailer'}
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {isLoadingTrailer ? (
                                <div className="flex flex-col items-center gap-3 text-foreground-muted">
                                    <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
                                    <span className="text-xs font-semibold">{t('loadingTrailer') || 'Loading Trailer…'}</span>
                                </div>
                            ) : youtubeKey ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0`}
                                    title={activeTrailer.title}
                                    className="h-full w-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="space-y-2 p-6 text-center">
                                    <Film className="mx-auto mb-2 h-12 w-12 text-foreground-subtle" />
                                    <h3 className="text-sm font-bold text-foreground">{t('noTrailerFound') || 'No Trailer Found'}</h3>
                                    <p className="max-w-xs text-xs text-foreground-muted">
                                        {t('noTrailerDesc') || 'We could not find an official YouTube trailer for this title.'}
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

                        <div className="relative z-10 w-full max-w-md space-y-6 rounded-xl bg-surface-secondary p-6 shadow-elevated">
                            <button
                                onClick={() => setActiveFreeItem(null)}
                                className="absolute right-4 top-4 rounded-full bg-background-elevated p-2 text-foreground-muted transition-colors hover:text-foreground"
                                aria-label={t('closeWatchDetails') || 'Close Watch Details'}
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
                                    <p className="font-sans text-xs text-foreground-muted">
                                        {activeFreeItem.release_date || activeFreeItem.first_air_date || t('upcomingShort') || 'Upcoming'}
                                    </p>
                                    <div className="inline-flex items-center rounded-md border border-success/20 bg-success/10 px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wider text-success">
                                        {t('freeStreamOptions') || 'Free Stream Options'}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-border/40 pt-4 space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                                    {t('streamingFreeIn', { region: globalRegion }) || `Streaming Free In ${globalRegion}`}
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
                                        <div className="rounded-lg border border-warning/20 bg-warning/10 p-2.5 font-sans text-[10px] text-warning">
                                            {t('noFreeStreams') || 'No 100% free streams found. Showing subscription options as a fallback.'}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-border/20 bg-background-elevated p-4 text-center font-sans text-xs text-foreground-muted">
                                        {t('noStreamingDetails') || 'No streaming details found for this title in your region.'}
                                    </div>
                                )}

                                <Link
                                    href={freeTab === 'movies' ? `/movie/${activeFreeItem.id}` : `/tv/${activeFreeItem.id}`}
                                    onClick={() => setActiveFreeItem(null)}
                                    className="inline-flex w-full items-center justify-center rounded-lg bg-foreground py-3 font-sans text-xs font-bold text-background transition-colors hover:bg-foreground/90"
                                >
                                    {t('viewDetails') || 'View Details'}
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : null}

            </div>

            {/* Taste Control & Transparency Modal */}
            <TasteControlModal
                isOpen={isControlsOpen}
                onClose={() => setIsControlsOpen(false)}
                activeMood={activeMood}
                onClearMood={() => handleMoodSelect('all')}
                topTraits={shelves?.userTasteSummary?.topDnaTraits}
                locale={locale}
            />
        </div>
    );
}
