'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  X, Sparkles, SlidersHorizontal, RotateCcw, Eye, 
  Trash2, ShieldCheck, Check, Loader2 
} from 'lucide-react';
import { 
  getTasteFeedbackExclusionsAction, 
  removeTasteFeedbackAction 
} from '@/app/actions/personalization';
import { translateDnaTrait, type MovieDnaTrait } from '@/lib/taste-engine';

interface TasteControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMood?: string;
  onClearMood?: () => void;
  topTraits?: string[];
  locale?: string;
}

export function TasteControlModal({
  isOpen,
  onClose,
  activeMood,
  onClearMood,
  topTraits = ['mindBending', 'thoughtProvoking', 'cinematography'],
  locale = 'en',
}: TasteControlModalProps) {
  const t = useTranslations('Companion');
  const [exclusions, setExclusions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoredIds, setRestoredIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getTasteFeedbackExclusionsAction()
        .then((data) => setExclusions(data))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const handleRestore = async (tmdbId: number, signalType: string) => {
    try {
      await removeTasteFeedbackAction(tmdbId, signalType);
      setRestoredIds((prev) => new Set([...prev, tmdbId]));
      setExclusions((prev) => prev.filter((item) => item.tmdb_id !== tmdbId));
    } catch (e) {
      console.error('Failed to restore exclusion:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0e0e18] border border-border/40 shadow-2xl p-6 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/20 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">
                {t('tastePreferences')}
              </h3>
              <p className="text-[11px] text-foreground-muted">
                {t('learningHint')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Section 1: Movie DNA Profile */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-subtle flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>{t('tasteProfileHeading')}</span>
          </h4>

          <div className="flex flex-wrap gap-2">
            {topTraits.map((trait) => (
              <span
                key={trait}
                className="px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-xs font-bold text-accent"
              >
                {translateDnaTrait(trait as MovieDnaTrait, locale)}
              </span>
            ))}
          </div>
        </div>

        {/* Section 2: Active Tonight's Mood */}
        {activeMood && activeMood !== 'all' && (
          <div className="rounded-2xl bg-background-elevated/50 border border-border/30 p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium text-foreground-muted">
                {t('activeMoodLabel')}
              </p>
              <p className="text-xs font-extrabold text-foreground">{activeMood}</p>
            </div>

            {onClearMood && (
              <button
                onClick={() => {
                  onClearMood();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background-elevated border border-border/40 text-[11px] font-bold text-foreground hover:text-accent hover:border-accent transition-all cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>{t('clearMood')}</span>
              </button>
            )}
          </div>
        )}

        {/* Section 3: Excluded / Dismissed Titles */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-subtle flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-foreground-muted" />
            <span>{t('negativeFiltersHeading')}</span>
          </h4>

          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {isLoading ? (
              <div className="flex items-center justify-center p-4 text-xs text-foreground-muted">
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-accent" />
                Loading...
              </div>
            ) : exclusions.length === 0 ? (
              <p className="text-xs text-foreground-muted/70 italic p-2 bg-background-elevated/20 rounded-xl">
                {t('noNegativeFilters')}
              </p>
            ) : (
              exclusions.map((item) => (
                <div
                  key={`${item.tmdb_id}-${item.signal_type}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-background-elevated/40 border border-border/20 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-foreground">TMDB #{item.tmdb_id}</span>
                    <span className="text-[10px] text-foreground-muted ml-2 uppercase px-1.5 py-0.5 rounded bg-background border border-border/30">
                      {item.signal_type}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRestore(item.tmdb_id, item.signal_type)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border/40 text-[10px] font-bold text-foreground hover:text-accent hover:border-accent transition-all cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{t('restoreTitle')}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-border/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-accent text-background font-bold text-xs hover:bg-accent-hover transition-all cursor-pointer shadow-md"
          >
            {t('restoreTitle') === '還原推薦' ? '完成' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
