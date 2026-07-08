import Dashboard from '@/components/now-showing/Dashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Now Showing — MARKD',
    description: 'Real-time dashboard for box office rankings, showtimes, and coming soon movies.',
    keywords: ['Now showing', 'box office', 'movie showtimes', 'coming soon', 'movie tracker'],
};

export default function NowShowingPage() {
    return (
        <main>
            <Dashboard />
        </main>
    );
}
