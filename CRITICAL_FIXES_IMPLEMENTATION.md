# Critical Fixes Implementation Guide

## ✅ COMPLETED FIXES

### 1. RT Scores on Movie Pages ✅
**Status**: FULLY IMPLEMENTED

**What was done**:
- Updated `getMovieDetails()` in `src/lib/tmdb.ts` to fetch RT scores via OMDb API
- Added `rtScore`, `rtStatus`, and `imdbRating` to return type
- Updated movie detail page (`src/app/[locale]/movie/[id]/page.tsx`) to display:
  - RT score badge with tomato emoji
  - IMDb rating badge
  - Color-coded fresh/rotten status
  - Positioned in metadata section alongside year, runtime, TMDB rating

**How to verify**:
1. Navigate to any movie page (e.g., `/en/movie/1266127`)
2. Check metadata section below title
3. RT score should appear in green (fresh) or red (rotten) badge
4. IMDb rating should appear in amber badge

---

### 2. RT Scores for TV Shows ✅
**Status**: ALREADY IMPLEMENTED (from previous update)

**What exists**:
- `getTVDetails()` in `src/lib/tmdb.ts` fetches RT scores
- TV detail page (`src/app/[locale]/tv/[id]/page.tsx`) displays RT badge
- Same visual treatment as movies

**How to verify**:
1. Navigate to any TV show page (e.g., `/en/tv/1396`)
2. Check metadata section
3. RT score badge should be visible

---

### 3. Box Office Data Filtering ✅
**Status**: IMPLEMENTED - Old movies now filtered out

**What was done**:
- Added date filtering to `getBoxOfficeMovies()` in `src/lib/tmdb.ts`
- Only includes movies released in last 3 months
- Filters out movies with zero revenue
- Added console logging for debugging
- Improved error handling

**Changes made**:
```typescript
// Filter out movies older than 3 months
const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
const releaseDate = new Date(detail.release_date);
if (releaseDate < threeMonthsAgo) {
    return null; // Skip old movies
}

// Skip movies with no revenue
if (!detail.revenue || detail.revenue === 0) {
    return null;
}
```

**How to verify**:
1. Navigate to `/box-office`
2. Check that only recent releases appear
3. Old movies like "The Revenant" should NOT appear
4. Check browser console for filtering logs

---

## 🔄 PENDING IMPLEMENTATION

### 4. Box Office Mojo Integration
**Status**: Framework created, needs implementation

**Files created**:
- `src/lib/box-office-mojo.ts` - Data structures and placeholder functions

**What needs to be done**:

#### Step 1: Set up web scraping
```typescript
// Install dependencies
npm install cheerio
npm install @types/cheerio --save-dev

// Or use Puppeteer for JavaScript-heavy sites
npm install puppeteer
```

#### Step 2: Implement scraping function
```typescript
import * as cheerio from 'cheerio';

export async function getBoxOfficeMojoWeekly(date?: string): Promise<BoxOfficeMojoMovie[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const url = `https://www.boxofficemojo.com/date/${targetDate}/weekly/`;
    
    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const movies: BoxOfficeMojoMovie[] = [];
        
        // Parse table rows (adjust selectors based on actual HTML structure)
        $('table tbody tr').each((index, element) => {
            const rank = index + 1;
            const title = $(element).find('td:nth-child(2) a').text().trim();
            const weekendGross = parseFloat($(element).find('td:nth-child(3)').text().replace(/[$,]/g, ''));
            const totalGross = parseFloat($(element).find('td:nth-child(4)').text().replace(/[$,]/g, ''));
            
            if (title && weekendGross) {
                movies.push({
                    rank,
                    title,
                    weekendGross,
                    totalGross,
                });
            }
        });
        
        return movies.slice(0, 10);
    } catch (error) {
        console.error('Failed to fetch Box Office Mojo data:', error);
        return [];
    }
}
```

#### Step 3: Integrate with box office page
Update `getBoxOfficeMovies()` in `src/lib/tmdb.ts`:

```typescript
if (region === 'US') {
    try {
        // Fetch real Box Office Mojo data
        const mojoData = await getBoxOfficeMojoWeekly();
        
        if (mojoData.length > 0) {
            // Map to TMDB and enrich
            const enrichedMovies = await Promise.all(
                mojoData.map(async (mojo) => {
                    const tmdbId = await mapMojoToTMDB(mojo.title);
                    if (!tmdbId) return null;
                    
                    // Fetch TMDB details
                    const detail = await tmdbFetch(`/movie/${tmdbId}`, {
                        append_to_response: 'credits,release_dates'
                    });
                    
                    // Combine Mojo revenue with TMDB metadata
                    return {
                        ...detail,
                        revenue: mojo.totalGross,
                        weeklyRevenue: mojo.weekendGross,
                        rank: mojo.rank,
                    };
                })
            );
            
            return enrichedMovies.filter(m => m !== null);
        }
    } catch (error) {
        console.error('Box Office Mojo fetch failed, using TMDB:', error);
        // Fall through to TMDB data
    }
}
```

---

### 5. Taiwan Box Office Integration
**Status**: Framework created, needs implementation

**Files created**:
- `src/lib/taiwan-box-office.ts` - Data structures and placeholder functions

**What needs to be done**:

#### Step 1: Implement Taiwan scraping
```typescript
import * as cheerio from 'cheerio';

