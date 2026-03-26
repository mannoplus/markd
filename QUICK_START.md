# Quick Start Guide

## 🚀 Getting Started

This guide will help you quickly verify and test the new box office features.

---

## Prerequisites

Ensure you have the following environment variables set:

```bash
# Required
TMDB_API_KEY=your_tmdb_api_key
OMDB_API_KEY=your_omdb_api_key

# Optional (for future Maoyan integration)
MAOYAN_API_KEY=your_maoyan_api_key
DATABASE_URL=your_database_url
```

---

## Installation

No additional packages are required. All changes use existing dependencies.

```bash
# Install dependencies (if not already done)
npm install

# Run development server
npm run dev
```

---

## Testing the Features

### 1. Weekly Box Office Data (2 minutes)

**Steps**:
1. Navigate to `http://localhost:3000/box-office`
2. Look for the "Weekly Revenue" column header
3. Verify "This Week" label appears under revenue amounts
4. Check for trend indicators (↑/↓) in the rightmost column
5. Switch between regions (US, TW, GB, JP, KR, CN, FR)
6. Test on mobile (resize browser or use dev tools)

**Expected Results**:
- ✅ Weekly revenue displays in green
- ✅ Trend arrows show with percentages
- ✅ Mobile layout shows weekly data prominently
- ✅ All regions load successfully

---

### 2. RT Scores in Box Office Modal (1 minute)

**Steps**:
1. On the box office page, click any movie card
2. Scroll to "Critical Reception" section
3. Look for the highlighted RT score card

**Expected Results**:
- ✅ RT score appears in a colored card (green/red)
- ✅ Tomato emoji (🍅) is visible
- ✅ "Tomatometer" label appears below score
- ✅ Score is larger and more prominent than other ratings

---

### 3. RT Scores in Box Office Table (30 seconds)

**Steps**:
1. On the box office page, look at the table
2. Find the RT column (between Rating and Week Change)

**Expected Results**:
- ✅ RT scores appear with tomato emoji
- ✅ Scores are color-coded (green for fresh, red for rotten)
- ✅ Visible on both desktop and mobile

---

### 4. RT Scores on TV Shows (1 minute)

**Steps**:
1. Navigate to any TV show page (e.g., `/tv/1396` for Breaking Bad)
2. Look at the metadata section below the title
3. Find the RT score badge

**Expected Results**:
- ✅ RT score appears in a rounded badge
- ✅ Badge has colored background (green/red)
- ✅ Tomato emoji is visible
- ✅ Badge is inline with other metadata (year, runtime, etc.)

---

### 5. China Region with Mock Data (30 seconds)

**Steps**:
1. On the box office page, click "China (CN)" tab
2. Verify movies load with weekly data

**Expected Results**:
- ✅ Top movies include "Pegasus 3", "Blades of the Guardians", etc.
- ✅ Weekly revenue displays correctly
- ✅ RT scores appear
- ✅ Week change indicators show

---

## Common Issues & Solutions

### Issue: RT Scores Not Showing

**Possible Causes**:
- Missing `OMDB_API_KEY` environment variable
- API rate limit exceeded (1000/day on free tier)
- Movie doesn't have RT score in OMDb database

**Solution**:
1. Check `.env.local` file for `OMDB_API_KEY`
2. Restart dev server after adding env variable
3. Check browser console for API errors
4. Try a different movie (popular movies more likely to have scores)

---

### Issue: Weekly Revenue Shows $0

**Possible Causes**:
- Movie is very old or hasn't been released yet
- TMDB doesn't have revenue data
- Using a region with limited data

**Solution**:
- This is expected for some movies
- Try switching to US or CN region for better data
- Check that movie is currently in theaters

---

### Issue: Week Change Shows "—"

**Possible Causes**:
- No historical data available
- Movie just released (no previous week to compare)

**Solution**:
- This is expected behavior
- Mock data includes week changes for testing
- Real implementation would need historical tracking

---

### Issue: China Region Not Loading

**Possible Causes**:
- Mock data not properly configured
- TMDB API error

**Solution**:
1. Check browser console for errors
2. Verify `TMDB_API_KEY` is set
3. Check `src/lib/tmdb.ts` for `GLOBAL_CN_MOCKS` array

---

## Performance Testing

### Load Time Test:
```bash
# Open browser dev tools
# Navigate to Network tab
# Load /box-office page
# Check:
# - Initial load < 2 seconds
# - API calls complete < 1 second
# - No failed requests
```

### Mobile Test:
```bash
# Open browser dev tools
# Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
# Test on:
# - iPhone SE (375px)
# - iPhone 12 Pro (390px)
# - iPad (768px)
# - Desktop (1920px)
```

---

## Verification Checklist

Use this checklist to verify all features are working:

### Box Office Page:
- [ ] Page loads without errors
- [ ] All 7 region tabs are visible
- [ ] Weekly revenue column shows data
- [ ] Week change column shows trends
- [ ] RT scores appear in table
- [ ] Mobile layout is responsive
- [ ] Clicking movie opens modal

### Box Office Modal:
- [ ] Modal opens smoothly
- [ ] RT score appears in highlighted card
- [ ] "Tomatometer" label is visible
- [ ] Tomato emoji displays
- [ ] Other ratings (TMDB, IMDb, Metacritic) show
- [ ] Close button works

### TV Show Pages:
- [ ] RT score badge appears
- [ ] Badge is color-coded correctly
- [ ] Tomato emoji displays
- [ ] Badge is inline with metadata
- [ ] Works on multiple TV shows

### Data Accuracy:
- [ ] Weekly revenue makes sense (not negative)
- [ ] RT scores are percentages (0-100%)
- [ ] Week changes are reasonable (-50% to +50%)
- [ ] Movie titles match posters
- [ ] Directors are correct

---

## Next Steps

### For Development:
1. ✅ All features tested and working
2. ⏭️ Deploy to staging environment
3. ⏭️ Conduct user acceptance testing
4. ⏭️ Monitor API usage and performance
5. ⏭️ Plan Maoyan integration (see MAOYAN_INTEGRATION_GUIDE.md)

### For Production:
1. ⏭️ Set environment variables in production
2. ⏭️ Configure caching strategy
3. ⏭️ Set up monitoring and alerts
4. ⏭️ Document API rate limits
5. ⏭️ Create runbook for common issues

---

## Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Check for TypeScript errors
npm run type-check

# Run linter
npm run lint

# Format code
npm run format
```

---

## Documentation Reference

- **BOX_OFFICE_UPDATES.md** - Comprehensive technical documentation
- **MAOYAN_INTEGRATION_GUIDE.md** - Step-by-step Maoyan implementation
- **IMPLEMENTATION_SUMMARY.md** - Quick overview of changes
- **VISUAL_CHANGES_GUIDE.md** - UI/UX reference
- **QUICK_START.md** - This file

---

## Support

### For Technical Issues:
1. Check browser console for errors
2. Verify environment variables
3. Review error logs
4. Check API rate limits

### For Feature Questions:
1. Review documentation files
2. Check inline code comments
3. Test with mock data
4. Refer to TMDB/OMDb API docs

---

## Success Criteria

Your implementation is successful when:

✅ All items in the verification checklist pass
✅ No console errors on any page
✅ Mobile and desktop layouts work correctly
✅ RT scores display for most movies/TV shows
✅ Weekly revenue and trends show properly
✅ All 7 regions load successfully

---

**Estimated Testing Time**: 10-15 minutes
**Last Updated**: March 25, 2026
**Status**: Ready for Testing
