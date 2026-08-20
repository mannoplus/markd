'use client';

import { Link } from '@/i18n/routing';
import { Award, Globe, History, Film, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ChallengesSpotlight() {
  const t = useTranslations('Home');
  const tChallenges = useTranslations('Challenges');

  const CHALLENGES = [
    {
      id: 'globetrotter',
      titleKey: 'globetrotterTitle',
      descKey: 'globetrotterDesc',
      icon: Globe,
      current: 6,
      target: 15,
      badge: '🌍',
    },
    {
      id: 'decadeHopper',
      titleKey: 'decadeHopperTitle',
      descKey: 'decadeHopperDesc',
      icon: History,
      current: 3,
      target: 6,
      badge: '⏳',
    },
    {
      id: 'scifiVisionary',
      titleKey: 'scifiVisionaryTitle',
      descKey: 'scifiVisionaryDesc',
      icon: Film,
      current: 7,
      target: 10,
      badge: '🚀',
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/30 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Award className="h-4 w-4 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {t('activeChallenges')}
            </h2>
          </div>
          <p className="text-xs text-foreground-muted">
            {t('activeChallengesSub')}
          </p>
        </div>

        <Link
          href="/challenges"
          className="text-xs font-bold text-accent hover:text-accent-hover transition-colors inline-flex items-center gap-1"
        >
          <span>View All</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CHALLENGES.map((c) => {
          const pct = Math.round((c.current / c.target) * 100);
          return (
            <Link
              key={c.id}
              href="/challenges"
              className="group rounded-2xl border border-border/30 bg-[#12121c] p-4 shadow-lg hover:border-yellow-500/30 transition-all hover:scale-[1.02] flex items-center gap-4"
            >
              <div className="h-12 w-12 rounded-xl bg-background-elevated border border-border/40 flex items-center justify-center text-xl shrink-0">
                {c.badge}
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-foreground group-hover:text-yellow-400 transition-colors truncate">
                    {tChallenges(c.titleKey as any)}
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-yellow-400 shrink-0">
                    {c.current}/{c.target}
                  </span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-background-elevated overflow-hidden border border-border/20">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-300 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
