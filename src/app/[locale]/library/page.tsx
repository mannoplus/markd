import { getUserMediaItems } from '@/app/actions';
import { redirect } from 'next/navigation';
import { LibraryTabs } from './library-tabs';
import { ErrorState } from '@/components/empty-state';
import { getTranslations } from 'next-intl/server';

export default async function LibraryPage() {
    const { data: items, error } = await getUserMediaItems();
    const t = await getTranslations('Library');

    if (error === 'Not authenticated') {
        redirect('/login');
    }

    return (
        <div className="mx-auto max-w-7xl space-y-10 px-4 pb-24 pt-28 fade-in sm:px-6 lg:px-8">
            <header className="space-y-3">
                <span className="eyebrow">{t('eyebrow')}</span>
                <h1 className="section-title">{t('title')}</h1>
            </header>

            {items ? (
                <LibraryTabs items={items} />
            ) : (
                <div className="card">
                    <ErrorState title={t('unableToLoad')} />
                </div>
            )}
        </div>
    );
}
