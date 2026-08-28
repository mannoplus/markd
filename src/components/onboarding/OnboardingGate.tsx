'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { isOnboardingCompleted } from '@/lib/onboarding/storage';
import { createClient } from '@/lib/supabase/client';

export function OnboardingGate() {
  const router = useRouter();

  useEffect(() => {
    async function checkFirstVisit() {
      // If user already completed onboarding, do nothing
      if (isOnboardingCompleted()) return;

      // Check if user is already logged in with active session
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          // Unauthenticated first-time visitor -> route to onboarding
          router.replace('/onboarding');
        }
      } catch (e) {
        console.warn('Failed to check session for onboarding gate:', e);
      }
    }

    checkFirstVisit();
  }, [router]);

  return null;
}
