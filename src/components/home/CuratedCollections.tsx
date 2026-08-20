'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { Star, Calendar, Bookmark, Check } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { upsertMediaItem } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import { SectionHeader } from '@/components/section-header';

interface CuratedFilm {
  id: number;
  title: string;
  year: string;
  rating: string;
  posterPath: string;
}

interface Collection {
  id: string;
  titleEn: string;
  titleZh: string;
  taglineEn: string;
  taglineZh: string;
  curatorTagEn: string;
  curatorTagZh: string;
  films: CuratedFilm[];
}

const CURATED_COLLECTIONS: Collection[] = [
  {
    id: 'nolan',
    titleEn: 'Christopher Nolan: Architectural Cinema',
    titleZh: '克里斯多福·諾蘭：光影時空迷宮',
    taglineEn: 'Mind-bending nonlinear narratives, practical scale, and high-stakes philosophical depth.',
    taglineZh: '打破線性時空的非線性敘事、震撼實景特效與宏大哲學深度。',
    curatorTagEn: 'Auteur Showcase',
    curatorTagZh: '導演專題',
    films: [
      { id: 872585, title: 'Oppenheimer', year: '2023', rating: '8.1', posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg' },
      { id: 157336, title: 'Interstellar', year: '2014', rating: '8.4', posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
      { id: 27205, title: 'Inception', year: '2010', rating: '8.4', posterPath: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg' },
      { id: 155, title: 'The Dark Knight', year: '2008', rating: '8.5', posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg' },
      { id: 1124, title: 'The Prestige', year: '2006', rating: '8.2', posterPath: '/bdN3gXuIZYaam7HQduaQwh5t6sl.jpg' },
      { id: 77, title: 'Memento', year: '2000', rating: '8.2', posterPath: '/yuWy097X9CRHGnm9xzgG0Yx9wK.jpg' },
    ],
  },
  {
    id: 'ghibli',
    titleEn: 'Studio Ghibli & Hayao Miyazaki',
    titleZh: '吉卜力工作室與宮﨑駿：手繪動畫經典',
    taglineEn: 'Timeless hand-drawn animation, mythic wonders, and profound ecological narratives.',
    taglineZh: '永恆的手繪動畫匠心、魔幻奇蹟與深刻的生命與自然哲思。',
    curatorTagEn: 'Animation Masterworks',
    curatorTagZh: '動畫大師',
    films: [
      { id: 129, title: 'Spirited Away', year: '2001', rating: '8.5', posterPath: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg' },
      { id: 508883, title: 'The Boy and the Heron', year: '2023', rating: '7.4', posterPath: '/jDQPkg03iK59dBURQkrVBM8MGEn.jpg' },
      { id: 128, title: 'Princess Mononoke', year: '1997', rating: '8.3', posterPath: '/cMYCDADoLKLbB83gpe190cbhyYd.jpg' },
      { id: 4935, title: 'Howl\'s Moving Castle', year: '2004', rating: '8.4', posterPath: '/6p0v21j86LwI2hZ8nC3m9Z7Z4fH.jpg' },
      { id: 8392, title: 'My Neighbor Totoro', year: '1988', rating: '8.1', posterPath: '/rtGDOJQGztJLwhIqHGExBG1hxew.jpg' },
    ],
  },
  {
    id: 'scifi',
    titleEn: '21st Century Visionary Sci-Fi',
    titleZh: '21 世紀當代科幻神作',
    taglineEn: 'Visually stunning explorations of artificial consciousness, alien encounter, and deep cosmos.',
    taglineZh: '極致視覺美學、人工意識探討與浩瀚宇宙的人性思辨。',
    curatorTagEn: 'Visionary Cinema',
    curatorTagZh: '科幻精選',
    films: [
      { id: 693134, title: 'Dune: Part Two', year: '2024', rating: '8.2', posterPath: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg' },
      { id: 438631, title: 'Dune: Part One', year: '2021', rating: '7.8', posterPath: '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg' },
      { id: 335984, title: 'Blade Runner 2049', year: '2017', rating: '7.6', posterPath: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg' },
      { id: 329865, title: 'Arrival', year: '2016', rating: '7.6', posterPath: '/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg' },
      { id: 264660, title: 'Ex Machina', year: '2014', rating: '7.6', posterPath: '/dmk6Pz9wWpQxH4eQ83eE8B6H6lH.jpg' },
    ],
  },
  {
    id: 'korean',
    titleEn: 'Modern Korean Cinema Masterpieces',
    titleZh: '當代韓國電影巨作：黑色懸疑與極致反轉',
    taglineEn: 'Razor-sharp tension, intricate social satire, and unmatched stylistic precision.',
    taglineZh: '無懈可擊的懸疑節奏、銳利社會批判與極致視覺美學。',
    curatorTagEn: 'Neo-Noir & Thriller',
    curatorTagZh: '驚悚懸疑',
    films: [
      { id: 496243, title: 'Parasite', year: '2019', rating: '8.5', posterPath: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg' },
      { id: 705996, title: 'Decision to Leave', year: '2022', rating: '7.3', posterPath: '/N2w4GZ8m2p5q1F9r4y6b8n7e.jpg' },
      { id: 290098, title: 'The Handmaiden', year: '2016', rating: '8.3', posterPath: '/8MnXRXkE0kR2m4F3L9x0Fq3.jpg' },
      { id: 11423, title: 'Memories of Murder', year: '2003', rating: '8.1', posterPath: '/7O2yFk4k8N1Yp8nK7Xb9q2r1e.jpg' },
      { id: 670, title: 'Oldboy', year: '2003', rating: '8.3', posterPath: '/pWDtHJqTGv9FuVMRebSSIRBsXQg.jpg' },
    ],
  },
];

export function CuratedCollections() {
  const locale = useLocale();
  const isZh = locale === 'zh-TW';
  const t = useTranslations('Home');
  const [activeCollectionId, setActiveCollectionId] = useState<string>('nolan');
  const [savedMap, setSavedMap] = useState<Record<number, boolean>>({});

  const activeCollection = CURATED_COLLECTIONS.find((c) => c.id === activeCollectionId) || CURATED_COLLECTIONS[0];

  const handleQuickSave = async (film: CuratedFilm) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.assign(`/${locale}/login`);
      return;
    }

    const nextState = !savedMap[film.id];
    setSavedMap((prev) => ({ ...prev, [film.id]: nextState }));

    try {
      await upsertMediaItem({
        tmdb_id: film.id,
        media_type: 'movie',
        title: film.title,
        poster_path: film.posterPath,
        status: nextState ? 'plan_to_watch' : 'dropped',
        rating: null,
        season_progress: null,
        episode_progress: null,
      });
    } catch (e) {
      console.error(e);
      setSavedMap((prev) => ({ ...prev, [film.id]: !nextState }));
    }
  };

  return (
    <section className="space-y-5">
      <SectionHeader
        eyebrow="Curated"
        title={t('editorialCollections')}
        description={t('editorialCollectionsSub')}
      >
        <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {CURATED_COLLECTIONS.map((col) => (
            <button
              key={col.id}
              onClick={() => setActiveCollectionId(col.id)}
              aria-pressed={activeCollectionId === col.id}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors border ${
                activeCollectionId === col.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background-elevated/70 text-foreground-muted border-border hover:text-foreground hover:border-border-hover'
              }`}
            >
              {isZh ? col.curatorTagZh : col.curatorTagEn}
            </button>
          ))}
        </div>
      </SectionHeader>

      {/* Active Collection Container */}
      <div className="rounded-xl border border-border bg-surface-secondary p-5 shadow-card sm:p-7">
        {/* Collection Meta */}
        <div className="space-y-2">
          <span className="eyebrow inline-flex">
            {isZh ? activeCollection.curatorTagZh : activeCollection.curatorTagEn}
          </span>
          <h3 className="section-title">
            {isZh ? activeCollection.titleZh : activeCollection.titleEn}
          </h3>
          <p className="lede">
            {isZh ? activeCollection.taglineZh : activeCollection.taglineEn}
          </p>
        </div>

        {/* Films Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 sm:gap-4">
          {activeCollection.films.map((film) => {
            const isSaved = savedMap[film.id];
            return (
              <div
                key={film.id}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface-primary transition-all duration-[var(--transition-base)] hover:-translate-y-1 hover:border-border-hover hover:shadow-elevated"
              >
                {/* Poster */}
                <Link href={`/movie/${film.id}`} className="relative block w-full overflow-hidden" style={{ aspectRatio: '2/3' }}>
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${film.posterPath}`}
                    alt={film.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-[var(--transition-base)] group-hover:opacity-100" />

                  {/* Rating Badge */}
                  <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-gold-star backdrop-blur-md">
                    <Star className="h-3 w-3 fill-gold-star" />
                    <span>{film.rating}</span>
                  </div>
                </Link>

                {/* Info & Action */}
                <div className="flex flex-1 flex-col justify-between gap-2 p-2.5">
                  <div className="space-y-1">
                    <Link
                      href={`/movie/${film.id}`}
                      className="block text-xs font-semibold text-foreground transition-colors line-clamp-1 group-hover:text-accent"
                    >
                      {film.title}
                    </Link>
                    <div className="flex items-center gap-1.5 text-[10px] text-foreground-subtle">
                      <Calendar className="h-3 w-3" />
                      <span>{film.year}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickSave(film)}
                    className={`flex w-full items-center justify-center gap-1 rounded-md border py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      isSaved
                        ? 'border-success/30 bg-success/10 text-success'
                        : 'border-border bg-background-elevated text-foreground-muted hover:bg-background-highlight hover:text-foreground'
                    }`}
                  >
                    {isSaved ? <Check className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
                    <span>
                      {isSaved ? t('inWatchlist') : t('quickAddToWatchlist')}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
