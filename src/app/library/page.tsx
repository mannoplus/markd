import { getUserMediaItems } from '@/app/actions';
import { redirect } from 'next/navigation';
import { LibraryTabs } from './library-tabs';

export default async function LibraryPage() {
    const { data: items, error } = await getUserMediaItems();

    if (error === 'Not authenticated') {
        redirect('/login');
    }

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto space-y-8 fade-in">
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-foreground">
                My Library
            </h1>

            {items ? (
                <LibraryTabs items={items} />
            ) : (
                <div className="py-24 text-center glass border border-border rounded-xl">
                    <p className="text-foreground-muted">Unable to load your library.</p>
                </div>
            )}
        </div>
    );
}
