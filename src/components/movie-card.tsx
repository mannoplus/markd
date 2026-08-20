'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Tv, Film, Play } from 'lucide-react';
import { IMAGE_SIZES } from '@/lib/tmdb';
import { useLocale, useTranslations } from 'next-intl';
import { emitClientSignal, createSignal } from '@/lib/personalization/signals';

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
    /** Optional: personalized match score shown on recommendation cards */
    matchPercent?: number;
    /** Optional: contextual caption shown under the title */
    meta?: string;
    /** Optional: suppress the media-type chip */
    showTypeChip?: boolean;
    className?: string;
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
    matchPercent,
    meta,
    showTypeChip = true,
    className = '',
}: MovieCardProps) {
    const locale = useLocale();
    const t = useTranslations('nowShowing');
    const [imgError, setImgError] = useState<boolean>(false);

    const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
    const href = `/${mediaType}/${id}`;
    const rating = voteAverage ? voteAverage.toFixed(1) : null;

    const sanitizedTitle = sanitizeTitle(title, locale);

    return (
        <Link
            href={href}
            onClick={() => {
                emitClientSignal(
                    createSignal('movie.card_clicked', {
                        tmdbId: id,
                        mediaType,
                        title,
                        context: { surface: 'movie_card' },
                    })
                );
            }}
            className={`group block outline-offset-4 ${className}`}
            aria-label={`${sanitizedTitle}${year ? ` (${year})` : ''}`}
        >
            <div className="relative overflow-hidden rounded-lg border border-border bg-surface-primary transition-all duration-[var(--transition-base)] hover:-translate-y-1 hover:border-border-hover hover:shadow-elevated">
                {/* Poster */}
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: '2/3' }}>
                    {posterPath && !imgError ? (
                        <Image
                            src={`${IMAGE_SIZES.poster.medium}${posterPath}`}
                            alt={sanitizedTitle}
                            fill
                            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                            className="object-cover transition-transform duration-[var(--transition-smooth)] group-hover:scale-[1.04]"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-background-highlight to-background gap-2">
                            <Film className="h-9 w-9 text-foreground-subtle" strokeWidth={1.5} />
                            <span className="px-3 text-center text-[10px] font-semibold tracking-wider text-foreground-muted">
                                {t('posterUnavailable') || 'Poster Unavailable'}
                            </span>
                        </div>
                    )}

                    {/* Cinematic scrim on hover */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition-opacity duration-[var(--transition-base)] group-hover:opacity-100" />

                    {/* Hover play affordance */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-[var(--transition-base)] group-hover:opacity-100">
                        <span className="flex h-11 w-11 scale-90 items-center justify-center rounded-full border border-white/25 bg-black/55 text-foreground backdrop-blur-sm transition-transform duration-[var(--transition-base)] group-hover:scale-100">
                            <Play className="h-4 w-4 fill-current" />
                        </span>
                    </div>

                    {/* Rating badges */}
                    <div className="absolute right-1.5 top-1.5 flex flex-col items-end gap-1">
                        {matchPercent !== undefined && (
                            <span className="rounded-md bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success backdrop-blur-md">
                                {matchPercent}%
                            </span>
                        )}
                        {rating && (
                            <span className="flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-foreground backdrop-blur-sm">
                                <Star className="h-3 w-3 shrink-0 fill-accent text-accent" />
                                <span className="leading-none">{rating}</span>
                            </span>
                        )}
                        {rtScore && (
                            <span
                                className={`flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm ${
                                    rtStatus === 'fresh' ? 'text-tomato-fresh' : 'text-tomato-rotten'
                                }`}
                            >
                                <span aria-hidden="true">🍅</span>
                                <span className="leading-none">{rtScore}</span>
                            </span>
                        )}
                    </div>

                    {/* Media type chip */}
                    {showTypeChip && (
                        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-foreground-secondary backdrop-blur-sm">
                            {mediaType === 'tv' ? (
                                <Tv className="h-2.5 w-2.5" />
                            ) : (
                                <Film className="h-2.5 w-2.5" />
                            )}
                            <span className="leading-none">{mediaType === 'tv' ? 'TV' : 'Film'}</span>
                        </span>
                    )}

                    {/* Status badge */}
                    {status && (
                        <div className="absolute bottom-1.5 left-1.5 right-1.5">
                            <StatusBadge status={status} />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="space-y-0.5 p-2.5">
                    <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
                        {sanitizedTitle}
                    </h3>
                    <div className="flex items-center justify-between gap-2">
                        {year && <p className="text-[11px] font-medium text-foreground-muted">{year}</p>}
                        {meta && <p className="truncate text-[11px] text-foreground-subtle">{meta}</p>}
                    </div>
                </div>
            </div>
        </Link>
    );
}

/* ---- Skeleton ---- */

export function MovieCardSkeleton() {
    return (
        <div className="overflow-hidden rounded-lg border border-border bg-surface-primary">
            <div className="aspect-[2/3] w-full shimmer" />
            <div className="space-y-2 p-2.5">
                <div className="h-3.5 w-4/5 rounded shimmer" />
                <div className="h-2.5 w-1/3 rounded shimmer" />
            </div>
        </div>
    );
}

/* ---- Small Status Badge ---- */

function StatusBadge({ status }: { status: string }) {
    const t = useTranslations('StatusSelector');
    const config: Record<string, { labelKey: string; color: string }> = {
        plan_to_watch: { labelKey: 'statusPlan', color: 'bg-info/20 text-info' },
        watching: { labelKey: 'statusWatching', color: 'bg-success/15 text-success' },
        completed: { labelKey: 'statusCompleted', color: 'bg-accent-muted text-accent' },
        dropped: { labelKey: 'statusDropped', color: 'bg-error/20 text-error' },
    };

    const known = config[status];

    return (
        <span
            className={`block truncate rounded-md px-2 py-0.5 text-center text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${
                known?.color ?? 'bg-foreground-subtle/20 text-foreground-muted'
            }`}
        >
            {known ? t(known.labelKey) : status}
        </span>
    );
}