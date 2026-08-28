'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Star } from 'lucide-react';
import { upsertMediaItem } from '@/app/actions';
import { emitClientSignal, createSignal } from '@/lib/personalization/signals';
import { IMAGE_SIZES } from '@/lib/tmdb';
import type { PersonalizedShelfItem } from '@/app/actions/personalization';
import { MediaActionButtons } from '@/components/media-action-buttons';

interface CompanionCardProps {
  item: PersonalizedShelfItem;
  surface?: 'home' | 'dashboard' | 'ask_markd';
}

export function CompanionCard({ item, surface = 'home' }: CompanionCardProps) {
  const t = useTranslations('Companion');
  const [isSaved, setIsSaved] = useState<'watchlist' | 'watched' | null>(null);

  const handleAddToWatchlist = async () => {
    try {
      await upsertMediaItem({
        tmdb_id: item.id,
        media_type: item.mediaType,
        title: item.title,
        poster_path: item.posterPath,
        status: 'plan_to_watch',
        rating: null,
        season_progress: null,
        episode_progress: null,
      });
      setIsSaved('watchlist');
      emitClientSignal(createSignal('movie.watchlist_added', {
        tmdbId: item.id,
        mediaType: item.mediaType,
        title: item.title,
        context: { surface },
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkWatched = async () => {
    try {
      await upsertMediaItem({
        tmdb_id: item.id,
        media_type: item.mediaType,
        title: item.title,
        poster_path: item.posterPath,
        status: 'completed',
        rating: 8,
        season_progress: null,
        episode_progress: null,
      });
      setIsSaved('watched');
      emitClientSignal(createSignal('movie.completed', {
        tmdbId: item.id,
        mediaType: item.mediaType,
        title: item.title,
        context: { surface },
      }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="group relative flex flex-col h-[360px] rounded-2xl bg-[#0c0c14] border border-border/30 hover:border-accent/40 shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 select-none">
      {/* Poster Image */}
      <Link href={`/${item.mediaType}/${item.id}`} className="relative h-[240px] w-full overflow-hidden bg-background-elevated block">
        {item.posterPath ? (
          <Image
            src={`${IMAGE_SIZES.poster.medium}${item.posterPath}`}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 160px, 220px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-foreground-muted font-bold">
            {item.title}
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c14] via-transparent to-black/30 pointer-events-none" />

        {/* Rating if available */}
        {item.rating && (
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-md px-2 py-1 text-[10px] font-bold text-amber-400 border border-border/40 shadow-lg">
            <Star className="h-3 w-3 fill-current" />
            <span>{item.rating.toFixed(1)}</span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex-1 p-3.5 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-1.5">
            <Link 
              href={`/${item.mediaType}/${item.id}`}
              className="text-xs font-extrabold text-foreground hover:text-accent transition-colors line-clamp-1"
              title={item.title}
            >
              {item.title}
            </Link>
            {item.year && (
              <span className="text-[10px] font-semibold text-foreground-subtle shrink-0">
                {item.year}
              </span>
            )}
          </div>
        </div>

        {/* Sleek Action Buttons */}
        <MediaActionButtons
          className="pt-2"
          savedState={isSaved}
          onAddToWatchlist={handleAddToWatchlist}
          onMarkWatched={handleMarkWatched}
          disabled={Boolean(isSaved)}
          watchlistLabel={t('quickAddToWatchlist')}
          watchlistActiveLabel={t('added')}
          watchedLabel={t('quickMarkWatched')}
          watchedActiveLabel={t('watched')}
        />
      </div>
    </div>
  );
}
