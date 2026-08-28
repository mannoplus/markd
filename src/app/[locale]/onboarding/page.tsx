import { getGenresList } from '@/lib/tmdb';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export default async function OnboardingPage() {
  // Access control: redirect authenticated users directly to /home
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/home');
  }

  return (
    <div className="min-h-screen bg-black">
      <OnboardingWizard />
    </div>
  );
}
