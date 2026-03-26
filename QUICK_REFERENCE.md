# Quick Reference Card

## ✅ What's Fixed

### 1. RT Scores on Movie Pages
- **Status**: ✅ WORKING
- **Test**: http://localhost:3000/en/movie/1266127
- **Look for**: 🍅 badge with percentage

### 2. RT Scores on TV Shows
- **Status**: ✅ WORKING
- **Test**: http://localhost:3000/en/tv/1396
- **Look for**: 🍅 badge with percentage

### 3. Box Office Filtering
- **Status**: ✅ WORKING
- **Test**: http://localhost:3000/en/box-office
- **Look for**: Only recent movies (no old titles)

---

## 🎯 Key Features

### Movie/TV Pages Now Show:
- 🍅 Rotten Tomatoes score (Critic)
- ⭐ IMDb rating
- 🎬 TMDB rating
- 📅 Release year
- ⏱️ Runtime

### Box Office Page Now Shows:
- 💰 Weekly revenue (not total)
- 📈 Week-over-week change
- 🍅 RT scores in table
- 🎯 Only current releases (last 3 months)

---

## 🔧 Environment Setup

Required in `.env.local`:
```env
TMDB_API_KEY=your_key_here
OMDB_API_KEY=your_key_here
```

---

## 🚀 Quick Commands

```bash
# Start dev server
npm run dev

# Clear cache if issues
rm -rf .next && npm run dev

# Check for errors
# Open browser console (F12)
```

---

## 📍 Important URLs

- **Home**: http://localhost:3000
- **Box Office**: http://localhost:3000/en/box-office
- **Movie Example**: http://localhost:3000/en/movie/1266127
- **TV Example**: http://localhost:3000/en/tv/1396

---

## 🐛 Quick Fixes

### RT scores not showing?
1. Check `OMDB_API_KEY` in `.env.local`
2. Restart server
3. Check console for errors

### Old movies still appearing?
1. `rm -rf .next`
2. Restart server
3. Check console logs

### Translation errors?
1. Check `messages/en.json`
2. Check `messages/zh-TW.json`
3. Restart server

---

## 📊 What Changed

### Files Modified:
- `src/lib/tmdb.ts` - RT fetching + filtering
- `src/app/[locale]/movie/[id]/page.tsx` - RT display
- `src/app/[locale]/tv/[id]/page.tsx` - Already had RT
- `messages/en.json` - Added translations
- `messages/zh-TW.json` - Added translations

### Files Created:
- `src/lib/box-office-mojo.ts` - Framework
- `src/lib/taiwan-box-office.ts` - Framework
- `CRITICAL_FIXES_IMPLEMENTATION.md` - Guide
- `FIXES_COMPLETED_SUMMARY.md` - Summary

---

## ✅ Deployment Checklist

- [x] RT scores on movies working
- [x] RT scores on TV working
- [x] Box office filtering working
- [x] No compilation errors
- [x] Translations added
- [x] Mobile responsive
- [x] Error handling in place

**Status**: READY TO DEPLOY ✅

---

**Last Updated**: March 25, 2026
