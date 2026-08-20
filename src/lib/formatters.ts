/**
 * Production-grade localized formatters for MARKD.
 * Supports date/time, duration, currency, relative time, number formatting, and localized titles.
 */

export type SupportedLocale = 'en' | 'zh-TW' | string;

/**
 * Format movie/episode runtime into a natural localized duration string.
 * Examples:
 * - en: "2h 15m" or "2 hours 15 minutes"
 * - zh-TW: "2 小時 15 分鐘" or "45 分鐘" or "2 小時"
 */
export function formatDuration(
    minutes: number | null | undefined,
    locale: SupportedLocale = 'en',
    options?: { full?: boolean }
): string {
    if (!minutes || minutes <= 0 || isNaN(minutes)) {
        return locale === 'zh-TW' ? '暫無片長資訊' : 'N/A';
    }

    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const isZh = locale === 'zh-TW' || locale.startsWith('zh');

    if (isZh) {
        if (hrs > 0 && mins > 0) {
            return `${hrs} 小時 ${mins} 分鐘`;
        }
        if (hrs > 0) {
            return `${hrs} 小時`;
        }
        return `${mins} 分鐘`;
    }

    // English formatting
    if (options?.full) {
        const hrStr = hrs === 1 ? '1 hour' : `${hrs} hours`;
        const minStr = mins === 1 ? '1 minute' : `${mins} minutes`;
        if (hrs > 0 && mins > 0) return `${hrStr} ${minStr}`;
        if (hrs > 0) return hrStr;
        return minStr;
    }

    if (hrs > 0 && mins > 0) {
        return `${hrs}h ${mins}m`;
    }
    if (hrs > 0) {
        return `${hrs}h`;
    }
    return `${mins}m`;
}

/**
 * Format date with Intl.DateTimeFormat
 */
export function formatDate(
    date: string | Date | number | null | undefined,
    locale: SupportedLocale = 'en',
    options?: Intl.DateTimeFormatOptions
): string {
    if (!date) return locale === 'zh-TW' ? '未定' : 'TBD';

    try {
        const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
        if (isNaN(d.getTime())) return String(date);

        const defaultOptions: Intl.DateTimeFormatOptions = options || {
            year: 'numeric',
            month: locale === 'zh-TW' ? 'numeric' : 'short',
            day: 'numeric',
        };

        const targetLocale = locale === 'zh-TW' ? 'zh-TW' : 'en-US';
        return new Intl.DateTimeFormat(targetLocale, defaultOptions).format(d);
    } catch {
        return String(date);
    }
}

/**
 * Format relative time (e.g., "3 days ago", "5 分鐘前")
 */
export function formatRelativeTime(
    date: string | Date | number | null | undefined,
    locale: SupportedLocale = 'en'
): string {
    if (!date) return '';

    try {
        const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
        const now = new Date();
        const diffMs = d.getTime() - now.getTime();
        const diffSec = Math.round(diffMs / 1000);
        const diffMin = Math.round(diffSec / 60);
        const diffHour = Math.round(diffMin / 60);
        const diffDay = Math.round(diffHour / 24);

        const targetLocale = locale === 'zh-TW' ? 'zh-TW' : 'en-US';
        const rtf = new Intl.RelativeTimeFormat(targetLocale, { numeric: 'auto' });

        if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
        if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
        if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
        if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
        return formatDate(d, locale);
    } catch {
        return '';
    }
}

/**
 * Format numbers and counts
 */
export function formatNumber(
    value: number | null | undefined,
    locale: SupportedLocale = 'en',
    options?: Intl.NumberFormatOptions
): string {
    if (value === null || value === undefined || isNaN(value)) return '0';

    try {
        const targetLocale = locale === 'zh-TW' ? 'zh-TW' : 'en-US';
        return new Intl.NumberFormat(targetLocale, options).format(value);
    } catch {
        return String(value);
    }
}

/**
 * Format currencies (e.g., $150,000,000 or NT$4,500,000)
 */
export function formatCurrency(
    amount: number | null | undefined,
    locale: SupportedLocale = 'en',
    currency: string = 'USD'
): string {
    if (!amount || amount <= 0 || isNaN(amount)) {
        return locale === 'zh-TW' ? '暫無數據' : 'N/A';
    }

    try {
        const targetLocale = locale === 'zh-TW' ? 'zh-TW' : 'en-US';
        return new Intl.NumberFormat(targetLocale, {
            style: 'currency',
            currency,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `$${amount.toLocaleString()}`;
    }
}

/**
 * Get authoritative localized title.
 * In zh-TW: Returns the Chinese title if available, otherwise original/English title. Never mixes dialects.
 * In en: Returns English title or original title.
 */
export function getLocalizedTitle(
    media: {
        title?: string;
        name?: string;
        original_title?: string;
        original_name?: string;
    },
    locale: SupportedLocale = 'en'
): string {
    const primary = media.title || media.name || '';
    const original = media.original_title || media.original_name || '';

    if (locale === 'zh-TW') {
        return primary || original || '未命名作品';
    }

    return primary || original || 'Untitled';
}
