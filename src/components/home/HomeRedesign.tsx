'use client';

import { useState } from 'react';
import { Play, RotateCw, Eye, HelpCircle, Film, MapPin } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { MovieCard } from '@/components/movie-card';
import type { TMDBTrendingResult } from '@/types';

// Country list in requested order:
// Taiwan, United States, China, Japan, UK, France, Germany, South Korea, Australia, Brazil, Mexico, Spain, Italy, Russia, Indonesia, India
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
    // SKELETON CLIENT STATE (Logic will be linked later)
    // ----------------------------------------------------
    const [trailerTab, setTrailerTab] = useState<'popular' | 'streaming' | 'rent' | 'theaters'>('popular');
    const [cinemaCountry, setCinemaCountry] = useState<string>('TW');
    const [freeTab, setFreeTab] = useState<'movies' | 'tv'>('movies');

    // Dynamic Lists (using initial props for skeleton display)
    const currentTrailers = 
        trailerTab === 'popular' ? initialPopularTrailers :
        trailerTab === 'streaming' ? initialStreamingTrailers :
        trailerTab === 'rent' ? initialRentTrailers :
        initialTheaterTrailers;

    const currentFreeItems = 
        freeTab === 'movies' ? initialFreeMovies :
        initialFreeShows;

    return (
        <div className="space-y-20 pb-24">
            
            {/* ====================================================
                SECTION 1: LATEST TRAILERS
               ==================================================== */}
            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight">Latest Trailers</h2>
                        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">Hot</span>
                    </div>

                    {/* Navigation Menu for Filter */}
                    <div className="flex flex-wrap items-center gap-2">
                        {(['popular', 'streaming', 'rent', 'theaters'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setTrailerTab(tab)}
                                className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                                    trailerTab === tab
                                        ? 'bg-accent text-background shadow-lg shadow-accent/20'
                                        : 'bg-background-elevated text-foreground-muted hover:bg-background-elevated-hover hover:text-foreground'
                                }`}
                            >
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
                        More Trailers →
                    </Link>
                </div>

                {/* Horizontal Scroll Containers */}
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                    {currentTrailers.slice(0, 10).map((item: TMDBTrendingResult) => (
                        <div
                            key={item.id}
                            className="w-[280px] sm:w-[320px] shrink-0 snap-start group relative rounded-2xl overflow-hidden bg-background-elevated/40 border border-border/40 hover:border-accent/40 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl"
                        >
                            {/* Backdrop 16:9 aspect image skeleton */}
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
                                {/* Play Overlay */}
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
                                <p className="text-[11px] text-foreground-muted">
                                    {item.release_date || item.first_air_date || 'Coming Soon'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ====================================================
                SECTION 2: IN CINEMAS
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
                        More Cinemas →
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Vertical Country Selector Panel */}
                    <div className="lg:col-span-1 bg-[#12121a] border border-border/40 rounded-2xl p-4 h-[350px] overflow-y-auto space-y-1.5 scrollbar-thin">
                        <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-2 px-2">
                            Select Region
                        </div>
                        {CINEMA_COUNTRIES.map((country) => (
                            <button
                                key={country.code}
                                onClick={() => setCinemaCountry(country.code)}
                                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-left transition-all ${
                                    cinemaCountry === country.code
                                        ? 'bg-accent/15 text-accent border border-accent/20'
                                        : 'text-foreground-muted hover:bg-background-elevated hover:text-foreground border border-transparent'
                                }`}
                            >
                                <span>{country.name}</span>
                                <span className="opacity-50 text-[10px] font-mono">{country.code}</span>
                            </button>
                        ))}
                    </div>

                    {/* Movie Grid */}
                    <div className="lg:col-span-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                            {initialNowPlaying.slice(0, 4).map((movie: TMDBTrendingResult) => (
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
                            <span>Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-background-elevated transition-all active:scale-95"
                        >
                            <RotateCw className="h-3 w-3" />
                            Manual Update
                        </button>

                        <Link
                            href="/movies?category=upcoming"
                            className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                        >
                            More Movies →
                        </Link>
                    </div>
                </div>

                <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                    {initialUpcomingMovies.map((movie: TMDBTrendingResult) => (
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
                            <span>Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-background-elevated transition-all active:scale-95"
                        >
                            <RotateCw className="h-3 w-3" />
                            Manual Update
                        </button>

                        <Link
                            href="/tv-shows?category=upcoming"
                            className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                        >
                            More Shows →
                        </Link>
                    </div>
                </div>

                <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                    {initialUpcomingShows.map((show: TMDBTrendingResult) => (
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
                SECTION 5: FREE TO WATCH
               ==================================================== */}
            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight">Free to Watch</h2>
                        {/* Horizontal toggle button */}
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
                        href={`/movies?availability=free`}
                        className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                    >
                        More Free Content →
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {currentFreeItems.slice(0, 5).map((item: TMDBTrendingResult) => (
                        <div
                            key={item.id}
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
                                    <div className="absolute top-2 left-2 rounded-md bg-emerald-500/95 px-2 py-0.5 text-[9px] font-bold text-background uppercase tracking-wider">
                                        Free
                                    </div>
                                </div>
                                <h3 className="font-bold text-xs truncate group-hover:text-accent transition-colors">
                                    {item.title || item.name}
                                </h3>
                            </div>

                            {/* Streaming links info box placeholder */}
                            <div className="bg-background-elevated rounded-xl p-2.5 text-[10px] text-foreground-muted text-center flex items-center justify-center gap-1.5 hover:bg-background-elevated-hover transition-colors">
                                <Eye className="h-3 w-3 text-accent" />
                                <span>Click to view free streaming options</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
