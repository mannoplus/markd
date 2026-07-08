import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const revalidate = 43200; // Cache for 12 hours (12 * 60 * 60)

const EXCLUDED_TITLES = ['電影首頁', '本周新片', '本期首輪', '本期二輪', '近期上映', '新片快報', '電影'];

async function fetchHtml(url: string) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            next: { revalidate: 43200 }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.text();
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return null;
    }
}

async function extractMovies(html: string | null, limit: number) {
    if (!html) return [];
    const $ = cheerio.load(html);
    const movies: any[] = [];
    $('a[href^="/movie/"]').each((i, el) => {
        const title = $(el).text().trim().replace(/\s+/g, ' ');
        const link = $(el).attr('href') || '';
        
        // Match /movie/ID/
        const match = link.match(/\/movie\/([a-zA-Z0-9]+)\/?/);
        const id = match ? match[1] : '';

        if (id && title && title.length > 1 && !EXCLUDED_TITLES.includes(title)) {
            // Avoid duplicates
            if (!movies.find(m => m.id === id)) {
                movies.push({ id, title, link: `/movie/${id}` });
            }
        }
    });
    return movies.slice(0, limit);
}

// Function to fetch details for a single movie to get the poster
async function fetchMovieDetails(movie: any) {
    if (!movie.id) return { ...movie, poster: `https://picsum.photos/seed/${encodeURIComponent(movie.title)}/400/600` };
    
    try {
        const html = await fetchHtml(`https://www.atmovies.com.tw/movie/${movie.id}/`);
        let poster = `https://picsum.photos/seed/${encodeURIComponent(movie.title)}/400/600`;
        if (html) {
            const $ = cheerio.load(html);
            const img = $('.film_poster img').attr('src') || $('img[src*="/photo101/"]').attr('src') || $('img.poster').attr('src');
            if (img) poster = img;
        }
        return { ...movie, poster };
    } catch {
        return { ...movie, poster: `https://picsum.photos/seed/${encodeURIComponent(movie.title)}/400/600` };
    }
}

export async function GET() {
    try {
        const [boxOfficeHtml, newReleasesHtml, firstRunHtml, upcomingHtml] = await Promise.all([
            fetchHtml('https://app2.atmovies.com.tw/boxoffice/'),
            fetchHtml('https://www.atmovies.com.tw/movie/new/'),
            fetchHtml('https://www.atmovies.com.tw/movie/now/'),
            fetchHtml('https://www.atmovies.com.tw/movie/next2/')
        ]);

        interface BaseMovieData {
            id: string;
            title: string;
            link: string;
            poster: string;
        }

        interface BoxOfficeData extends BaseMovieData {
            rank: number;
        }

        let boxOffice: BoxOfficeData[] = [];
        if (boxOfficeHtml) {
            const $ = cheerio.load(boxOfficeHtml);
            $('tr').each((i, el) => {
                const a = $(el).find('td a[href^="/movie/"]');
                const title = a.text().trim().replace(/\s+/g, ' ');
                const link = a.attr('href') || '';
                const match = link.match(/\/movie\/([a-zA-Z0-9]+)\/?/);
                const id = match ? match[1] : '';

                if (id && title && title.length > 1 && !EXCLUDED_TITLES.includes(title)) {
                    if (!boxOffice.find(m => m.id === id)) {
                        boxOffice.push({ id, title, link: `/movie/${id}`, rank: boxOffice.length + 1, poster: '' });
                    }
                }
            });
            boxOffice = boxOffice.slice(0, 10);
        }

        let thisWeekNew = await extractMovies(newReleasesHtml, 10) as BaseMovieData[];
        let firstRun = await extractMovies(firstRunHtml, 10) as BaseMovieData[];
        let comingSoon = await extractMovies(upcomingHtml, 10) as BaseMovieData[];

        // Fetch posters concurrently
        boxOffice = (await Promise.all(boxOffice.map(fetchMovieDetails))) as BoxOfficeData[];
        thisWeekNew = (await Promise.all(thisWeekNew.map(fetchMovieDetails))) as BaseMovieData[];
        firstRun = (await Promise.all(firstRun.map(fetchMovieDetails))) as BaseMovieData[];
        comingSoon = (await Promise.all(comingSoon.map(fetchMovieDetails))) as BaseMovieData[];

        return NextResponse.json({
            success: true,
            data: { boxOffice, thisWeekNew, firstRun, comingSoon }
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
