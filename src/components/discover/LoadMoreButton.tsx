'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface LoadMoreButtonProps {
    onClick: () => void;
    isLoading: boolean;
    disabled: boolean;
    isLastPage: boolean;
}

export function LoadMoreButton({
    onClick,
    isLoading,
    disabled,
    isLastPage,
}: LoadMoreButtonProps) {
    const t = useTranslations('Discover');

    if (isLastPage) {
        return (
            <div className="text-center py-8 text-xs font-semibold uppercase tracking-wider text-foreground-subtle fade-in select-none">
                {t('noMoreResults')}
            </div>
        );
    }

    return (
        <div className="flex justify-center pt-8 pb-12 fade-in">
            <button
                type="button"
                onClick={onClick}
                disabled={disabled || isLoading}
                className="relative inline-flex items-center gap-2 rounded-xl bg-foreground hover:bg-foreground-muted disabled:bg-foreground-muted/40 disabled:cursor-not-allowed disabled:text-foreground-subtle px-8 py-3.5 text-sm font-bold text-background transition-all duration-[var(--transition-fast)] focus:outline-none focus:ring-2 focus:ring-accent active:scale-95"
            >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-background" />}
                <span>{isLoading ? t('loadingMore') : t('loadMore')}</span>
            </button>
        </div>
    );
}
