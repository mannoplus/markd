import { SkeletonCard } from '@/components/skeletons';

export default function PersonLoading() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 mt-16 md:mt-24 pulse">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[300px_1fr]">
                {/* Left Column Skeleton */}
                <div className="space-y-6">
                    <div className="aspect-[2/3] w-full max-w-[300px] rounded-xl bg-background-elevated mx-auto lg:mx-0" />
                    <div className="space-y-4">
                        <div className="h-6 w-1/2 rounded bg-background-elevated" />
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="space-y-1">
                                    <div className="h-4 w-1/3 rounded bg-background-elevated" />
                                    <div className="h-4 w-2/3 rounded bg-background-elevated" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column Skeleton */}
                <div className="space-y-12">
                    <div className="space-y-4">
                        <div className="h-10 w-2/3 rounded-lg bg-background-elevated" />
                        <div className="h-6 w-1/4 rounded bg-background-elevated" />
                        <div className="space-y-2">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-4 w-full rounded bg-background-elevated" />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="h-8 w-1/4 rounded bg-background-elevated" />
                        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
