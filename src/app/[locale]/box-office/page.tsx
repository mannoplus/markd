import { getBoxOfficeMultiRegion } from '@/lib/tmdb';
import { BoxOfficeClient } from './box-office-client';
import { BoxOfficeTableSkeleton } from '@/components/box-office-table';
import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Box Office — MARKD',
    description: 'Real-time box office tracking across US, Taiwan, UK, Japan, Korea, and France. Revenue, ratings, and trends for the biggest movies.',
    keywords: ['box office', 'movie revenue', 'now playing', 'box office rankings', 'movie tracker'],
};

async function BoxOfficeContent() {
    const regions = ['US', 'TW', 'GB', 'JP', 'KR', 'FR'];
    const allRegionData = await getBoxOfficeMultiRegion(regions);

    return (
        <BoxOfficeClient
            allRegionData={allRegionData}
            defaultRegion="US"
        />
    );
}

export default function BoxOfficePage() {
    return (
        <Suspense fallback={
            <div className="pb-16 pt-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
                    <div className="h-[50vh] rounded-[var(--radius-xl)] shimmer" />
                    <BoxOfficeTableSkeleton />
                </div>
            </div>
        }>
            <BoxOfficeContent />
        </Suspense>
    );
}
