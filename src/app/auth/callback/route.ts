import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const origin = requestUrl.origin;
    const next = requestUrl.searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            let redirectUrl = process.env.NEXT_PUBLIC_SITE_URL
                ? process.env.NEXT_PUBLIC_SITE_URL
                : process.env.NEXT_PUBLIC_VERCEL_URL
                    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
                    : origin;

            return NextResponse.redirect(`${redirectUrl}${next}`);
        }
    }

    // Return the user to an error page with instructions or simply back to login
    return NextResponse.redirect(`${origin}/login?error=Invalid+Google+Sign+In`);
}
