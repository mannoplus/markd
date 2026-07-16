/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFullMediaDetails } from '@/lib/tmdb';
import { notFound } from 'next/navigation';
import { getUserMediaItem } from '@/app/actions';
import { MovieDetailsClient } from '@/components/media-details/MovieDetailsClient';

export default async function MovieDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    if (!id || isNaN(Number(id))) {
        notFound();
    }

    let movie: any = null;
    let userItem: any = null;

    try {
        movie = await getFullMediaDetails(Number(id), 'movie');
        if (!movie || !movie.details) {
            notFound();
        }
        const { data } = await getUserMediaItem(Number(id), 'movie');
        userItem = data;
    } catch (error) {
        console.error(error);
        notFound();
    }

    return (
        <MovieDetailsClient
            initialMovie={movie}
            initialUserItem={userItem}
        />
    );
}
