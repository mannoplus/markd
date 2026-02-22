'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const switchLanguage = (newLocale: string) => {
        if (newLocale !== locale) {
            router.replace(pathname, { locale: newLocale });
        }
    };

    return (
        <div className="relative group flex items-center">
            <button className="flex items-center justify-center w-9 h-9 rounded-full bg-background border border-border hover:bg-background-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-accent">
                <span className="text-xs font-extrabold tracking-wider text-foreground-muted group-hover:text-foreground transition-colors">
                    {locale === 'en' ? 'EN' : '中文'}
                </span>
            </button>
            <div className="absolute top-full right-0 mt-2 py-1 w-32 bg-background-elevated border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
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
        </div>
    );
}
