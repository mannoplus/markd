/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { 
  Sparkles, Clock, Check, Eye, CheckCircle2, MoreVertical, 
  ThumbsDown, EyeOff, Ban, ExternalLink, Star 
} from 'lucide-react';
import { upsertMediaItem } from '@/app/actions';
import { emitClientSignal, createSignal } from '@/lib/personalization/signals';
import { IMAGE_SIZES } from '@/lib/tmdb';
import type { PersonalizedShelfItem } from '@/app/actions/personalization';

interface CompanionCardProps {
  item: PersonalizedShelfItem;
  surface?: 'home' | 'dashboard' | 'ask_markd';
  onDismiss?: (id: number) => void;
}

export function CompanionCard({ item, surface = 'home', onDismiss }: CompanionCardProps) {
  const t = useTranslations('Companion');
  const [isSaved, setIsSaved] = useState<'watchlist' | 'watched' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState<string | null>(null);

  const handleAddToWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleMarkWatched = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleFeedback = (e: React.MouseEvent, type: 'feedback.not_interested' | 'feedback.less_like_this' | 'feedback.not_my_type' | 'feedback.already_watched') => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsDismissed(true);

    let note = t('feedbackDismissed');
    if (type === 'feedback.not_interested') note = t('feedbackNotInterested');
    if (type === 'feedback.less_like_this') note = t('feedbackShowLess');
    if (type === 'feedback.not_my_type') note = t('feedbackNotMyType');
    if (type === 'feedback.already_watched') note = t('feedbackAlreadyWatched');
    setFeedbackNote(note);

    emitClientSignal(createSignal(type, {
      tmdbId: item.id,
      mediaType: item.mediaType,
      title: item.title,
      context: { surface },
    }));

    if (onDismiss) onDismiss(item.id);
  };

  if (isDismissed) {
    return (
      <div className="h-[360px] w-full rounded-2xl bg-background-elevated/40 border border-border/20 p-4 flex flex-col items-center justify-center text-center space-y-2 select-none animate-in fade-in duration-300">
        <EyeOff className="h-6 w-6 text-foreground-muted/60" />
        <p className="text-xs text-foreground-muted font-medium">{feedbackNote}</p>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col h-[380px] rounded-2xl bg-[#0c0c14] border border-border/30 hover:border-accent/40 shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 select-none">
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

        {/* Match Score Badge */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-md px-2.5 py-1 text-[10px] font-black text-accent border border-accent/30 shadow-lg shadow-black/50">
          <Sparkles className="h-3 w-3 animate-pulse" />
          <span>{t('matchScore', { score: item.matchScore })}</span>
        </div>

        {/* Rating if available */}
        {item.rating && (
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-md px-2 py-1 text-[10px] font-bold text-amber-400 border border-border/40 shadow-lg">
            <Star className="h-3 w-3 fill-current" />
            <span>{item.rating.toFixed(1)}</span>
          </div>
        )}
      </Link>

      {/* Body & Reasons */}
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

          {/* Structured Reason */}
          <p className="text-[10px] text-foreground-muted/90 leading-tight line-clamp-2 italic">
            "{item.reason}"
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-border/20 gap-1.5 relative">
          <div className="flex items-center gap-1.5">
            {/* Add to Watchlist */}
            <button
              onClick={handleAddToWatchlist}
              disabled={Boolean(isSaved)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-background-elevated border border-border/40 text-[10px] font-bold text-foreground hover:bg-accent hover:text-background hover:border-accent transition-all cursor-pointer disabled:opacity-50"
              title={t('quickAddToWatchlist')}
              aria-label={t('quickAddToWatchlist')}
            >
              {isSaved === 'watchlist' ? <Check className="h-3 w-3 text-accent" /> : <Clock className="h-3 w-3" />}
              <span className="hidden sm:inline">{isSaved === 'watchlist' ? t('added') : t('quickAddToWatchlist')}</span>
            </button>

            {/* Mark Watched */}
            <button
              onClick={handleMarkWatched}
              disabled={Boolean(isSaved)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-background-elevated border border-border/40 text-[10px] font-bold text-foreground hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all cursor-pointer disabled:opacity-50"
              title={t('quickMarkWatched')}
              aria-label={t('quickMarkWatched')}
            >
              {isSaved === 'watched' ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Eye className="h-3 w-3" />}
              <span className="hidden sm:inline">{isSaved === 'watched' ? t('watched') : t('quickMarkWatched')}</span>
            </button>
          </div>

          <div className="flex items-center gap-1 relative">
            {/* Feedback Menu Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors cursor-pointer"
              title="Feedback"
              aria-label="Feedback"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {/* Feedback Dropdown Menu */}
            {isMenuOpen && (
              <div 
                className="absolute bottom-full right-0 mb-2 w-44 rounded-xl bg-[#14141f] border border-border/50 shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => handleFeedback(e, 'feedback.not_interested')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                >
                  <ThumbsDown className="h-3 w-3 text-red-400" />
                  <span>{t('feedbackNotInterested')}</span>
                </button>
                <button
                  onClick={(e) => handleFeedback(e, 'feedback.less_like_this')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-foreground-muted hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer text-left"
                >
                  <EyeOff className="h-3 w-3 text-amber-400" />
                  <span>{t('feedbackShowLess')}</span>
                </button>
                <button
                  onClick={(e) => handleFeedback(e, 'feedback.not_my_type')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                >
                  <Ban className="h-3 w-3 text-red-400" />
                  <span>{t('feedbackNotMyType')}</span>
                </button>
                <button
                  onClick={(e) => handleFeedback(e, 'feedback.already_watched')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors cursor-pointer text-left"
                >
                  <Check className="h-3 w-3 text-accent" />
                  <span>{t('feedbackAlreadyWatched')}</span>
                </button>
              </div>
            )}

            <Link
              href={`/${item.mediaType}/${item.id}`}
              className="p-1 rounded-lg text-foreground-muted hover:text-accent hover:bg-accent/10 transition-colors"
              title={t('viewDetails')}
              aria-label={t('viewDetails')}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
