'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, SlidersHorizontal, RotateCcw } from 'lucide-react';
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
    { key: 'all', label: t('moodAll'), icon: '✨' },
    { key: 'mindBending', label: t('moodMindBending'), icon: '🌀' },
    { key: 'cozy', label: t('moodCozy'), icon: '☕' },
    { key: 'slowBurn', label: t('moodSlowBurn'), icon: '🕯️' },
    { key: 'darkThriller', label: t('moodDarkThriller'), icon: '🌑' },
    { key: 'underTwoHours', label: t('moodUnderTwoHours'), icon: '⏱️' },
    { key: 'emotional', label: t('moodEmotional'), icon: '💧' },
    { key: 'actionPacked', label: t('moodActionPacked'), icon: '⚡' },
    { key: 'visualSplendor', label: t('moodVisualSplendor'), icon: '🎨' },
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
      {/* Label */}
      <div className="flex items-center gap-2 px-1 shrink-0">
        <div className="h-6 w-6 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center text-accent">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
        </div>
        <span className="text-xs font-black uppercase tracking-wider text-foreground">
          {t('setTonightMood')}
        </span>
      </div>

      {/* Mood Pills Slider */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none snap-x -mx-1 px-1">
        {MOOD_OPTIONS.map((mood) => {
          const isSelected = (activeMood === mood.key) || (activeMood === mood.label);

          return (
            <button
              key={mood.key}
              onClick={() => handleSelect(mood.key, mood.label)}
              className={`shrink-0 snap-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm ${
                isSelected
                  ? 'bg-accent text-background border border-accent font-black shadow-accent/25 scale-[1.02]'
                  : 'bg-background-elevated/70 border border-border/40 text-foreground-muted hover:text-foreground hover:border-accent/40 hover:bg-background-elevated'
              }`}
            >
              <span>{mood.icon}</span>
              <span>{mood.label}</span>
            </button>
          );
        })}
      </div>

      {/* Controls / Reset Button */}
      {onOpenControls && (
        <button
          onClick={onOpenControls}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-background-elevated border border-border/40 text-xs font-semibold text-foreground-muted hover:text-accent hover:border-accent/40 transition-all cursor-pointer"
          title={t('tastePreferences')}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{t('tastePreferences')}</span>
        </button>
      )}
    </div>
  );
}
