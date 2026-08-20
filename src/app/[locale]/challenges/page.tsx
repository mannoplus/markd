'use client';

import { useState, useEffect } from 'react';
import { Award, Globe, History, Film, Sparkles, CheckCircle2, Trophy, Flame, ChevronRight, Lock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { getUserChallengesAction, updateChallengeProgressAction } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';

interface Challenge {
  id: string;
  titleKey: string;
  descKey: string;
  badge: string;
  target: number;
  current: number;
  category: string;
  unlockedAt?: string;
}

export default function ChallengesPage() {
  const t = useTranslations('Challenges');
  const locale = useLocale();

  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: 'globetrotter',
      titleKey: 'globetrotterTitle',
      descKey: 'globetrotterDesc',
      badge: '🌍',
      target: 15,
      current: 6,
      category: 'World Cinema',
    },
    {
      id: 'decadeHopper',
      titleKey: 'decadeHopperTitle',
      descKey: 'decadeHopperDesc',
      badge: '⏳',
      target: 6,
      current: 4,
      category: 'Film History',
    },
    {
      id: 'auteur',
      titleKey: 'auteurTitle',
      descKey: 'auteurDesc',
      badge: '🎬',
      target: 8,
      current: 8,
      category: 'Director Deep Dive',
      unlockedAt: '2026-01-15',
    },
    {
      id: 'horrorMarathon',
      titleKey: 'horrorMarathonTitle',
      descKey: 'horrorMarathonDesc',
      badge: '🦇',
      target: 10,
      current: 7,
      category: 'Genre Mastery',
    },
    {
      id: 'scifiVisionary',
      titleKey: 'scifiVisionaryTitle',
      descKey: 'scifiVisionaryDesc',
      badge: '🚀',
      target: 10,
      current: 10,
      category: 'Futurism & Sci-Fi',
      unlockedAt: '2026-02-01',
    },
  ]);

  useEffect(() => {
    getUserChallengesAction().then((res) => {
      if (res.data && res.data.length > 0) {
        setChallenges((prev) =>
          prev.map((c) => {
            const match = res.data.find((dbC: any) => dbC.challenge_id === c.id);
            if (match) {
              return {
                ...c,
                current: match.current_count,
                unlockedAt: match.completed_at || c.unlockedAt,
              };
            }
            return c;
          })
        );
      }
    });
  }, []);

  const handleIncrement = async (id: string) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const next = Math.min(c.target, c.current + 1);
          return { ...c, current: next, unlockedAt: next === c.target ? new Date().toISOString() : c.unlockedAt };
        }
        return c;
      })
    );

    const targetItem = challenges.find((c) => c.id === id);
    if (targetItem) {
      try {
        await updateChallengeProgressAction(id, 1, targetItem.target);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const unlockedCount = challenges.filter((c) => c.current >= c.target).length;

  return (
    <div className="min-h-screen pt-8 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">
                <Award className="h-6 w-6" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {t('title')}
              </h1>
            </div>
            <p className="text-sm text-foreground-muted max-w-xl">
              {t('subtitle')}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-3 text-center shrink-0">
            <span className="text-2xl font-black font-mono text-yellow-400">
              {unlockedCount} / {challenges.length}
            </span>
            <p className="text-[10px] uppercase font-bold tracking-wider text-yellow-300/80">
              {locale === 'zh-TW' ? '已解鎖成就徽章' : 'Badges Unlocked'}
            </p>
          </div>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {challenges.map((c) => {
            const isDone = c.current >= c.target;
            const pct = Math.round((c.current / c.target) * 100);

            return (
              <div
                key={c.id}
                className={`rounded-2xl border p-6 shadow-xl transition-all flex flex-col justify-between space-y-5 ${
                  isDone
                    ? 'bg-[#14120e] border-yellow-500/40'
                    : 'bg-[#0f0f18] border-border/40'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-inner border ${
                      isDone
                        ? 'bg-yellow-500/20 border-yellow-500/40 animate-bounce'
                        : 'bg-background-elevated border-border/40'
                    }`}
                  >
                    {c.badge}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-subtle">
                        {c.category}
                      </span>
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-yellow-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {locale === 'zh-TW' ? '已解鎖' : 'Unlocked'}
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-bold text-foreground-muted">
                          {c.current} / {c.target}
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-bold text-foreground">
                      {t(c.titleKey as any)}
                    </h2>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      {t(c.descKey as any)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar & Actions */}
                <div className="space-y-3 pt-2">
                  <div className="h-2 w-full rounded-full bg-background-elevated overflow-hidden border border-border/20">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-300'
                          : 'bg-accent'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-foreground-subtle">
                      {pct}% Complete
                    </span>

                    {!isDone && (
                      <button
                        onClick={() => handleIncrement(c.id)}
                        className="rounded-lg bg-white/8 hover:bg-white/15 px-3 py-1 text-[11px] font-bold text-foreground border border-white/10 transition-colors cursor-pointer"
                      >
                        +1 Progress
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
