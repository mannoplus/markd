'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

const REGIONS = [
    { code: 'US' },
    { code: 'TW' },
    { code: 'CN' },
    { code: 'JP' },
    { code: 'GB' },
    { code: 'FR' },
    { code: 'DE' },
    { code: 'KR' },
    { code: 'IN' },
    { code: 'AU' },
    { code: 'BR' },
    { code: 'MX' },
    { code: 'ES' },
    { code: 'IT' },
    { code: 'RU' },
    { code: 'ID' },
];

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
        <div className="relative inline-flex items-center bg-background-elevated rounded-lg border border-border transition-colors hover:border-foreground/30 focus-within:border-foreground/50 focus-within:ring-1 focus-within:ring-foreground/50">
            <select
                value={currentRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="appearance-none bg-transparent pl-3 pr-8 py-1.5 text-xs font-semibold text-foreground/90 focus:outline-none cursor-pointer w-full h-full"
                aria-label="Select Region"
            >
                {REGIONS.map((region) => (
                    <option key={region.code} value={region.code} className="bg-background text-foreground">
                        {t(`region${region.code}`)}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-foreground/70">
                <ChevronDown className="h-4 w-4" />
            </div>
        </div>
    );
}
