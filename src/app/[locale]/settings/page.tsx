'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import {
    Sliders, User as UserIcon, Save, Globe, Play, Moon, Download, Upload,
    Trash2, ShieldCheck, CheckCircle2, AlertTriangle, Loader2, Languages,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { getUserMediaItems, upsertMediaItem } from '@/app/actions';
import { ToggleSwitch } from '@/components/toggle-switch';

const REGIONS = [
    { code: 'US', label: 'United States (US)' },
    { code: 'TW', label: 'Taiwan (台灣 - TW)' },
    { code: 'GB', label: 'United Kingdom (UK)' },
    { code: 'JP', label: 'Japan (日本 - JP)' },
    { code: 'KR', label: 'South Korea (한국 - KR)' },
    { code: 'FR', label: 'France (FR)' },
    { code: 'DE', label: 'Germany (DE)' },
    { code: 'CA', label: 'Canada (CA)' },
    { code: 'AU', label: 'Australia (AU)' },
];

export default function SettingsPage() {
    const t = useTranslations('Settings');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<'general' | 'account'>('general');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [user, setUser] = useState<User | null>(null);
    const [isUserLoading, setIsUserLoading] = useState(true);

    const [defaultRegion, setDefaultRegion] = useState('US');
    const [defaultTimeframe, setDefaultTimeframe] = useState('day');
    const [autoPlayTrailers, setAutoPlayTrailers] = useState(true);
    const [enableSoundFx, setEnableSoundFx] = useState(false);

    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<string | null>(null);

    useEffect(() => {
        const savedRegion = localStorage.getItem('markd_region');
        if (savedRegion) setDefaultRegion(savedRegion);

        const savedTimeframe = localStorage.getItem('markd_timeframe');
        if (savedTimeframe) setDefaultTimeframe(savedTimeframe);

        const savedAutoplay = localStorage.getItem('markd_autoplay_trailers');
        if (savedAutoplay !== null) setAutoPlayTrailers(savedAutoplay === 'true');

        const savedSound = localStorage.getItem('markd_sound_fx');
        if (savedSound !== null) setEnableSoundFx(savedSound === 'true');

        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
            setIsUserLoading(false);
        });
    }, []);

    const handleSwitchLanguage = async (newLocale: string) => {
        if (newLocale === locale) return;

        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        try {
            localStorage.setItem('preferredLocale', newLocale);
        } catch {
            // Ignore storage errors
        }

        try {
            const supabase = createClient();
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
                await supabase.auth.updateUser({
                    data: { preferred_locale: newLocale }
                });
            }
        } catch (e) {
            console.error('Failed to sync locale to user profile:', e);
        }

        router.replace(pathname, { locale: newLocale });
    };

    const handleSavePreferences = () => {
        localStorage.setItem('markd_region', defaultRegion);
        localStorage.setItem('markd_timeframe', defaultTimeframe);
        localStorage.setItem('markd_autoplay_trailers', autoPlayTrailers ? 'true' : 'false');
        localStorage.setItem('markd_sound_fx', enableSoundFx ? 'true' : 'false');

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const handleExportLibrary = async () => {
        setIsExporting(true);
        try {
            const res = await getUserMediaItems();
            const backupData = {
                markd_version: '2.0',
                exported_at: new Date().toISOString(),
                user_id: user?.id || 'guest',
                items: res.data || [],
            };

            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', dataStr);
            downloadAnchor.setAttribute('download', `markd_backup_${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        } catch (err) {
            console.error(err);
            alert(t('exportFailed'));
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportStatus(t('importReading'));

        try {
            const text = await file.text();
            const parsed = JSON.parse(text);

            if (!parsed.items || !Array.isArray(parsed.items)) {
                throw new Error('Invalid MARKD backup format');
            }

            setImportStatus(t('importing', { count: parsed.items.length }));

            for (const item of parsed.items) {
                await upsertMediaItem({
                    tmdb_id: item.tmdb_id,
                    media_type: item.media_type || 'movie',
                    title: item.title || '',
                    poster_path: item.poster_path,
                    status: item.status || 'plan_to_watch',
                    rating: item.rating || null,
                    season_progress: item.season_progress || null,
                    episode_progress: item.episode_progress || null,
                });
            }

            setImportStatus(t('importSuccess'));
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (err) {
            console.error(err);
            alert(t('importFailed'));
            setIsImporting(false);
            setImportStatus(null);
        }
    };

    const TABS = [
        { id: 'general' as const, label: t('generalTab'), icon: Sliders },
        { id: 'account' as const, label: t('accountTab'), icon: UserIcon },
    ];

    return (
        <div className="mx-auto max-w-4xl space-y-10 px-4 pb-24 pt-16 fade-in sm:px-6 lg:px-8">
            {/* Header */}
            <header className="space-y-2">
                <span className="eyebrow">{t('eyebrow')}</span>
                <h1 className="section-title">{t('title')}</h1>
                <p className="lede">{t('subtitle')}</p>
            </header>

            {/* Tab Navigation */}
            <div role="tablist" aria-label={t('title')} className="flex items-center gap-1.5 border-b border-border/40 pb-4">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveTab(tab.id)}
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                                isActive
                                    ? 'border-foreground bg-foreground text-background'
                                    : 'border-border bg-background-elevated/60 text-foreground-muted hover:border-border-hover hover:text-foreground'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* ====================================================
                TAB 1: GENERAL PREFERENCES
               ==================================================== */}
            {activeTab === 'general' && (
                <div className="space-y-8 fade-in">
                    {/* Language & Localization Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2.5">
                            <Languages className="h-4 w-4 text-foreground-muted" />
                            <h2 className="text-lg font-bold text-foreground">{t('languageHeading')}</h2>
                        </div>
                        <p className="text-xs leading-relaxed text-foreground-muted">{t('languageDesc')}</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => handleSwitchLanguage('en')}
                                className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                                    locale === 'en'
                                        ? 'border-foreground bg-background-elevated text-foreground ring-1 ring-foreground'
                                        : 'border-border bg-background-elevated/40 text-foreground-muted hover:border-border-hover hover:text-foreground'
                                }`}
                            >
                                <div>
                                    <p className="text-sm font-bold">{tCommon('english')}</p>
                                    <p className="text-xs text-foreground-subtle mt-0.5">English (US)</p>
                                </div>
                                {locale === 'en' && (
                                    <span className="h-2 w-2 rounded-full bg-accent" />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSwitchLanguage('zh-TW')}
                                className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                                    locale === 'zh-TW'
                                        ? 'border-foreground bg-background-elevated text-foreground ring-1 ring-foreground'
                                        : 'border-border bg-background-elevated/40 text-foreground-muted hover:border-border-hover hover:text-foreground'
                                }`}
                            >
                                <div>
                                    <p className="text-sm font-bold">{tCommon('traditionalChinese')}</p>
                                    <p className="text-xs text-foreground-subtle mt-0.5">繁體中文</p>
                                </div>
                                {locale === 'zh-TW' && (
                                    <span className="h-2 w-2 rounded-full bg-accent" />
                                )}
                            </button>
                        </div>
                    </section>

                    {/* Theme Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2.5">
                            <Moon className="h-4 w-4 text-foreground-muted" />
                            <h2 className="text-lg font-bold text-foreground">{t('themeHeading')}</h2>
                        </div>
                        <div className="card flex items-center justify-between gap-4 p-5">
                            <div className="space-y-0.5">
                                <p className="text-sm font-semibold text-foreground">{t('themeDark')}</p>
                                <p className="text-xs leading-relaxed text-foreground-muted">{t('themeDarkDesc')}</p>
                            </div>
                            <span className="shrink-0 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                                {t('themeActive')}
                            </span>
                        </div>
                    </section>

                    {/* Cinema Region Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2.5">
                            <Globe className="h-4 w-4 text-foreground-muted" />
                            <h2 className="text-lg font-bold text-foreground">{t('regionHeading')}</h2>
                        </div>
                        <p className="text-xs leading-relaxed text-foreground-muted">{t('regionDesc')}</p>
                        <select
                            value={defaultRegion}
                            onChange={(e) => setDefaultRegion(e.target.value)}
                            aria-label={t('regionHeading')}
                            className="w-full cursor-pointer rounded-lg border border-border bg-background-elevated px-3.5 py-3 text-sm text-foreground focus:border-border-active focus:outline-none"
                        >
                            {REGIONS.map((reg) => (
                                <option key={reg.code} value={reg.code} className="bg-background-elevated text-foreground">
                                    {reg.label}
                                </option>
                            ))}
                        </select>
                    </section>

                    {/* Playback & Trending Options */}
                    <section className="space-y-5">
                        <div className="flex items-center gap-2.5">
                            <Play className="h-4 w-4 text-foreground-muted" />
                            <h2 className="text-lg font-bold text-foreground">{t('playbackHeading')}</h2>
                        </div>

                        <div className="card divide-y divide-border/40">
                            {/* Autoplay Trailers Toggle */}
                            <div className="flex items-center justify-between gap-4 p-5">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-foreground">{t('autoplayTrailers')}</p>
                                    <p className="text-xs leading-relaxed text-foreground-muted">{t('autoplayTrailersDesc')}</p>
                                </div>
                                <ToggleSwitch
                                    checked={autoPlayTrailers}
                                    onChange={() => setAutoPlayTrailers(!autoPlayTrailers)}
                                    label={t('autoplayTrailers')}
                                />
                            </div>

                            {/* Sound FX Toggle */}
                            <div className="flex items-center justify-between gap-4 p-5">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-foreground">{t('soundFx')}</p>
                                    <p className="text-xs leading-relaxed text-foreground-muted">{t('soundFxDesc')}</p>
                                </div>
                                <ToggleSwitch
                                    checked={enableSoundFx}
                                    onChange={() => setEnableSoundFx(!enableSoundFx)}
                                    label={t('soundFx')}
                                />
                            </div>
                        </div>

                        {/* Timeframe selector */}
                        <div className="space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
                                {t('defaultTimeframe')}
                            </span>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setDefaultTimeframe('day')}
                                    aria-pressed={defaultTimeframe === 'day'}
                                    className={`rounded-lg border py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                                        defaultTimeframe === 'day'
                                            ? 'border-foreground bg-foreground text-background'
                                            : 'border-border bg-background-elevated/60 text-foreground-muted hover:border-border-hover hover:text-foreground'
                                    }`}
                                >
                                    {t('timeframeDay')}
                                </button>
                                <button
                                    onClick={() => setDefaultTimeframe('week')}
                                    aria-pressed={defaultTimeframe === 'week'}
                                    className={`rounded-lg border py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                                        defaultTimeframe === 'week'
                                            ? 'border-foreground bg-foreground text-background'
                                            : 'border-border bg-background-elevated/60 text-foreground-muted hover:border-border-hover hover:text-foreground'
                                    }`}
                                >
                                    {t('timeframeWeek')}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Save Button */}
                    <div className="flex items-center gap-4 pt-1">
                        <button
                            onClick={handleSavePreferences}
                            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-background transition-colors hover:bg-foreground/90"
                        >
                            <Save className="h-4 w-4" />
                            <span>{t('save')}</span>
                        </button>

                        {saveSuccess && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success fade-in">
                                <CheckCircle2 className="h-4 w-4" />
                                {t('saved')}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* ====================================================
                TAB 2: ACCOUNT & DATA SYNC
               ==================================================== */}
            {activeTab === 'account' && (
                <div className="space-y-8 fade-in">
                    {/* Account Profile Card */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2.5">
                            <UserIcon className="h-4 w-4 text-foreground-muted" />
                            <h2 className="text-lg font-bold text-foreground">{t('accountHeading')}</h2>
                        </div>

                        {isUserLoading ? (
                            <div className="card flex items-center gap-2 p-5 text-xs text-foreground-muted">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{t('loadingUser')}</span>
                            </div>
                        ) : user ? (
                            <div className="card flex items-center justify-between gap-4 p-5">
                                <div>
                                    <p className="text-[11px] uppercase tracking-wider text-foreground-muted">{t('accountEmail')}</p>
                                    <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">{user.email}</p>
                                </div>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    {t('authenticated')}
                                </span>
                            </div>
                        ) : (
                            <div className="card flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
                                <p className="text-xs leading-relaxed text-foreground-muted">{t('guestNote')}</p>
                                <a
                                    href={`/${locale}/login`}
                                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-xs font-bold text-background transition-colors hover:bg-foreground/90"
                                >
                                    {t('signIn')}
                                </a>
                            </div>
                        )}
                    </section>

                    {/* Data Management & Backup */}
                    <section className="space-y-5">
                        <div className="flex items-center gap-2.5">
                            <Download className="h-4 w-4 text-foreground-muted" />
                            <h2 className="text-lg font-bold text-foreground">{t('dataSyncHeading')}</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Export Card */}
                            <div className="card flex flex-col justify-between gap-4 p-5">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-foreground">{t('exportLibrary')}</h3>
                                    <p className="text-xs leading-relaxed text-foreground-muted">{t('exportLibraryDesc')}</p>
                                </div>
                                <button
                                    onClick={handleExportLibrary}
                                    disabled={isExporting}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background-elevated px-4 py-2.5 text-xs font-bold text-foreground transition-colors hover:border-border-hover hover:bg-background-highlight disabled:opacity-50"
                                >
                                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    <span>{t('exportBtn')}</span>
                                </button>
                            </div>

                            {/* Import Card */}
                            <div className="card flex flex-col justify-between gap-4 p-5">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-foreground">{t('importLibrary')}</h3>
                                    <p className="text-xs leading-relaxed text-foreground-muted">{t('importLibraryDesc')}</p>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={handleImportFile}
                                />

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isImporting}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background-elevated px-4 py-2.5 text-xs font-bold text-foreground transition-colors hover:border-border-hover hover:bg-background-highlight disabled:opacity-50"
                                >
                                    {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    <span>{t('importBtn')}</span>
                                </button>
                            </div>
                        </div>

                        {importStatus && (
                            <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 p-3 text-xs font-semibold text-success fade-in">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{importStatus}</span>
                            </div>
                        )}
                    </section>

                    {/* Danger Zone */}
                    <section className="space-y-4 rounded-lg border border-error/25 bg-error/5 p-6">
                        <div className="flex items-center gap-2.5 text-error">
                            <AlertTriangle className="h-4 w-4" />
                            <h2 className="text-base font-bold">{t('dangerZone')}</h2>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="max-w-lg text-xs leading-relaxed text-foreground-muted">
                                {t('deleteAccountConfirm')}
                            </p>
                            <button
                                onClick={() => {
                                    if (confirm(t('deleteAccountConfirm'))) {
                                        localStorage.clear();
                                        const supabase = createClient();
                                        supabase.auth.signOut().then(() => {
                                            window.location.assign(`/${locale}`);
                                        });
                                    }
                                }}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-error/40 bg-error/15 px-4 py-2.5 text-xs font-bold text-error transition-colors hover:bg-error/25"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>{t('deleteAccount')}</span>
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}