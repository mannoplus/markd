'use client';

import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import { Search, Library, LayoutDashboard, LogIn, Menu, X, TrendingUp } from 'lucide-react';
import { Logo } from '@/components/logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';

export function Navbar() {
    const t = useTranslations('Navigation');
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);

    const NAV_LINKS = [
        { href: '/search', label: t('searchLink'), icon: Search },
        { href: '/now-showing', label: t('nowShowing'), icon: TrendingUp },
        { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/library', label: t('library'), icon: Library },
    ];

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

    // No mobile menu logic needed anymore

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
                        return (
                            <Link
                                key={href}
                                href={href as any}
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
        </header>
    );
}
