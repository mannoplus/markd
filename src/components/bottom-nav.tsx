'use client';

import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import { Film, Tv, Library, User, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function BottomNav() {
    const t = useTranslations('Navigation');
    const tAccessibility = useTranslations('Accessibility');
    const pathname = usePathname();

    if (pathname?.includes('/onboarding') || pathname?.includes('/login')) {
        return null;
    }

    const NAV_LINKS = [
        { href: '/', activePath: '/', exact: true, label: t('home') || 'Home', icon: Home },
        { href: '/movies?category=popular', activePath: '/movies', label: t('movies'), icon: Film },
        { href: '/tv-shows?category=popular', activePath: '/tv-shows', label: t('tvShows'), icon: Tv },
        { href: '/library', activePath: '/library', label: t('library'), icon: Library },
        { href: '/profile', activePath: '/profile', label: t('profile') || 'Profile', icon: User },
    ];

    return (
        <nav
            aria-label={tAccessibility('bottomNav')}
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-secondary/90 backdrop-blur-xl md:hidden"
            style={{
                paddingBottom: 'env(safe-area-inset-bottom)',
            }}
        >
            <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
                {NAV_LINKS.map(({ href, activePath, exact, label, icon: Icon }) => {
                    const isActive = exact
                        ? pathname === '/' || pathname === '/en' || pathname === '/zh-TW'
                        : pathname.startsWith(activePath);

                    return (
                        <Link
                            key={href}
                            href={href as Parameters<typeof Link>[0]['href']}
                            aria-current={isActive ? 'page' : undefined}
                            className={`relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                                isActive ? 'text-accent' : 'text-foreground-muted hover:text-foreground'
                            }`}
                        >
                            {isActive && (
                                <span
                                    className="absolute top-0 h-0.5 w-8 rounded-full bg-accent"
                                    aria-hidden="true"
                                />
                            )}
                            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
                            <span className="text-[10px] font-semibold tracking-wide whitespace-nowrap">
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}