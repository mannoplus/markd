'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
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

const STATUS_OPTIONS: { value: WatchStatus; translationKey: any; icon: React.ElementType; color: string }[] = [
    { value: 'plan_to_watch', translationKey: 'statusPlan', icon: Clock, color: 'text-info' },
    { value: 'watching', translationKey: 'statusWatching', icon: Eye, color: 'text-success' },
    { value: 'completed', translationKey: 'statusCompleted', icon: CheckCircle2, color: 'text-accent' },
    { value: 'dropped', translationKey: 'statusDropped', icon: XCircle, color: 'text-error' },
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
    const t = useTranslations('StatusSelector');
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
        <div className="space-y-6 rounded-2xl border border-border/50 bg-background-elevated/80 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden group transition-all duration-500 hover:border-border/80">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 -m-8 h-32 w-32 rounded-full bg-accent/10 blur-[60px] pointer-events-none transition-all duration-500 group-hover:bg-accent/20" />

            <div className="relative z-10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground pb-1 border-b border-border/10 inline-block mb-4">
                    {t('title')}
                </h3>

                {/* Status Dropdown */}
                <div className="relative mb-6">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-background-card/50 backdrop-blur-sm px-4 py-3.5 text-sm font-medium transition-all hover:bg-background-card/80 hover:border-border hover:shadow-sm"
                        id="status-selector-btn"
                    >
                        <span className={`flex items-center gap-2.5 ${selectedOption.color}`}>
                            <SelectedIcon className="h-5 w-5" />
                            {t(selectedOption.translationKey)}
                        </span>
                        <ChevronDown
                            className={`h-4 w-4 text-foreground-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {isOpen && (
                        <div className="absolute top-full left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-border bg-background-elevated/95 backdrop-blur-xl shadow-2xl fade-in animate-in slide-in-from-top-2 duration-200">
                            {STATUS_OPTIONS.map(({ value, translationKey, icon: Icon, color }) => (
                                <button
                                    key={value}
                                    onClick={() => handleStatusSelect(value)}
                                    className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 hover:pl-5 
                                        ${value === status ? `${color} bg-background-card border-l-2 border-current rounded-none` : 'text-foreground-muted hover:bg-background-card hover:text-foreground'}`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {t(translationKey)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Rating */}
                <div className="mb-6">
                    <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-foreground-subtle">
                        {t('rating')}
                    </label>
                    <div className="flex items-center justify-between w-full">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(rating === star ? null : star)}
                                className={`flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 shrink-0 rounded-full transition-all duration-300 hover:scale-125
                                    ${rating && star <= rating
                                        ? 'text-accent drop-shadow-[0_0_8px_rgba(var(--color-accent),0.5)]'
                                        : 'text-foreground-muted/30 hover:text-accent/60'
                                    }`}
                                title={`${star}/10`}
                                aria-label={`Rate ${star} out of 10`}
                            >
                                <Star
                                    className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-colors duration-300 ${rating && star <= rating ? 'fill-accent' : ''}`}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* TV Progress */}
                {mediaType === 'tv' && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label
                                htmlFor="season-input"
                                className="mb-2 block text-xs font-semibold uppercase tracking-widest text-foreground-subtle"
                            >
                                {t('season')}
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
                                className="w-full rounded-xl border border-border/60 bg-background-card/50 px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="episode-input"
                                className="mb-2 block text-xs font-semibold uppercase tracking-widest text-foreground-subtle"
                            >
                                {t('episode')}
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
                                className="w-full rounded-xl border border-border/60 bg-background-card/50 px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                            />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2 mt-4 border-t border-border/20">
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent/90 px-5 py-3.5 text-sm font-bold text-black shadow-lg shadow-accent/20 transition-all duration-300 hover:shadow-accent/40 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                        id="save-tracking-btn"
                    >
                        {isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                {currentStatus ? t('update') : t('add')}
                                <CheckCircle2 className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 -ml-6 group-hover:ml-0" />
                            </>
                        )}
                    </button>

                    {currentStatus && onRemove && (
                        <button
                            onClick={handleRemove}
                            disabled={isPending}
                            title={t('remove')}
                            className="flex items-center justify-center rounded-xl border-2 border-error/20 bg-error/5 backdrop-blur-sm px-4 py-3 text-sm font-medium text-error transition-all duration-300 hover:bg-error/20 hover:border-error/50 hover:shadow-sm disabled:opacity-50"
                            id="remove-tracking-btn"
                        >
                            <XCircle className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
