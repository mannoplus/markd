# Visual Changes Guide

## Overview
This document provides a visual reference for all UI/UX changes made to the box office and TV show features.

---

## 1. Box Office Table - Desktop View

### BEFORE:
```
┌─────────────────────────────────────────────────────────────────────┐
│ #  │ Movie              │ Revenue    │ Budget     │ Rating │ Trend  │
├─────────────────────────────────────────────────────────────────────┤
│ 1  │ [Poster] Movie A   │ $125.5M    │ $80M       │ ⭐ 8.2 │   ↑    │
│    │ Director Name      │            │            │        │        │
└─────────────────────────────────────────────────────────────────────┘
```

### AFTER:
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ #  │ Movie              │ Weekly Revenue │ Budget  │ Rating │ RT    │ Change │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1  │ [Poster] Movie A   │ $45.0M        │ $80M    │ ⭐ 8.2 │ 🍅 85%│ ↑ 5.2% │
│    │ Director Name      │ This Week     │         │        │       │        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Key Changes**:
- ✅ "Revenue" → "Weekly Revenue" with "This Week" label
- ✅ Added RT score column with tomato emoji
- ✅ "Trend" → "Change" with percentage value
- ✅ Color-coded indicators (green for up, red for down)

---

## 2. Box Office Table - Mobile View

### BEFORE:
```
┌─────────────────────────────────────┐
│ 1  [Poster]  Movie Title            │
│              ⭐ 8.2 • 2026          │
│              $125.5M                │
│              Budget: $80M           │
└─────────────────────────────────────┘
```

### AFTER:
```
┌─────────────────────────────────────┐
│ 1  [Poster]  Movie Title            │
│              ⭐ 8.2 🍅 85% • 2026   │
│              $45.0M                 │
│              This Week              │
│              ↑ 5.2%                 │
└─────────────────────────────────────┘
```

**Key Changes**:
- ✅ Added RT score with tomato emoji
- ✅ Weekly revenue with "This Week" label
- ✅ Week-over-week change with trend arrow
- ✅ Removed budget to save space

---

## 3. Box Office Modal - Critical Reception Section

### BEFORE:
```
┌─────────────────────────────────────┐
│ Critical Reception                  │
├─────────────────────────────────────┤
│ ⭐ TMDB User Score    8.2 (1,234)   │
│ IMDb                 8.0            │
│ Rotten Tomatoes      85%            │
│ Metacritic           78             │
└─────────────────────────────────────┘
```

### AFTER:
```
┌─────────────────────────────────────┐
│ Critical Reception                  │
├─────────────────────────────────────┤
│ ⭐ TMDB User Score    8.2 (1,234)   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🍅 Rotten Tomatoes         85%  │ │
│ │                    Tomatometer  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ IMDb                 8.0/10         │
│ Metacritic           78/100         │
└─────────────────────────────────────┘
```

**Key Changes**:
- ✅ RT score in highlighted card (red/green background)
- ✅ Larger font size for RT score
- ✅ "Tomatometer" label added
- ✅ Tomato emoji for visual recognition
- ✅ Moved to top of ratings list

---

## 4. TV Show Detail Page - Metadata Section

### BEFORE:
```
┌─────────────────────────────────────────────────────┐
│ Show Title                                          │
│ Created by: Creator Name                            │
│                                                     │
│ 📅 2024  ⏱️ 45m/ep  📺 3 Seasons (30 ep)  ⭐ 8.5  │
└─────────────────────────────────────────────────────┘
```

### AFTER:
```
┌─────────────────────────────────────────────────────────────┐
│ Show Title                                                  │
│ Created by: Creator Name                                    │
│                                                             │
│ 📅 2024  ⏱️ 45m/ep  📺 3 Seasons (30 ep)  ⭐ 8.5  🍅 92%  │
│                                                      Fresh  │
└─────────────────────────────────────────────────────────────┘
```

**Key Changes**:
- ✅ RT score badge added to metadata row
- ✅ Green background for "Fresh" (≥60%)
- ✅ Red background for "Rotten" (<60%)
- ✅ Tomato emoji included
- ✅ Seamlessly integrated with existing metadata

---

## 5. Box Office Client - Page Header

### BEFORE:
```
┌─────────────────────────────────────┐
│ Top 10 at the Box Office            │
│ Real-time tracking for United States│
└─────────────────────────────────────┘
```

### AFTER:
```
┌─────────────────────────────────────────────┐
│ Top 10 at the Box Office                    │
│ Real-time tracking for United States        │
│ • Weekly Box Office                         │
└─────────────────────────────────────────────┘
```

**Key Changes**:
- ✅ Added "• Weekly Box Office" indicator
- ✅ Clarifies data timeframe for users

---

## 6. Color Coding Reference

### Week-over-Week Changes:
```
↑ +5.2%  → Green (#10b981)   - Positive growth
↓ -3.1%  → Red (#ef4444)     - Decline
— 0.0%   → Gray (#6b7280)    - No change
```

### RT Score Status:
```
🍅 85% Fresh   → Green background (#10b981/10)
                 Green text (#10b981)
                 
🍅 45% Rotten  → Red background (#ef4444/10)
                 Red text (#ef4444)
```

### Revenue Display:
```
$45.0M         → Emerald (#10b981) - Weekly revenue
This Week      → Muted gray - Label
```

