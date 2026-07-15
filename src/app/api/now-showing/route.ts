import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const revalidate = 43200; // Cache for 12 hours (12 * 60 * 60)

const EXCLUDED_TITLES = ['電影首頁', '本周新片', '本期首輪', '本期二輪', '近期上映', '新片快報', '電影'];

// Regex sanitization utility to isolate Traditional Chinese and English title fragments
export function sanitizeTitle(title: string, lang: string): string {
    if (!title) return '';
    const hasChinese = /[\u4e00-\u9fa5]/.test(title);
    if (lang === 'zh-TW' || lang.startsWith('zh')) {
        if (hasChinese) {
            // Strip trailing English alphanumeric strings, e.g. "海洋奇緣 (真人版) Moana (Live-action)"
            const cleaned = title.replace(/\s*[a-zA-Z][a-zA-Z0-9\s\-(),'&:!.]*$/, '').trim();
            if (cleaned) return cleaned;
        }
    } else {
        // English: strip Chinese characters and Chinese punctuation/brackets
        if (hasChinese) {
            const hasEnglish = /[a-zA-Z]/.test(title);
            if (hasEnglish) {
                // Replace Chinese characters with empty space
                const cleaned = title.replace(/[\u4e00-\u9fa5\s（）()：:]+/g, ' ').trim();
                if (cleaned) return cleaned;
            }
        }
    }
    return title;
}

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

async function extractMovies(html: string | null, limit?: number) {
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
                movies.push({ id, title });
            }
        }
    });
    return limit ? movies.slice(0, limit) : movies;
}

// Function to fetch poster and ID from TMDB using the movie title
async function fetchTmdbPoster(movie: any, lang: string = 'zh-TW') {
    const fallbackPoster = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%231e1e2f"/><stop offset="100%" stop-color="%230a0a0f"/></linearGradient></defs><rect width="400" height="600" fill="url(%23g)"/><g fill="%23888899" text-anchor="middle" font-family="sans-serif"><circle cx="200" cy="240" r="40" stroke="%23444455" stroke-width="4" fill="none"/><path d="M185 240 L215 240 M200 225 L200 255" stroke="%23444455" stroke-width="4"/><text x="200" y="340" font-size="20" font-weight="bold">Poster Unavailable</text><text x="200" y="375" font-size="14" fill="%23555566">MARKD Entertainment</text></g></svg>`;
    
    let poster = fallbackPoster;
    let tmdbId = null;
    let link = null; // Default to null if TMDB fails
    
    // Clean up title for better TMDB search results
    let cleanTitle = movie.title.replace(/[a-zA-Z:\-0-9\s]+$/, '').trim();
    if (!cleanTitle) cleanTitle = movie.title.trim(); // fallback if it was all English
    
    try {
        const tmdbApiKey = process.env.TMDB_API_KEY;
        if (!tmdbApiKey) {
            console.warn("TMDB_API_KEY is missing in environment variables.");
            return { ...movie, poster, link };
        }

        const tmdbLang = lang === 'en' ? 'en-US' : (lang === 'zh-TW' ? 'zh-TW' : lang);
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(cleanTitle)}&language=${tmdbLang}&page=1`;
        const response = await fetch(url, {
            headers: {
                'accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                // Find the first result with a poster
                const match = data.results.find((r: any) => r.poster_path) || data.results[0];
                if (match) {
                    tmdbId = match.id;
                    link = `/movie/${tmdbId}`;
                    if (match.poster_path) {
                        poster = `https://image.tmdb.org/t/p/w500${match.poster_path}`;
                    }
                    if (match.title) {
                        movie.title = match.title; // Update the title to the localized version
                    }
                }
            }
        }
    } catch (e) {
        console.error("TMDB fetch error:", e);
    }

    // Apply regex language sanitization to isolate local translation fragments
    movie.title = sanitizeTitle(movie.title, lang);

    return { ...movie, poster, tmdbId, link };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'zh-TW';
    try {
        const [boxOfficeHtml, newReleasesHtml, upcomingHtml] = await Promise.all([
            fetchHtml('https://app2.atmovies.com.tw/boxoffice/'),
            fetchHtml('https://www.atmovies.com.tw/movie/new/'),
            fetchHtml('https://www.atmovies.com.tw/movie/next2/')
        ]);

        interface BaseMovieData {
            id: string; // ATM ID
            tmdbId?: number | null; // TMDB ID
            title: string;
            link: string | null; // Route link
            poster: string;
        }

        interface BoxOfficeData extends BaseMovieData {
            rank: number;
        }

        let boxOffice: BoxOfficeData[] = [];
        if (boxOfficeHtml) {
            const $ = cheerio.load(boxOfficeHtml);
            $('tr').each((i, el) => {
                const a = $(el).find('td a[href*="/movie/"]');
                const title = a.text().trim().replace(/\s+/g, ' ');
                const link = a.attr('href') || '';
                const match = link.match(/\/movie\/([a-zA-Z0-9]+)\/?/);
                const id = match ? match[1] : '';

                if (id && title && title.length > 1 && !EXCLUDED_TITLES.includes(title)) {
                    if (!boxOffice.find(m => m.id === id)) {
                        boxOffice.push({ id, title, link: null, rank: boxOffice.length + 1, poster: '' });
                    }
                }
            });
            boxOffice = boxOffice.slice(0, 10);
        }

        // Fetch without limit for New Releases
        let thisWeekNew = await extractMovies(newReleasesHtml) as BaseMovieData[];
        let comingSoon = await extractMovies(upcomingHtml, 10) as BaseMovieData[];

        // Fetch TMDB metadata concurrently
        boxOffice = (await Promise.all(boxOffice.map(m => fetchTmdbPoster(m, lang)))) as BoxOfficeData[];
        thisWeekNew = (await Promise.all(thisWeekNew.map(m => fetchTmdbPoster(m, lang)))) as BaseMovieData[];
        comingSoon = (await Promise.all(comingSoon.map(m => fetchTmdbPoster(m, lang)))) as BaseMovieData[];

        return NextResponse.json({
            success: true,
            data: { boxOffice, thisWeekNew, comingSoon }
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
