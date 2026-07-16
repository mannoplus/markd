/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFullMediaDetails } from '@/lib/tmdb';
import { notFound } from 'next/navigation';
import { getUserMediaItem } from '@/app/actions';
import { TVDetailsClient } from '@/components/media-details/TVDetailsClient';

export default async function TVDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    if (!id || isNaN(Number(id))) {
        notFound();
    }

    let tv: any = null;
    let userItem: any = null;

    try {
        tv = await getFullMediaDetails(Number(id), 'tv');
        if (!tv || !tv.details) {
            notFound();
        }
        const { data } = await getUserMediaItem(Number(id), 'tv');
        userItem = data;
    } catch (error) {
        console.error(error);
        notFound();
    }

    return (
        <TVDetailsClient
            initialTV={tv}
            initialUserItem={userItem}
        />
    );
}
