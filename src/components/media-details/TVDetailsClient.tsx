/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { 
    Star, Clock, Calendar, Film, Heart, Bookmark, Globe, 
    Loader2, Plus, Trash2, ExternalLink,
    Facebook, Instagram, Twitter, Tv
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useRegion } from '@/context/RegionContext';
import { getWatchProvidersAction, getTVContentRatingsAction } from '@/app/actions/discover';
import { upsertMediaItem, deleteMediaItem } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { TMDBCastMember, TMDBCrewMember, TMDBVideo, TMDBWatchProviderResult } from '@/types';
import { MovieCard } from '@/components/movie-card';

interface TVDetailsClientProps {
    initialTV: any;
    initialUserItem: any;
}

export function TVDetailsClient({ initialTV, initialUserItem }: TVDetailsClientProps) {
    const t = useTranslations('MediaDetails');
    const locale = useLocale();
    const { region } = useRegion();

    const details = initialTV.details;
    const cast: TMDBCastMember[] = initialTV.cast || [];
    const crew: TMDBCrewMember[] = initialTV.crew || [];
    const recommendations = initialTV.recommendations?.results || [];

    // Client States
    const [user, setUser] = useState<User | null>(null);
    const [userItem, setUserItem] = useState<any>(initialUserItem);
    const [isPending, startTransition] = useTransition();

    // Localized release info & watch providers
    const [providers, setProviders] = useState<TMDBWatchProviderResult | null>(initialTV.providers);
    const [isLoadingProviders, setIsLoadingProviders] = useState(false);
    const [contentRatings, setContentRatings] = useState<any[]>(initialTV.content_ratings?.results || []);

    // Likes and Bookmarks local persistence backup
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);

    // Expanded Media Pagination
    const [activeMediaTab, setActiveMediaTab] = useState<'backdrops' | 'posters' | 'videos'>('backdrops');
    const [visibleMediaCount, setVisibleMediaCount] = useState(12);

    // Full Credits Modal
    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

    // TV Tracking progress inputs
    const [seasonProgress, setSeasonProgress] = useState<number>(initialUserItem?.season_progress || 0);
    const [episodeProgress, setEpisodeProgress] = useState<number>(initialUserItem?.episode_progress || 0);

    // Check supabase user session on mount
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUser(data.user);
                // Load liked / bookmarked states from localStorage
                setIsLiked(localStorage.getItem(`markd_liked_${data.user.id}_tv_${details.id}`) === 'true');
                setIsBookmarked(localStorage.getItem(`markd_bookmarked_${data.user.id}_tv_${details.id}`) === 'true');
            }
        });
    }, [details.id]);

    // Update watch providers and content ratings whenever region changes
    useEffect(() => {
        let active = true;

        const updateData = async () => {
            setIsLoadingProviders(true);
            try {
                const res = await getWatchProvidersAction(details.id, 'tv', region);
                if (active) setProviders(res);
            } catch (err) {
                console.error(err);
            } finally {
                if (active) setIsLoadingProviders(false);
            }

            // Fetch updated content ratings if they weren't in the initial payload
            try {
                const res = await getTVContentRatingsAction(details.id);
                if (active && res && res.results) {
                    setContentRatings(res.results);
                }
            } catch (err) {
                console.error(err);
            }
        };

        if (region !== 'TW') {
            updateData();
        } else {
            setProviders(initialTV.providers);
            setContentRatings(initialTV.content_ratings?.results || []);
        }

        return () => {
            active = false;
        };
    }, [region, details.id, initialTV.providers, initialTV.content_ratings]);

    // Sync progress local states if userItem changes
    useEffect(() => {
        if (userItem) {
            setSeasonProgress(userItem.season_progress || 0);
            setEpisodeProgress(userItem.episode_progress || 0);
        }
    }, [userItem]);

    // Compute certification & localized release date
    const getLocalizationData = () => {
        const ratingData = contentRatings.find((r) => r.iso_3166_1 === region);
        let cert = ratingData ? ratingData.rating : '';
        let isFallback = false;

        if (!cert) {
            // Fallback to US
            const usData = contentRatings.find((r) => r.iso_3166_1 === 'US');
            if (usData) {
                cert = usData.rating;
                isFallback = true;
            }
        }

        return { cert, isFallback };
    };

    const { cert, isFallback: isCertFallback } = getLocalizationData();

    // Map language code to full display name
    const getLanguageName = (code: string) => {
        try {
            const displayNames = new Intl.DisplayNames([locale], { type: 'language' });
            return displayNames.of(code) || code;
        } catch {
            return code;
        }
    };

    // YouTube Hero Trailer calculation
    const getHeroTrailer = (): TMDBVideo | null => {
        const videos: TMDBVideo[] = initialTV.videos?.results || [];
        const trailers = videos.filter((v) => v.type === 'Trailer' && v.site === 'YouTube');
        if (trailers.length > 0) {
            const official = trailers.find((t) => t.official);
            if (official) return official;
            return trailers.sort((a, b) => new Date(b.published_at || '').getTime() - new Date(a.published_at || '').getTime())[0];
        }
        return videos.find((v) => v.type === 'Teaser' && v.site === 'YouTube') || null;
    };

    const heroTrailer = getHeroTrailer();

    // Episode Runtime calculation (average)
    const getAverageRuntime = () => {
        const runtimes = details.episode_run_time || [];
        if (runtimes.length === 0) return null;
        const avg = Math.round(runtimes.reduce((a: number, b: number) => a + b, 0) / runtimes.length);
        const hours = Math.floor(avg / 60);
        const minutes = avg % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    const averageRuntimeStr = getAverageRuntime();

    // Creator / Production Crew filtration
    const creator = (details.created_by && details.created_by.length > 0) 
        ? { id: details.created_by[0].id, name: details.created_by[0].name } 
        : (crew.find((c) => c.job === 'Executive Producer') || null);

    const writers = crew.filter((c) => ['Screenplay', 'Writer', 'Story', 'Teleplay', 'Series Writer'].includes(c.job));
    const producers = crew.filter((c) => ['Producer', 'Executive Producer'].includes(c.job));
    const sourceMaterial = crew.find((c) => ['Novel', 'Original Story', 'Comic Book', 'Idea'].includes(c.job));

    // Social Links
    const extIds = initialTV.external_ids || {};
    const socialLinks = [
        { id: extIds.facebook_id, url: (id: string) => `https://facebook.com/${id}`, icon: Facebook },
        { id: extIds.twitter_id, url: (id: string) => `https://x.com/${id}`, icon: Twitter },
        { id: extIds.instagram_id, url: (id: string) => `https://instagram.com/${id}`, icon: Instagram },
        { id: details.homepage, url: (url: string) => url, icon: Globe, isDirect: true },
    ].filter((s) => s.id);

    // Watch Providers Grouping
    const [activeProviderTab, setActiveProviderTab] = useState<'flatrate' | 'rent' | 'buy'>('flatrate');

    const providerList = providers 
        ? (providers[activeProviderTab] || [])
        : [];

    // Keywords Parsing (TV show keywords are under results)
    const keywordList = initialTV.keywords?.results || [];

    // User Tracking Operations
    const handleStatusUpdate = (status: string) => {
        if (!user) return;
        startTransition(async () => {
            const ratingVal = userItem?.rating || null;
            const res = await upsertMediaItem({
                tmdb_id: details.id,
                media_type: 'tv',
                title: details.name,
                poster_path: details.poster_path,
                status: status as any,
                rating: ratingVal,
                season_progress: seasonProgress,
                episode_progress: episodeProgress,
            });
            if (!res?.error) {
                setUserItem({
                    ...userItem,
                    status,
                    rating: ratingVal,
                    season_progress: seasonProgress,
                    episode_progress: episodeProgress,
                });
            }
        });
    };

    const handleRatingUpdate = (rating: number | null) => {
        if (!user) return;
        startTransition(async () => {
            const statusVal = userItem?.status || 'plan_to_watch';
            const res = await upsertMediaItem({
                tmdb_id: details.id,
                media_type: 'tv',
                title: details.name,
                poster_path: details.poster_path,
                status: statusVal as any,
                rating,
                season_progress: seasonProgress,
                episode_progress: episodeProgress,
            });
            if (!res?.error) {
                setUserItem({
                    ...userItem,
                    status: statusVal,
                    rating,
                    season_progress: seasonProgress,
                    episode_progress: episodeProgress,
                });
            }
        });
    };

    const handleProgressSave = (newSeason: number, newEpisode: number) => {
        if (!user) return;
        startTransition(async () => {
            const statusVal = userItem?.status || 'plan_to_watch';
            const ratingVal = userItem?.rating || null;
            const res = await upsertMediaItem({
                tmdb_id: details.id,
                media_type: 'tv',
                title: details.name,
                poster_path: details.poster_path,
                status: statusVal as any,
                rating: ratingVal,
                season_progress: newSeason,
                episode_progress: newEpisode,
            });
            if (!res?.error) {
                setUserItem({
                    ...userItem,
                    status: statusVal,
                    rating: ratingVal,
                    season_progress: newSeason,
                    episode_progress: newEpisode,
                });
            }
        });
    };

    const handleToggleLibrary = () => {
        if (!user) return;
        startTransition(async () => {
            if (userItem) {
                const res = await deleteMediaItem(details.id, 'tv');
                if (!res?.error) {
                    setUserItem(null);
                }
            } else {
                const res = await upsertMediaItem({
                    tmdb_id: details.id,
                    media_type: 'tv',
                    title: details.name,
                    poster_path: details.poster_path,
                    status: 'plan_to_watch',
                    rating: null,
                    season_progress: 0,
                    episode_progress: 0,
                });
                if (!res?.error) {
                    setUserItem({
                        status: 'plan_to_watch',
                        rating: null,
                        season_progress: 0,
                        episode_progress: 0,
                    });
                }
            }
        });
    };

    const handleToggleLike = () => {
        if (!user) return;
        const nextState = !isLiked;
        setIsLiked(nextState);
        localStorage.setItem(`markd_liked_${user.id}_tv_${details.id}`, String(nextState));
    };

    const handleToggleBookmark = () => {
        if (!user) return;
        const nextState = !isBookmarked;
        setIsBookmarked(nextState);
        localStorage.setItem(`markd_bookmarked_${user.id}_tv_${details.id}`, String(nextState));
    };

    // Media Gallery Filtration
    const backdrops = initialTV.images?.backdrops || [];
    const posters = initialTV.images?.posters || [];
    const videoGallery = (initialTV.videos?.results || []).filter((v: TMDBVideo) => v.id !== heroTrailer?.id);

    const getMediaItems = () => {
        switch (activeMediaTab) {
            case 'backdrops': return backdrops;
            case 'posters': return posters;
            case 'videos': return videoGallery;
        }
    };

    const activeMediaItems = getMediaItems();

    // Map status key to localized status
    const getStatusText = (status: string) => {
        switch (status) {
            case 'Returning Series': return t('returningSeries') || 'Returning Series';
            case 'Ended': return t('ended') || 'Ended';
            case 'Canceled': return t('canceled') || 'Canceled';
            case 'In Production': return t('inProduction') || 'In Production';
            default: return status;
        }
    };

    return (
        <div className="min-h-screen bg-[#07070a] text-foreground pb-16">
            {/* 1. Hero Trailer Backdrop */}
            {heroTrailer ? (
                <div className="relative h-[50vh] md:h-[70vh] w-full border-b border-border/20 overflow-hidden">
                    <iframe
                        src={`https://www.youtube.com/embed/${heroTrailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${heroTrailer.key}&showinfo=0&rel=0&modestbranding=1`}
                        title={details.name}
                        className="absolute inset-0 w-full h-[120%] -translate-y-[10%] pointer-events-none scale-105 opacity-60"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-transparent to-black/40 z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#07070a] via-transparent to-transparent z-10" />
                </div>
            ) : details.backdrop_path ? (
                <div className="relative h-[40vh] md:h-[60vh] w-full overflow-hidden">
                    <Image
                        src={`https://image.tmdb.org/t/p/original${details.backdrop_path}`}
                        alt={details.name}
                        fill
                        className="object-cover object-top opacity-55"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#07070a]/60 to-transparent z-10" />
                </div>
            ) : (
                <div className="h-[20vh] bg-background-elevated" />
            )}

            {/* Content Body */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-48 relative z-25">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    
                    {/* Left Column (Poster, Providers, Social, Tracking) */}
                    <div className="w-full lg:w-80 shrink-0 space-y-6">
                        
                        {/* Poster */}
                        <div className="relative w-48 mx-auto lg:w-full overflow-hidden rounded-2xl shadow-2xl border border-border/40 bg-background-elevated" style={{ aspectRatio: '2/3' }}>
                            {details.poster_path ? (
                                <Image
                                    src={`https://image.tmdb.org/t/p/w500${details.poster_path}`}
                                    alt={details.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-foreground-subtle">
                                    <Film className="h-12 w-12 opacity-40" />
                                </div>
                            )}
                        </div>

                        {/* Watch Providers Panel */}
                        <div className="rounded-2xl border border-border/40 bg-background-elevated/40 backdrop-blur-xl p-5 space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-border/20">
                                <h3 className="text-sm font-bold uppercase tracking-wider">{t('whereToWatch')}</h3>
                                <div className="flex gap-2">
                                    {(['flatrate', 'rent', 'buy'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveProviderTab(tab)}
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider transition-colors ${
                                                activeProviderTab === tab
                                                    ? 'bg-accent text-background'
                                                    : 'text-foreground-muted hover:text-foreground'
                                            }`}
                                        >
                                            {t(tab)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {isLoadingProviders ? (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="h-6 w-6 text-accent animate-spin" />
                                </div>
                            ) : providerList.length > 0 ? (
                                <div className="flex flex-wrap gap-2.5">
                                    {providerList.map((p: any) => (
                                        <a
                                            key={p.provider_id}
                                            href={providers?.link || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={p.provider_name}
                                            className="relative h-10 w-10 rounded-lg overflow-hidden border border-border/20 hover:border-accent/40 transition-colors shadow-md block"
                                        >
                                            <img
                                                src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                                                alt={p.provider_name}
                                                className="h-full w-full object-cover"
                                            />
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-foreground-muted py-2">{t('notAvailable')}</p>
                            )}

                            <div className="pt-2 border-t border-border/10 flex items-center justify-between text-[9px] text-foreground-muted">
                                <span>{t('justWatchAttribution')}</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                            </div>
                        </div>

                        {/* Social/External Links */}
                        {socialLinks.length > 0 && (
                            <div className="flex justify-center gap-3">
                                {socialLinks.map((s: any, idx) => {
                                    const Icon = s.icon;
                                    return (
                                        <a
                                            key={idx}
                                            href={s.isDirect ? s.id : s.url(s.id)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2.5 rounded-full border border-border/40 bg-background-elevated/40 hover:bg-background-elevated hover:border-accent/40 text-foreground-muted hover:text-foreground transition-all duration-300"
                                        >
                                            <Icon className="h-4 w-4" />
                                        </a>
                                    );
                                })}
                            </div>
                        )}

                        {/* Tracking Panel */}
                        <div className="rounded-2xl border border-border/40 bg-background-elevated/60 backdrop-blur-2xl p-5 space-y-5">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground pb-2 border-b border-border/20">
                                Tracking Workspace
                            </h3>

                            {!user ? (
                                <Link
                                    href="/login"
                                    className="flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-center text-xs font-bold text-background transition-all hover:bg-accent-hover active:scale-[0.98] shadow-lg shadow-accent/20"
                                >
                                    {t('loginToTrack')}
                                </Link>
                            ) : (
                                <div className="space-y-4">
                                    {/* Add / Remove from Library */}
                                    <button
                                        onClick={handleToggleLibrary}
                                        disabled={isPending}
                                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-md ${
                                            userItem
                                                ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                                                : 'bg-accent text-background hover:bg-accent-hover shadow-accent/20'
                                        }`}
                                    >
                                        {isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : userItem ? (
                                            <>
                                                <Trash2 className="h-4 w-4" />
                                                {t('removeFromLibrary')}
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                {t('addToLibrary')}
                                            </>
                                        )}
                                    </button>

                                    {userItem && (
                                        <div className="space-y-4 pt-2 border-t border-border/10 fade-in">
                                            {/* Watch Status Selector */}
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                                                    {t('status')}
                                                </label>
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {(['plan_to_watch', 'watching', 'completed', 'dropped'] as const).map((status) => (
                                                        <button
                                                            key={status}
                                                            onClick={() => handleStatusUpdate(status)}
                                                            className={`text-[10px] font-bold py-1.5 px-2 rounded-lg border text-center transition-all ${
                                                                userItem.status === status
                                                                    ? 'bg-accent/10 border-accent text-accent'
                                                                    : 'bg-background-elevated/40 border-border/20 text-foreground-muted hover:border-border/40 hover:text-foreground'
                                                            }`}
                                                        >
                                                            {t(status)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Episode Progress Counter for TV */}
                                            <div className="space-y-3 pt-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                                                    Progress
                                                </label>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] text-foreground-muted uppercase tracking-wider">{t('season')}</span>
                                                        <div className="flex items-center gap-1.5 bg-background-elevated/80 rounded-lg border border-border/20 px-2 py-1">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={details.number_of_seasons}
                                                                value={seasonProgress}
                                                                onChange={(e) => {
                                                                    const val = Math.max(0, Math.min(details.number_of_seasons, Number(e.target.value)));
                                                                    setSeasonProgress(val);
                                                                    handleProgressSave(val, episodeProgress);
                                                                }}
                                                                className="w-full bg-transparent text-center font-bold focus:outline-none"
                                                            />
                                                            <span className="text-[10px] text-foreground-muted">/ {details.number_of_seasons}</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] text-foreground-muted uppercase tracking-wider">Episode</span>
                                                        <div className="flex items-center gap-1.5 bg-background-elevated/80 rounded-lg border border-border/20 px-2 py-1">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={details.number_of_episodes}
                                                                value={episodeProgress}
                                                                onChange={(e) => {
                                                                    const val = Math.max(0, Math.min(details.number_of_episodes, Number(e.target.value)));
                                                                    setEpisodeProgress(val);
                                                                    handleProgressSave(seasonProgress, val);
                                                                }}
                                                                className="w-full bg-transparent text-center font-bold focus:outline-none"
                                                            />
                                                            <span className="text-[10px] text-foreground-muted">/ {details.number_of_episodes}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Rating system */}
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                                                        {t('rating')}
                                                    </label>
                                                    {userItem.rating && (
                                                        <span className="text-[10px] font-bold text-accent">{userItem.rating} / 10</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                                        <button
                                                            key={star}
                                                            onClick={() => handleRatingUpdate(userItem.rating === star ? null : star)}
                                                            className="focus:outline-none transition-transform hover:scale-110"
                                                        >
                                                            <Star
                                                                className={`h-4.5 w-4.5 ${
                                                                    (userItem.rating ?? 0) >= star
                                                                        ? 'text-yellow-500 fill-yellow-500'
                                                                        : 'text-foreground-muted/30 hover:text-yellow-500/70'
                                                                }`}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Like / Bookmark toggles */}
                                            <div className="grid grid-cols-2 gap-2 pt-2">
                                                <button
                                                    onClick={handleToggleLike}
                                                    className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold border transition-all ${
                                                        isLiked
                                                            ? 'bg-pink-500/10 border-pink-500/30 text-pink-500'
                                                            : 'bg-background-elevated/40 border-border/20 text-foreground-muted hover:text-foreground'
                                                    }`}
                                                >
                                                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-pink-500' : ''}`} />
                                                    {isLiked ? t('liked') : t('like')}
                                                </button>
                                                <button
                                                    onClick={handleToggleBookmark}
                                                    className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold border transition-all ${
                                                        isBookmarked
                                                            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                                                            : 'bg-background-elevated/40 border-border/20 text-foreground-muted hover:text-foreground'
                                                    }`}
                                                >
                                                    <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-yellow-500' : ''}`} />
                                                    {isBookmarked ? t('bookmarked') : t('bookmark')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex-1 space-y-8 w-full">
                        
                        {/* Title Header */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                    {details.name}
                                </h1>
                                {details.tagline && (
                                    <p className="text-lg md:text-xl text-accent/80 font-medium italic">
                                        &quot;{details.tagline}&quot;
                                    </p>
                                )}
                            </div>

                            {/* Ratings & Certifications Pill Row */}
                            <div className="flex flex-wrap items-center gap-3">
                                {cert && (
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-background-elevated border border-border font-extrabold text-xs tracking-wider">
                                            <span className="text-foreground-muted text-[10px] uppercase font-bold">{t('certification')}:</span>
                                            <span className="text-foreground">{cert}</span>
                                        </div>
                                        {isCertFallback && (
                                            <span className="text-[9px] text-foreground-muted/70 mt-1">
                                                {t('certificationNote', { country: region })}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {details.vote_average > 0 && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-background-elevated border border-border font-bold text-xs">
                                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                        <span>{details.vote_average.toFixed(1)} / 10</span>
                                        <span className="text-[10px] text-foreground-muted">TMDB</span>
                                    </div>
                                )}

                                {initialTV.imdbRating && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 font-bold text-xs text-amber-500">
                                        <span>IMDb</span>
                                        <span className="text-foreground">{initialTV.imdbRating}</span>
                                    </div>
                                )}

                                {initialTV.rtScore && initialTV.rtScore !== 'N/A' && (
                                    <div className="flex items-center gap-3 font-bold text-xs">
                                        <div className={`flex items-center gap-1 px-3 py-1 rounded-md ${initialTV.rtStatus === 'fresh' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
                                            <span className="text-sm">🍅</span>
                                            <span>{initialTV.rtScore}</span>
                                        </div>
                                        {initialTV.rtAudienceScore && (
                                            <div className={`flex items-center gap-1 px-3 py-1 rounded-md ${initialTV.rtAudienceStatus === 'fresh' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-500' : 'bg-orange-500/10 border border-orange-500/20 text-orange-500'}`}>
                                                <span className="text-sm">🍿</span>
                                                <span>{initialTV.rtAudienceScore}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Core Metadata pills */}
                            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-foreground-muted border-t border-b border-border/20 py-3.5">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    <span>{details.first_air_date}</span>
                                </div>
                                {averageRuntimeStr && (
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-4 w-4" />
                                        <span>{averageRuntimeStr} / ep</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <Tv className="h-4 w-4" />
                                    <span>
                                        {details.number_of_seasons} {details.number_of_seasons === 1 ? t('season') : t('seasons')} ({details.number_of_episodes} {t('ep')})
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Globe className="h-4 w-4" />
                                    <span>{t('originalLanguage')}: {getLanguageName(details.original_language)}</span>
                                </div>
                                <div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 uppercase tracking-wider">
                                        {getStatusText(details.status)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Overview Plot */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold border-b border-border/20 pb-2">{t('synopsis')}</h3>
                            <p className="text-foreground-muted leading-relaxed text-sm md:text-base">
                                {details.overview}
                            </p>
                        </div>

                        {/* Production Crew Credits */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold border-b border-border/20 pb-2">Production</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
                                {creator && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider">{t('createdBy')}</p>
                                        <Link href={`/person/${creator.id}`} className="font-semibold text-accent hover:underline">
                                            {creator.name}
                                        </Link>
                                    </div>
                                )}
                                {writers.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider">{t('writer')}</p>
                                        <div className="flex flex-col gap-0.5">
                                            {writers.slice(0, 3).map((w) => (
                                                <Link key={w.id} href={`/person/${w.id}`} className="font-semibold text-accent hover:underline">
                                                    {w.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {producers.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider">{t('producer')}</p>
                                        <div className="flex flex-col gap-0.5">
                                            {producers.slice(0, 3).map((p) => (
                                                <Link key={p.id} href={`/person/${p.id}`} className="font-semibold text-accent hover:underline">
                                                    {p.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {sourceMaterial && (
                                    <div className="space-y-1 col-span-2 sm:col-span-1">
                                        <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider">{t('sourceMaterial')}</p>
                                        <p className="font-semibold text-foreground">{sourceMaterial.name} ({sourceMaterial.job})</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Cast List */}
                        {cast.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-border/20 pb-2">
                                    <h3 className="text-lg font-bold">{t('topCast')}</h3>
                                    <button 
                                        onClick={() => setIsCreditsModalOpen(true)}
                                        className="text-xs font-bold text-accent hover:text-accent-hover transition-colors"
                                    >
                                        {t('fullCredits')} →
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {cast.slice(0, 10).map((person) => (
                                        <Link
                                            key={person.id}
                                            href={`/person/${person.id}`}
                                            className="group bg-background-elevated/20 hover:bg-background-elevated/40 border border-border/30 rounded-xl p-3 space-y-2 text-center transition-all duration-300 shadow hover:shadow-lg flex flex-col items-center"
                                        >
                                            <div className="relative h-20 w-20 rounded-full overflow-hidden border border-border/40 group-hover:border-accent/40 transition-colors shadow">
                                                {person.profile_path ? (
                                                    <Image
                                                        src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                                                        alt={person.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-background-elevated text-foreground-subtle text-[10px] font-bold uppercase">
                                                        {person.name.slice(0, 2)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-foreground group-hover:text-accent transition-colors truncate max-w-[120px]" title={person.name}>
                                                    {person.name}
                                                </p>
                                                <p className="text-[10px] text-foreground-muted truncate max-w-[120px]" title={person.character}>
                                                    {person.character}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Clickable Keywords */}
                        {keywordList.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground-muted">{t('keywords')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {keywordList.map((kw: any) => (
                                        <Link
                                            key={kw.id}
                                            href={`/tv-shows?keywords=${encodeURIComponent(kw.name)}&keyword_id=${kw.id}`}
                                            className="px-3 py-1 rounded-full bg-background-elevated/40 border border-border/20 hover:border-accent/40 text-xs text-foreground-muted hover:text-foreground transition-colors"
                                        >
                                            #{kw.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Expanded Media Grid Section */}
                        {(backdrops.length > 0 || posters.length > 0 || videoGallery.length > 0) && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                                    <h3 className="text-lg font-bold">{t('expandedMedia')}</h3>
                                    <div className="flex gap-4 text-xs font-bold">
                                        {backdrops.length > 0 && (
                                            <button
                                                onClick={() => { setActiveMediaTab('backdrops'); setVisibleMediaCount(12); }}
                                                className={`transition-colors ${activeMediaTab === 'backdrops' ? 'text-accent' : 'text-foreground-muted hover:text-foreground'}`}
                                            >
                                                {t('backdrops')} ({backdrops.length})
                                            </button>
                                        )}
                                        {posters.length > 0 && (
                                            <button
                                                onClick={() => { setActiveMediaTab('posters'); setVisibleMediaCount(12); }}
                                                className={`transition-colors ${activeMediaTab === 'posters' ? 'text-accent' : 'text-foreground-muted hover:text-foreground'}`}
                                            >
                                                {t('posters')} ({posters.length})
                                            </button>
                                        )}
                                        {videoGallery.length > 0 && (
                                            <button
                                                onClick={() => { setActiveMediaTab('videos'); setVisibleMediaCount(12); }}
                                                className={`transition-colors ${activeMediaTab === 'videos' ? 'text-accent' : 'text-foreground-muted hover:text-foreground'}`}
                                            >
                                                {t('videos')} ({videoGallery.length})
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {activeMediaItems.slice(0, visibleMediaCount).map((item: any, idx: number) => (
                                        <div key={idx} className="relative rounded-xl overflow-hidden border border-border/20 bg-background-elevated/40" style={{ aspectRatio: activeMediaTab === 'posters' ? '2/3' : '16/9' }}>
                                            {activeMediaTab === 'videos' ? (
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${item.key}`}
                                                    title={item.name}
                                                    className="absolute inset-0 h-full w-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            ) : (
                                                <Image
                                                    src={`https://image.tmdb.org/t/p/w500${item.file_path}`}
                                                    alt="Media Gallery Asset"
                                                    fill
                                                    className="object-cover transition-transform duration-500 hover:scale-105"
                                                    loading="lazy"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {activeMediaItems.length > visibleMediaCount && (
                                    <div className="flex justify-center pt-2">
                                        <button
                                            onClick={() => setVisibleMediaCount((prev) => prev + 12)}
                                            className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-background-elevated text-xs font-bold transition-all"
                                        >
                                            {t('viewMore')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer Recommendations */}
                        {recommendations.length > 0 && (
                            <div className="space-y-4 pt-4 border-t border-border/10">
                                <h3 className="text-lg font-bold">{t('recommendations')}</h3>
                                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                                    {recommendations.slice(0, 12).map((item: any) => (
                                        <div key={item.id} className="w-40 md:w-48 shrink-0 snap-start">
                                            <MovieCard
                                                id={item.id}
                                                title={item.title || item.name}
                                                posterPath={item.poster_path}
                                                voteAverage={item.vote_average}
                                                releaseDate={item.release_date || item.first_air_date}
                                                mediaType="tv"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Full Credits Modal */}
            {isCreditsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setIsCreditsModalOpen(false)} />
                    <div className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-[#0c0c12] border border-border p-6 shadow-2xl z-10 space-y-6">
                        <div className="flex justify-between items-center border-b border-border/20 pb-3">
                            <h2 className="text-xl font-bold">{t('fullCredits')}</h2>
                            <button
                                onClick={() => setIsCreditsModalOpen(false)}
                                className="text-xs font-bold text-foreground-muted hover:text-foreground"
                            >
                                Close
                            </button>
                        </div>
                        <div className="space-y-6 text-sm">
                            <div>
                                <h3 className="font-extrabold text-accent uppercase tracking-widest text-xs mb-3">Cast ({cast.length})</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {cast.map((c) => (
                                        <div key={c.id} className="flex justify-between py-1 border-b border-border/10">
                                            <Link href={`/person/${c.id}`} className="font-semibold text-accent hover:underline">{c.name}</Link>
                                            <span className="text-foreground-muted truncate max-w-[180px]">{c.character}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-extrabold text-accent uppercase tracking-widest text-xs mb-3">Crew ({crew.length})</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {crew.map((c, idx) => (
                                        <div key={idx} className="flex justify-between py-1 border-b border-border/10">
                                            <Link href={`/person/${c.id}`} className="font-semibold text-accent hover:underline">{c.name}</Link>
                                            <span className="text-foreground-muted">{c.job} ({c.department})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
