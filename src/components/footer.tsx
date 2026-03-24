import { Github } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useTranslations } from 'next-intl';
import { AboutModal } from '@/components/about-modal';

export function Footer() {
    const t = useTranslations('Footer');

    return (
        <footer className="border-t border-border bg-background-secondary pt-8 pb-safe">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 md:flex-row md:px-6 lg:px-8">
                {/* Left: Logo */}
                <div className="flex w-full justify-center md:w-auto md:justify-start">
                    <Logo size="sm" className="opacity-80 transition-opacity hover:opacity-100" />
                </div>

                {/* Center: Text */}
                <div className="flex-1 text-center">
                    <p className="text-sm text-foreground-subtle whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                        {t.rich('text', {
                            tmdb: (chunks) => (
                                <a
                                    href="https://www.themoviedb.org/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-foreground-muted hover:text-foreground transition-colors underline underline-offset-4"
                                >
                                    {chunks}
                                </a>
                            )
                        })}
                    </p>
                </div>

                {/* Right: Links */}
                <div className="flex w-full items-center justify-center gap-6 text-sm md:w-auto md:justify-end">
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
