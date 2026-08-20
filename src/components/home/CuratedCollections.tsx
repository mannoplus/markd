'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { Clapperboard, ChevronRight, Film, Star, Calendar, Bookmark, Check } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { upsertMediaItem } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';

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
  const [activeCollectionId, setActiveCollectionId] = useState<string>('nolan');
  const [savedMap, setSavedMap] = useState<Record<number, boolean>>({});

  const activeCollection = CURATED_COLLECTIONS.find((c) => c.id === activeCollectionId) || CURATED_COLLECTIONS[0];

  const handleQuickSave = async (film: CuratedFilm) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/${locale}/login`;
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
    <section className="space-y-6 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/[0.08] border border-white/[0.1]">
              <Clapperboard className="h-4 w-4 text-foreground" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {isZh ? 'MARKD 編輯特選片單' : 'Editorial Cinema Collections'}
            </h2>
          </div>
          <p className="text-xs text-foreground-muted">
            {isZh ? '深度策劃的主題專題、影史大師與當代必看經典' : 'Curated cinematic trilogies, auteur spotlights, and iconic movements.'}
          </p>
        </div>

        {/* Collection Selector Tabs */}
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto scrollbar-hide py-1">
          {CURATED_COLLECTIONS.map((col) => (
            <button
              key={col.id}
              onClick={() => setActiveCollectionId(col.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                activeCollectionId === col.id
                  ? 'bg-white text-black border-white shadow-lg shadow-white/10'
                  : 'bg-white/[0.03] text-foreground-muted border-white/[0.06] hover:text-foreground hover:border-white/15'
              }`}
            >
              {isZh ? col.curatorTagZh : col.curatorTagEn}
            </button>
          ))}
        </div>
      </div>

      {/* Active Collection Container */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017] p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Collection Meta */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-bold uppercase text-zinc-300 border border-white/[0.08] tracking-wider">
              {isZh ? activeCollection.curatorTagZh : activeCollection.curatorTagEn}
            </span>
          </div>

          <h3 className="text-2xl font-extrabold text-foreground">
            {isZh ? activeCollection.titleZh : activeCollection.titleEn}
          </h3>

          <p className="text-xs sm:text-sm text-foreground-muted max-w-3xl leading-relaxed">
            {isZh ? activeCollection.taglineZh : activeCollection.taglineEn}
          </p>
        </div>

        {/* Films Horizontal Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {activeCollection.films.map((film) => {
            const isSaved = savedMap[film.id];
            return (
              <div
                key={film.id}
                className="group relative flex flex-col justify-between rounded-xl overflow-hidden border border-white/[0.06] bg-[#12141F] transition-all hover:border-white/20 hover:-translate-y-1"
              >
                {/* Poster */}
                <Link href={`/movie/${film.id}`} className="relative aspect-[2/3] w-full block overflow-hidden">
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${film.posterPath}`}
                    alt={film.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Rating Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-yellow-400 backdrop-blur-md border border-white/10">
                    <Star className="h-3 w-3 fill-yellow-400" />
                    <span>{film.rating}</span>
                  </div>
                </Link>

                {/* Info & Action */}
                <div className="p-3 space-y-2 flex flex-col justify-between flex-1">
                  <div className="space-y-1">
                    <Link
                      href={`/movie/${film.id}`}
                      className="font-bold text-xs text-foreground hover:text-zinc-300 transition-colors line-clamp-1 block"
                    >
                      {film.title}
                    </Link>
                    <div className="flex items-center gap-1.5 text-[10px] text-foreground-subtle font-mono">
                      <Calendar className="h-3 w-3" />
                      <span>{film.year}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickSave(film)}
                    className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                      isSaved
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-white/[0.04] border-white/[0.08] text-foreground-muted hover:text-foreground hover:bg-white/[0.08]'
                    }`}
                  >
                    {isSaved ? <Check className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
                    <span>{isSaved ? (isZh ? '已在片單' : 'In Watchlist') : (isZh ? '+ 想看' : '+ Watchlist')}</span>
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
