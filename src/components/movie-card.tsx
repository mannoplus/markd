import Image from 'next/image';
import Link from 'next/link';
import { Star, Tv, Film } from 'lucide-react';
import { IMAGE_SIZES } from '@/lib/tmdb';

interface MovieCardProps {
    id: number;
    title: string;
    posterPath: string | null;
    mediaType: 'movie' | 'tv';
    voteAverage?: number;
    releaseDate?: string;
    /** Optional: show the user's watch status badge */
    status?: string;
}

export function MovieCard({
    id,
    title,
    posterPath,
    mediaType,
    voteAverage,
    releaseDate,
    status,
}: MovieCardProps) {
    const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
    const href = `/${mediaType}/${id}`;
    const rating = voteAverage ? voteAverage.toFixed(1) : null;

    return (
        <Link href={href} className="group block" id={`card-${mediaType}-${id}`}>
            <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-background-card border border-border transition-all duration-[var(--transition-base)] hover:border-border-hover hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1">
                {/* Poster */}
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                    {posterPath ? (
                        <Image
                            src={`${IMAGE_SIZES.poster.medium}${posterPath}`}
                            alt={title}
                            fill
                            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
                            className="object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-background-elevated">
                            <Film className="h-12 w-12 text-foreground-subtle" />
                        </div>
                    )}

                    {/* Rating badge */}
                    {rating && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
                            <Star className="h-3 w-3 fill-accent text-accent" />
                            <span>{rating}</span>
                        </div>
                    )}

                    {/* Media type badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                        {mediaType === 'tv' ? (
                            <Tv className="h-3 w-3 text-info" />
                        ) : (
                            <Film className="h-3 w-3 text-accent" />
                        )}
                        <span>{mediaType === 'tv' ? 'TV' : 'Film'}</span>
                    </div>

                    {/* Status badge */}
                    {status && (
                        <div className="absolute bottom-2 left-2 right-2">
                            <StatusBadge status={status} />
                        </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-[var(--transition-base)] group-hover:opacity-100" />
                </div>

                {/* Info */}
                <div className="p-3">
                    <h3 className="truncate text-sm font-semibold leading-tight transition-colors group-hover:text-accent">
                        {title}
                    </h3>
                    {year && (
                        <p className="mt-1 text-xs text-foreground-muted">{year}</p>
                    )}
                </div>
            </div>
        </Link>
    );
}

/* ---- Skeleton ---- */

export function MovieCardSkeleton() {
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

/* ---- Small Status Badge ---- */

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; color: string }> = {
        plan_to_watch: { label: 'Plan to Watch', color: 'bg-info/20 text-info' },
        watching: { label: 'Watching', color: 'bg-success/20 text-success' },
        completed: { label: 'Completed', color: 'bg-accent-muted text-accent' },
        dropped: { label: 'Dropped', color: 'bg-error/20 text-error' },
    };

    const { label, color } = config[status] ?? {
        label: status,
        color: 'bg-foreground-subtle/20 text-foreground-muted',
    };

    return (
        <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${color}`}
        >
            {label}
        </span>
    );
}
