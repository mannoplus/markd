import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { 
    getTraktTrending, 
    getTraktPopular, 
    getTraktAnticipated, 
    getTraktRecentComments 
} from '@/lib/trakt';
import { enrichMoviesWithPosters, getTmdbFallback } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'trending';

    try {
        let data;
        const traktApiKey = process.env.TRAKT_CLIENT_ID;

        if (!traktApiKey) {
            console.warn('Trakt API key missing, using TMDB fallbacks');
            data = await getTmdbFallback(type);
        } else {
            switch (type) {
                case 'trending':
                    data = await getTraktTrending();
                    data = await enrichMoviesWithPosters(data);
                    break;
                case 'popular':
                    data = await getTraktPopular();
                    data = await enrichMoviesWithPosters(data);
                    break;
                case 'anticipated':
                    // MERGE Trakt and TMDB for "Coming Soon"
                    const [traktData, tmdbData] = await Promise.all([
                        getTraktAnticipated().then(d => enrichMoviesWithPosters(d)),
                        getTmdbFallback('anticipated')
                    ]);
                    
                    const uniqueRecords: Record<string, any> = {};
                    [...(traktData || []), ...(tmdbData || [])].forEach((item: any) => {
                        const movie = item.movie || item || {};
                        const tmdbId = movie.ids?.tmdb || movie.tmdb_id || movie.id;
                        const key = tmdbId ? String(tmdbId) : (movie.title ? movie.title.toLowerCase().replace(/[^a-z0-9]/g, '') : null);

                        if (key && !uniqueRecords[key]) {
                            uniqueRecords[key] = item;
                        }
                    });
                    
                    data = Object.values(uniqueRecords);
                    break;
                case 'reviews':
                    data = await getTraktRecentComments(10);
                    data = await enrichMoviesWithPosters(data);
                    break;
                default:
                    data = await getTraktTrending();
            }
            
            // If Trakt returned empty or failed (and not already merged), use TMDB fallback
            if (type !== 'anticipated' && (!data || (Array.isArray(data) && data.length === 0))) {
                data = await getTmdbFallback(type);
            }
        }

        // Final filtering for 'anticipated' to ensure date range (March 27 - June 30, 2026)
        if (type === 'anticipated' && Array.isArray(data)) {
            const start = new Date('2026-03-27');
            const end = new Date('2026-09-30'); // Widened to 6 months to ensure 10 movies
            
            data = data.filter(item => {
                const movie = item.movie || item;
                // Check both item.movie.release_date (TMDB) and item.movie.released (Trakt)
                const rawDate = movie.release_date || movie.released || item.release_date || '';
                const releaseDate = new Date(rawDate);
                
                // If we have a valid date, filter by range
                if (!isNaN(releaseDate.getTime())) {
                    return releaseDate >= start && releaseDate <= end;
                }
                
            }).sort((a: any, b: any) => {
                // Prioritize watchers (popularity) to show major upcoming films first
                const watchersA = a.watchers || 0;
                const watchersB = b.watchers || 0;
                if (watchersB !== watchersA) return watchersB - watchersA;
                
                // Fallback to release date
                const dateA = new Date(a.movie?.release_date || a.movie?.released || a.release_date || '2026-12-31').getTime();
                const dateB = new Date(b.movie?.release_date || b.movie?.released || b.release_date || '2026-12-31').getTime();
                return dateA - dateB;
            }).slice(0, 10);
        }

        // Final deduplication before return
        const uniqueData = [];
        const seen = new Set();
        for (const item of (data as any[])) {
            const movie = item.movie || item || {};
            const id = movie.ids?.tmdb || movie.tmdb_id || movie.id;
            const key = id ? String(id) : (movie.title ? movie.title.toLowerCase().replace(/[^a-z0-9]/g, '') : null);
            if (key && !seen.has(key)) {
                seen.add(key);
                uniqueData.push(item);
            }
        }
        
        return NextResponse.json(uniqueData.slice(0, 10));
    } catch (error) {
        console.error(`Error in movie-buzz API (${type}):`, error);
        return NextResponse.json([], { status: 200 });
    }
}

