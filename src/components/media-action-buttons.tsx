'use client';

import { Bookmark, Eye, Check, CheckCircle2 } from 'lucide-react';

export type MediaSavedState = 'watchlist' | 'watched' | null;

interface MediaActionButtonsProps {
    /** Current saved state of the media item, if known. */
    savedState?: MediaSavedState;
    onAddToWatchlist?: () => void;
    onMarkWatched?: () => void;
    /** Disables both buttons (e.g. while a request is in flight or an item is locked). */
    disabled?: boolean;
    className?: string;
    /** `row` keeps the buttons side-by-side and wraps on narrow cards; `stack` stacks them full-width. */
    layout?: 'row' | 'stack';
    watchlistLabel: string;
    watchlistActiveLabel?: string;
    watchedLabel: string;
    watchedActiveLabel?: string;
}

const BASE =
    'group/btn inline-flex items-center justify-center gap-1.5 h-8 px-3 min-w-0 flex-1 rounded-full border text-[12px] font-medium transition-all duration-200 ease-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 select-none';

const INACTIVE =
    'border-white/15 bg-white/5 backdrop-blur-sm text-foreground hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.12)]';

const WATCHLIST_ACTIVE =
    'border-accent/40 bg-accent/15 text-accent hover:bg-accent/25 hover:shadow-[0_0_12px_rgba(168,85,247,0.18)]';

const WATCHED_ACTIVE =
    'border-emerald-400/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 hover:shadow-[0_0_12px_rgba(16,185,129,0.18)]';

/**
 * Pill-styled "Add to Watchlist" / "Mark as Watched" action buttons used on
 * media cards. Buttons stay contained within the card, wrap safely on narrow
 * layouts, and use translucent micro-UI styling with a soft luminescent hover.
 */
export function MediaActionButtons({
    savedState = null,
    onAddToWatchlist,
    onMarkWatched,
    disabled = false,
    className = '',
    layout = 'row',
    watchlistLabel,
    watchlistActiveLabel,
    watchedLabel,
    watchedActiveLabel,
}: MediaActionButtonsProps) {
    const isWatchlist = savedState === 'watchlist';
    const isWatched = savedState === 'watched';
    const locked = disabled || Boolean(savedState);

    const layoutClass = layout === 'stack' ? 'flex-col' : 'flex-row flex-wrap';

    return (
        <div className={`flex ${layoutClass} gap-2 ${className}`}>
            <button
                type="button"
                onClick={onAddToWatchlist}
                disabled={locked}
                aria-pressed={isWatchlist}
                className={`${BASE} ${isWatchlist ? WATCHLIST_ACTIVE : INACTIVE}`}
            >
                {isWatchlist ? (
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : (
                    <Bookmark className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">
                    {isWatchlist ? (watchlistActiveLabel ?? watchlistLabel) : watchlistLabel}
                </span>
            </button>

            <button
                type="button"
                onClick={onMarkWatched}
                disabled={locked}
                aria-pressed={isWatched}
                className={`${BASE} ${isWatched ? WATCHED_ACTIVE : INACTIVE}`}
            >
                {isWatched ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : (
                    <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">
                    {isWatched ? (watchedActiveLabel ?? watchedLabel) : watchedLabel}
                </span>
            </button>
        </div>
    );
}
