'use client';

import { useState, useMemo } from 'react';
import { Sparkles, Compass, Zap, Flame, Smile, Film } from 'lucide-react';
import { MovieCard } from '@/components/movie-card';
import type { TMDBTrendingResult } from '@/types';
import { useTranslations } from 'next-intl';
import { classifyMovieDna } from '@/lib/taste-engine';

interface PerfectForTonightProps {
  items: TMDBTrendingResult[];
}

type MoodType = 'all' | 'mindBending' | 'feelGood' | 'thriller' | 'quickWatch' | 'visualSplendor';

export function PerfectForTonight({ items }: PerfectForTonightProps) {
  const t = useTranslations('Home');
  const [activeMood, setActiveMood] = useState<MoodType>('all');

  const MOOD_TABS: { id: MoodType; labelKey: string; icon: any }[] = [
    { id: 'all', labelKey: 'moodAll', icon: Compass },
    { id: 'mindBending', labelKey: 'moodMindBending', icon: Sparkles },
    { id: 'feelGood', labelKey: 'moodFeelGood', icon: Smile },
    { id: 'thriller', labelKey: 'moodThriller', icon: Flame },
    { id: 'quickWatch', labelKey: 'moodQuickWatch', icon: Zap },
    { id: 'visualSplendor', labelKey: 'moodVisualSplendor', icon: Film },
  ];

  const filteredItems = useMemo(() => {
    if (activeMood === 'all') return items;

    return items.filter((item) => {
      const dna = classifyMovieDna(item);
      switch (activeMood) {
        case 'mindBending':
          return dna.traits.includes('mindBending') || dna.traits.includes('sciFi') || dna.traits.includes('psychological');
        case 'feelGood':
          return dna.traits.includes('funny') || dna.traits.includes('hopeful') || dna.traits.includes('familyFriendly') || dna.traits.includes('romantic');
        case 'thriller':
          return dna.traits.includes('dark') || dna.traits.includes('suspenseful') || dna.traits.includes('violent');
        case 'quickWatch':
          return dna.traits.includes('fastPaced') || ((item as any).runtime ? (item as any).runtime <= 95 : true);
        case 'visualSplendor':
          return dna.traits.includes('cinematography') || dna.traits.includes('fantasy') || (item.vote_average || 0) >= 7.8;
        default:
          return true;
      }
    });
  }, [items, activeMood]);

  const displayList = filteredItems.length > 0 ? filteredItems : items;

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/30 pb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t('perfectForTonight')}
          </h2>
          <p className="text-xs text-foreground-muted">
            {t('perfectForTonightSub')}
          </p>
        </div>

        {/* Mood Filter Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {MOOD_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMood === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMood(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-accent text-background shadow-lg shadow-white/10 scale-105'
                    : 'bg-background-elevated/70 text-foreground-muted hover:bg-background-elevated hover:text-foreground border border-border/20'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t(tab.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Media Horizontal Grid */}
      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
        {displayList.slice(0, 10).map((movie) => (
          <div key={movie.id} className="w-40 md:w-48 shrink-0 snap-start fade-in">
            <MovieCard
              id={movie.id}
              title={movie.title || movie.name || ''}
              posterPath={movie.poster_path}
              voteAverage={movie.vote_average}
              releaseDate={movie.release_date || movie.first_air_date}
              mediaType="movie"
              rtScore={movie.rtScore}
              rtStatus={movie.rtStatus}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
