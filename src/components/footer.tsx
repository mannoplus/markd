'use client';

import { Github } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useTranslations } from 'next-intl';
import { AboutModal } from '@/components/about-modal';
import { usePathname } from 'next/navigation';

export function Footer() {
    const t = useTranslations('Footer');
    const pathname = usePathname();

    if (pathname?.includes('/onboarding') || pathname?.includes('/login')) {
        return null;
    }

    return (
        <footer className="border-t border-border/60 bg-background-secondary pb-safe">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-foreground-subtle md:flex-row md:gap-6 md:px-6 lg:px-8">
                <div className="flex shrink-0 items-center justify-center md:justify-start">
                    <Logo size="sm" className="opacity-70 transition-opacity hover:opacity-100" />
                </div>

                <p className="max-w-md flex-1 text-center leading-relaxed md:text-left">
                    {t.rich('text', {
                        tmdb: (chunks) => (
                            <a
                                href="https://www.themoviedb.org/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-foreground-muted underline underline-offset-4 transition-colors hover:text-foreground"
                            >
                                {chunks}
                            </a>
                        ),
                    })}
                </p>

                <div className="flex shrink-0 items-center justify-center gap-4 md:justify-end">
                    <AboutModal />
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-foreground-muted"
                        aria-label="GitHub"
                    >
                        <Github className="h-4 w-4" />
                    </a>
                </div>
            </div>
        </footer>
    );
}