'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StepGenres } from './StepGenres';
import { StepTitles } from './StepTitles';
import { StepTasteQuestions } from './StepTasteQuestions';
import {
  getOnboardingState,
  saveOnboardingState,
} from '@/lib/onboarding/storage';
import type {
  OnboardingState,
  FavoriteTitleItem,
} from '@/lib/onboarding/types';

interface Genre {
  id: number;
  name: string;
}

interface OnboardingWizardProps {
  movieGenres: Genre[];
  tvGenres: Genre[];
}

export function OnboardingWizard({
  movieGenres,
  tvGenres,
}: OnboardingWizardProps) {
  const t = useTranslations('Onboarding');
  const router = useRouter();

  const [state, setState] = useState<OnboardingState>(() => {
    if (typeof window !== 'undefined') {
      return getOnboardingState();
    }
    return {
      genres: { movie: [], tv: [] },
      genreNames: { movie: [], tv: [] },
      favoriteTitles: [],
      tasteAnswers: [],
      currentStep: 1,
    };
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Synchronize state changes to localStorage
  const updateState = (updater: (prev: OnboardingState) => OnboardingState) => {
    setState((prev) => {
      const next = updater(prev);
      saveOnboardingState(next);
      return next;
    });
  };

  // Genre handlers
  const handleToggleMovieGenre = (id: number, name: string) => {
    updateState((prev) => {
      const isSelected = prev.genres.movie.includes(id);
      const nextIds = isSelected
        ? prev.genres.movie.filter((gId) => gId !== id)
        : [...prev.genres.movie, id];
      const nextNames = isSelected
        ? (prev.genreNames?.movie || []).filter((gName) => gName !== name)
        : [...(prev.genreNames?.movie || []), name];

      return {
        ...prev,
        genres: { ...prev.genres, movie: nextIds },
        genreNames: { ...prev.genreNames, movie: nextNames, tv: prev.genreNames?.tv || [] },
      };
    });
  };

  const handleToggleTvGenre = (id: number, name: string) => {
    updateState((prev) => {
      const isSelected = prev.genres.tv.includes(id);
      const nextIds = isSelected
        ? prev.genres.tv.filter((gId) => gId !== id)
        : [...prev.genres.tv, id];
      const nextNames = isSelected
        ? (prev.genreNames?.tv || []).filter((gName) => gName !== name)
        : [...(prev.genreNames?.tv || []), name];

      return {
        ...prev,
        genres: { ...prev.genres, tv: nextIds },
        genreNames: { ...prev.genreNames, tv: nextNames, movie: prev.genreNames?.movie || [] },
      };
    });
  };

  // Title handlers
  const handleToggleTitle = (item: FavoriteTitleItem) => {
    updateState((prev) => {
      const exists = prev.favoriteTitles.some((t) => t.id === item.id);
      const nextTitles = exists
        ? prev.favoriteTitles.filter((t) => t.id !== item.id)
        : [...prev.favoriteTitles, item];
      return { ...prev, favoriteTitles: nextTitles };
    });
  };

  const handleRemoveTitle = (id: number) => {
    updateState((prev) => ({
      ...prev,
      favoriteTitles: prev.favoriteTitles.filter((t) => t.id !== id),
    }));
  };

  // Taste question handler
  const handleSelectTasteAnswer = (questionId: string, answerId: string) => {
    updateState((prev) => {
      const filtered = prev.tasteAnswers.filter((a) => a.questionId !== questionId);
      return {
        ...prev,
        tasteAnswers: [...filtered, { questionId, answerId }],
      };
    });
  };

  // Validation per step
  const isStep1Valid =
    state.genres.movie.length >= 3 && state.genres.tv.length >= 3;
  const isStep2Valid = state.favoriteTitles.length >= 3;
  const isStep3Valid = state.tasteAnswers.length >= 4;

  const canProceed =
    state.currentStep === 1
      ? isStep1Valid
      : state.currentStep === 2
      ? isStep2Valid
      : isStep3Valid;

  const handleNext = () => {
    if (!canProceed) return;
    if (state.currentStep < 3) {
      updateState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Step 3 finished -> route to login page
      router.push('/login');
    }
  };

  const handleBack = () => {
    if (state.currentStep > 1) {
      updateState((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const getStepBadge = () => {
    switch (state.currentStep) {
      case 1:
        return t('step1Badge');
      case 2:
        return t('step2Badge');
      case 3:
        return t('step3Badge');
      default:
        return '';
    }
  };

  const getStepTitle = () => {
    switch (state.currentStep) {
      case 1:
        return t('step1Title');
      case 2:
        return t('step2Title');
      case 3:
        return t('step3Title');
      default:
        return '';
    }
  };

  const getStepSubtitle = () => {
    switch (state.currentStep) {
      case 1:
        return t('step1Subtitle');
      case 2:
        return t('step2Subtitle');
      case 3:
        return t('step3Subtitle');
      default:
        return '';
    }
  };

  const progressPercent = ((state.currentStep - 1) / 3) * 100 + (canProceed ? 33.33 : 15);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-16">
      {/* Progress Bar & Counter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-foreground-muted">
          <span>{t('stepCounter', { current: state.currentStep, total: 3 })}</span>
          <span>{Math.min(100, Math.round(progressPercent))}%</span>
        </div>

        <div className="h-2 w-full bg-background-elevated rounded-full overflow-hidden border border-border/40">
          <div
            className="h-full bg-gradient-to-r from-accent/80 to-accent transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Header Container */}
      <div className="space-y-2 text-center sm:text-left">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-accent/15 text-accent border border-accent/25">
          {getStepBadge()}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          {getStepTitle()}
        </h1>
        <p className="text-sm sm:text-base text-foreground-muted max-w-2xl">
          {getStepSubtitle()}
        </p>
      </div>

      {/* Step Body */}
      <div className="pt-2">
        {state.currentStep === 1 && (
          <StepGenres
            movieGenres={movieGenres}
            tvGenres={tvGenres}
            selectedMovieGenres={state.genres.movie}
            selectedTvGenres={state.genres.tv}
            onToggleMovieGenre={handleToggleMovieGenre}
            onToggleTvGenre={handleToggleTvGenre}
          />
        )}

        {state.currentStep === 2 && (
          <StepTitles
            favoriteTitles={state.favoriteTitles}
            onToggleTitle={handleToggleTitle}
            onRemoveTitle={handleRemoveTitle}
          />
        )}

        {state.currentStep === 3 && (
          <StepTasteQuestions
            answers={state.tasteAnswers}
            onSelectAnswer={handleSelectTasteAnswer}
          />
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/40">
        {/* Back Button */}
        <div>
          {state.currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border/50 bg-background-elevated text-xs font-bold text-foreground hover:bg-background-highlight transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('back')}</span>
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* Validation Helper Hint & Next Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {!canProceed && (
            <span className="text-xs font-medium text-amber-400/90 text-center sm:text-right">
              {state.currentStep === 1 &&
                t('genreMinRequirement', {
                  min: 3,
                  movieCount: state.genres.movie.length,
                  tvCount: state.genres.tv.length,
                })}
              {state.currentStep === 2 &&
                t('pickMinRequirement', {
                  min: 3,
                  count: state.favoriteTitles.length,
                })}
              {state.currentStep === 3 && t('answerAllRequirement')}
            </span>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
              canProceed
                ? 'bg-accent text-background shadow-lg shadow-accent/25 hover:bg-accent/90 hover:shadow-accent/40 active:scale-[0.98]'
                : 'bg-background-elevated text-foreground-muted/50 border border-border/40 cursor-not-allowed opacity-60'
            }`}
          >
            {state.currentStep === 3 ? (
              <>
                <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                <span>{t('completeAndSignIn')}</span>
              </>
            ) : (
              <>
                <span>{t('continue')}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
