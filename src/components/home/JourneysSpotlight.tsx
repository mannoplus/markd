'use client';

import { Link } from '@/i18n/routing';
import { Compass, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface JourneyMeta {
  id: string;
  titleKey: string;
  descKey: string;
  directorOrTheme: string;
  totalFilms: number;
  completedFilms: number;
  backdropUrl: string;
  dnaHighlight: string;
}

export function JourneysSpotlight() {
  const t = useTranslations('Home');
  const tJourneys = useTranslations('Journeys');

  const FEATURED_JOURNEYS: JourneyMeta[] = [
    {
      id: 'nolan',
      titleKey: 'nolanTitle',
      descKey: 'nolanDesc',
      directorOrTheme: 'Christopher Nolan',
      totalFilms: 12,
      completedFilms: 4,
      backdropUrl: 'https://image.tmdb.org/t/p/w780/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
      dnaHighlight: 'Mind-Bending',
    },
    {
      id: 'ghibli',
      titleKey: 'ghibliTitle',
      descKey: 'ghibliDesc',
      directorOrTheme: 'Studio Ghibli',
      totalFilms: 22,
      completedFilms: 7,
      backdropUrl: 'https://image.tmdb.org/t/p/w780/7k2f7u1wT5g1R0h2M1Q9h8e.jpg',
      dnaHighlight: 'Timeless Animation',
    },
    {
      id: 'scifi',
      titleKey: 'scifiTitle',
      descKey: 'scifiDesc',
      directorOrTheme: '21st Century Sci-Fi',
      totalFilms: 15,
      completedFilms: 6,
      backdropUrl: 'https://image.tmdb.org/t/p/w780/rAiYTnrLEhkpuvlhvSchwqFk3o3.jpg',
      dnaHighlight: 'Philosophical Sci-Fi',
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/30 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20">
              <Compass className="h-4 w-4 text-accent" />
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
          className="text-xs font-bold text-accent hover:text-accent-hover transition-colors inline-flex items-center gap-1"
        >
          <span>{tJourneys('exploreAll')}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {FEATURED_JOURNEYS.map((journey) => {
          const pct = Math.round((journey.completedFilms / journey.totalFilms) * 100);
          return (
            <Link
              key={journey.id}
              href="/journeys"
              className="group relative rounded-2xl overflow-hidden border border-border/40 bg-[#12121c] p-5 shadow-xl hover:border-accent/40 transition-all hover:scale-[1.02] flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-accent border border-accent/30 tracking-wider">
                    {journey.dnaHighlight}
                  </span>
                  <span className="text-[11px] font-bold text-foreground-muted">
                    {journey.completedFilms}/{journey.totalFilms} Films
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-foreground group-hover:text-accent transition-colors leading-snug">
                  {tJourneys(journey.titleKey as any)}
                </h3>

                <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed">
                  {tJourneys(journey.descKey as any)}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="pt-5 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-foreground-subtle">
                  <span>Progress</span>
                  <span className="text-emerald-400 font-mono">{pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-background-elevated overflow-hidden border border-border/20">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-400 transition-all duration-500"
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
