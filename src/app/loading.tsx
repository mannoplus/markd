import { SkeletonCard } from '@/components/skeletons';

export default function Loading() {
    return (
        <div className="space-y-12 pb-16 pt-8">
            {/* Hero / Welcome */}
            <section className="space-y-4">
                <div className="h-10 w-64 bg-muted animate-pulse rounded-md" />
                <div className="h-6 w-96 bg-muted animate-pulse rounded-md max-w-[80vw]" />
            </section>

            {/* Trending Movies */}
            <section className="space-y-6">
                <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <SkeletonCard key={`movie-${i}`} />
                    ))}
                </div>
            </section>

            {/* Trending TV Shows */}
            <section className="space-y-6">
                <div className="h-8 w-56 bg-muted animate-pulse rounded-md" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <SkeletonCard key={`tv-${i}`} />
                    ))}
                </div>
            </section>
        </div>
    );
}
