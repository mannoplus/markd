'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { revalidateHomeAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function RefreshButton() {
    const t = useTranslations('Home');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const router = useRouter();

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await revalidateHomeAction();
            router.refresh();
        } catch (error) {
            console.error('Failed to refresh:', error);
        } finally {
            // Keep the spinner for a bit to feel like it did something
            setTimeout(() => setIsRefreshing(false), 1000);
        }
    };

    return (
        <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background-elevated border border-border text-xs font-bold text-foreground-muted hover:text-foreground hover:border-accent/50 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
            <span>{isRefreshing ? t('updating') : t('updateNow')}</span>
        </button>
    );
}
