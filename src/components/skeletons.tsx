/**
 * Reusable skeleton loader components for various content types.
 */

export function TextSkeleton({
    width = 'w-3/4',
    height = 'h-4',
}: {
    width?: string;
    height?: string;
}) {
    return <div className={`rounded ${width} ${height} shimmer`} />;
}

export function DetailPageSkeleton() {
    return (
        <div className="fade-in">
            {/* Backdrop skeleton */}
            <div className="relative h-[40vh] w-full shimmer sm:h-[50vh]" />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 lg:flex-row">
                    {/* Poster */}
                    <div className="mx-auto w-48 flex-shrink-0 lg:mx-0 lg:w-64">
                        <div className="aspect-[2/3] rounded-[var(--radius-lg)] shimmer" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-4">
                        <div className="h-8 w-2/3 rounded shimmer" />
                        <div className="h-4 w-1/3 rounded shimmer" />
                        <div className="space-y-2">
                            <div className="h-4 w-full rounded shimmer" />
                            <div className="h-4 w-full rounded shimmer" />
                            <div className="h-4 w-4/5 rounded shimmer" />
                        </div>
                        <div className="flex gap-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-8 w-20 rounded-full shimmer" />
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-full space-y-4 lg:w-72">
                        <div className="h-64 rounded-[var(--radius-lg)] shimmer" />
                        <div className="h-40 rounded-[var(--radius-lg)] shimmer" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className="overflow-hidden rounded-[var(--radius-lg)] bg-background-card border border-border">
            <div className="aspect-[2/3] w-full shimmer" />
            <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 rounded shimmer" />
                <div className="h-3 w-1/3 rounded shimmer" />
            </div>
        </div>
    );
}

export function SearchResultsSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="overflow-hidden rounded-[var(--radius-lg)] bg-background-card border border-border"
                >
                    <div className="aspect-[2/3] w-full shimmer" />
                    <div className="space-y-2 p-3">
                        <div className="h-4 w-3/4 rounded shimmer" />
                        <div className="h-3 w-1/3 rounded shimmer" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            {/* Section header */}
            <div>
                <div className="h-6 w-48 rounded shimmer mb-4" />
                <div className="flex gap-4 overflow-hidden">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-36">
                            <div className="aspect-[2/3] rounded-[var(--radius-lg)] shimmer" />
                            <div className="mt-2 space-y-1.5">
                                <div className="h-3 w-3/4 rounded shimmer" />
                                <div className="h-2.5 w-1/2 rounded shimmer" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Another section */}
            <div>
                <div className="h-6 w-36 rounded shimmer mb-4" />
                <div className="flex gap-4 overflow-hidden">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-36">
                            <div className="aspect-[2/3] rounded-[var(--radius-lg)] shimmer" />
                            <div className="mt-2 space-y-1.5">
                                <div className="h-3 w-3/4 rounded shimmer" />
                                <div className="h-2.5 w-1/2 rounded shimmer" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
