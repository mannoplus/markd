import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const revalidate = 43200; // Cache for 12 hours (12 * 60 * 60)

async function fetchHtml(url: string) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            next: { revalidate: 43200 }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const buffer = await response.arrayBuffer();
        return new TextDecoder('utf-8').decode(buffer);
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return null;
    }
}

export async function GET() {
    try {
        const [boxOfficeHtml, showtimeHtml, nextHtml] = await Promise.all([
            fetchHtml('https://app2.atmovies.com.tw/boxoffice/'),
            fetchHtml('https://www.atmovies.com.tw/showtime/'),
            fetchHtml('https://www.atmovies.com.tw/movie/next/')
        ]);

        const boxOffice = [];
        const showtimes = [];
        const comingSoon = [];

        // Parse Box Office
        if (boxOfficeHtml) {
            const $ = cheerio.load(boxOfficeHtml);
            $('td a[href*="/movie/"]').each((i, el) => {
                const title = $(el).text().trim();
                const link = $(el).attr('href');
                if (title && title.length > 1) {
                    boxOffice.push({
                        id: `boxoffice-${i}`,
                        title,
                        link: link ? `https://app2.atmovies.com.tw${link}` : '',
                        rank: i + 1,
                        poster: `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600` // Using placeholder as posters aren't always present here
                    });
                }
            });
        }

        // Parse Showtimes
        if (showtimeHtml) {
            const $ = cheerio.load(showtimeHtml);
            // On showtime page, movies are usually listed in dropdowns or list items
            $('select[name="film_id"] option, a[href*="/movie/"]').each((i, el) => {
                const title = $(el).text().trim();
                const val = $(el).attr('value') || $(el).attr('href');
                if (title && title.length > 2 && !title.includes('選擇') && !title.includes('電影首頁') && !showtimes.find(m => m.title === title)) {
                    showtimes.push({
                        id: `showtime-${i}`,
                        title,
                        link: val?.startsWith('/') ? `https://www.atmovies.com.tw${val}` : val,
                        poster: `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`
                    });
                }
            });
            // Limit to top 20
            showtimes.splice(20);
        }

        // Parse Coming Soon
        if (nextHtml) {
            const $ = cheerio.load(nextHtml);
            // Movies are typically in `.filmTitle` or lists
            $('.filmTitle a, ul.filmListAll li a[href*="/movie/"], .movieList a').each((i, el) => {
                const title = $(el).text().trim();
                const link = $(el).attr('href');
                if (title && title.length > 2 && !comingSoon.find(m => m.title === title)) {
                    comingSoon.push({
                        id: `next-${i}`,
                        title,
                        link: link ? `https://www.atmovies.com.tw${link}` : '',
                        poster: `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`
                    });
                }
            });
            comingSoon.splice(20);
        }

        return NextResponse.json({
            success: true,
            data: {
                boxOffice: boxOffice.slice(0, 10),
                showtimes,
                comingSoon
            }
        }, {
            headers: {
                'Cache-Control': 's-maxage=43200, stale-while-revalidate'
            }
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: false, error: 'Unknown error' }, { status: 500 });
    }
}
