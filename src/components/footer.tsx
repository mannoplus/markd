import { Github } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Logo } from '@/components/logo';
import { useTranslations } from 'next-intl';

export function Footer() {
    const t = useTranslations('Footer');

    return (
        <footer className="border-t border-border bg-background-secondary">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 text-foreground-muted">
                    <Logo size="sm" className="text-foreground-muted" />
                    <span className="text-sm">© {new Date().getFullYear()}</span>
                </div>

                <p className="text-xs text-foreground-subtle text-center">
                    {t('poweredBy')}{' '}
                    <a
                        href="https://www.themoviedb.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline transition-colors hover:text-foreground-muted"
                    >
                        TMDB
                    </a>
                    . {t('disclaimer')}
                </p>

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
        </footer>
    );
}
