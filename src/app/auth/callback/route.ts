import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SUPPORTED_LOCALES = ['en', 'zh-TW'];
const DEFAULT_LOCALE = 'en';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const origin = requestUrl.origin;
    const next = requestUrl.searchParams.get('next');

    // Read locale from NEXT_LOCALE cookie (set by next-intl middleware)
    const localeCookie = request.headers.get('cookie')?.match(/NEXT_LOCALE=([^;]+)/)?.[1];
    const locale = SUPPORTED_LOCALES.includes(localeCookie ?? '') ? localeCookie : DEFAULT_LOCALE;

    // Determine redirect path: use explicit next param if provided, otherwise localized home
    const redirectPath = next && next.startsWith('/') ? `/${locale}${next}` : `/${locale}`;

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return NextResponse.redirect(`${origin}${redirectPath}`);
        }
    }

    // Return the user to an error page with instructions or simply back to login
    return NextResponse.redirect(`${origin}/${locale}/login?error=Invalid+Google+Sign+In`);
}
