'use client';

import { X, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ReactNode, useState, useEffect } from 'react';

interface DiscoverSidebarProps {
    children: ReactNode;
}

export function DiscoverSidebar({ children }: DiscoverSidebarProps) {
    const t = useTranslations('Discover');
    const [isOpen, setIsOpen] = useState(false);

    // Prevent body scroll when mobile drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <>
            {/* Mobile Filter Toggle Button (visible only < 1024px) */}
            <div className="lg:hidden w-full mb-6">
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-border bg-background-card px-5 py-3 text-sm font-bold text-foreground transition-all hover:bg-background-elevated active:scale-98 focus:outline-none focus:ring-2 focus:ring-accent shadow-sm"
                >
                    <SlidersHorizontal className="h-4 w-4 text-foreground-muted" />
                    <span>{t('showFiltersButton')}</span>
                </button>
            </div>

            {/* Desktop persistent sidebar layout */}
            <aside className="hidden lg:block w-80 shrink-0 self-start sticky top-24 max-h-[85vh] overflow-y-auto pr-2">
                <div className="space-y-6">
                    {children}
                </div>
            </aside>

            {/* Mobile off-canvas drawer */}
            {isOpen && (
                <div className="lg:hidden fixed inset-0 z-[1000] flex">
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                    />

                    {/* Drawer Content */}
                    <div className="relative flex flex-col w-full max-w-xs h-full bg-background border-r border-border p-5 shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-250 z-[1001] pt-safe">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-extrabold tracking-tight text-foreground flex items-center gap-2">
                                <SlidersHorizontal className="h-5 w-5 text-foreground-muted" />
                                {t('filtersTitle')}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="rounded-full border border-border p-2 text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-all focus:outline-none focus:ring-2 focus:ring-accent"
                                aria-label="Close filters"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 space-y-6 pb-20">
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
