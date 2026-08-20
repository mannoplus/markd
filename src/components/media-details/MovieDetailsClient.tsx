/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { 
    Star, Clock, Calendar, Film, Heart, Bookmark, Globe, 
    Loader2, Play, Plus, Trash2, ArrowUp,
    Facebook, Instagram, Twitter, Sparkles
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useRegion } from '@/context/RegionContext';
import { AiChatBox } from '@/components/AiChatBox';
import { getWatchProvidersAction, getMovieReleaseDatesAction } from '@/app/actions/discover';
import { upsertMediaItem, deleteMediaItem } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { TMDBCastMember, TMDBCrewMember, TMDBVideo, TMDBWatchProviderResult } from '@/types';
import { MovieCard } from '@/components/movie-card';
import { formatDuration } from '@/lib/formatters';

interface MovieDetailsClientProps {
    initialMovie: any;
    initialUserItem: any;
}

export function MovieDetailsClient({ initialMovie, initialUserItem }: MovieDetailsClientProps) {
    const t = useTranslations('MediaDetails');
    const locale = useLocale();
    const { region } = useRegion();

    const details = initialMovie.details;
    const cast: TMDBCastMember[] = initialMovie.cast || [];
    const crew: TMDBCrewMember[] = initialMovie.crew || [];
    const recommendations = initialMovie.recommendations?.results || [];

    // Client States
    const [user, setUser] = useState<User | null>(null);
    const [userItem, setUserItem] = useState<any>(initialUserItem);
    const [isPending, startTransition] = useTransition();

    // Localized release info & watch providers
    const [providers, setProviders] = useState<TMDBWatchProviderResult | null>(initialMovie.providers);
    const [isLoadingProviders, setIsLoadingProviders] = useState(false);
    const [releaseDates, setReleaseDates] = useState<any[]>(initialMovie.release_dates?.results || []);

    // Likes and Bookmarks local persistence backup
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);

    // Expanded Media Pagination
    const [activeMediaTab, setActiveMediaTab] = useState<'backdrops' | 'posters' | 'videos'>('backdrops');
    const [visibleMediaCount, setVisibleMediaCount] = useState(12);

    // Full Credits Modal, Trailer Modal, and scroll-to-top status
    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
    const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    // Check supabase user session on mount
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUser(data.user);
                // Load liked / bookmarked states from localStorage
                setIsLiked(localStorage.getItem(`markd_liked_${data.user.id}_movie_${details.id}`) === 'true');
                setIsBookmarked(localStorage.getItem(`markd_bookmarked_${data.user.id}_movie_${details.id}`) === 'true');
            }
        });
    }, [details.id]);

    // Update watch providers and release data when region changes
    useEffect(() => {
        let active = true;

        const updateData = async () => {
            setIsLoadingProviders(true);
            try {
                const res = await getWatchProvidersAction(details.id, 'movie', region);
                if (active) setProviders(res);
            } catch (err) {
                console.error(err);
            } finally {
                if (active) setIsLoadingProviders(false);
            }

            try {
                const res = await getMovieReleaseDatesAction(details.id);
                if (active && res && res.results) {
                    setReleaseDates(res.results);
                }
            } catch (err) {
                console.error(err);
            }
        };

        if (region !== 'TW') {
            updateData();
        } else {
            setProviders(initialMovie.providers);
            setReleaseDates(initialMovie.release_dates?.results || []);
        }

        return () => {
            active = false;
        };
    }, [region, details.id, initialMovie.providers, initialMovie.release_dates]);

    // Handle Scroll for Scroll-to-Top Button
    useEffect(() => {
        const handleScroll = () => {
            const threshold = document.documentElement.scrollHeight - window.innerHeight - 300;
            setShowScrollTop(window.scrollY >= threshold && window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Compute certification & localized release date
    const getLocalizationData = () => {
        const countryData = releaseDates.find((r) => r.iso_3166_1 === region);
        let cert = '';
        let date = '';
        let isFallback = false;

        if (countryData && countryData.release_dates?.length > 0) {
            const match = countryData.release_dates.find((d: any) => d.certification);
            cert = match ? match.certification : '';
            date = countryData.release_dates[0].release_date;
        }

        if (!cert) {
            // Fallback to US
            const usData = releaseDates.find((r) => r.iso_3166_1 === 'US');
            if (usData && usData.release_dates?.length > 0) {
                const match = usData.release_dates.find((d: any) => d.certification);
                cert = match ? match.certification : '';
                date = usData.release_dates[0].release_date;
                isFallback = true;
            }
        }

        return { cert, date, isFallback };
    };

    const { cert, date: localizedReleaseDate, isFallback: isCertFallback } = getLocalizationData();

    // Clean release date formatting
    const formatCleanDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
        const parts = datePart.split('-');
        if (parts.length !== 3) return dateStr;
        
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        
        try {
            const d = new Date(year, month, day);
            return d.toLocaleDateString(locale === 'zh-TW' ? 'zh-TW' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

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
        const videos: TMDBVideo[] = initialMovie.videos?.results || [];
        const trailers = videos.filter((v) => v.type === 'Trailer' && v.site === 'YouTube');
        if (trailers.length > 0) {
            const official = trailers.find((t) => t.official);
            if (official) return official;
            return trailers.sort((a, b) => new Date(b.published_at || '').getTime() - new Date(a.published_at || '').getTime())[0];
        }
        return videos.find((v) => v.type === 'Teaser' && v.site === 'YouTube') || null;
    };

    const heroTrailer = getHeroTrailer();

    // Financial Formatting
    const formatRevenue = (rev: number) => {
        if (!rev || rev === 0) return t('notAvailable');
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(rev);
    };

    // Production Crew filtration
    const director = crew.find((c) => c.job === 'Director') || initialMovie.director;
    const writers = crew.filter((c) => ['Screenplay', 'Writer', 'Story', 'Teleplay'].includes(c.job));
    const producers = crew.filter((c) => ['Producer', 'Executive Producer'].includes(c.job));
    const sourceMaterial = crew.find((c) => ['Novel', 'Original Story', 'Comic Book', 'Idea'].includes(c.job));

    // Social Links
    const extIds = initialMovie.external_ids || {};
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

    // Keywords Parsing
    const keywordList = initialMovie.keywords?.keywords || [];

    // Translate Watch Status nicely
    const getStatusLabel = (statusVal: string) => {
        const key = statusVal === 'plan_to_watch' ? 'planToWatch' : statusVal;
        return t(key);
    };

    // Map watch provider tab string to localized tab label
    const getProviderTabLabel = (tabVal: string) => {
        if (tabVal === 'flatrate') return t('stream');
        return t(tabVal);
    };

    // Map streaming providers to their official website urls directly
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

    // User Tracking Operations
    const handleStatusUpdate = (status: string) => {
        if (!user) return;
        startTransition(async () => {
            const ratingVal = userItem?.rating || null;
            const res = await upsertMediaItem({
                tmdb_id: details.id,
                media_type: 'movie',
                title: details.title,
                poster_path: details.poster_path,
                status: status as any,
                rating: ratingVal,
                season_progress: null,
                episode_progress: null,
            });
            if (!res?.error) {
                setUserItem({
                    ...userItem,
                    status,
                    rating: ratingVal,
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
                media_type: 'movie',
                title: details.title,
                poster_path: details.poster_path,
                status: statusVal as any,
                rating,
                season_progress: null,
                episode_progress: null,
            });
            if (!res?.error) {
                setUserItem({
                    ...userItem,
                    status: statusVal,
                    rating,
                });
            }
        });
    };

    const handleToggleLibrary = () => {
        if (!user) return;
        startTransition(async () => {
            if (userItem) {
                const res = await deleteMediaItem(details.id, 'movie');
                if (!res?.error) {
                    setUserItem(null);
                }
            } else {
                const res = await upsertMediaItem({
                    tmdb_id: details.id,
                    media_type: 'movie',
                    title: details.title,
                    poster_path: details.poster_path,
                    status: 'plan_to_watch',
                    rating: null,
                    season_progress: null,
                    episode_progress: null,
                });
                if (!res?.error) {
                    setUserItem({
                        status: 'plan_to_watch',
                        rating: null,
                    });
                }
            }
        });
    };

    const handleToggleLike = () => {
        if (!user) return;
        const nextState = !isLiked;
        setIsLiked(nextState);
        localStorage.setItem(`markd_liked_${user.id}_movie_${details.id}`, String(nextState));
    };

    const handleToggleBookmark = () => {
        if (!user) return;
        const nextState = !isBookmarked;
        setIsBookmarked(nextState);
        localStorage.setItem(`markd_bookmarked_${user.id}_movie_${details.id}`, String(nextState));
    };

    // Media Gallery Filtering
    const backdrops = initialMovie.images?.backdrops || [];
    const posters = initialMovie.images?.posters || [];
    const videoGallery = (initialMovie.videos?.results || []).filter((v: TMDBVideo) => v.id !== heroTrailer?.id);

    const getMediaItems = () => {
        switch (activeMediaTab) {
            case 'backdrops': return backdrops;
            case 'posters': return posters;
            case 'videos': return videoGallery;
        }
    };

    const activeMediaItems = getMediaItems();

    return (
        <div className="min-h-screen bg-[#07070a] text-foreground pb-16">
            {/* 1. Backdrop Area */}
            <div className="relative h-[40vh] md:h-[60vh] w-full overflow-hidden bg-black border-b border-border/20">
                {details.backdrop_path ? (
                    <Image
                        src={`https://image.tmdb.org/t/p/original${details.backdrop_path}`}
                        alt={details.title}
                        fill
                        className="object-cover object-top opacity-50"
                        priority
                    />
                ) : (
                    <div className="absolute inset-0 bg-background-elevated/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#07070a]/60 to-transparent z-10" />
            </div>

            {/* Content Body */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-48 relative z-25">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    
                    {/* Left Column (Poster, Tracking Workspace, Providers, Social) */}
                    <div className="w-full lg:w-80 shrink-0 space-y-6">
                        
                        {/* Poster */}
                        <div className="relative w-48 mx-auto lg:w-full overflow-hidden rounded-2xl shadow-2xl border border-border/40 bg-background-elevated" style={{ aspectRatio: '2/3' }}>
                            {details.poster_path ? (
                                <Image
                                    src={`https://image.tmdb.org/t/p/w500${details.poster_path}`}
                                    alt={details.title}
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

                        {/* Tracking Panel (Repositioned under poster) */}
                        <div className="rounded-2xl border border-border/30 bg-background-elevated/60 backdrop-blur-2xl p-4 space-y-4 shadow-xl">
                            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-foreground-muted pb-1.5 border-b border-border/15">
                                {t('trackingWorkspace')}
                            </h3>

                            {!user ? (
                                <Link
                                    href="/login"
                                    className="flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-center text-xs font-black uppercase tracking-wider text-background transition-all hover:bg-accent-hover active:scale-[0.98] shadow-lg shadow-accent/20"
                                >
                                    {t('loginToTrack')}
                                </Link>
                            ) : (
                                <div className="space-y-4">
                                    <button
                                        onClick={handleToggleLibrary}
                                        disabled={isPending}
                                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-md ${
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
                                        <div className="space-y-4 pt-3 border-t border-border/10 fade-in">
                                            {/* Watch Status Selector */}
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-wider text-foreground-muted">
                                                    {t('status')}
                                                </label>
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {(['plan_to_watch', 'watching', 'completed', 'dropped'] as const).map((status) => (
                                                        <button
                                                            key={status}
                                                            onClick={() => handleStatusUpdate(status)}
                                                            className={`text-[9px] font-black py-1.5 px-2 rounded-lg border text-center transition-all ${
                                                                userItem.status === status
                                                                    ? 'bg-accent/10 border-accent text-accent'
                                                                    : 'bg-background-elevated/40 border-border/20 text-foreground-muted hover:border-border/40 hover:text-foreground'
                                                            }`}
                                                        >
                                                            {getStatusLabel(status)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Rating system */}
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[9px] font-black uppercase tracking-wider text-foreground-muted">
                                                        {t('rating')}
                                                    </label>
                                                    {userItem.rating && (
                                                        <span className="text-[10px] font-bold text-accent">{userItem.rating} / 10</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between bg-background-elevated/40 border border-border/20 rounded-lg p-1.5">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                                        <button
                                                            key={star}
                                                            onClick={() => handleRatingUpdate(userItem.rating === star ? null : star)}
                                                            className="focus:outline-none transition-transform hover:scale-120"
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
                                            <div className="grid grid-cols-2 gap-2 pt-1.5">
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

                        {/* Compact Watch Providers */}
                        <div className="rounded-2xl border border-border/30 bg-background-elevated/40 backdrop-blur-xl p-4 space-y-3 shadow-md">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-border/15">
                                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-foreground-muted">{t('whereToWatch')}</h3>
                                <div className="flex gap-1 bg-background/40 p-0.5 rounded-lg border border-border/25">
                                    {(['flatrate', 'rent', 'buy'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveProviderTab(tab)}
                                            className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider transition-colors ${
                                                activeProviderTab === tab
                                                    ? 'bg-accent text-background'
                                                    : 'text-foreground-subtle hover:text-foreground hover:bg-background-elevated/35'
                                            }`}
                                        >
                                            {getProviderTabLabel(tab)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {isLoadingProviders ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-5 w-5 text-accent animate-spin" />
                                </div>
                            ) : providerList.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {providerList.map((p: any) => (
                                        <a
                                            key={p.provider_id}
                                            href={getProviderUrl(p.provider_name, providers?.link || '')}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={p.provider_name}
                                            className="relative h-8 w-8 rounded-lg overflow-hidden border border-border/20 hover:border-accent/40 transition-colors shadow-sm block"
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
                                <p className="text-[10px] text-foreground-muted py-1">{t('notAvailable')}</p>
                            )}
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
                                            className="p-2.5 rounded-full border border-border/40 bg-background-elevated/40 hover:bg-background-elevated hover:border-accent/40 text-foreground-muted hover:text-foreground transition-all duration-300 shadow-sm"
                                        >
                                            <Icon className="h-4 w-4" />
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column (Info, Plot, Crew, Cast, Media, Similars) */}
                    <div className="flex-1 space-y-8 w-full min-w-0">
                        
                        {/* Title Header */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                    {details.title}
                                </h1>
                                {details.tagline && (
                                    <p className="text-lg md:text-xl text-accent/80 font-medium italic">
                                        &quot;{details.tagline}&quot;
                                    </p>
                                )}
                            </div>

                            {/* Ratings & Certifications Pill Row */}
                            <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-3">
                                    {cert && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-background-elevated border border-border font-extrabold text-xs tracking-wider h-8">
                                            <span className="text-foreground-muted text-[10px] uppercase font-bold">{t('certification')}:</span>
                                            <span className="text-foreground">{cert}</span>
                                        </div>
                                    )}

                                    {details.vote_average > 0 && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-background-elevated border border-border font-bold text-xs h-8">
                                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                            <span>{details.vote_average.toFixed(1)}</span>
                                            <span className="text-[10px] text-foreground-muted">TMDB</span>
                                        </div>
                                    )}

                                    {initialMovie.imdbRating && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 font-bold text-xs text-amber-500 h-8">
                                            <span>IMDb</span>
                                            <span className="text-foreground">{initialMovie.imdbRating}</span>
                                        </div>
                                    )}

                                    {initialMovie.rtScore && initialMovie.rtScore !== 'N/A' && (
                                        <div className="flex items-center gap-2.5 font-bold text-xs h-8">
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md h-full ${initialMovie.rtStatus === 'fresh' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
                                                <span className="text-sm">🍅</span>
                                                <span>{initialMovie.rtScore}</span>
                                            </div>
                                            {initialMovie.rtAudienceScore && (
                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md h-full ${initialMovie.rtAudienceStatus === 'fresh' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-500' : 'bg-orange-500/10 border border-orange-500/20 text-orange-500'}`}>
                                                    <span className="text-sm">🍿</span>
                                                    <span>{initialMovie.rtAudienceScore}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Inline Play Trailer Badge (Pill styled with glowing effects) */}
                                    {heroTrailer && (
                                        <button
                                            onClick={() => setIsTrailerModalOpen(true)}
                                            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-accent/15 border border-accent/30 font-extrabold text-xs tracking-wider h-8 hover:bg-accent/25 hover:border-accent hover:shadow-[0_0_12px_rgba(20,240,240,0.35)] transition-all cursor-pointer text-accent"
                                        >
                                            <Play className="h-3.5 w-3.5 fill-current" />
                                            <span>{t('trailer')}</span>
                                        </button>
                                    )}

                                    {/* Ask AI Pill Button */}
                                    <button
                                        onClick={() => setIsAiChatOpen(true)}
                                        data-ai-trigger="true"
                                        className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-accent/15 border border-accent/30 font-extrabold text-xs tracking-wider h-8 hover:bg-accent/25 hover:border-accent hover:shadow-[0_0_12px_rgba(20,240,240,0.35)] transition-all cursor-pointer text-accent"
                                    >
                                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                                        <span>{t('askAi')}</span>
                                    </button>
                                </div>
                                {isCertFallback && cert && (
                                    <p className="text-[10px] text-foreground-muted/70 italic">
                                        {t('certificationNote', { country: region })}
                                    </p>
                                )}
                            </div>

                            {/* Core Metadata pills */}
                            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-foreground-muted border-t border-b border-border/20 py-3.5">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatCleanDate(localizedReleaseDate || details.release_date)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    <span>{formatDuration(details.runtime, locale)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Globe className="h-4 w-4" />
                                    <span>{t('originalLanguage')}: {getLanguageName(details.original_language)}</span>
                                </div>
                                <div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        details.status === 'Released' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'
                                    }`}>
                                        {details.status === 'Released' ? t('released') : t('unreleased')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Synopsis section */}
                        <div className="space-y-3 bg-[#0c0c12]/40 border border-border/15 p-5 rounded-2xl">
                            <h3 className="text-lg font-bold border-b border-border/20 pb-2">{t('synopsis')}</h3>
                            <p className="text-foreground-muted leading-relaxed text-sm md:text-base break-words">
                                {details.overview}
                            </p>
                        </div>

                        {/* Compact Financials Row */}
                        <div className="flex flex-wrap items-center gap-6 rounded-xl border border-border/20 bg-background-elevated/15 py-3.5 px-5 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">{t('revenue')}:</span>
                                <span className="font-extrabold text-foreground">{formatRevenue(details.revenue)}</span>
                            </div>
                            <div className="w-[1px] h-4 bg-border/20 hidden sm:block" />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">{t('budget')}:</span>
                                <span className="font-extrabold text-foreground">{formatRevenue(details.budget)}</span>
                            </div>
                        </div>

                        {/* Production Crew Credits */}
                        <div className="space-y-4 bg-[#0c0c12]/20 border border-border/10 p-5 rounded-2xl">
                            <h3 className="text-lg font-bold border-b border-border/20 pb-2">{t('production')}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
                                {director && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider">{t('director')}</p>
                                        <Link href={`/person/${director.id}`} className="font-semibold text-accent hover:underline">
                                            {director.name}
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
                                        className="text-xs font-black uppercase tracking-wider text-accent hover:text-accent-hover transition-colors px-3 py-1 rounded bg-accent/5 border border-accent/20 cursor-pointer"
                                    >
                                        {t('fullCredits')}
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

                        {/* Expanded Media Grid Section */}
                        {(backdrops.length > 0 || posters.length > 0 || videoGallery.length > 0) && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                                    <h3 className="text-lg font-bold">{t('expandedMedia')}</h3>
                                    <div className="flex gap-4 text-xs font-bold">
                                        {backdrops.length > 0 && (
                                            <button
                                                onClick={() => { setActiveMediaTab('backdrops'); setVisibleMediaCount(12); }}
                                                className={`transition-colors cursor-pointer ${activeMediaTab === 'backdrops' ? 'text-accent' : 'text-foreground-muted hover:text-foreground'}`}
                                            >
                                                {t('backdrops')} ({backdrops.length})
                                            </button>
                                        )}
                                        {posters.length > 0 && (
                                            <button
                                                onClick={() => { setActiveMediaTab('posters'); setVisibleMediaCount(12); }}
                                                className={`transition-colors cursor-pointer ${activeMediaTab === 'posters' ? 'text-accent' : 'text-foreground-muted hover:text-foreground'}`}
                                            >
                                                {t('posters')} ({posters.length})
                                            </button>
                                        )}
                                        {videoGallery.length > 0 && (
                                            <button
                                                onClick={() => { setActiveMediaTab('videos'); setVisibleMediaCount(12); }}
                                                className={`transition-colors cursor-pointer ${activeMediaTab === 'videos' ? 'text-accent' : 'text-foreground-muted hover:text-foreground'}`}
                                            >
                                                {t('videos')} ({videoGallery.length})
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {activeMediaItems.slice(0, visibleMediaCount).map((item: any, idx: number) => (
                                        <div key={idx} className="relative rounded-xl overflow-hidden border border-border/20 bg-background-elevated/40" style={{ aspectRatio: activeMediaTab === 'posters' ? '2/3' : '16/9' }}>
                                            {/* Photo/Video type indicator badge */}
                                            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-border/20 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 text-foreground">
                                                {activeMediaTab === 'videos' ? (
                                                    <>
                                                        <Play className="h-2.5 w-2.5 fill-current" />
                                                        <span>Video</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Film className="h-2.5 w-2.5" />
                                                        <span>Photo</span>
                                                    </>
                                                )}
                                            </div>

                                            {activeMediaTab === 'videos' ? (
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${item.key}`}
                                                    title={item.name}
                                                    className="absolute inset-0 h-full w-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            ) : (
                                                <div 
                                                    className="relative w-full h-full cursor-zoom-in"
                                                    onClick={() => setLightboxImage(`https://image.tmdb.org/t/p/original${item.file_path}`)}
                                                >
                                                    <Image
                                                        src={`https://image.tmdb.org/t/p/w500${item.file_path}`}
                                                        alt="Media Gallery Asset"
                                                        fill
                                                        className="object-cover transition-transform duration-500 hover:scale-105"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-center gap-4 pt-2">
                                    {activeMediaItems.length > visibleMediaCount && (
                                        <button
                                            onClick={() => setVisibleMediaCount((prev) => prev + 12)}
                                            className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-background-elevated text-xs font-bold transition-all cursor-pointer text-foreground hover:text-accent"
                                        >
                                            {t('viewMore')}
                                        </button>
                                    )}
                                    {visibleMediaCount > 12 && (
                                        <button
                                            onClick={() => setVisibleMediaCount(12)}
                                            className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-background-elevated text-xs font-bold transition-all cursor-pointer text-foreground-muted hover:text-foreground"
                                        >
                                            View Less
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Keywords (Repositioned under media) */}
                        {keywordList.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-border/10">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground-muted">{t('keywords')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {keywordList.map((kw: any) => (
                                        <Link
                                            key={kw.id}
                                            href={`/movies?keywords=${encodeURIComponent(kw.name)}&keyword_id=${kw.id}`}
                                            className="px-3 py-1 rounded-full bg-background-elevated/40 border border-border/20 hover:border-accent/40 text-xs text-foreground-muted hover:text-foreground transition-colors"
                                        >
                                            #{kw.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer Recommendations */}
                        {recommendations.length > 0 && (
                            <div className="space-y-4 pt-6 border-t border-border/10">
                                <h3 className="text-lg font-bold">{t('recommendations')}</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {recommendations.slice(0, 12).map((item: any) => (
                                        <div key={item.id} className="w-full">
                                            <MovieCard
                                                id={item.id}
                                                title={item.title || item.name}
                                                posterPath={item.poster_path}
                                                voteAverage={item.vote_average}
                                                releaseDate={item.release_date || item.first_air_date}
                                                mediaType="movie"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Scroll to Top floating button */}
            {showScrollTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-accent text-background hover:bg-accent-hover active:scale-95 transition-all shadow-lg hover:shadow-accent/25 flex items-center justify-center cursor-pointer border border-accent/20"
                    title="Scroll to Top"
                >
                    <ArrowUp className="h-5 w-5" />
                </button>
            )}

            {/* Trailer Modal Popup */}
            {isTrailerModalOpen && heroTrailer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsTrailerModalOpen(false)} />
                    <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden border border-border shadow-2xl z-10 bg-black">
                        <iframe
                            src={`https://www.youtube.com/embed/${heroTrailer.key}?autoplay=1`}
                            title={details.title}
                            className="absolute inset-0 h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                        <button
                            onClick={() => setIsTrailerModalOpen(false)}
                            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-foreground transition-colors border border-border/20 cursor-pointer"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Image Lightbox Modal */}
            {lightboxImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setLightboxImage(null)} />
                    <div className="relative max-w-full max-h-full rounded-xl overflow-hidden border border-border/40 shadow-2xl z-10 bg-black">
                        <img
                            src={lightboxImage}
                            alt="Enlarged media asset"
                            className="max-w-full max-h-[90vh] object-contain"
                        />
                        <button
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-foreground transition-colors border border-border/20 cursor-pointer"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Full Credits Modal (Cast/Crew sections separated with rounded profile avatars) */}
            {isCreditsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setIsCreditsModalOpen(false)} />
                    <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[#0c0c12] border border-border p-6 shadow-2xl z-10 space-y-6">
                        <div className="flex justify-between items-center border-b border-border/20 pb-3">
                            <h2 className="text-xl font-bold">{t('fullCredits')}</h2>
                            <button
                                onClick={() => setIsCreditsModalOpen(false)}
                                className="text-xs font-bold text-foreground-muted hover:text-foreground cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                        <div className="space-y-6 text-sm">
                            <div>
                                <h3 className="font-extrabold text-accent uppercase tracking-widest text-xs mb-3 border-b border-border/25 pb-1">
                                    Cast ({cast.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                                    {cast.map((c) => (
                                        <div key={c.id} className="flex items-center gap-3 py-1.5 border-b border-border/10">
                                            <div className="relative h-9 w-9 rounded-full overflow-hidden shrink-0 border border-border/30 bg-background-elevated">
                                                {c.profile_path ? (
                                                    <img
                                                        src={`https://image.tmdb.org/t/p/w200${c.profile_path}`}
                                                        alt={c.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground-muted uppercase font-bold">
                                                        {c.name.slice(0, 2)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <Link 
                                                    href={`/person/${c.id}`} 
                                                    onClick={() => setIsCreditsModalOpen(false)} 
                                                    className="font-semibold text-accent hover:underline block truncate"
                                                >
                                                    {c.name}
                                                </Link>
                                                <span className="text-[11px] text-foreground-muted block truncate">{c.character}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-extrabold text-accent uppercase tracking-widest text-xs mb-3 border-b border-border/25 pb-1">
                                    Crew ({crew.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                                    {crew.map((c, idx) => (
                                        <div key={idx} className="flex items-center gap-3 py-1.5 border-b border-border/10">
                                            <div className="relative h-9 w-9 rounded-full overflow-hidden shrink-0 border border-border/30 bg-background-elevated">
                                                {c.profile_path ? (
                                                    <img
                                                        src={`https://image.tmdb.org/t/p/w200${c.profile_path}`}
                                                        alt={c.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground-muted uppercase font-bold">
                                                        {c.name.slice(0, 2)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <Link 
                                                    href={`/person/${c.id}`} 
                                                    onClick={() => setIsCreditsModalOpen(false)} 
                                                    className="font-semibold text-accent hover:underline block truncate"
                                                >
                                                    {c.name}
                                                </Link>
                                                <span className="text-[11px] text-foreground-muted block truncate">{c.job} ({c.department})</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Chat Box overlay component */}
            <AiChatBox
                mediaId={details.id}
                mediaType="movie"
                title={details.title}
                overview={details.overview}
                locale={locale}
                isOpen={isAiChatOpen}
                setIsOpen={setIsAiChatOpen}
            />
        </div>
    );
}
