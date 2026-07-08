import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

export const revalidate = 3600; // Cache for 1 hour

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');
    const region = searchParams.get('region') || 'a02'; // default to Taipei (a02)

    if (!movieId) {
        return NextResponse.json({ success: false, error: 'Missing movieId' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://www.atmovies.com.tw/showtime/${movieId}/${region}/`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            if (response.status === 404) return NextResponse.json({ success: true, data: [] });
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const html = iconv.decode(buffer, 'utf8');

        const $ = cheerio.load(html);
        const theaters: { theater: string; version: string; times: string[] }[] = [];

        $('#filmShowtimeBlock ul').each((i, ul) => {
            const theater = $(ul).find('.theaterTitle a').text().trim() || $(ul).find('.theaterTitle').text().trim();
            const version = $(ul).find('.filmVersion').text().trim();
            const times: string[] = [];
            
            $(ul).find('li').each((j, li) => {
                const text = $(li).text().replace(/訂票/g, '').trim();
                if (text.includes('：') || text.includes(':')) {
                    times.push(text);
                }
            });

            if (theater && times.length > 0) {
                theaters.push({ theater, version, times });
            }
        });

        return NextResponse.json({ success: true, data: theaters });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: false, error: 'Unknown error' }, { status: 500 });
    }
}
