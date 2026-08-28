import { getGenresList } from '@/lib/tmdb';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export default async function OnboardingPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(`/${locale}/home`);
  }

  return (
    <div className="min-h-screen bg-black">
      <OnboardingWizard />
    </div>
  );
}
