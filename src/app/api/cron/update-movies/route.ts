import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        
        // Vercel cron uses Bearer token format with CRON_SECRET
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', {
                status: 401,
            });
        }

        // Revalidate the API endpoint cache so the next request fetches fresh data
        revalidatePath('/api/now-showing');

        return NextResponse.json({
            success: true,
            message: 'Now showing cache successfully revalidated'
        });
    } catch (error) {
        console.error('Error during cron execution:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
