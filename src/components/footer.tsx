'use client';

import { Github } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useTranslations } from 'next-intl';
import { AboutModal } from '@/components/about-modal';
import { usePathname } from 'next/navigation';

export function Footer() {
    const t = useTranslations('Footer');
    const pathname = usePathname();

    if (pathname?.includes('/onboarding')) {
        return null;
    }

    return (
        <footer className="border-t border-border bg-background-secondary pb-safe">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 md:flex-row md:px-6 lg:px-8">
                <div className="flex w-full justify-center md:w-auto md:justify-start">
                    <Logo size="sm" className="opacity-70 transition-opacity hover:opacity-100" />
                </div>

                <p className="max-w-md flex-1 text-center text-xs leading-relaxed text-foreground-subtle">
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

                <div className="flex w-full items-center justify-center gap-5 md:w-auto md:justify-end">
                    <AboutModal />
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground-subtle transition-colors hover:text-foreground-muted"
                        aria-label="GitHub"
                    >
                        <Github className="h-5 w-5" />
                    </a>
                </div>
            </div>
        </footer>
    );
}