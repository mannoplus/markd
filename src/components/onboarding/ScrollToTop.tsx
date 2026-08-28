'use client';

import { useEffect } from 'react';

/**
 * Instantly scrolls the window to the top whenever `key` changes (e.g. the
 * current onboarding step or a route change). Uses `behavior: 'auto'` so
 * the reset is imperceptible — no smooth-scroll animation.
 *
 * Runs after the new content has mounted (effects run post-render), which
 * also defeats the browser's scroll restoration on back/forward navigation.
 */
export function ScrollToTop({ trigger }: { trigger: string | number }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    // Double rAF guarantees the reset lands after the new step's DOM has
    // painted, beating any browser scroll-restoration pass.
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
    });
    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  return null;
}