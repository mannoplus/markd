'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import {
  getOnboardingState,
  clearOnboardingState,
  setOnboardingCompleted,
} from '@/lib/onboarding/storage';
import { mergeOnboardingPreferencesAction } from '@/app/actions/onboarding';

export function DashboardOnboardingSync() {
  const router = useRouter();

  useEffect(() => {
    async function syncPendingOnboarding() {
      const state = getOnboardingState();
      if (
        state.favoriteTitles.length > 0 ||
        state.genres.movie.length > 0 ||
        state.tasteAnswers.length > 0
      ) {
        try {
          const res = await mergeOnboardingPreferencesAction(state);
          if (res.success) {
            setOnboardingCompleted(true);
            clearOnboardingState();
            router.refresh();
          }
        } catch (e) {
          console.warn('Dashboard background onboarding sync error:', e);
        }
      }
    }
    syncPendingOnboarding();
  }, [router]);

  return null;
}
