import { getGenresList } from '@/lib/tmdb';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export default async function OnboardingPage() {
  // Access control: redirect authenticated users directly to /dashboard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  // Fetch initial genre lists for Step 1
  const [movieGenres, tvGenres] = await Promise.all([
    getGenresList('movie').catch(() => []),
    getGenresList('tv').catch(() => []),
  ]);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <OnboardingWizard movieGenres={movieGenres} tvGenres={tvGenres} />
    </div>
  );
}
