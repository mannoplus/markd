'use client';

import { useState, useEffect } from 'react';
import { Film, Tv, Clock, Star, Globe, Lock, FolderPlus, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { getUserMediaItems } from '@/app/actions';
import { Link } from '@/i18n/routing';
import { SectionHeader } from '@/components/section-header';

export default function ProfilePage() {
    const t = useTranslations('Profile');

    const [user, setUser] = useState<{ email?: string } | null>(null);
    const [stats, setStats] = useState({
        moviesWatched: 0,
        showsWatched: 0,
        hoursWatched: 0,
        avgRating: 0,
    });

    const [privacy, setPrivacy] = useState({
        isPublic: true,
        showHistory: true,
        showRatings: true,
    });

    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUser(data.user);
        });

        getUserMediaItems().then((res) => {
            if (res.data) {
                const completedMovies = res.data.filter((i) => i.status === 'completed' && i.media_type === 'movie').length;
                const completedShows = res.data.filter((i) => i.status === 'completed' && i.media_type === 'tv').length;
                const ratedItems = res.data.filter((i) => i.rating && i.rating > 0);
                const avg = ratedItems.length > 0
                    ? parseFloat((ratedItems.reduce((acc, i) => acc + (i.rating || 0), 0) / ratedItems.length).toFixed(1))
                    : 0;

                setStats({
                    moviesWatched: completedMovies,
                    showsWatched: completedShows,
                    hoursWatched: Math.round((completedMovies * 115 + completedShows * 350) / 60),
                    avgRating: avg,
                });
            }
        });
    }, []);

    const handleTogglePrivacy = (key: keyof typeof privacy) => {
        setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }));
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const TASTE_DNA_BARS = [
        { label: t('tasteMindBending'), pct: 92 },
        { label: t('tasteSuspense'), pct: 85 },
        { label: t('tasteEmotional'), pct: 78 },
        { label: t('tasteVisual'), pct: 88 },
    ];

    const STAT_CARDS = [
        { label: t('moviesWatched'), value: String(stats.moviesWatched), icon: Film },
        { label: t('showsWatched'), value: String(stats.showsWatched), icon: Tv },
        { label: t('hoursWatched'), value: `${stats.hoursWatched}${t('hoursSuffix')}`, icon: Clock },
        { label: t('avgRating'), value: stats.avgRating ? `★ ${stats.avgRating}` : '—', icon: Star },
    ];

    const PRIVACY_ROWS = [
        {
            key: 'isPublic' as const,
            label: t('publicProfileLabel'),
            description: t('publicProfileDesc'),
        },
        {
            key: 'showHistory' as const,
            label: t('publicHistoryLabel'),
            description: t('publicHistoryDesc'),
        },
        {
            key: 'showRatings' as const,
            label: t('publicRatingsLabel'),
            description: t('publicRatingsDesc'),
        },
    ];

    return (
        <div className="mx-auto max-w-5xl space-y-12 px-4 pb-24 pt-16 fade-in sm:px-6 lg:px-8">
            {/* Profile Card Header */}
            <section className="card relative overflow-hidden p-6 sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/[0.04] blur-2xl" />
                <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-border bg-background-elevated text-4xl font-black text-foreground">
                        {user?.email?.[0]?.toUpperCase() || 'M'}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                            <h1 className="truncate text-2xl font-bold text-foreground sm:text-3xl">
                                {user?.email?.split('@')[0] || t('defaultName')}
                            </h1>
                            <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                                    privacy.isPublic
                                        ? 'border-success/30 bg-success/10 text-success'
                                        : 'border-border bg-background-elevated text-foreground-muted'
                                }`}
                            >
                                {privacy.isPublic ? (
                                    <><Globe className="h-3 w-3" />{t('publicProfile')}</>
                                ) : (
                                    <><Lock className="h-3 w-3" />{t('privateProfile')}</>
                                )}
                            </span>
                        </div>

                        <p className="max-w-md text-sm leading-relaxed text-foreground-muted">{t('bio')}</p>

                        <p className="pt-1 text-xs font-medium text-foreground-subtle">
                            {t('memberSince', { year: new Date().getFullYear() })}
                        </p>
                    </div>
                </div>
            </section>

            {/* Cinema Statistics Grid */}
            <section className="space-y-5">
                <SectionHeader eyebrow="Stats" title={t('statsHeading')} />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {STAT_CARDS.map((card) => {
                        const Icon = card.icon;
                        return (
                            <div key={card.label} className="card space-y-3 p-5">
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
                                    <Icon className="h-3.5 w-3.5" />
                                    <span>{card.label}</span>
                                </div>
                                <span className="block text-3xl font-bold tracking-tight text-foreground">
                                    {card.value}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Taste DNA & Breakdown */}
            <section className="space-y-5">
                <SectionHeader eyebrow="Taste" title={t('tasteDnaHeading')} />
                <div className="card space-y-5 p-6">
                    {TASTE_DNA_BARS.map((bar, idx) => (
                        <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                                <span className="text-foreground">{bar.label}</span>
                                <span className="shrink-0 font-mono text-foreground-muted">
                                    {t('affinity', { pct: bar.pct })}
                                </span>
                            </div>
                            <div
                                role="progressbar"
                                aria-valuenow={bar.pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={bar.label}
                                className="h-1.5 w-full overflow-hidden rounded-full bg-background-elevated"
                            >
                                <div
                                    className="h-full rounded-full bg-foreground/80 transition-all duration-700"
                                    style={{ width: `${bar.pct}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Privacy & Visibility Settings */}
            <section className="space-y-5">
                <SectionHeader
                    eyebrow="Privacy"
                    title={t('privacySettings')}
                    actionLabel={isSaved ? t('saved') : undefined}
                >
                    {isSaved && <span className="text-xs font-semibold text-success">{t('saved')}</span>}
                </SectionHeader>

                <div className="card divide-y divide-border/40">
                    {PRIVACY_ROWS.map((row) => {
                        const isOn = privacy[row.key];
                        return (
                            <div key={row.key} className="flex items-center justify-between gap-4 p-5">
                                <div className="min-w-0 space-y-0.5">
                                    <span className="block text-sm font-semibold text-foreground">{row.label}</span>
                                    <p className="text-xs leading-relaxed text-foreground-muted">{row.description}</p>
                                </div>
                                <button
                                    role="switch"
                                    aria-checked={isOn}
                                    aria-label={row.label}
                                    onClick={() => handleTogglePrivacy(row.key)}
                                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                                        isOn ? 'bg-foreground' : 'bg-background-highlight'
                                    }`}
                                >
                                    <span
                                        className={`absolute top-0.5 h-5 w-5 rounded-full transition-transform ${
                                            isOn
                                                ? 'translate-x-[22px] bg-background'
                                                : 'translate-x-0.5 bg-foreground-subtle'
                                        }`}
                                    />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Link
                        href="/library"
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background-elevated px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-highlight"
                    >
                        <FolderPlus className="h-4 w-4" />
                        {t('viewLibrary')}
                    </Link>
                    <Link
                        href="/settings"
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background-elevated px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-highlight"
                    >
                        <Settings className="h-4 w-4" />
                        {t('openSettings')}
                    </Link>
                </div>
            </section>
        </div>
    );
}