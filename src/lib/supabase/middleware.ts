import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const handleI18nRouting = createMiddleware(routing);

/**
 * Refresh the Supabase auth session on every request and handle i18n routing.
 */
export async function updateSession(request: NextRequest) {
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
        url.pathname = '/login'; // next-intl will handle prefixing the locale on the next request if needed
        return NextResponse.redirect(url);
    }

    if (pathname.includes('/onboarding') && user) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return response;
}
