'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import {
  getOnboardingState,
  clearOnboardingState,
  setOnboardingCompleted,
} from '@/lib/onboarding/storage';
import {
  getShadowProfile,
  hasShadowProfileData,
  clearShadowProfile,
} from '@/lib/onboarding/shadow';
import { mergeOnboardingPreferencesAction } from '@/app/actions/onboarding';

export function DashboardOnboardingSync() {
  const router = useRouter();

  useEffect(() => {
    async function syncPendingOnboarding() {
      const state = getOnboardingState();
      const shadow = getShadowProfile();
      if (
        state.favoriteTitles.length > 0 ||
        state.genres.movie.length > 0 ||
        state.tasteAnswers.length > 0 ||
        hasShadowProfileData(shadow)
      ) {
        try {
          const res = await mergeOnboardingPreferencesAction(state, shadow);
          if (res.success) {
            setOnboardingCompleted(true);
            clearOnboardingState();
            clearShadowProfile();
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