---

## 7. Responsive Breakpoints

### Desktop (≥768px):
- Full table with all columns visible
- RT scores in dedicated column
- Week change with icon and percentage
- Larger poster images (h-16)

### Mobile (<768px):
- Compact card layout
- RT score inline with TMDB rating
- Weekly revenue prominently displayed
- Smaller poster images (h-20)
- Trend indicator below revenue

---

## 8. Typography & Spacing

### Box Office Table:
```
Movie Title:     font-bold, truncate
Director:        text-xs, text-foreground-muted
Weekly Revenue:  font-mono, font-bold, text-emerald-400
"This Week":     text-[10px], uppercase, tracking-wider
RT Score:        text-xs, font-bold
Week Change:     text-xs, font-semibold
```

### Box Office Modal:
```
RT Score:        text-lg, font-black
"Tomatometer":   text-[10px], uppercase, tracking-wider
Section Title:   text-xl, font-bold
```

### TV Show Page:
```
RT Badge:        px-2.5, py-1, rounded-full
RT Score:        font-bold
Metadata:        text-sm, font-medium
```

---

## 9. Animation & Transitions

### Table Rows:
```css
.slide-up {
  animation: slideUp 0.3s ease-out;
  animation-delay: calc(index * 60ms);
}
```

### Hover States:
```css
.movie-row:hover {
  transform: translateY(-2px);
  border-color: var(--border-hover);
  box-shadow: var(--shadow-elevated);
}
```

### RT Score Badge:
```css
.rt-badge {
  transition: all 0.2s ease;
}

.rt-badge:hover {
  transform: scale(1.05);
}
```

---

## 10. Accessibility Features

### Screen Reader Support:
```html
<span role="img" aria-label="Rotten Tomatoes">🍅</span>
```

### Keyboard Navigation:
- All movie cards are focusable buttons
- Tab order follows visual hierarchy
- Enter/Space to open modal

### Color Contrast:
- Fresh green: #10b981 (WCAG AA compliant)
- Rotten red: #ef4444 (WCAG AA compliant)
- All text meets minimum contrast ratios

---

## 11. Loading States

### Box Office Table Skeleton:
```
┌─────────────────────────────────────┐
│ ▓▓▓  ▓▓▓▓▓▓▓▓▓  ▓▓▓▓▓  ▓▓▓▓  ▓▓▓  │
│ ▓▓▓  ▓▓▓▓▓▓▓▓▓  ▓▓▓▓▓  ▓▓▓▓  ▓▓▓  │
│ ▓▓▓  ▓▓▓▓▓▓▓▓▓  ▓▓▓▓▓  ▓▓▓▓  ▓▓▓  │
└─────────────────────────────────────┘
```

### Modal Loading:
```
┌─────────────────────────────────────┐
│                                     │
│          ⟳ Loading...               │
│                                     │
└─────────────────────────────────────┘
```

---

## 12. Error States

### RT Score Unavailable:
```
┌─────────────────────────────────────┐
│ Rotten Tomatoes    Available via    │
│                    OMDb API          │
└─────────────────────────────────────┘
```

### No Weekly Data:
```
Weekly Revenue: —
```

### Failed to Load:
```
┌─────────────────────────────────────┐
│ ⚠️ Failed to load box office data   │
│    Please try again later           │
└─────────────────────────────────────┘
```

---

## 13. Icon Reference

### Icons Used:
- ⭐ (Star) - TMDB rating
- 🍅 (Tomato) - Rotten Tomatoes score
- ↑ (TrendingUp) - Positive change
- ↓ (TrendingDown) - Negative change
- — (Minus) - No change
- 📅 (Calendar) - Release date
- ⏱️ (Clock) - Runtime
- 📺 (TV) - Seasons/Episodes

### Icon Sizes:
- Table: h-3 w-3 to h-4 w-4
- Modal: h-5 w-5
- Metadata: h-4 w-4

---

## 14. Data Formatting Examples

### Currency:
```
$1,234,567,890  → $1.2B
$123,456,789    → $123.5M
$1,234,567      → $1.2M
$12,345         → $12K
$0              → —
```

### Percentages:
```
+5.234%  → +5.2%
-12.567% → -12.6%
0.000%   → —
```

### Dates:
```
2026-03-25 → 2026 (year only in table)
2026-03-25 → March 25, 2026 (full in modal)
```

---

## 15. Component Hierarchy

```
BoxOfficeClient
├── Region Tabs
├── BoxOfficeTable
│   ├── Desktop Layout
│   │   ├── Rank
│   │   ├── Movie Info (Poster + Title + Director)
│   │   ├── Weekly Revenue
│   │   ├── Budget
│   │   ├── Rating (TMDB)
│   │   ├── RT Score
│   │   └── Week Change
│   └── Mobile Layout
│       ├── Rank + Poster
│       └── Info (Title + Ratings + Revenue + Change)
├── BoxOfficeChart
└── BoxOfficeModal (on click)
    ├── Hero Section
    ├── Financial Performance
    ├── Critical Reception (with enhanced RT display)
    ├── Cast & Crew
    └── Additional Details
```

---

**Last Updated**: March 25, 2026
**Design System**: Follows existing MARKD design tokens
**Accessibility**: WCAG 2.1 AA compliant
