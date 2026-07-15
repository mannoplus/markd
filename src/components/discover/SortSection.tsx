'use client';

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SortField } from './config/movieConfig';

interface SortSectionProps {
    sortFields: SortField[];
    activeSort: string; // e.g. 'popularity.desc'
    onChange: (sortValue: string) => void;
}

export function SortSection({
    sortFields,
    activeSort,
    onChange,
}: SortSectionProps) {
    const t = useTranslations('Discover');
    const [activeField, activeDirection] = activeSort.split('.'); // ['popularity', 'desc']

    const handleSortToggle = (fieldValue: string) => {
        if (activeField === fieldValue) {
            // Toggle direction
            const nextDirection = activeDirection === 'desc' ? 'asc' : 'desc';
            onChange(`${fieldValue}.${nextDirection}`);
        } else {
            // New sort field, default to desc
            onChange(`${fieldValue}.desc`);
        }
    };

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                {t('sortBy')}
            </h3>
            <div className="flex flex-col gap-2">
                {sortFields.map((field) => {
                    const isActive = activeField === field.value;
                    const direction = isActive ? activeDirection : null;

                    return (
                        <button
                            key={field.value}
                            type="button"
                            onClick={() => handleSortToggle(field.value)}
                            className={`flex items-center justify-between w-full rounded-xl border px-4 py-3 text-sm font-semibold transition-all hover:bg-background-elevated hover:border-border-hover focus:outline-none focus:ring-1 focus:ring-accent ${
                                isActive
                                    ? 'bg-accent-muted border-accent text-accent'
                                    : 'bg-background-card border-border text-foreground-muted'
                            }`}
                        >
                            <span>{t(field.labelKey)}</span>
                            <div className="flex items-center gap-1">
                                {isActive ? (
                                    direction === 'desc' ? (
                                        <ArrowDown className="h-4 w-4 text-accent animate-pulse" />
                                    ) : (
                                        <ArrowUp className="h-4 w-4 text-accent animate-pulse" />
                                    )
                                ) : (
                                    <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
