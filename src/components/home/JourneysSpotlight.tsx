'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { Compass, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getUserMediaItems, getUserJourneysAction } from '@/app/actions';

export interface JourneyTrack {
  id: string;
  titleKey: string;
  descKey: string;
  directorOrTheme: string;
  tmdbIds: number[];
  dnaHighlight: string;
}

const SPOTLIGHT_TRACKS: JourneyTrack[] = [
  {
    id: 'nolan',
    titleKey: 'nolanTitle',
    descKey: 'nolanDesc',
    directorOrTheme: 'Christopher Nolan',
    tmdbIds: [77, 1124, 155, 27205, 157336, 374720, 577922, 872585],
    dnaHighlight: 'Mind-Bending',
  },
  {
    id: 'ghibli',
    titleKey: 'ghibliTitle',
    descKey: 'ghibliDesc',
    directorOrTheme: 'Studio Ghibli',
    tmdbIds: [81, 10515, 8392, 16859, 128, 129, 4935, 508883],
    dnaHighlight: 'Timeless Animation',
  },
  {
    id: 'scifi',
    titleKey: 'scifiTitle',
    descKey: 'scifiDesc',
    directorOrTheme: '21st Century Sci-Fi',
    tmdbIds: [264660, 329865, 335984, 438631, 693134],
    dnaHighlight: 'Philosophical Sci-Fi',
  },
];

export function JourneysSpotlight() {
  const t = useTranslations('Home');
  const tJourneys = useTranslations('Journeys');

  const [watchedTmdbIds, setWatchedTmdbIds] = useState<Set<number>>(new Set([77, 155, 27205])); // sample baseline

  useEffect(() => {
    getUserMediaItems().then((res) => {
      if (res.data) {
        const completedIds = new Set<number>();
        res.data.forEach((item: any) => {
          if (item.status === 'completed' || item.status === 'watching') {
            completedIds.add(item.tmdb_id);
          }
        });
        if (completedIds.size > 0) {
          setWatchedTmdbIds(completedIds);
        }
      }
    });

    getUserJourneysAction().then((res) => {
      if (res.data && res.data.length > 0) {
        setWatchedTmdbIds((prev) => {
          const next = new Set(prev);
          res.data.forEach((j: any) => {
            (j.completed_tmdb_ids || []).forEach((id: number) => next.add(id));
          });
          return next;
        });
      }
    });
  }, []);

  return (
    <section className="space-y-6 pt-2">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/[0.08] border border-white/[0.1]">
              <Compass className="h-4 w-4 text-foreground" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {t('cinemaJourneys')}
            </h2>
          </div>
          <p className="text-xs text-foreground-muted">
            {t('cinemaJourneysSub')}
          </p>
        </div>

        <Link
          href="/journeys"
          className="text-xs font-bold text-foreground-muted hover:text-foreground transition-colors inline-flex items-center gap-1 self-start sm:self-auto"
        >
          <span>{tJourneys('exploreAll')}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Journeys Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {SPOTLIGHT_TRACKS.map((track) => {
          const total = track.tmdbIds.length;
          const completed = track.tmdbIds.filter((id) => watchedTmdbIds.has(id)).length;
          const pct = Math.round((completed / total) * 100);

          return (
            <Link
              key={track.id}
              href="/journeys"
              className="group relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0E1017] p-5 shadow-xl hover:border-white/20 transition-all hover:scale-[1.01] flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase text-zinc-300 border border-white/[0.08] tracking-wider">
                    {track.dnaHighlight}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-foreground-muted">
                    {completed}/{total} Films
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-foreground group-hover:text-zinc-200 transition-colors leading-snug">
                  {tJourneys(track.titleKey as any)}
                </h3>

                <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed">
                  {tJourneys(track.descKey as any)}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="pt-6 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-foreground-subtle">
                  <span>Progress</span>
                  <span className="text-emerald-400 font-mono">{pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden border border-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-zinc-300 to-emerald-400 transition-all duration-500"
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
