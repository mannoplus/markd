import { Github } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export function Footer() {
    return (
        <footer className="border-t border-border bg-background-secondary">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 text-foreground-muted">
                    <Logo size="sm" className="text-foreground-muted" />
                    <span className="text-sm">© {new Date().getFullYear()}</span>
                </div>

                <p className="text-xs text-foreground-subtle text-center">
                    Powered by{' '}
                    <Link
                        href="https://www.themoviedb.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline transition-colors hover:text-foreground-muted"
                    >
                        TMDB
                    </Link>
                    . This product uses the TMDB API but is not endorsed or certified by TMDB.
                </p>

                <Link
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-subtle transition-colors hover:text-foreground-muted"
                    aria-label="GitHub"
                >
                    <Github className="h-5 w-5" />
                </Link>
            </div>
        </footer>
    );
}
