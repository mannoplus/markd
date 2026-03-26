// ===========================================
// MARKD — Box Office Mojo Data Service
// ===========================================
// Fetches real-time weekly box office data from Box Office Mojo
// https://www.boxofficemojo.com/

/**
 * Box Office Mojo weekly data structure
 */
export interface BoxOfficeMojoMovie {
    rank: number;
    title: string;
    weekendGross: number;
    totalGross: number;
    weekChange?: number;
    theaters?: number;
}

/**
 * Fetch weekly box office data from Box Office Mojo
 * Note: This requires web scraping. For production, consider:
 * 1. Using a proxy service to avoid CORS
 * 2. Running scraping on the server side
 * 3. Caching results in database
 * 4. Using official API if available
 */
export async function getBoxOfficeMojoWeekly(date?: string): Promise<BoxOfficeMojoMovie[]> {
    // TODO: Implement actual Box Office Mojo scraping
    // This would involve:
    // 1. Fetching https://www.boxofficemojo.com/date/YYYY-MM-DD/weekly/
    // 2. Parsing HTML to extract movie data
    // 3. Mapping to our data structure
    
    // For now, return empty array - will be populated with real data
    return [];
}

/**
 * Map Box Office Mojo movie title to TMDB ID
 */
export async function mapMojoToTMDB(mojoTitle: string): Promise<number | null> {
    try {
        // Search TMDB for the movie
        const searchRes = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(mojoTitle)}`
        );
        
        if (searchRes.ok) {
            const results = await searchRes.json();
            if (results.results && results.results.length > 0) {
                return results.results[0].id;
            }
        }
    } catch (e) {
        console.error('Failed to map Mojo title to TMDB:', e);
    }
    
    return null;
}
