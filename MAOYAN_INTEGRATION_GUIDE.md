# Maoyan Integration Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing real-time Maoyan (猫眼专业版) box office data integration for the China (CN) region.

## Prerequisites
- Access to Maoyan Professional Edition: https://piaofang.maoyan.com/
- Web scraping tools or Maoyan API access
- Database for storing daily box office data
- TMDB API access (already configured)

## Implementation Steps

### Step 1: Data Collection Setup

#### Option A: Web Scraping (Recommended for MVP)
```typescript
// Example using Puppeteer or Playwright
import puppeteer from 'puppeteer';

async function scrapeMaoyanDailyData(date: string): Promise<MaoyanDailyData[]> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Navigate to Maoyan dashboard
    await page.goto('https://piaofang.maoyan.com/dashboard');
    
    // Wait for data to load
    await page.waitForSelector('.movie-list');
    
    // Extract movie data
    const movies = await page.evaluate(() => {
        const movieElements = document.querySelectorAll('.movie-item');
        return Array.from(movieElements).map(el => ({
            movieId: el.getAttribute('data-movie-id'),
            movieName: el.querySelector('.movie-name')?.textContent,
            boxOffice: parseFloat(el.querySelector('.box-office')?.textContent || '0'),
            date: new Date().toISOString().split('T')[0]
        }));
    });
    
    await browser.close();
    return movies;
}
```

#### Option B: Official API (If Available)
```typescript
// If Maoyan provides an official API
async function fetchMaoyanAPI(date: string): Promise<MaoyanDailyData[]> {
    const response = await fetch(`https://api.maoyan.com/box-office/daily?date=${date}`, {
        headers: {
            'Authorization': `Bearer ${process.env.MAOYAN_API_KEY}`
        }
    });
    
    return response.json();
}
```

### Step 2: Database Schema

Create tables to store Maoyan data:

```sql
-- Daily box office data
CREATE TABLE maoyan_daily_box_office (
    id SERIAL PRIMARY KEY,
    maoyan_movie_id VARCHAR(50) NOT NULL,
    movie_name VARCHAR(255) NOT NULL,
    box_office_cny BIGINT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(maoyan_movie_id, date)
);

-- Movie ID mapping (Maoyan <-> TMDB)
CREATE TABLE movie_id_mapping (
    id SERIAL PRIMARY KEY,
    maoyan_movie_id VARCHAR(50) NOT NULL UNIQUE,
    tmdb_movie_id INTEGER NOT NULL,
    movie_name_cn VARCHAR(255),
    movie_name_en VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_maoyan_daily_date ON maoyan_daily_box_office(date);
CREATE INDEX idx_maoyan_daily_movie ON maoyan_daily_box_office(maoyan_movie_id);
CREATE INDEX idx_mapping_tmdb ON movie_id_mapping(tmdb_movie_id);
```

### Step 3: Implement Data Aggregation

Update `src/lib/maoyan.ts`:

```typescript
import { db } from '@/lib/database'; // Your database client

/**
 * Fetch and aggregate weekly box office data from Maoyan
 */
export async function getMaoyanWeeklyBoxOffice(): Promise<MaoyanWeeklyData[]> {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Query daily data for the past 7 days
    const dailyData = await db.query(`
        SELECT 
            maoyan_movie_id,
            movie_name,
            SUM(box_office_cny) as weekly_total,
            MIN(date) as week_start,
            MAX(date) as week_end
        FROM maoyan_daily_box_office
        WHERE date >= $1 AND date <= $2
        GROUP BY maoyan_movie_id, movie_name
        ORDER BY weekly_total DESC
        LIMIT 10
    `, [weekAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]]);
    
    return dailyData.rows.map(row => ({
        movieId: row.maoyan_movie_id,
        movieName: row.movie_name,
        weeklyBoxOffice: parseInt(row.weekly_total),
        weekStart: row.week_start,
        weekEnd: row.week_end
    }));
}

/**
 * Map Maoyan movie to TMDB ID using fuzzy matching
 */
export async function mapMaoyanToTMDB(maoyanName: string): Promise<number | null> {
    // First, check if mapping exists in database
    const existing = await db.query(
        'SELECT tmdb_movie_id FROM movie_id_mapping WHERE movie_name_cn = $1 OR movie_name_en = $1',
        [maoyanName]
    );
    
    if (existing.rows.length > 0) {
        return existing.rows[0].tmdb_movie_id;
    }
    
    // If not found, search TMDB
    const tmdbSearch = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(maoyanName)}&language=zh-CN`
    );
    
    const results = await tmdbSearch.json();
    
    if (results.results && results.results.length > 0) {
        const tmdbId = results.results[0].id;
        
        // Store mapping for future use
        await db.query(
            'INSERT INTO movie_id_mapping (maoyan_movie_id, tmdb_movie_id, movie_name_cn) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            ['unknown', tmdbId, maoyanName]
        );
        
        return tmdbId;
    }
    
    return null;
}
```

### Step 4: Integrate with Box Office Function

Update `getBoxOfficeMovies()` in `src/lib/tmdb.ts`:

