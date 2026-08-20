'use client';

import { useState, useEffect } from 'react';
import { Compass, CheckCircle2, Circle, Trophy, ChevronDown, Calendar, Film } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { getUserJourneysAction, updateJourneyProgressAction, getUserMediaItems, upsertMediaItem } from '@/app/actions';

interface JourneyFilm {
  id: number;
  title: string;
  year: string;
  posterPath: string;
  tagline?: string;
}

interface JourneyDefinition {
  id: string;
  titleKey: string;
  descKey: string;
  director: string;
  badgeTag: string;
  films: JourneyFilm[];
}

const ALL_JOURNEYS: JourneyDefinition[] = [
  {
    id: 'nolan',
    titleKey: 'nolanTitle',
    descKey: 'nolanDesc',
    director: 'Christopher Nolan',
    badgeTag: 'Mind-Bending Auteur',
    films: [
      { id: 77, title: 'Memento', year: '2000', posterPath: '/yuWy097X9CRHGnm9xzgG0Yx9wK.jpg', tagline: 'Some memories are best forgotten.' },
      { id: 1124, title: 'The Prestige', year: '2006', posterPath: '/bdN3gXuIZYaam7HQduaQwh5t6sl.jpg', tagline: 'Are you watching closely?' },
      { id: 155, title: 'The Dark Knight', year: '2008', posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', tagline: 'Why so serious?' },
      { id: 27205, title: 'Inception', year: '2010', posterPath: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', tagline: 'Your mind is the scene of the crime.' },
      { id: 157336, title: 'Interstellar', year: '2014', posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', tagline: 'Mankind was born on Earth. It was never meant to die here.' },
      { id: 374720, title: 'Dunkirk', year: '2017', posterPath: '/ebSnODDg9lbsMIaWg2uAbjn7TO5.jpg', tagline: 'When 400,000 men couldn\'t get home, home came for them.' },
      { id: 577922, title: 'Tenet', year: '2020', posterPath: '/k68nPLbIST6NP96JmTxmZijEvCA.jpg', tagline: 'Time runs out.' },
      { id: 872585, title: 'Oppenheimer', year: '2023', posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', tagline: 'The world forever changes.' },
    ],
  },
  {
    id: 'ghibli',
    titleKey: 'ghibliTitle',
    descKey: 'ghibliDesc',
    director: 'Hayao Miyazaki',
    badgeTag: 'Animation Masterpiece',
    films: [
      { id: 81, title: 'Nausicaä of the Valley of the Wind', year: '1984', posterPath: '/tcrkfB8ex1gtRollZsTvKyWckEf.jpg' },
      { id: 10515, title: 'Castle in the Sky', year: '1986', posterPath: '/41XxAjnm2q1rNaEZ9btfuTlmNgY.jpg' },
      { id: 8392, title: 'My Neighbor Totoro', year: '1988', posterPath: '/rtGDOJQGztJLwhIqHGExBG1hxew.jpg' },
      { id: 16859, title: 'Kiki\'s Delivery Service', year: '1989', posterPath: '/7nO5DUMnKa2v449R2BHf0t1bI2M.jpg' },
      { id: 128, title: 'Princess Mononoke', year: '1997', posterPath: '/cMYCDADoLKLbB83gpe190cbhyYd.jpg' },
      { id: 129, title: 'Spirited Away', year: '2001', posterPath: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg' },
      { id: 4935, title: 'Howl\'s Moving Castle', year: '2004', posterPath: '/6p0v21j86LwI2hZ8nC3m9Z7Z4fH.jpg' },
      { id: 508883, title: 'The Boy and the Heron', year: '2023', posterPath: '/jDQPkg03iK59dBURQkrVBM8MGEn.jpg' },
    ],
  },
  {
    id: 'scifi',
    titleKey: 'scifiTitle',
    descKey: 'scifiDesc',
    director: 'Modern Sci-Fi Era',
    badgeTag: 'Philosophical Vision',
    films: [
      { id: 264660, title: 'Ex Machina', year: '2014', posterPath: '/dmk6Pz9wWpQxH4eQ83eE8B6H6lH.jpg' },
      { id: 329865, title: 'Arrival', year: '2016', posterPath: '/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg' },
      { id: 335984, title: 'Blade Runner 2049', year: '2017', posterPath: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg' },
      { id: 438631, title: 'Dune: Part One', year: '2021', posterPath: '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg' },
      { id: 693134, title: 'Dune: Part Two', year: '2024', posterPath: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg' },
    ],
  },
  {
    id: 'korean',
    titleKey: 'koreanTitle',
    descKey: 'koreanDesc',
    director: 'Bong Joon-ho & Park Chan-wook',
    badgeTag: 'Thriller Masterclass',
    films: [
      { id: 670, title: 'Oldboy', year: '2003', posterPath: '/pWDtHJqTGv9FuVMRebSSIRBsXQg.jpg' },
      { id: 11423, title: 'Memories of Murder', year: '2003', posterPath: '/7O2yFk4k8N1Yp8nK7Xb9q2r1e.jpg' },
      { id: 290098, title: 'The Handmaiden', year: '2016', posterPath: '/8MnXRXkE0kR2m4F3L9x0Fq3.jpg' },
      { id: 496243, title: 'Parasite', year: '2019', posterPath: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg' },
      { id: 705996, title: 'Decision to Leave', year: '2022', posterPath: '/N2w4GZ8m2p5q1F9r4y6b8n7e.jpg' },
    ],
  },
];

export default function JourneysPage() {
  const t = useTranslations('Journeys');
  const locale = useLocale();

  const [completedMap, setCompletedMap] = useState<Record<string, number[]>>({
    nolan: [77, 155, 27205],
    ghibli: [81, 129],
    scifi: [329865, 438631],
    korean: [496243],
  });

  const [expandedJourney, setExpandedJourney] = useState<string>('nolan');

  useEffect(() => {
    // 1. Sync from user media library items
    getUserMediaItems().then((res) => {
      if (res.data) {
        const completedIds = new Set<number>();
        res.data.forEach((item: any) => {
          if (item.status === 'completed' || item.status === 'watching') {
            completedIds.add(item.tmdb_id);
          }
        });

        if (completedIds.size > 0) {
          setCompletedMap((prev) => {
            const updated: Record<string, number[]> = { ...prev };
            ALL_JOURNEYS.forEach((journey) => {
              const matched = journey.films
                .map((f) => f.id)
                .filter((id) => completedIds.has(id));
              if (matched.length > 0) {
                updated[journey.id] = Array.from(new Set([...(updated[journey.id] || []), ...matched]));
              }
            });
            return updated;
          });
        }
      }
    });

    // 2. Sync from Supabase user_journeys table
    getUserJourneysAction().then((res) => {
      if (res.data && res.data.length > 0) {
        setCompletedMap((prev) => {
          const map: Record<string, number[]> = { ...prev };
          res.data.forEach((j: any) => {
            map[j.journey_id] = Array.from(new Set([...(map[j.journey_id] || []), ...(j.completed_tmdb_ids || [])]));
          });
          return map;
        });
      }
    });
  }, []);

  const handleToggleFilm = async (journeyId: string, film: JourneyFilm, total: number) => {
    const currentCompleted = completedMap[journeyId] || [];
    const isDone = currentCompleted.includes(film.id);

    const updated = isDone
      ? currentCompleted.filter((id) => id !== film.id)
      : [...currentCompleted, film.id];

    setCompletedMap((prev) => ({
      ...prev,
      [journeyId]: updated,
    }));

    try {
      await updateJourneyProgressAction(journeyId, film.id, total);
      // Also sync to user media items
      await upsertMediaItem({
        tmdb_id: film.id,
        media_type: 'movie',
        title: film.title,
        poster_path: film.posterPath,
        status: isDone ? 'plan_to_watch' : 'completed',
        rating: null,
        season_progress: null,
        episode_progress: null,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen pt-8 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Page Header with distinct margins */}
        <div className="space-y-3 border-b border-border/40 pb-8">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/[0.08] border border-white/[0.1] text-foreground">
              <Compass className="h-6 w-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {t('title')}
            </h1>
          </div>
          <p className="text-sm sm:text-base text-foreground-muted max-w-2xl leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Journeys List */}
        <div className="space-y-8">
          {ALL_JOURNEYS.map((journey) => {
            const completed = completedMap[journey.id] || [];
            const total = journey.films.length;
            const pct = Math.round((completed.length / total) * 100);
            const isFullyCompleted = pct === 100;
            const isExpanded = expandedJourney === journey.id;

            return (
              <div
                key={journey.id}
                className="rounded-2xl border border-white/[0.08] bg-[#0E1017] p-6 sm:p-8 shadow-2xl transition-all space-y-6"
              >
                {/* Journey Summary Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-md bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 border border-white/[0.08]">
                        {journey.badgeTag}
                      </span>
                      {isFullyCompleted && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                          <Trophy className="h-3.5 w-3.5" />
                          {t('completed')}
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold text-foreground">
                      {t(journey.titleKey as any)}
                    </h2>
                    <p className="text-xs sm:text-sm text-foreground-muted max-w-2xl leading-relaxed">
                      {t(journey.descKey as any)}
                    </p>
                  </div>

                  {/* Progress & Expand Toggle */}
                  <div className="flex items-center gap-4 shrink-0 self-start md:self-auto">
                    <div className="text-left md:text-right space-y-0.5">
                      <span className="text-lg font-black font-mono text-emerald-400">
                        {pct}%
                      </span>
                      <p className="text-[10px] text-foreground-subtle uppercase font-bold">
                        {completed.length} / {total} {locale === 'zh-TW' ? '部作品' : 'Films'}
                      </p>
                    </div>

                    <button
                      onClick={() => setExpandedJourney(isExpanded ? '' : journey.id)}
                      className="rounded-xl bg-background-elevated p-2.5 text-foreground-muted hover:text-foreground border border-white/[0.08] transition-colors cursor-pointer"
                      aria-label="Toggle Milestones"
                    >
                      <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden border border-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-zinc-300 via-emerald-400 to-teal-300 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Interactive Film Milestone Grid (When Expanded) */}
                {isExpanded && (
                  <div className="pt-4 border-t border-white/[0.06] space-y-4">
                    <h3 className="text-xs font-bold text-foreground-subtle uppercase tracking-wider">
                      {locale === 'zh-TW' ? '旅程光影里程碑' : 'Journey Milestones & Films'}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {journey.films.map((film, idx) => {
                        const isWatched = completed.includes(film.id);
                        return (
                          <div
                            key={film.id}
                            className={`rounded-xl border p-4 transition-all flex flex-col justify-between space-y-3 ${
                              isWatched
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-foreground'
                                : 'bg-[#12141F] border-white/[0.06] text-foreground-muted hover:border-white/15'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] font-mono font-bold text-foreground-subtle">
                                #{idx + 1}
                              </span>
                              <button
                                onClick={() => handleToggleFilm(journey.id, film, total)}
                                className="cursor-pointer transition-transform active:scale-90"
                                title={isWatched ? 'Mark Unwatched' : 'Mark Watched'}
                              >
                                {isWatched ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-400 fill-emerald-500/20" />
                                ) : (
                                  <Circle className="h-5 w-5 text-foreground-subtle hover:text-foreground" />
                                )}
                              </button>
                            </div>

                            <div className="space-y-1">
                              <Link
                                href={`/movie/${film.id}`}
                                className="font-bold text-sm text-foreground hover:text-zinc-200 transition-colors line-clamp-1"
                              >
                                {film.title}
                              </Link>
                              <div className="flex items-center gap-2 text-[10px] text-foreground-subtle font-mono">
                                <Calendar className="h-3 w-3" />
                                <span>{film.year}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
