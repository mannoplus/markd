import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

/**
 * Shared empty state — communicates what's missing and what to do next.
 * Feels like MARKD: restrained, cinematic, never a blank void.
 */
export function EmptyState({ icon: Icon, title, description, action, actionLabel, onAction, className = '' }: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center gap-1.5 px-6 py-16 text-center ${className}`}>
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background-elevated/60">
                <Icon className="h-7 w-7 text-foreground-subtle" strokeWidth={1.5} />
            </div>
            <p className="mt-3 text-base font-semibold text-foreground">{title}</p>
            {description && (
                <p className="max-w-sm text-sm leading-relaxed text-foreground-muted">{description}</p>
            )}
            {(action ?? (actionLabel && onAction)) && (
                <div className="mt-4">
                    {action ?? (
                        <button
                            onClick={onAction}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background-elevated px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-highlight"
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

interface ErrorStateProps {
    title: string;
    description?: string;
    onRetry?: () => void;
    retryLabel?: string;
    className?: string;
}

/**
 * Shared error state — calm, plain-language, with a clear next step.
 */
export function ErrorState({ title, description, onRetry, retryLabel, className = '' }: ErrorStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center gap-1.5 px-6 py-16 text-center ${className}`}>
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-tomato-rotten/10">
                <span className="text-2xl" aria-hidden="true">🎬</span>
            </div>
            <p className="mt-3 text-base font-semibold text-foreground">{title}</p>
            {description && (
                <p className="max-w-sm text-sm leading-relaxed text-foreground-muted">{description}</p>
            )}
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-background-elevated px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-highlight"
                >
                    {retryLabel || 'Try again'}
                </button>
            )}
        </div>
    );
}