```typescript
export async function getBoxOfficeMovies(region: string = 'US'): Promise<BoxOfficeMovie[]> {
    // ... existing code ...
    
    // Special handling for China region
    if (region === 'CN') {
        try {
            // Fetch Maoyan weekly data
            const maoyanData = await getMaoyanWeeklyBoxOffice();
            
            // Map Maoyan movies to TMDB and enrich with details
            const cnMovies = await Promise.all(
                maoyanData.map(async (maoyan) => {
                    const tmdbId = await mapMaoyanToTMDB(maoyan.movieName);
                    
                    if (!tmdbId) return null;
                    
                    // Fetch TMDB details
                    const detail = await tmdbFetch<any>(
                        `/movie/${tmdbId}`,
                        { append_to_response: 'credits,release_dates' },
                        3600
                    );
                    
                    // Convert CNY to USD
                    const weeklyRevenueUSD = convertCNYtoUSD(maoyan.weeklyBoxOffice);
                    
                    return {
                        id: tmdbId,
                        rank: 0, // Will be assigned later
                        title: detail.title,
                        poster_path: detail.poster_path,
                        backdrop_path: detail.backdrop_path,
                        overview: detail.overview,
                        tagline: detail.tagline || '',
                        release_date: detail.release_date,
                        runtime: detail.runtime || 0,
                        vote_average: detail.vote_average,
                        vote_count: detail.vote_count,
                        revenue: weeklyRevenueUSD, // Use Maoyan data
                        weeklyRevenue: weeklyRevenueUSD,
                        budget: detail.budget || 0,
                        popularity: detail.popularity,
                        genres: detail.genres || [],
                        director: detail.credits?.crew?.find((c: any) => c.job === 'Director')?.name || null,
                        cast: detail.credits?.cast?.slice(0, 5) || [],
                        weekChange: 0, // Calculate from historical data
                    } as BoxOfficeMovie;
                })
            );
            
            // Filter out nulls and assign ranks
            validMovies = cnMovies.filter((m): m is BoxOfficeMovie => m !== null);
            validMovies.sort((a, b) => (b.weeklyRevenue || 0) - (a.weeklyRevenue || 0));
            return validMovies.slice(0, 10).map((m, i) => ({ ...m, rank: i + 1 }));
            
        } catch (error) {
            console.error('Failed to fetch Maoyan data, falling back to mock:', error);
            // Fall back to existing mock data
        }
    }
    
    // ... rest of existing code ...
}
```

### Step 5: Set Up Automated Data Collection

Create a cron job or scheduled task:

```typescript
// scripts/sync-maoyan-data.ts
import { scrapeMaoyanDailyData } from '@/lib/maoyan';
import { db } from '@/lib/database';

async function syncMaoyanData() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const dailyData = await scrapeMaoyanDailyData(today);
        
        // Insert into database
        for (const movie of dailyData) {
            await db.query(
                `INSERT INTO maoyan_daily_box_office (maoyan_movie_id, movie_name, box_office_cny, date)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (maoyan_movie_id, date) DO UPDATE
                 SET box_office_cny = $2`,
                [movie.movieId, movie.movieName, movie.boxOffice, movie.date]
            );
        }
        
        console.log(`Successfully synced ${dailyData.length} movies for ${today}`);
    } catch (error) {
        console.error('Failed to sync Maoyan data:', error);
    }
}

// Run daily at 2 AM Beijing time
syncMaoyanData();
```

Add to `package.json`:
```json
{
  "scripts": {
    "sync-maoyan": "tsx scripts/sync-maoyan-data.ts"
  }
}
```

Set up cron (Linux/Mac):
```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/project && npm run sync-maoyan
```

Or use Vercel Cron (for Next.js on Vercel):
```typescript
// app/api/cron/sync-maoyan/route.ts
export async function GET(request: Request) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }
    
    await syncMaoyanData();
    return Response.json({ success: true });
}
```

### Step 6: Testing

1. **Test Data Collection**:
```bash
npm run sync-maoyan
```

2. **Verify Database**:
```sql
SELECT * FROM maoyan_daily_box_office ORDER BY date DESC LIMIT 10;
```

3. **Test Box Office Page**:
- Navigate to `/box-office`
- Select "China (CN)" region
- Verify weekly data displays correctly

4. **Test Movie Mapping**:
```typescript
const tmdbId = await mapMaoyanToTMDB('飞驰人生3');
console.log('TMDB ID:', tmdbId); // Should return valid ID
```

## Monitoring & Maintenance

### Daily Checks:
- [ ] Verify data sync completed successfully
- [ ] Check for any failed movie mappings
- [ ] Monitor API rate limits (TMDB)
- [ ] Review error logs

### Weekly Tasks:
- [ ] Verify movie ID mappings are accurate
- [ ] Update exchange rate if needed
- [ ] Review and approve new movie mappings

### Monthly Tasks:
- [ ] Archive old daily data (>90 days)
- [ ] Optimize database indexes
- [ ] Review and update scraping logic if Maoyan changes

## Troubleshooting

### Issue: Scraping fails
**Solution**: Check if Maoyan website structure changed. Update selectors in scraping code.

### Issue: Movie mapping incorrect
**Solution**: Manually update `movie_id_mapping` table with correct TMDB ID.

### Issue: Exchange rate outdated
**Solution**: Update `convertCNYtoUSD()` function or fetch from currency API.

### Issue: Missing data for certain dates
**Solution**: Run backfill script to fetch historical data.

## Security Considerations

1. **Rate Limiting**: Implement rate limiting for Maoyan requests
2. **API Keys**: Store all API keys in environment variables
3. **Data Validation**: Validate all scraped data before storing
4. **Error Handling**: Implement comprehensive error handling and logging
5. **Backup**: Regular database backups of box office data

## Performance Optimization

1. **Caching**: Cache weekly aggregations for 30 minutes
2. **Indexing**: Ensure database indexes are optimized
3. **Batch Processing**: Process movie mappings in batches
4. **CDN**: Use CDN for movie posters and images

## Legal Considerations

⚠️ **Important**: Before implementing web scraping:
1. Review Maoyan's Terms of Service
2. Check robots.txt file
3. Consider contacting Maoyan for official API access
4. Implement respectful scraping (rate limiting, user agent)
5. Consult with legal team if necessary

---

**Last Updated**: March 25, 2026
**Status**: Implementation Guide
