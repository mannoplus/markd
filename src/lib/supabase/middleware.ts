import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const handleI18nRouting = createMiddleware(routing);

/**
 * Map an `Accept-Language` header to our supported locales.
 * Any Chinese variant (zh, zh-TW, zh-HK, zh-CN, ...) should resolve to `zh-TW`.
 * Everything else is treated as `en`.
 */
function normalizeAcceptLanguage(header: string | null): string | null {
    if (!header) return null;
    const wantsChinese = header
        .split(',')
        .some((part) => {
            const lang = part.split(';')[0].trim().toLowerCase();
            return lang === 'zh' || lang.startsWith('zh-') || lang.startsWith('zh');
        });
    return wantsChinese ? 'zh-TW,zh;q=0.9,en;q=0.8' : null;
}

/**
 * Refresh the Supabase auth session on every request and handle i18n routing.
 */
export async function updateSession(request: NextRequest) {
    // 0. Normalize the `Accept-Language` header so Chinese locales resolve to `zh-TW`.
    // This only affects first-visit users (no NEXT_LOCALE cookie yet); existing
    // sessions keep their stored locale automatically via next-intl cookie priority.
    const normalized = normalizeAcceptLanguage(request.headers.get('accept-language'));
    if (normalized) {
        request.headers.set('accept-language', normalized);
    }

    // 1. Run next-intl middleware to get the localized response (rewrite or redirect)
    const response = handleI18nRouting(request);

    // 2. Set up Supabase using the localized response
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    // Mutate the existing localized response
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh the session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protected routes — redirect to /login if not authenticated
    // We check against the pathname, which might be /en/dashboard or /dashboard
    const pathname = request.nextUrl.pathname;
    const isProtected = ['/dashboard', '/library'].some((path) =>
        pathname.includes(path)
    );

    if (isProtected && !user) {
        const url = request.nextUrl.clone();
        // Preserve the locale prefix in the redirect
        const localeMatch = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(\/|$)/);
        const locale = localeMatch?.[1] ?? 'en';
        url.pathname = `/${locale}/login`;
        return NextResponse.redirect(url);
    }

    if (pathname.includes('/onboarding') && user) {
        const url = request.nextUrl.clone();
        // Preserve the locale prefix in the redirect
        const localeMatch = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(\/|$)/);
        const locale = localeMatch?.[1] ?? 'en';
        url.pathname = `/${locale}/home`;
        return NextResponse.redirect(url);
    }

    return response;
}
