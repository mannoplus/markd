'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { useState, useEffect, useRef } from 'react';

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const switchLanguage = (newLocale: string) => {
        if (newLocale !== locale) {
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
                className="flex items-center justify-center w-9 h-9 rounded-full bg-background border border-border hover:bg-background-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            >
                <span className="text-xs font-extrabold tracking-wider text-foreground-muted hover:text-foreground transition-colors">
                    {locale === 'en' ? 'EN' : '中文'}
                </span>
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 py-1 w-32 bg-background-elevated border border-border rounded-lg shadow-xl z-50 fade-in">
                    <button
                        onClick={() => switchLanguage('en')}
                        className={`w-full px-4 py-2 text-sm text-left hover:bg-background transition-colors ${locale === 'en' ? 'text-accent font-semibold' : 'text-foreground'
                            }`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => switchLanguage('zh-TW')}
                        className={`w-full px-4 py-2 text-sm text-left hover:bg-background transition-colors ${locale === 'zh-TW' ? 'text-accent font-semibold' : 'text-foreground'
                            }`}
                    >
                        繁體中文
                    </button>
                </div>
            )}
        </div>
    );
}
