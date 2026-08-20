'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const t = useTranslations('Accessibility');
    const tCommon = useTranslations('Common');

    const switchLanguage = async (newLocale: string) => {
        if (newLocale !== locale) {
            // 1. Set cookie for next-intl (1 year expiry)
            document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
            
            // 2. Persist in localStorage
            try {
                localStorage.setItem('preferredLocale', newLocale);
            } catch {
                // Ignore storage errors in private browsing
            }

            // 3. Persist in Supabase user metadata if signed in
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.auth.updateUser({
                        data: { preferred_locale: newLocale }
                    });
                }
            } catch (e) {
                console.error('Failed to sync locale to user profile:', e);
            }

            // 4. Navigate to the new locale path
            router.replace(pathname, { locale: newLocale });
        }
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div className="relative flex items-center" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={t('switchLanguage')}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-background border border-border hover:bg-background-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            >
                <Globe className="h-3.5 w-3.5 text-foreground-muted" />
                <span className="text-xs font-bold tracking-wider text-foreground-muted hover:text-foreground transition-colors">
                    {locale === 'en' ? 'EN' : '繁中'}
                </span>
            </button>
            {isOpen && (
                <div
                    role="listbox"
                    aria-label={t('switchLanguage')}
                    className="absolute top-full right-0 mt-2 py-1 w-44 bg-background-elevated border border-border rounded-xl shadow-xl z-50 fade-in"
                >
                    <button
                        role="option"
                        aria-selected={locale === 'en'}
                        onClick={() => switchLanguage('en')}
                        className={`w-full px-4 py-2.5 text-xs text-left transition-colors flex items-center justify-between hover:bg-background ${
                            locale === 'en' ? 'text-accent font-bold' : 'text-foreground'
                        }`}
                    >
                        <span>{tCommon('english')}</span>
                        {locale === 'en' && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    </button>
                    <button
                        role="option"
                        aria-selected={locale === 'zh-TW'}
                        onClick={() => switchLanguage('zh-TW')}
                        className={`w-full px-4 py-2.5 text-xs text-left transition-colors flex items-center justify-between hover:bg-background ${
                            locale === 'zh-TW' ? 'text-accent font-bold' : 'text-foreground'
                        }`}
                    >
                        <span>{tCommon('traditionalChinese')}</span>
                        {locale === 'zh-TW' && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    </button>
                </div>
            )}
        </div>
    );
}
