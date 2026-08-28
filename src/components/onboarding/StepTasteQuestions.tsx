'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
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
      title: t('q1_title'),
      options: [
        { id: 'thriller', label: t('q1_opt1') },
        { id: 'comedy', label: t('q1_opt2') },
        { id: 'drama', label: t('q1_opt3') },
        { id: 'action', label: t('q1_opt4') },
      ],
    },
    {
      id: 'rewatch_vibe',
      title: t('q2_title'),
      options: [
        { id: 'scifi', label: t('q2_opt1') },
        { id: 'mystery', label: t('q2_opt2') },
        { id: 'nostalgic', label: t('q2_opt3') },
        { id: 'heist', label: t('q2_opt4') },
      ],
    },
    {
      id: 'taste_style',
      title: t('q3_title'),
      options: [
        { id: 'blockbusters', label: t('q3_opt1') },
        { id: 'hidden_gems', label: t('q3_opt2') },
        { id: 'arthouse', label: t('q3_opt3') },
        { id: 'eclectic', label: t('q3_opt4') },
      ],
    },
    {
      id: 'priority_factor',
      title: t('q4_title'),
      options: [
        { id: 'plot_twists', label: t('q4_opt1') },
        { id: 'character_depth', label: t('q4_opt2') },
        { id: 'visuals', label: t('q4_opt3') },
        { id: 'entertainment', label: t('q4_opt4') },
      ],
    },
  ];

  const getSelectedAnswer = (questionId: string) => {
    return answers.find((a) => a.questionId === questionId)?.answerId;
  };

  return (
    <div className="space-y-8">
      {QUESTIONS.map((q, qIndex) => {
        const selectedId = getSelectedAnswer(q.id);
        const isAnswered = Boolean(selectedId);

        return (
          <div
            key={q.id}
            className="rounded-2xl bg-[#0f0f1c]/80 border border-border/40 p-5 sm:p-6 space-y-4 shadow-lg transition-all"
          >
            {/* Question Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-foreground-muted">
                  Question 0{qIndex + 1}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {q.title}
                </h3>
              </div>

              {isAnswered && (
                <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <Check className="h-3 w-3 stroke-[3]" />
                  <span>Answered</span>
                </span>
              )}
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {q.options.map((opt) => {
                const isSelected = selectedId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelectAnswer(q.id, opt.id)}
                    className={`group text-left p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                      isSelected
                        ? 'bg-accent/15 border-accent text-accent shadow-md shadow-accent/10 ring-1 ring-accent/30'
                        : 'bg-background-elevated/70 border-border/40 text-foreground-muted hover:text-foreground hover:bg-background-elevated hover:border-accent/40'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span
                      className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-accent bg-accent text-background'
                          : 'border-border/60 text-transparent group-hover:border-foreground-muted'
                      }`}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
