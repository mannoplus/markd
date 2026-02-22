'use client';

import { useState, useTransition } from 'react';
import {
    Eye,
    Clock,
    CheckCircle2,
    XCircle,
    Star,
    ChevronDown,
    Loader2,
} from 'lucide-react';
import type { WatchStatus, MediaType } from '@/types';

interface StatusSelectorProps {
    /** Current status from DB, or null if not tracked */
    currentStatus: WatchStatus | null;
    currentRating: number | null;
    currentSeason: number | null;
    currentEpisode: number | null;
    mediaType: MediaType;
    totalSeasons?: number;
    /** Callback when user changes status/rating/progress */
    onUpdate: (data: {
        status: WatchStatus;
        rating: number | null;
        season_progress: number | null;
        episode_progress: number | null;
    }) => Promise<{ error: string | null } | void>;
    /** Callback to remove the item */
    onRemove?: () => Promise<{ error: string | null } | void>;
}

const STATUS_OPTIONS: { value: WatchStatus; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'plan_to_watch', label: 'Plan to Watch', icon: Clock, color: 'text-info' },
    { value: 'watching', label: 'Watching', icon: Eye, color: 'text-success' },
    { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-accent' },
    { value: 'dropped', label: 'Dropped', icon: XCircle, color: 'text-error' },
];

export function StatusSelector({
    currentStatus,
    currentRating,
    currentSeason,
    currentEpisode,
    mediaType,
    totalSeasons,
    onUpdate,
    onRemove,
}: StatusSelectorProps) {
    const [status, setStatus] = useState<WatchStatus>(currentStatus ?? 'plan_to_watch');
    const [rating, setRating] = useState<number | null>(currentRating);
    const [season, setSeason] = useState<number | null>(currentSeason);
    const [episode, setEpisode] = useState<number | null>(currentEpisode);
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const selectedOption = STATUS_OPTIONS.find((o) => o.value === status)!;
    const SelectedIcon = selectedOption.icon;

    const handleStatusSelect = (value: WatchStatus) => {
        setStatus(value);
        setIsOpen(false);
    };

    const handleSave = () => {
        startTransition(async () => {
            const res = await onUpdate({
                status,
                rating,
                season_progress: mediaType === 'tv' ? season : null,
                episode_progress: mediaType === 'tv' ? episode : null,
            });
            if (res && res.error) {
                alert(`Error saving tracking data: ${res.error}\n\nPlease check if your database schema is properly configured.`);
            }
        });
    };

    const handleRemove = () => {
        if (!onRemove) return;
        startTransition(async () => {
            const res = await onRemove();
            if (res && res.error) {
                alert(`Error removing item: ${res.error}`);
            }
        });
    };

    return (
        <div className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-background-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
                Your Tracking
            </h3>

            {/* Status Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex w-full items-center justify-between rounded-[var(--radius-md)] border border-border bg-background-elevated px-4 py-3 text-sm font-medium transition-all hover:border-border-hover"
                    id="status-selector-btn"
                >
                    <span className={`flex items-center gap-2 ${selectedOption.color}`}>
                        <SelectedIcon className="h-4 w-4" />
                        {selectedOption.label}
                    </span>
                    <ChevronDown
                        className={`h-4 w-4 text-foreground-muted transition-transform ${isOpen ? 'rotate-180' : ''
                            }`}
                    />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 overflow-hidden rounded-[var(--radius-md)] border border-border bg-background-elevated shadow-[var(--shadow-elevated)] fade-in">
                        {STATUS_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                            <button
                                key={value}
                                onClick={() => handleStatusSelect(value)}
                                className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-background-card ${value === status ? `${color} bg-background-card` : 'text-foreground-muted'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Rating */}
            <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                    Your Rating
                </label>
                <div className="flex items-center gap-1">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(rating === star ? null : star)}
                            className={`rounded p-0.5 transition-all hover:scale-110 ${rating && star <= rating
                                ? 'text-accent'
                                : 'text-foreground-subtle hover:text-foreground-muted'
                                }`}
                            title={`${star}/10`}
                            aria-label={`Rate ${star} out of 10`}
                        >
                            <Star
                                className={`h-5 w-5 ${rating && star <= rating ? 'fill-accent' : ''}`}
                            />
                        </button>
                    ))}
                    {rating && (
                        <span className="ml-2 text-sm font-bold text-accent">{rating}/10</span>
                    )}
                </div>
            </div>

            {/* TV Progress */}
            {mediaType === 'tv' && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label
                            htmlFor="season-input"
                            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground-subtle"
                        >
                            Season
                        </label>
                        <input
                            id="season-input"
                            type="number"
                            min={0}
                            max={totalSeasons ?? 99}
                            value={season ?? ''}
                            onChange={(e) =>
                                setSeason(e.target.value ? parseInt(e.target.value, 10) : null)
                            }
                            placeholder="S"
                            className="w-full rounded-[var(--radius-md)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="episode-input"
                            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground-subtle"
                        >
                            Episode
                        </label>
                        <input
                            id="episode-input"
                            type="number"
                            min={0}
                            value={episode ?? ''}
                            onChange={(e) =>
                                setEpisode(e.target.value ? parseInt(e.target.value, 10) : null)
                            }
                            placeholder="E"
                            className="w-full rounded-[var(--radius-md)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-all hover:bg-foreground-muted disabled:opacity-50"
                    id="save-tracking-btn"
                >
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        currentStatus ? 'Update' : 'Add to Library'
                    )}
                </button>

                {currentStatus && onRemove && (
                    <button
                        onClick={handleRemove}
                        disabled={isPending}
                        className="flex items-center justify-center rounded-[var(--radius-md)] border border-error/30 px-4 py-2.5 text-sm font-medium text-error transition-all hover:bg-error/10 disabled:opacity-50"
                        id="remove-tracking-btn"
                    >
                        <XCircle className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
