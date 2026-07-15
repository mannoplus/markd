import { DiscoverPage } from '@/components/discover/DiscoverPage';

export const dynamic = 'force-dynamic';

export default function MoviesPage() {
    return <DiscoverPage mediaType="movie" />;
}
