'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Tv, Film } from 'lucide-react';
import { IMAGE_SIZES } from '@/lib/tmdb';
import { useLocale, useTranslations } from 'next-intl';

// Regex sanitization utility to isolate Traditional Chinese and English title fragments
export function sanitizeTitle(title: string, lang: string): string {
    if (!title) return '';
    const hasChinese = /[\u4e00-\u9fa5]/.test(title);
    if (lang === 'zh-TW' || lang.startsWith('zh')) {
        if (hasChinese) {
            // Strip trailing English alphanumeric strings, e.g. "海洋奇緣 (真人版) Moana (Live-action)"
            const cleaned = title.replace(/\s*[a-zA-Z][a-zA-Z0-9\s\-(),'&:!.]*$/, '').trim();
            if (cleaned) return cleaned;
        }
    } else {
        // English: strip Chinese characters and Chinese punctuation/brackets
        if (hasChinese) {
            const hasEnglish = /[a-zA-Z]/.test(title);
            if (hasEnglish) {
                // Replace Chinese characters with empty space
                const cleaned = title.replace(/[\u4e00-\u9fa5\s（）()：:]+/g, ' ').trim();
                if (cleaned) return cleaned;
            }
        }
    }
    return title;
}

interface MovieCardProps {
    id: number;
    title: string;
    posterPath: string | null;
    mediaType: 'movie' | 'tv';
    voteAverage?: number;
    releaseDate?: string;
    /** Optional: show the user's watch status badge */
    status?: string;
    /** Optional: RT formatting for global UI */
    rtScore?: string;
    rtStatus?: 'fresh' | 'rotten';
}

export function MovieCard({
    id,
    title,
    posterPath,
    mediaType,
    voteAverage,
    releaseDate,
    status,
    rtScore,
    rtStatus,
}: MovieCardProps) {
    const locale = useLocale();
    const t = useTranslations('nowShowing');
    const [imgError, setImgError] = useState<boolean>(false);

    const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
    const href = `/${mediaType}/${id}`;
    const rating = voteAverage ? voteAverage.toFixed(1) : null;

    const sanitizedTitle = sanitizeTitle(title, locale);

    return (
        <Link href={href} className="group block" id={`card-${mediaType}-${id}`}>
            <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-background-card border border-border transition-all duration-[var(--transition-base)] hover:border-border-hover hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1">
                {/* Poster */}
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                    {posterPath && !imgError ? (
                        <Image
                            src={`${IMAGE_SIZES.poster.medium}${posterPath}`}
                            alt={sanitizedTitle}
                            fill
                            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
                            className="object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-105"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 to-black border border-border/20">
                            <div className="text-center p-4">
                                <Film className="h-10 w-10 text-accent/60 mx-auto mb-2 animate-pulse" />
                                <div className="text-[11px] font-bold text-foreground/80 tracking-wide uppercase font-sans">
                                    {t('posterUnavailable') || 'Poster Unavailable'}
                                </div>
                                <div className="text-[9px] text-foreground-muted font-sans mt-0.5">
                                    MARKD
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rating badge(s) */}
                    {(rating || rtScore) && (
                        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                            {rating && (
                                <div className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
                                    <Star className="h-3 w-3 fill-accent text-accent" />
                                    <span>{rating}</span>
                                </div>
                            )}
                            {rtScore && (
                                <div className={`flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ${rtStatus === 'fresh' ? 'text-green-500' : 'text-red-500'}`}>
                                    <span role="img" aria-label="Rotten Tomatoes">🍅</span>
                                    <span>{rtScore}</span>
                                </div>
                            )}
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
                        {sanitizedTitle}
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
