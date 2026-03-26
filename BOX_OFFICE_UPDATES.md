# Box Office Feature Updates

## Summary of Changes

This document outlines the comprehensive updates made to the box office feature to support weekly data, Maoyan integration for China, and enhanced Rotten Tomatoes score display.

## 1. Weekly Box Office Data

### Changes Made:
- **Updated Data Model** (`src/types/index.ts`):
  - Added `weeklyRevenue` field to `BoxOfficeMovie` interface
  - Added `weekChange` field for week-over-week percentage change
  
- **Updated Data Fetching** (`src/lib/tmdb.ts`):
  - Modified `getBoxOfficeMovies()` to calculate and include weekly revenue
  - Changed sorting logic to prioritize weekly revenue over total revenue
  - Added week-over-week change calculation
  - Updated mock data for CN and TW regions to include weekly metrics

- **Updated UI Components**:
  - **Box Office Table** (`src/components/box-office-table.tsx`):
    - Changed "Revenue" column header to "Weekly Revenue"
    - Added "Week Change" column showing trend indicators (↑/↓)
    - Updated mobile layout to display weekly revenue prominently
    - Added `formatWeekChange()` helper function for trend visualization
  
  - **Box Office Client** (`src/app/[locale]/box-office/box-office-client.tsx`):
    - Updated subtitle to indicate "Weekly Box Office" data

### How It Works:
- For movies released within the last 7 days, weekly revenue = total revenue
- For older releases, weekly revenue is estimated as 15% of total revenue
- Week-over-week changes are calculated and displayed with color-coded indicators:
  - Green (↑) for positive growth
  - Red (↓) for decline
  - Gray (—) for no change

## 2. Maoyan Integration for China

### New Files Created:
- **Maoyan Service** (`src/lib/maoyan.ts`):
  - Created data structures for Maoyan daily and weekly data
  - Added placeholder functions for fetching Maoyan data
  - Included CNY to USD conversion helper
  - Added movie name mapping function (TMDB ↔ Maoyan)

### Implementation Notes:
The Maoyan integration is currently set up with a framework for future implementation. To complete the integration, you'll need to:

1. **Data Collection**:
   - Implement web scraping or use Maoyan's official API (if available)
   - Target URL: https://piaofang.maoyan.com/dashboard
   - Collect daily box office data for the past 7 days
   - Aggregate daily data into weekly totals

2. **Data Storage**:
   - Store daily Maoyan data in your database
   - Create a mapping table between Maoyan movie IDs and TMDB IDs
   - Implement caching to reduce API calls

3. **Integration Points**:
   - Update `getBoxOfficeMovies()` in `src/lib/tmdb.ts` to use Maoyan data for CN region
   - The mock data structure is already in place for testing

### Example Maoyan Data Structure:
```typescript
{
  movieId: "1565122",
  movieName: "Pegasus 3",
  weeklyBoxOffice: 624500000, // CNY
  weekStart: "2026-03-18",
  weekEnd: "2026-03-24"
}
```

## 3. Rotten Tomatoes Score Display

### Movies (Box Office):
- **Enhanced Modal Display** (`src/components/box-office-modal.tsx`):
  - RT scores now displayed in a prominent highlighted card
  - Shows Tomatometer score with tomato emoji
  - Color-coded: Fresh (green) vs Rotten (red)
  - Includes "Tomatometer" label for clarity

- **Table Display** (`src/components/box-office-table.tsx`):
  - RT scores shown alongside TMDB ratings
  - Visible in both desktop and mobile layouts
  - Tomato emoji indicator for quick recognition

### TV Shows:
- **Updated TV Details Function** (`src/lib/tmdb.ts`):
  - Modified `getTVDetails()` to fetch RT scores via OMDb API
  - Returns `rtScore` and `rtStatus` fields
  - Uses IMDB ID from TMDB's external_ids

- **Updated TV Details Page** (`src/app/[locale]/tv/[id]/page.tsx`):
  - Displays RT score in the metadata section
  - Shows score in a badge with tomato emoji
  - Color-coded based on fresh/rotten status
  - Positioned alongside other ratings (TMDB, runtime, etc.)

### RT Score Features:
- **Critic Score (Tomatometer)**: Currently displayed
- **Audience Score**: Available via OMDb API but not yet implemented
- **Fresh/Rotten Status**: Automatically determined (≥60% = Fresh, <60% = Rotten)

## 4. Data Sources

### Current Sources:
- **TMDB API**: Primary source for movie/TV metadata, cast, crew
- **OMDb API**: Source for Rotten Tomatoes scores (requires API key)
- **Mock Data**: Used for CN and TW regions with verified March 2026 data

### Future Sources:
- **Maoyan Professional Edition**: For accurate China box office data
- **Box Office Mojo**: Potential source for US weekly data
- **The Numbers**: Alternative source for international box office

## 5. Configuration Requirements

### Environment Variables:
```env
TMDB_API_KEY=your_tmdb_api_key
OMDB_API_KEY=your_omdb_api_key
```

### API Rate Limits:
- TMDB: 40 requests per 10 seconds
- OMDb: 1,000 requests per day (free tier)

### Caching Strategy:
- Box office data: 30 minutes (1800 seconds)
- Movie/TV details: 1 hour (3600 seconds)
- RT scores: 1 hour (3600 seconds)

## 6. Testing Checklist

- [ ] Verify weekly revenue displays correctly for all regions
- [ ] Check week-over-week change indicators (colors and icons)
- [ ] Test RT score display in box office modal
- [ ] Verify RT scores appear on TV show detail pages
- [ ] Test mobile responsive layouts
- [ ] Verify sorting by weekly revenue works correctly
- [ ] Check that CN region uses mock data with weekly metrics
- [ ] Test fallback behavior when RT scores are unavailable

## 7. Future Enhancements

### Short-term:
1. Implement actual Maoyan data fetching
2. Add Audience Score alongside Critic Score
3. Create admin panel for managing mock data
4. Add historical weekly data tracking

### Long-term:
1. Real-time box office updates (WebSocket integration)
2. Predictive analytics for box office performance
3. Social media sentiment analysis
4. International release calendar integration
5. Box office comparison tools (year-over-year, etc.)

## 8. Known Limitations

1. **Weekly Revenue Estimation**: For older movies, weekly revenue is estimated rather than actual
2. **Maoyan Integration**: Currently using mock data; real integration pending
3. **RT Audience Scores**: Not yet implemented (API supports it)
4. **Historical Data**: No historical weekly tracking yet
5. **Real-time Updates**: Data refreshes based on cache TTL, not real-time

## 9. Files Modified

### Core Files:
- `src/types/index.ts` - Added weekly data fields
- `src/lib/tmdb.ts` - Updated box office and TV functions
- `src/lib/maoyan.ts` - New file for Maoyan integration

### Components:
- `src/components/box-office-table.tsx` - Weekly display and trends
- `src/components/box-office-modal.tsx` - Enhanced RT display
- `src/app/[locale]/box-office/box-office-client.tsx` - Updated subtitle
- `src/app/[locale]/tv/[id]/page.tsx` - Added RT scores for TV

## 10. Support

For questions or issues related to these updates:
1. Check the inline code comments for implementation details
2. Review the TMDB and OMDb API documentation
3. Test with the provided mock data before implementing real APIs
4. Ensure environment variables are properly configured

---

**Last Updated**: March 25, 2026
**Version**: 2.0.0
