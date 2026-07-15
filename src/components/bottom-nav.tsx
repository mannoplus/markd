'use client';

import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import { Film, Tv, Library, LayoutDashboard } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function BottomNav() {
    const t = useTranslations('Navigation');
    const pathname = usePathname();

    const NAV_LINKS = [
        { href: '/movies', label: t('movies'), icon: Film },
        { href: '/tv-shows', label: t('tvShows'), icon: Tv },
        { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/library', label: t('library'), icon: Library },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border pb-safe flex items-center justify-around h-[68px] px-2 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                    <Link
                        key={href}
                        href={href as any}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-[var(--transition-fast)] ${isActive
                            ? 'text-accent'
                            : 'text-foreground-muted hover:text-foreground'
                        }`}
                    >
                        <div className={`p-1 rounded-full ${isActive ? 'bg-accent-muted' : 'bg-transparent'}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-medium tracking-wide">{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
