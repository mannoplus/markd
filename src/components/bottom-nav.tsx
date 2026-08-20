'use client';

import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import { Film, Tv, Library, User, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function BottomNav() {
    const t = useTranslations('Navigation');
    const pathname = usePathname();

    const NAV_LINKS = [
        { href: '/', activePath: '/', exact: true, label: t('home') || 'Home', icon: Home },
        { href: '/movies?category=popular', activePath: '/movies', label: t('movies'), icon: Film },
        { href: '/tv-shows?category=popular', activePath: '/tv-shows', label: t('tvShows'), icon: Tv },
        { href: '/library', activePath: '/library', label: t('library'), icon: Library },
        { href: '/profile', activePath: '/profile', label: t('profile') || 'Profile', icon: User },
    ];

    return (
        <nav 
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border flex items-center justify-around px-2 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
            style={{
                paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
                height: 'calc(76px + env(safe-area-inset-bottom))'
            }}
        >
            {NAV_LINKS.map(({ href, activePath, exact, label, icon: Icon }) => {
                const isActive = exact
                    ? pathname === '/' || pathname === '/en' || pathname === '/zh-TW'
                    : pathname.startsWith(activePath);

                return (
                    <Link
                        key={href}
                        href={href as Parameters<typeof Link>[0]['href']}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-[var(--transition-fast)] cursor-pointer ${isActive
                            ? 'text-accent'
                            : 'text-foreground-muted hover:text-foreground'
                        }`}
                        style={{ minHeight: '44px' }}
                    >
                        <div className={`p-1.5 rounded-full ${isActive ? 'bg-accent-muted' : 'bg-transparent'}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-medium tracking-wide whitespace-nowrap">{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
