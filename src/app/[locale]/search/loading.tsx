import { SkeletonCard } from '@/components/skeletons';

export default function Loading() {
    return (
        <div className="space-y-12 pb-16 pt-8">
            <section className="flex flex-col items-center justify-center space-y-8 pt-8 pb-12">
                <div className="space-y-4 text-center flex flex-col items-center w-full">
                    <div className="h-12 w-64 bg-muted animate-pulse rounded-md" />
                    <div className="h-6 w-96 bg-muted animate-pulse rounded-md max-w-[80vw]" />
                </div>
                <div className="w-full max-w-3xl px-4">
                    {/* Skeleton Search Bar */}
                    <div className="h-16 w-full rounded-full bg-muted animate-pulse border-2 border-border" />
                </div>
            </section>

            <section className="space-y-6">
                <div className="h-8 w-64 bg-muted animate-pulse rounded-md" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </section>
        </div>
    );
}
