'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function JourneysPage() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    router.replace(`/${locale}/library`);
  }, [router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-sm text-foreground-muted">
        Redirecting to Cinema Library...
      </div>
    </div>
  );
}
