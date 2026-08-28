'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal } from 'lucide-react';
import { emitClientSignal, createSignal } from '@/lib/personalization/signals';

export interface MoodMatcherBarProps {
  activeMood?: string;
  onSelectMood: (mood: string) => void;
  onOpenControls?: () => void;
}

export function MoodMatcherBar({
  activeMood = 'all',
  onSelectMood,
  onOpenControls,
}: MoodMatcherBarProps) {
  const t = useTranslations('Companion');

  const MOOD_OPTIONS = [
    { key: 'all', label: t('moodAll') },
    { key: 'mindBending', label: t('moodMindBending') },
    { key: 'cozy', label: t('moodCozy') },
    { key: 'slowBurn', label: t('moodSlowBurn') },
    { key: 'darkThriller', label: t('moodDarkThriller') },
    { key: 'underTwoHours', label: t('moodUnderTwoHours') },
    { key: 'emotional', label: t('moodEmotional') },
    { key: 'actionPacked', label: t('moodActionPacked') },
    { key: 'visualSplendor', label: t('moodVisualSplendor') },
  ];

  const handleSelect = (key: string, label: string) => {
    onSelectMood(key);
    emitClientSignal(
      createSignal(key === 'all' ? 'mood.cleared' : 'mood.selected', {
        context: {
          surface: 'mood_bar',
          activeMood: label,
        },
      })
    );
  };

  return (
    <div className="w-full rounded-2xl bg-[#0e0e17]/80 backdrop-blur-md border border-border/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
      {/* Text-only Section Header */}
      <div className="flex items-center px-1 shrink-0">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
          {t('setTonightMood')}
        </span>
      </div>

      {/* Mood Pills Slider - Text Only with Subtle Transitions */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none snap-x -mx-1 px-1">
        {MOOD_OPTIONS.map((mood) => {
          const isSelected = activeMood === mood.key || activeMood === mood.label;

          return (
            <button
              key={mood.key}
              onClick={() => handleSelect(mood.key, mood.label)}
              className={`shrink-0 snap-start px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 cursor-pointer select-none border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isSelected
                  ? 'bg-accent text-background border-accent font-semibold shadow-sm shadow-accent/20'
                  : 'bg-background-elevated/70 border-border/40 text-foreground-muted hover:text-foreground hover:border-accent/40 hover:bg-background-elevated'
              }`}
            >
              {mood.label}
            </button>
          );
        })}
      </div>

      {/* Controls / Settings Button */}
      {onOpenControls && (
        <button
          onClick={onOpenControls}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-elevated border border-border/40 text-xs font-medium text-foreground-muted hover:text-foreground hover:border-border-hover transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          title={t('tastePreferences')}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-foreground-muted" />
          <span className="hidden md:inline">{t('tastePreferences')}</span>
        </button>
      )}
    </div>
  );
}
