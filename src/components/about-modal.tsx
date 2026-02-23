'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Logo } from '@/components/logo';

export function AboutModal() {
    const t = useTranslations('About');
    const [isOpen, setIsOpen] = useState(false);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-foreground-subtle transition-colors hover:text-foreground-muted"
            >
                {t('trigger')}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Modal Content container */}
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="about-modal-title"
                        className="relative z-50 w-full max-w-lg overflow-hidden rounded-2xl bg-zinc-950 p-6 sm:p-8 shadow-2xl ring-1 ring-white/10"
                    >
                        {/* Repeating Background Pattern */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03] sm:opacity-5">
                            <div className="flex h-[200%] w-[200%] -translate-x-1/4 -translate-y-1/4 flex-wrap content-start items-start justify-start gap-x-10 gap-y-16">
                                {Array.from({ length: 150 }).map((_, i) => (
                                    <div key={i} className="transform -rotate-[20deg] select-none">
                                        <span className="font-black text-2xl tracking-[0.2em] text-white">
                                            MARKD
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Gradient for subtle visual separation */}
                        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />

                        {/* Close button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute right-4 top-4 z-20 rounded-md p-1 opacity-70 ring-offset-zinc-950 transition-opacity hover:opacity-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2 focus:ring-offset-zinc-950 text-zinc-400 hover:text-white"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Text Content */}
                        <div className="relative z-10 flex flex-col gap-6 text-zinc-200">
                            <div>
                                <Logo className="mb-6" size="lg" />
                                <h2
                                    id="about-modal-title"
                                    className="text-2xl font-semibold leading-none tracking-tight text-white mb-2 sr-only"
                                >
                                    {t('title')}
                                </h2>
                            </div>

                            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-zinc-300">
                                <p>{t('p1')}</p>
                                <p>{t('p2')}</p>
                            </div>

                            <div className="mt-2">
                                <p className="text-sm sm:text-base leading-relaxed text-zinc-300">
                                    {t('tagline')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