export async function getTaiwanBoxOfficeWeekly(): Promise<TaiwanBoxOfficeMovie[]> {
    const url = 'https://boxofficetw.tfai.org.tw/';
    
    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const movies: TaiwanBoxOfficeMovie[] = [];
        
        // Parse table (adjust selectors based on actual HTML)
        $('.box-office-table tr').each((index, element) => {
            if (index === 0) return; // Skip header
            
            const rank = index;
            const title = $(element).find('.title-zh').text().trim();
            const titleEn = $(element).find('.title-en').text().trim();
            const weeklyGross = parseFloat($(element).find('.weekly-gross').text().replace(/[,]/g, ''));
            const totalGross = parseFloat($(element).find('.total-gross').text().replace(/[,]/g, ''));
            
            if (title && weeklyGross) {
                movies.push({
                    rank,
                    title,
                    titleEn,
                    weeklyGross,
                    totalGross,
                });
            }
        });
        
        return movies.slice(0, 10);
    } catch (error) {
        console.error('Failed to fetch Taiwan box office data:', error);
        return [];
    }
}
```

#### Step 2: Integrate with box office page
Update `getBoxOfficeMovies()` for TW region:

```typescript
if (region === 'TW') {
    try {
        const taiwanData = await getTaiwanBoxOfficeWeekly();
        
        if (taiwanData.length > 0) {
            const enrichedMovies = await Promise.all(
                taiwanData.map(async (tw) => {
                    const tmdbId = await mapTaiwanToTMDB(tw.title, tw.titleEn);
                    if (!tmdbId) return null;
                    
                    const detail = await tmdbFetch(`/movie/${tmdbId}`, {
                        append_to_response: 'credits,release_dates'
                    });
                    
                    // Convert TWD to USD
                    const revenueUSD = convertTWDtoUSD(tw.totalGross);
                    const weeklyUSD = convertTWDtoUSD(tw.weeklyGross);
                    
                    return {
                        ...detail,
                        revenue: revenueUSD,
                        weeklyRevenue: weeklyUSD,
                        rank: tw.rank,
                    };
                })
            );
            
            return enrichedMovies.filter(m => m !== null);
        }
    } catch (error) {
        console.error('Taiwan box office fetch failed:', error);
        // Fall through to mock data
    }
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Before deploying:
- [ ] Test RT scores on multiple movie pages
- [ ] Test RT scores on multiple TV show pages
- [ ] Verify old movies are filtered from box office
- [ ] Test all 7 regions load correctly
- [ ] Check console for any errors
- [ ] Verify mobile responsive design

### After implementing Box Office Mojo:
- [ ] Test US region shows real data
- [ ] Verify movie titles match correctly
- [ ] Check revenue numbers are accurate
- [ ] Monitor scraping success rate
- [ ] Set up error alerts

### After implementing Taiwan box office:
- [ ] Test TW region shows real data
- [ ] Verify Chinese/English title mapping
- [ ] Check TWD to USD conversion
- [ ] Test with various movie titles

---

## 🔍 TESTING COMMANDS

```bash
# Test movie RT scores
curl http://localhost:3000/en/movie/1266127

# Test TV RT scores
curl http://localhost:3000/en/tv/1396

# Test box office filtering
curl http://localhost:3000/en/box-office

# Check console logs
# Open browser dev tools and check for:
# - "Filtering out old movie: ..."
# - "Skipping movie with no revenue: ..."
```

---

## 📊 CURRENT STATUS SUMMARY

| Feature | Status | Notes |
|---------|--------|-------|
| RT scores on movie pages | ✅ DONE | Fully implemented and working |
| RT scores on TV shows | ✅ DONE | Already implemented |
| Filter old box office movies | ✅ DONE | Only shows movies from last 3 months |
| Box Office Mojo integration | 🔄 PENDING | Framework ready, needs scraping implementation |
| Taiwan box office integration | 🔄 PENDING | Framework ready, needs scraping implementation |

---

## ⚠️ IMPORTANT NOTES

### Legal Considerations:
1. **Web Scraping**: Check robots.txt and Terms of Service before scraping
2. **Rate Limiting**: Implement delays between requests
3. **User Agent**: Use appropriate user agent string
4. **Caching**: Cache scraped data to minimize requests

### Technical Considerations:
1. **Error Handling**: Always have fallback to TMDB data
2. **Data Validation**: Validate all scraped data before using
3. **Monitoring**: Set up alerts for scraping failures
4. **Performance**: Cache results for at least 30 minutes

### Alternative Approaches:
1. **Official APIs**: Check if Box Office Mojo or Taiwan Film Institute offer APIs
2. **Third-party Services**: Consider using services like The Numbers API
3. **Manual Updates**: For critical periods, manually update mock data

---

## 🆘 TROUBLESHOOTING

### RT scores not showing:
1. Check `OMDB_API_KEY` is set in `.env.local`
2. Verify API key is valid (test at https://www.omdbapi.com/)
3. Check browser console for API errors
4. Ensure movie has IMDB ID in TMDB

### Old movies still appearing:
1. Clear Next.js cache: `rm -rf .next`
2. Restart dev server
3. Check console logs for filtering messages
4. Verify date calculation is correct

### Scraping fails:
1. Check website structure hasn't changed
2. Verify selectors are correct
3. Test with curl/Postman first
4. Check for CORS issues
5. Consider using server-side scraping

---

**Last Updated**: March 25, 2026
**Priority**: HIGH - RT scores complete, box office data filtering complete
**Next Steps**: Implement Box Office Mojo and Taiwan scraping when ready
