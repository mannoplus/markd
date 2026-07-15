'use client';

import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import { Search, Library, LayoutDashboard, LogIn, X, TrendingUp, Film, Tv, ChevronDown } from 'lucide-react';
import { Logo } from '@/components/logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';
import { SearchOverlay } from '@/components/search-overlay';

export function Navbar() {
    const t = useTranslations('Navigation');
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const NAV_LINKS = [
        { href: '/movies', label: t('movies'), icon: Film },
        { href: '/tv-shows', label: t('tvShows'), icon: Tv },
        { href: '/now-showing', label: t('nowShowing'), icon: TrendingUp },
        { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/library', label: t('library'), icon: Library },
    ];

    const dropdownMenus: Record<string, { label: string; href: string }[]> = {
        '/movies': [
            { label: t('popular'), href: '/movies?category=popular' },
            { label: t('nowPlaying'), href: '/movies?category=now_playing' },
            { label: t('upcoming'), href: '/movies?category=upcoming' },
            { label: t('topRated'), href: '/movies?category=top_rated' },
        ],
        '/tv-shows': [
            { label: t('popular'), href: '/tv-shows?category=popular' },
            { label: t('airingToday'), href: '/tv-shows?category=airing_today' },
            { label: t('onTv'), href: '/tv-shows?category=on_tv' },
            { label: t('topRated'), href: '/tv-shows?category=top_rated' },
        ],
        '/now-showing': [
            { label: t('boxOffice'), href: '/now-showing#box-office' },
            { label: t('newReleases'), href: '/now-showing#new-releases' },
            { label: t('comingSoon'), href: '/now-showing#coming-soon' },
        ],
    };

    useEffect(() => {
        const supabase = createClient();

        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Listen for ⌘K or / shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
            if (e.key === '/') {
                if (
                    document.activeElement?.tagName !== 'INPUT' &&
                    document.activeElement?.tagName !== 'TEXTAREA'
                ) {
                    e.preventDefault();
                    setIsSearchOpen(true);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);


    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border pt-safe">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center transition-opacity hover:opacity-80 flex-shrink-0"
                >
                    <Logo size="md" className="text-foreground" />
                </Link>

                {/* Desktop nav */}
                <div className="hidden items-center gap-1 md:flex">
                    {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname.startsWith(href);
                        const items = dropdownMenus[href];

                        if (items) {
                            const isOpen = openMenu === href;
                            return (
                                <div
                                    key={href}
                                    className="relative py-2"
                                    onMouseEnter={() => setOpenMenu(href)}
                                    onMouseLeave={() => setOpenMenu(null)}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenMenu(isOpen ? null : href)}
                                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-[var(--transition-fast)] cursor-pointer select-none ${isActive
                                            ? 'bg-accent-muted text-accent'
                                            : 'text-foreground-muted hover:bg-background-elevated hover:text-foreground'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {label}
                                        <ChevronDown className={`h-3 w-3 text-foreground-muted opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <div
                                        className={`absolute top-full left-0 mt-1 w-44 rounded-xl border border-border bg-[#1c1c28] p-1.5 shadow-2xl z-50 flex flex-col transition-all duration-150 origin-top-left ${isOpen
                                            ? 'opacity-100 scale-100 pointer-events-auto'
                                            : 'opacity-0 scale-95 pointer-events-none'
                                            }`}
                                    >
                                        {items.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href as Parameters<typeof Link>[0]['href']}
                                                onClick={() => setOpenMenu(null)}
                                                className="w-full text-left rounded-lg px-3 py-2 text-xs font-semibold text-foreground-muted hover:bg-background-elevated hover:text-foreground transition-all truncate"
                                            >
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={href}
                                href={href as Parameters<typeof Link>[0]['href']}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-[var(--transition-fast)] ${isActive
                                    ? 'bg-accent-muted text-accent'
                                    : 'text-foreground-muted hover:bg-background-elevated hover:text-foreground'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </Link>
                        );
                    })}
                </div>

                {/* Auth + Mobile toggle */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Search Trigger Buttons */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-background-secondary px-3.5 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground hover:bg-background-elevated hover:border-border-hover transition-all cursor-pointer select-none"
                    >
                        <Search className="h-3.5 w-3.5" />
                        <span className="max-w-[120px] lg:max-w-none truncate">{t('searchPlaceholderDesktop')}</span>
                        <kbd className="hidden lg:inline-flex h-4 select-none items-center gap-0.5 rounded border border-border bg-background-elevated px-1.5 font-mono text-[9px] font-medium text-foreground-subtle">
                            ⌘K
                        </kbd>
                    </button>

                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg border border-border bg-background-secondary hover:bg-background-elevated hover:border-border-hover text-foreground-muted hover:text-foreground transition-all cursor-pointer"
                        aria-label="Search"
                    >
                        <Search className="h-4 w-4" />
                    </button>

                    <LanguageSwitcher />

                    {user ? (
                        <div className="flex items-center gap-2 relative group/usermenu">
                            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background transition-transform hover:scale-105 focus:outline-none">
                                {user.email?.[0]?.toUpperCase() ?? 'U'}
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-background-elevated p-2 shadow-xl opacity-0 invisible group-hover/usermenu:opacity-100 group-hover/usermenu:visible group-focus-within/usermenu:opacity-100 group-focus-within/usermenu:visible transition-all duration-[var(--transition-fast)] z-50 transform origin-top-right scale-95 group-hover/usermenu:scale-100">
                                <div className="px-2 py-1.5 mb-1 border-b border-border">
                                    <p className="text-xs font-semibold text-foreground-muted truncate" title={user.email || ''}>
                                        {user.email}
                                    </p>
                                </div>
                                <form action={async () => {
                                    const { logout } = await import('@/app/[locale]/login/actions');
                                    await logout();
                                }}>
                                    <button
                                        type="submit"
                                        className="w-full text-left rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-background transition-colors flex items-center gap-2"
                                    >
                                        <LogIn className="h-4 w-4 rotate-180" />
                                        {t('signOut')}
                                    </button>
                                </form>
                                <div className="my-1 border-t border-border" />
                                <form action={async () => {
                                    // Confirm before deleting
                                    const confirmed = window.confirm(t('deleteAccount'));
                                    if (confirmed) {
                                        const { deleteAccount } = await import('@/app/[locale]/login/actions');
                                        await deleteAccount();
                                    }
                                }}>
                                    <button
                                        type="submit"
                                        className="w-full text-left rounded-md px-2 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                    >
                                        <X className="h-4 w-4" />
                                        {t('deleteAccount')}
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="flex items-center gap-2 rounded-lg bg-foreground px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-background transition-all hover:bg-foreground-muted flex-shrink-0 whitespace-nowrap"
                        >
                            <LogIn className="h-4 w-4" />
                            {t('signIn')}
                        </Link>
                    )}

                </div>
            </nav>

            <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </header>
    );
}
