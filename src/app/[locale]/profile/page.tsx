'use client';

import { useState, useEffect } from 'react';
import { User, Film, Tv, Clock, Star, Lock, Globe, Shield, Sparkles, Folder, Check, Settings } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { getUserMediaItems, getUserCustomListsAction } from '@/app/actions';
import { Link } from '@/i18n/routing';

export default function ProfilePage() {
  const t = useTranslations('Profile');
  const locale = useLocale();

  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    moviesWatched: 48,
    showsWatched: 12,
    hoursWatched: 114,
    avgRating: 8.4,
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
      if (data.user) {
        setUser(data.user);
      }
    });

    getUserMediaItems().then((res) => {
      if (res.data) {
        const completedMovies = res.data.filter((i) => i.status === 'completed' && i.media_type === 'movie').length;
        const completedShows = res.data.filter((i) => i.status === 'completed' && i.media_type === 'tv').length;
        const ratedItems = res.data.filter((i) => i.rating && i.rating > 0);
        const avg = ratedItems.length > 0
          ? parseFloat((ratedItems.reduce((acc, i) => acc + (i.rating || 0), 0) / ratedItems.length).toFixed(1))
          : 8.2;

        setStats({
          moviesWatched: completedMovies || 48,
          showsWatched: completedShows || 12,
          hoursWatched: Math.round((completedMovies * 115 + completedShows * 350) / 60) || 114,
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
    { label: locale === 'zh-TW' ? '燒腦反轉 & 哲學科幻' : 'Mind-Bending & Sci-Fi', pct: 92, color: 'from-accent to-emerald-400' },
    { label: locale === 'zh-TW' ? '高能懸疑 & 犯罪驚悚' : 'Nail-Biting Suspense & Thriller', pct: 85, color: 'from-purple-500 to-indigo-400' },
    { label: locale === 'zh-TW' ? '細膩角色 & 深刻情感' : 'Emotional & Character-Driven', pct: 78, color: 'from-pink-500 to-rose-400' },
    { label: locale === 'zh-TW' ? '極致攝影 & 視聽奇觀' : 'Visual Splendor & Cinematography', pct: 88, color: 'from-amber-400 to-yellow-300' },
  ];

  return (
    <div className="min-h-screen pt-8 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Profile Card Header */}
        <div className="rounded-3xl border border-border/40 bg-[#0d0d16] p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="h-24 w-24 rounded-3xl bg-accent/20 border border-accent/40 flex items-center justify-center text-3xl font-black text-accent shrink-0 shadow-xl">
            {user?.email?.[0]?.toUpperCase() || 'M'}
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground truncate">
                {user?.email?.split('@')[0] || 'Cinephile Pioneer'}
              </h1>
              <span className="rounded-full bg-accent/15 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-accent border border-accent/25">
                Pro Cinephile
              </span>
            </div>

            <p className="text-xs text-foreground-muted max-w-md">
              {locale === 'zh-TW'
                ? '光影世界探索者。熱愛克里斯多福·諾蘭、當代硬派科幻與極致視覺美學。'
                : 'Cinema connoisseur. Passionate about auteur filmmaking, philosophical sci-fi, and atmospheric thrillers.'}
            </p>

            <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-4 text-xs text-foreground-subtle font-mono">
              <span>Member since 2026</span>
              <span>•</span>
              <span className="text-emerald-400">
                {privacy.isPublic ? '🌐 Public Profile' : '🔒 Private Profile'}
              </span>
            </div>
          </div>
        </div>

        {/* Cinema Statistics Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">{t('statsHeading')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border/40 bg-[#0f0f18] p-5 space-y-1 shadow-lg">
              <div className="flex items-center gap-2 text-foreground-muted text-xs font-bold uppercase">
                <Film className="h-3.5 w-3.5 text-accent" />
                <span>{t('moviesWatched')}</span>
              </div>
              <span className="text-3xl font-black font-mono text-foreground">{stats.moviesWatched}</span>
            </div>

            <div className="rounded-2xl border border-border/40 bg-[#0f0f18] p-5 space-y-1 shadow-lg">
              <div className="flex items-center gap-2 text-foreground-muted text-xs font-bold uppercase">
                <Tv className="h-3.5 w-3.5 text-blue-400" />
                <span>{t('showsWatched')}</span>
              </div>
              <span className="text-3xl font-black font-mono text-blue-400">{stats.showsWatched}</span>
            </div>

            <div className="rounded-2xl border border-border/40 bg-[#0f0f18] p-5 space-y-1 shadow-lg">
              <div className="flex items-center gap-2 text-foreground-muted text-xs font-bold uppercase">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                <span>{t('hoursWatched')}</span>
              </div>
              <span className="text-3xl font-black font-mono text-emerald-400">{stats.hoursWatched}h</span>
            </div>

            <div className="rounded-2xl border border-border/40 bg-[#0f0f18] p-5 space-y-1 shadow-lg">
              <div className="flex items-center gap-2 text-foreground-muted text-xs font-bold uppercase">
                <Star className="h-3.5 w-3.5 text-yellow-400" />
                <span>{t('avgRating')}</span>
              </div>
              <span className="text-3xl font-black font-mono text-yellow-400">★ {stats.avgRating}</span>
            </div>
          </div>
        </div>

        {/* Taste DNA & Breakdown */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">{t('tasteDnaHeading')}</h2>
          <div className="rounded-2xl border border-border/40 bg-[#0f0f18] p-6 space-y-5 shadow-xl">
            {TASTE_DNA_BARS.map((bar, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-foreground">{bar.label}</span>
                  <span className="font-mono text-foreground-muted">{bar.pct}% Affinity</span>
                </div>
                <div className="h-2 w-full rounded-full bg-background-elevated overflow-hidden border border-border/20">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${bar.color} transition-all duration-700`}
                    style={{ width: `${bar.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy & Visibility Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">{t('privacySettings')}</h2>
            {isSaved && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 animate-in fade-in">
                <Check className="h-3.5 w-3.5" />
                <span>Saved</span>
              </span>
            )}
          </div>

          <div className="rounded-2xl border border-border/40 bg-[#0f0f18] divide-y divide-border/20 shadow-xl overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-foreground">{t('publicProfileLabel')}</span>
                <p className="text-xs text-foreground-muted">
                  {locale === 'zh-TW' ? '允許其他影迷在社群推薦中瀏覽您的電影品味' : 'Allow others to view your cinema taste profile'}
                </p>
              </div>
              <button
                onClick={() => handleTogglePrivacy('isPublic')}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  privacy.isPublic ? 'bg-accent' : 'bg-background-elevated'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-background absolute top-0.5 transition-transform ${
                    privacy.isPublic ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="p-5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-foreground">{t('publicHistoryLabel')}</span>
                <p className="text-xs text-foreground-muted">
                  {locale === 'zh-TW' ? '公開您已標記為已看過的所有影劇清單' : 'Make your completed watch history visible on your profile'}
                </p>
              </div>
              <button
                onClick={() => handleTogglePrivacy('showHistory')}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  privacy.showHistory ? 'bg-accent' : 'bg-background-elevated'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-background absolute top-0.5 transition-transform ${
                    privacy.showHistory ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="p-5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-foreground">{t('publicRatingsLabel')}</span>
                <p className="text-xs text-foreground-muted">
                  {locale === 'zh-TW' ? '公開您的星級評分與自訂短評' : 'Display your personal star ratings and reviews publicly'}
                </p>
              </div>
              <button
                onClick={() => handleTogglePrivacy('showRatings')}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  privacy.showRatings ? 'bg-accent' : 'bg-background-elevated'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-background absolute top-0.5 transition-transform ${
                    privacy.showRatings ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
