'use client';

import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import { Search, Library, LogIn, X, Film, Tv, ChevronDown, Settings, User as UserIcon } from 'lucide-react';
import { Logo } from '@/components/logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';
import { SearchOverlay } from '@/components/search-overlay';

interface NavItem {
    href: string;
    label: string;
    icon: typeof Film;
    activePrefix?: string;
    items?: { label: string; href: string }[];
}

export function Navbar() {
    const t = useTranslations('Navigation');
    const tAccessibility = useTranslations('Accessibility');
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const navRef = useRef<HTMLElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);


    const NAV_ITEMS: NavItem[] = [
        {
            href: '/movies',
            label: t('movies'),
            icon: Film,
            activePrefix: '/movies',
            items: [
                { label: t('popular'), href: '/movies?category=popular' },
                { label: t('nowPlaying'), href: '/movies?category=now_playing' },
                { label: t('upcoming'), href: '/movies?category=upcoming' },
                { label: t('topRated'), href: '/movies?category=top_rated' },
            ],
        },
        {
            href: '/tv-shows',
            label: t('tvShows'),
            icon: Tv,
            activePrefix: '/tv-shows',
            items: [
                { label: t('popular'), href: '/tv-shows?category=popular' },
                { label: t('airingToday'), href: '/tv-shows?category=airing_today' },
                { label: t('onTv'), href: '/tv-shows?category=on_tv' },
                { label: t('topRated'), href: '/tv-shows?category=top_rated' },
            ],
        },
        {
            href: '/library',
            label: t('library'),
            icon: Library,
            activePrefix: '/library',
        },
    ];

    // Auth session
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // ⌘K / "/" opens search
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

    // Close menus on outside click and Escape
    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setOpenMenu(null);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpenMenu(null);
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, []);

    const isActive = (prefix?: string, exactHref?: string) => {
        if (prefix) return pathname.startsWith(prefix);
        return pathname === exactHref;
    };

    const handleSignOut = async () => {
        const { logout } = await import('@/app/[locale]/login/actions');
        await logout();
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(t('deleteAccount'));
        if (confirmed) {
            const { deleteAccount } = await import('@/app/[locale]/login/actions');
            await deleteAccount();
        }
    };

    if (pathname?.includes('/onboarding') || pathname?.includes('/login')) {
        return null;
    }

    return (
        <header ref={navRef} className="fixed top-0 left-0 right-0 z-50 glass border-b border-border pt-safe">
            <nav
                aria-label={tAccessibility('mainNav')}
                className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
            >
                {/* Brand */}
                <Link href="/" className="flex shrink-0 items-center transition-opacity hover:opacity-80" aria-label={tAccessibility('homeLink')}>
                    <Logo size="sm" />
                </Link>

                {/* Primary navigation (desktop) */}
                <div className="hidden items-center gap-1 md:flex">
                    {NAV_ITEMS.map((item) => {
                        const active = isActive(item.activePrefix);
                        const menuOpen = openMenu === item.href;

                        return (
                            <div key={item.href} className="relative">
                                <button
                                    type="button"
                                    onClick={() =>
                                        item.items ? setOpenMenu(menuOpen ? null : item.href) : undefined
                                    }
                                    aria-expanded={item.items ? menuOpen : undefined}
                                    aria-haspopup={item.items ? 'menu' : undefined}
                                    className={`group flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                        active
                                            ? 'text-foreground'
                                            : 'text-foreground-muted hover:text-foreground'
                                    }`}
                                >
                                    {item.items ? (
                                        <>
                                            <span>{item.label}</span>
                                            <ChevronDown
                                                className={`h-3 w-3 text-foreground-subtle transition-transform duration-200 ${
                                                    menuOpen ? 'rotate-180' : ''
                                                }`}
                                            />
                                        </>
                                    ) : (
                                        <Link
                                            href={item.href as Parameters<typeof Link>[0]['href']}
                                            className="flex items-center gap-1.5"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span>{item.label}</span>
                                        </Link>
                                    )}
                                    {active && (
                                        <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" aria-hidden="true" />
                                    )}
                                </button>

                                {item.items && (
                                    <div
                                        role="menu"
                                        className={`absolute left-0 top-full mt-2 w-52 origin-top-left rounded-xl border border-border bg-surface-secondary/95 p-1.5 shadow-elevated backdrop-blur-xl transition-all duration-150 ${
                                            menuOpen
                                                ? 'pointer-events-auto translate-y-0 opacity-100'
                                                : 'pointer-events-none -translate-y-1 opacity-0'
                                        }`}
                                    >
                                        {item.items.map((sub) => (
                                            <Link
                                                key={sub.href}
                                                href={sub.href as Parameters<typeof Link>[0]['href']}
                                                role="menuitem"
                                                onClick={() => setOpenMenu(null)}
                                                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground-muted transition-colors hover:bg-background-elevated hover:text-foreground"
                                            >
                                                {sub.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
                    {/* Search trigger */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="hidden items-center gap-2 rounded-lg border border-border bg-background-secondary px-3.5 py-2 text-xs font-medium text-foreground-muted transition-all hover:border-border-hover hover:bg-background-elevated hover:text-foreground md:flex"
                        aria-label={t('search')}
                    >
                        <Search className="h-3.5 w-3.5" />
                        <span className="max-w-[130px] truncate lg:max-w-none">{t('searchPlaceholderDesktop')}</span>
                        <kbd className="hidden h-5 select-none items-center gap-0.5 rounded border border-border bg-background-elevated px-1.5 font-mono text-[9px] font-medium text-foreground-subtle lg:inline-flex">
                            ⌘K
                        </kbd>
                    </button>
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background-secondary text-foreground-muted transition-colors hover:border-border-hover hover:bg-background-elevated hover:text-foreground md:hidden"
                        aria-label={t('search')}
                    >
                        <Search className="h-4 w-4" />
                    </button>

                    <LanguageSwitcher />

                    <Link
                        href="/settings"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background-secondary text-foreground-muted transition-colors hover:border-border-hover hover:bg-background-elevated hover:text-foreground"
                        aria-label={t('settings')}
                        title={t('settings')}
                    >
                        <Settings className="h-4 w-4" />
                    </Link>

                    {user ? (
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setIsUserMenuOpen((v) => !v)}
                                aria-expanded={isUserMenuOpen}
                                aria-haspopup="menu"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-accent text-sm font-bold text-background transition-transform hover:scale-105"
                            >
                                {user.email?.[0]?.toUpperCase() ?? 'U'}
                            </button>

                            <div
                                role="menu"
                                className={`absolute right-0 top-full mt-2 w-56 origin-top-right rounded-xl border border-border bg-surface-secondary/95 p-2 shadow-elevated backdrop-blur-xl transition-all duration-150 ${
                                    isUserMenuOpen
                                        ? 'pointer-events-auto translate-y-0 opacity-100'
                                        : 'pointer-events-none -translate-y-1 opacity-0'
                                }`}
                            >
                                <div className="mb-1 border-b border-border px-2 py-1.5">
                                    <p className="truncate text-xs font-medium text-foreground-muted" title={user.email || ''}>
                                        {user.email}
                                    </p>
                                </div>

                                <Link
                                    href="/profile"
                                    role="menuitem"
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground transition-colors hover:bg-background-elevated"
                                >
                                    <UserIcon className="h-4 w-4" />
                                    <span>{t('profile')}</span>
                                </Link>
                                <Link
                                    href="/settings"
                                    role="menuitem"
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground transition-colors hover:bg-background-elevated"
                                >
                                    <Settings className="h-4 w-4" />
                                    <span>{t('settings')}</span>
                                </Link>

                                <div className="my-1 border-t border-border" />

                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={handleSignOut}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground transition-colors hover:bg-background-elevated"
                                >
                                    <LogIn className="h-4 w-4 rotate-180" />
                                    <span>{t('signOut')}</span>
                                </button>

                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={handleDeleteAccount}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-tomato-rotten transition-colors hover:bg-tomato-rotten/10"
                                >
                                    <X className="h-4 w-4" />
                                    <span>{t('deleteAccount')}</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-foreground px-3.5 py-2 text-xs font-semibold text-background transition-all hover:bg-foreground-secondary"
                        >
                            <LogIn className="h-4 w-4" />
                            <span>{t('signIn')}</span>
                        </Link>
                    )}
                </div>
            </nav>

            <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </header>
    );
}