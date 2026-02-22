'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function RegionToggle({ currentRegion }: { currentRegion: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const t = useTranslations('Home');

    const handleRegionChange = (newRegion: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('region', newRegion);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="inline-flex bg-background-elevated p-1 rounded-lg border border-border">
            <button
                onClick={() => handleRegionChange('TW')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${currentRegion === 'TW'
                    ? 'bg-foreground text-background shadow-md'
                    : 'text-foreground/90 font-bold hover:text-foreground hover:bg-background-card'
                    }`}
            >
                {t('regionTW')}
            </button>
            <button
                onClick={() => handleRegionChange('US')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${currentRegion === 'US'
                    ? 'bg-foreground text-background shadow-md'
                    : 'text-foreground/90 font-bold hover:text-foreground hover:bg-background-card'
                    }`}
            >
                {t('regionUS')}
            </button>
        </div>
    );
}
