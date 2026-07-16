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

    try {
        const movie = await getFullMediaDetails(Number(id), 'movie');
        if (!movie || !movie.details) {
            notFound();
        }
        const { data: userItem } = await getUserMediaItem(Number(id), 'movie');

        return (
            <MovieDetailsClient
                initialMovie={movie}
                initialUserItem={userItem}
            />
        );
    } catch (error) {
        console.error(error);
        notFound();
    }
}
