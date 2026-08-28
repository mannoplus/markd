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

export function OnboardingWizard() {
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

  // Genre toggle handler
  const handleToggleGenre = (id: number, name: string) => {
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
        genres: { movie: nextIds, tv: [] },
        genreNames: { movie: nextNames, tv: [] },
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
  const isStep1Valid = state.genres.movie.length >= 3;
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
      // Step 3 finished -> route to login page to merge preferences
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
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  const getStepBadge = () => {
    switch (state.currentStep) {
      case 1: return t('step1Badge') || 'Step 1: Genres';
      case 2: return t('step2Badge') || 'Step 2: Favorite Titles';
      case 3: return t('step3Badge') || 'Step 3: Taste DNA';
      default: return '';
    }
  };

  const getStepTitle = () => {
    switch (state.currentStep) {
      case 1: return t('step1Title') || 'What moves you?';
      case 2: return t('step2Title') || 'Anchor your taste.';
      case 3: return t('step3Title') || 'Define your Taste DNA.';
      default: return '';
    }
  };

  const getStepSubtitle = () => {
    switch (state.currentStep) {
      case 1: return t('step1Subtitle') || "Select the genres that define your tastes. We'll tailor your experience from here.";
      case 2: return t('step2Subtitle') || 'Pick at least 3 movies or shows you love to jumpstart your recommendations.';
      case 3: return t('step3Subtitle') || 'The final layer. Tell us about the vibes and storytelling styles that keep you watching.';
      default: return '';
    }
  };

  const progressPercent = ((state.currentStep - 1) / 3) * 100 + (canProceed ? 33.33 : 15);

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-between relative overflow-x-hidden selection:bg-white selection:text-black font-sans">
      {/* Fixed Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <div
          className="h-full bg-white transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Scrollable Canvas */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 max-w-5xl space-y-10">
        {/* Header Block */}
        <header className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-white/10 text-white border border-white/15">
            <span>{getStepBadge()}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1]">
            {getStepTitle()}
          </h1>

          <p className="text-sm md:text-base text-white/60 font-normal leading-relaxed">
            {getStepSubtitle()}
          </p>
        </header>

        {/* Step Body */}
        <div className="pb-8">
          {state.currentStep === 1 && (
            <StepGenres
              selectedGenres={state.genres.movie}
              onToggleGenre={handleToggleGenre}
            />
          )}

          {state.currentStep === 2 && (
            <StepTitles
              selectedGenres={state.genres.movie}
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
      </main>

      {/* Fixed/Sticky Bottom Action Bar */}
      <footer className="sticky bottom-0 left-0 right-0 bg-black/85 backdrop-blur-xl border-t border-white/10 py-4 px-4 sm:px-8 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {/* Back button */}
          <div>
            {state.currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 text-xs font-bold text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t('back') || 'Back'}</span>
              </button>
            ) : (
              <div />
            )}
          </div>

          {/* Center/Right Status & Continue Button */}
          <div className="flex items-center gap-4">
            {!canProceed && (
              <span className="hidden sm:inline text-xs font-semibold text-white/50">
                {state.currentStep === 1 &&
                  (t('genreMinRequirement', { min: 3, count: state.genres.movie.length }) || `Select at least 3 genres (${state.genres.movie.length}/3)`)}
                {state.currentStep === 2 &&
                  (t('pickMinRequirement', { min: 3, count: state.favoriteTitles.length }) || `Pick at least 3 titles (${state.favoriteTitles.length}/3)`)}
                {state.currentStep === 3 && (t('answerAllRequirement') || 'Please answer all 4 questions')}
              </span>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className={`inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                canProceed
                  ? 'bg-white text-black shadow-lg shadow-white/10 hover:bg-white/90 active:scale-[0.98]'
                  : 'bg-white/10 text-white/30 border border-white/5 cursor-not-allowed'
              }`}
            >
              {state.currentStep === 3 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                  <span>{t('completeAndSignIn') || 'Save Taste Profile & Sign In'}</span>
                </>
              ) : (
                <>
                  <span>{t('continue') || 'Continue'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
