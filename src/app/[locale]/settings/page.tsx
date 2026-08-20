'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Sliders, User as UserIcon, Save, Globe, Play, Moon, Download, Upload, 
  Trash2, ShieldCheck, CheckCircle2, AlertTriangle, Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { getUserMediaItems, upsertMediaItem } from '@/app/actions';

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
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'general' | 'account'>('general');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Supabase auth user state
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // General Preferences Settings
  const [defaultRegion, setDefaultRegion] = useState('US');
  const [defaultTimeframe, setDefaultTimeframe] = useState('day');
  const [autoPlayTrailers, setAutoPlayTrailers] = useState(true);
  const [enableSoundFx, setEnableSoundFx] = useState(false);

  // Export / Import states
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    // Load local settings
    const savedRegion = localStorage.getItem('markd_region');
    if (savedRegion) setDefaultRegion(savedRegion);

    const savedTimeframe = localStorage.getItem('markd_timeframe');
    if (savedTimeframe) setDefaultTimeframe(savedTimeframe);

    const savedAutoplay = localStorage.getItem('markd_autoplay_trailers');
    if (savedAutoplay !== null) setAutoPlayTrailers(savedAutoplay === 'true');

    const savedSound = localStorage.getItem('markd_sound_fx');
    if (savedSound !== null) setEnableSoundFx(savedSound === 'true');

    // Supabase auth check
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsUserLoading(false);
    });
  }, []);

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
    } catch (e) {
      console.error(e);
      alert('Failed to export library backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(locale === 'zh-TW' ? '正在讀取並解析備份檔案...' : 'Reading and parsing backup file...');

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.items || !Array.isArray(parsed.items)) {
        throw new Error('Invalid MARKD backup format');
      }

      setImportStatus(locale === 'zh-TW' ? `正在匯入 ${parsed.items.length} 筆影劇紀錄...` : `Importing ${parsed.items.length} titles...`);

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

      setImportStatus(locale === 'zh-TW' ? '匯入成功！即將重新載入頁面...' : 'Import successful! Refreshing...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert(locale === 'zh-TW' ? '備份檔案格式不正確或匯入失敗。' : 'Failed to import backup: invalid file format.');
      setIsImporting(false);
      setImportStatus(null);
    }
  };

  return (
    <div className="min-h-screen pt-8 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="space-y-2 border-b border-white/[0.08] pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/[0.08] border border-white/[0.1] text-foreground">
              <Sliders className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {t('title')}
            </h1>
          </div>
          <p className="text-sm text-foreground-muted">
            {t('subtitle')}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'text-foreground-muted hover:text-foreground hover:bg-white/[0.04]'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>{t('generalTab')}</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'text-foreground-muted hover:text-foreground hover:bg-white/[0.04]'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            <span>{t('accountTab')}</span>
          </button>
        </div>

        {/* ====================================================
            TAB 1: GENERAL PREFERENCES
           ==================================================== */}
        {activeTab === 'general' && (
          <div className="space-y-6 fade-in">
            {/* Theme Section */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017] p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-zinc-300" />
                <h2 className="text-base font-bold text-foreground">
                  {t('themeHeading')}
                </h2>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {t('themeDark')}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {locale === 'zh-TW' ? '專為電影鑑賞打造的極致沉浸黑曜石色彩系統。' : 'High-contrast cinematic obsidian palette tailored for films.'}
                  </p>
                </div>
                <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                  Active
                </span>
              </div>
            </div>

            {/* Cinema Region Section */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017] p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-zinc-300" />
                <h2 className="text-base font-bold text-foreground">
                  {t('regionHeading')}
                </h2>
              </div>
              <p className="text-xs text-foreground-muted leading-relaxed">
                {t('regionDesc')}
              </p>
              <select
                value={defaultRegion}
                onChange={(e) => setDefaultRegion(e.target.value)}
                aria-label={t('regionHeading')}
                className="w-full rounded-xl bg-[#141622] border border-white/[0.1] px-4 py-3 text-sm text-foreground focus:outline-none focus:border-white/30 cursor-pointer"
              >
                {REGIONS.map((reg) => (
                  <option key={reg.code} value={reg.code} className="bg-[#141622] text-foreground">
                    {reg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Playback & Trending Options */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017] p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-3">
                <Play className="h-5 w-5 text-zinc-300" />
                <h2 className="text-base font-bold text-foreground">
                  {t('playbackHeading')}
                </h2>
              </div>

              {/* Autoplay Trailers Toggle */}
              <div className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {t('autoplayTrailers')}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {t('autoplayTrailersDesc')}
                  </p>
                </div>
                <button
                  onClick={() => setAutoPlayTrailers(!autoPlayTrailers)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    autoPlayTrailers ? 'bg-emerald-500' : 'bg-white/20'
                  }`}
                  aria-label="Toggle Autoplay Trailers"
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      autoPlayTrailers ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Timeframe selector */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-foreground-muted uppercase tracking-wider">
                  {t('defaultTimeframe')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDefaultTimeframe('day')}
                    className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      defaultTimeframe === 'day'
                        ? 'bg-white/[0.1] border-white/30 text-white'
                        : 'bg-white/[0.02] border-white/[0.06] text-foreground-muted hover:border-white/15'
                    }`}
                  >
                    {t('timeframeDay')}
                  </button>
                  <button
                    onClick={() => setDefaultTimeframe('week')}
                    className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      defaultTimeframe === 'week'
                        ? 'bg-white/[0.1] border-white/30 text-white'
                        : 'bg-white/[0.02] border-white/[0.06] text-foreground-muted hover:border-white/15'
                    }`}
                  >
                    {t('timeframeWeek')}
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={handleSavePreferences}
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-background hover:bg-foreground-muted transition-all active:scale-95 cursor-pointer shadow-xl shadow-white/5"
              >
                <Save className="h-4 w-4" />
                <span>{t('save')}</span>
              </button>

              {saveSuccess && (
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 fade-in">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t('saved')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================
            TAB 2: ACCOUNT & DATA SYNC
           ==================================================== */}
        {activeTab === 'account' && (
          <div className="space-y-6 fade-in">
            {/* Account Profile Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017] p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-zinc-300" />
                <h2 className="text-base font-bold text-foreground">
                  {t('accountHeading')}
                </h2>
              </div>

              {isUserLoading ? (
                <div className="flex items-center gap-2 text-xs text-foreground-muted py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading user details...</span>
                </div>
              ) : user ? (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-foreground-muted">{t('accountEmail')}</p>
                      <p className="text-sm font-bold text-foreground font-mono mt-0.5">{user.email}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Authenticated
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center justify-between">
                  <p className="text-xs text-foreground-muted">
                    {locale === 'zh-TW' ? '您目前尚未登入。登入後可啟用跨裝置雲端同步。' : 'You are currently browsing as a guest. Sign in to sync across devices.'}
                  </p>
                  <a
                    href={`/${locale}/login`}
                    className="rounded-lg bg-foreground px-4 py-2 text-xs font-bold text-background hover:bg-foreground-muted transition-all"
                  >
                    {locale === 'zh-TW' ? '立即登入' : 'Sign In'}
                  </a>
                </div>
              )}
            </div>

            {/* Data Management & Backup */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017] p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-zinc-300" />
                <h2 className="text-base font-bold text-foreground">
                  {t('dataSyncHeading')}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground">
                      {t('exportLibrary')}
                    </h3>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      {t('exportLibraryDesc')}
                    </p>
                  </div>
                  <button
                    onClick={handleExportLibrary}
                    disabled={isExporting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.08] border border-white/[0.1] px-4 py-2.5 text-xs font-bold text-foreground hover:bg-white/[0.15] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    <span>{t('exportBtn')}</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground">
                      {t('importLibrary')}
                    </h3>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      {t('importLibraryDesc')}
                    </p>
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.08] border border-white/[0.1] px-4 py-2.5 text-xs font-bold text-foreground hover:bg-white/[0.15] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span>{t('importBtn')}</span>
                  </button>
                </div>
              </div>

              {importStatus && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-semibold text-emerald-400 flex items-center gap-2 fade-in">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{importStatus}</span>
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-base font-bold">
                  {t('dangerZone')}
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-red-300/80 max-w-lg leading-relaxed">
                  {t('deleteAccountConfirm')}
                </p>
                <button
                  onClick={() => {
                    if (confirm(t('deleteAccountConfirm'))) {
                      localStorage.clear();
                      const supabase = createClient();
                      supabase.auth.signOut().then(() => {
                        window.location.href = `/${locale}`;
                      });
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/20 border border-red-500/40 px-4 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/30 transition-all cursor-pointer shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{t('deleteAccount')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
