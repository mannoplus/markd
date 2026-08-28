'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Check, Sparkles, Compass, Zap, Moon, History, Rocket, Flame, Eye, Film, Heart } from 'lucide-react';
import type { TasteAnswerItem } from '@/lib/onboarding/types';

interface StepTasteQuestionsProps {
  answers: TasteAnswerItem[];
  onSelectAnswer: (questionId: string, answerId: string) => void;
}

export function StepTasteQuestions({
  answers,
  onSelectAnswer,
}: StepTasteQuestionsProps) {
  const t = useTranslations('Onboarding');

  const QUESTIONS = [
    {
      id: 'friday_mood',
      title: t('q1_title') || "What's your typical viewing mood?",
      subtitle: t('q1_subtitle') || 'Select the energy you crave on movie night',
      options: [
        { id: 'thriller', label: t('q1_opt1') || 'Mind-Bending & Suspense', sub: 'High tension & twists', icon: Eye },
        { id: 'comedy', label: t('q1_opt2') || 'Feel Good & Cozy', sub: 'Comfort & easy laughs', icon: Heart },
        { id: 'drama', label: t('q1_opt3') || 'Dark & Gritty', sub: 'Atmospheric depth', icon: Moon },
        { id: 'action', label: t('q1_opt4') || 'High Energy & Adrenaline', sub: 'Action & fast pulse', icon: Zap },
      ],
    },
    {
      id: 'rewatch_vibe',
      title: t('q2_title') || 'Your go-to rewatch vibe?',
      subtitle: t('q2_subtitle') || 'Stories you happily return to again and again',
      options: [
        { id: 'scifi', label: t('q2_opt1') || 'Modern Epic & Sci-Fi', sub: 'Spectacle, scale & worlds', icon: Rocket },
        { id: 'mystery', label: t('q2_opt2') || 'Classic Cinema & Noir', sub: 'Timeless storytelling', icon: History },
        { id: 'nostalgic', label: t('q2_opt3') || 'Charming & Heartfelt', sub: 'Emotional resonance', icon: Sparkles },
        { id: 'heist', label: t('q2_opt4') || 'Clever Heists & Mysteries', sub: 'Sharp dialogue & puzzles', icon: Compass },
      ],
    },
    {
      id: 'taste_style',
      title: t('q3_title') || 'How would you describe your taste?',
      subtitle: t('q3_subtitle') || 'How you discover and select new titles',
      options: [
        { id: 'blockbusters', label: t('q3_opt1') || 'Blockbusters & Big Hits', sub: 'Cultural tentpoles & crowds', icon: Flame },
        { id: 'hidden_gems', label: t('q3_opt2') || 'Hidden Indie Gems', sub: 'Festival breakouts & originality', icon: Sparkles },
        { id: 'arthouse', label: t('q3_opt3') || 'Auteur & Visionary Style', sub: 'Director-driven masterpieces', icon: Film },
        { id: 'eclectic', label: t('q3_opt4') || 'Eclectic Explorer', sub: 'Diverse eras & unexpected picks', icon: Compass },
      ],
    },
    {
      id: 'priority_factor',
      title: t('q4_title') || 'What matters most when you hit play?',
      subtitle: t('q4_subtitle') || 'The core ingredient for a great watch',
      options: [
        { id: 'plot_twists', label: t('q4_opt1') || 'Unpredictable Plot Twists', sub: 'Keeping you guessing until the end', icon: Zap },
        { id: 'character_depth', label: t('q4_opt2') || 'Deep Character Depth', sub: 'Rich emotions & believable arcs', icon: Heart },
        { id: 'visuals', label: t('q4_opt3') || 'Immersive Visual Splendor', sub: 'Stunning cinematography & design', icon: Sparkles },
        { id: 'entertainment', label: t('q4_opt4') || 'Snappy Pacing & Entertainment', sub: 'Zero boring moments, pure flow', icon: Rocket },
      ],
    },
  ];

  const getSelectedAnswer = (questionId: string) => {
    return answers.find((a) => a.questionId === questionId)?.answerId;
  };

  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      {QUESTIONS.map((q, qIndex) => {
        const selectedId = getSelectedAnswer(q.id);
        const isAnswered = Boolean(selectedId);

        return (
          <section key={q.id} className="space-y-4">
            {/* Question Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                  {t('questionNumber', { number: `0${qIndex + 1}` }) || `Layer 0${qIndex + 1}`}
                </span>
                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                  {q.title}
                </h2>
                <p className="text-xs text-white/60">
                  {q.subtitle}
                </p>
              </div>

              {isAnswered && (
                <div className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>{t('answered') || 'Set'}</span>
                </div>
              )}
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {q.options.map((opt) => {
                const isSelected = selectedId === opt.id;
                const IconComponent = opt.icon;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelectAnswer(q.id, opt.id)}
                    className={`group relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 select-none ${
                      isSelected
                        ? 'bg-white/10 border-white text-white shadow-[0_0_24px_rgba(255,255,255,0.15)] ring-1 ring-white'
                        : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10 text-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                          isSelected
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 border-white/10 text-white/70 group-hover:text-white group-hover:border-white/30'
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <span className="block text-sm font-bold text-white truncate">
                          {opt.label}
                        </span>
                        <span className="block text-[11px] text-white/60 truncate">
                          {opt.sub}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`h-5 w-5 shrink-0 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-white bg-white text-black'
                          : 'border-white/30 text-transparent group-hover:border-white/60'
                      }`}
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
