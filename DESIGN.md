# MARKD — Design System & Semantic Guidelines
*Version 2.0 • The Cinematic Editorial Standard for Film & Television*

---

## 1. Design Philosophy & Brand Identity

MARKD is an editorial, high-density cinematic entertainment companion designed for passionate cinephiles, casual moviegoers, and television enthusiasts. It unites the visual gravity of a high-end film archive with the effortless discovery and tracking of personal taste.

### Core Principles
- **Cinematic Atmosphere**: Visuals are framed like movie film stills with deep obsidian slate backdrops, rich photography vignettes, and intentional negative space.
- **Editorial Typography**: Track-tight display headings, relaxed body text, and distinct metadata pills with high contrast and zero awkward line-wrapping.
- **Restrained Motion**: Hardware-accelerated transitions (`transform`, `opacity`) using weighted spring physics (`stiffness: 100, damping: 20`). No distracting bouncy blobs or gratuitous animations.
- **Human-Designed & Anti-AI**: Strict ban on generic AI purple gradients, floating neon halos, and repetitive card grids. Every section has an intentional editorial role.
- **Bilingual First-Class**: Seamless layout scaling and font fallbacks across English (`en`) and Taiwan Traditional Chinese (`zh-TW`).

---

## 2. Color System (Obsidian Slate & Pure White)

### Base Canvas & Surfaces
| Token | Hex / Value | Purpose |
|---|---|---|
| `--background` | `#0B0D12` | Deepest canvas background |
| `--background-secondary` | `#11141D` | Secondary panel backgrounds |
| `--background-card` | `#151822` | Card & collection containers |
| `--background-elevated` | `#1B1E2B` | Hover states & elevated controls |
| `--surface-glass` | `rgba(17, 20, 29, 0.82)` | Frosted glass headers & navigation |
| `--border` | `rgba(255, 255, 255, 0.08)` | Standard structural hairpins |
| `--border-hover` | `rgba(255, 255, 255, 0.18)` | Interactive hover borders |

### Typography & Status
| Token | Hex / Value | Purpose |
|---|---|---|
| `--foreground` | `#F4F4F7` | Primary headlines & titles |
| `--foreground-secondary` | `#C5C5D2` | Subheadings & active controls |
| `--foreground-muted` | `#8B8B9F` | Overviews, body text & metadata |
| `--foreground-subtle` | `#57576A` | Captions, dates & borders |
| `--gold-star` | `#EAB308` | TMDB ratings & awards |
| `--success` | `#22C55E` | Watched state & high match scores |
| `--error` | `#EF4444` | Danger zone & destructive actions |

---

## 3. Typography Architecture

- **Display & Titles**: Font stack using modern sans-serif with `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang TC", "Noto Sans TC", sans-serif`. Tight tracking (`letter-spacing: -0.02em`), bold/black weights (`700`–`900`), and `leading-[1.1]`.
- **Body & Overview**: Generous line height (`1.6`), max width 65 characters (`max-w-2xl` to `max-w-3xl`) for effortless reading.
- **Metadata & Labels**: Clean, non-colliding font sizing (`11px`–`13px`) with `whitespace-nowrap` on all interactive button labels and dropdown items.

---

## 4. Component Standards

### Hero Carousel
- Full-bleed cinematic backdrop with layered horizontal and vertical dark gradients.
- Horizontal metadata pill container: Release year, Star rating, Media type, and DNA tone tags.
- Non-colliding action button row: `Watch Trailer` (Primary solid), `+ Add to Watchlist` / `In Watchlist` (Secondary glass toggle), and `View Details` (Tertiary link).
- Frosted glass arrow navigation and active-expanding pagination dots.

### Movie Cards & Poster Grids
- 2:3 aspect ratio posters with subtle `border border-white/[0.08]` and soft shadow.
- Hover elevation: `translate-y-[-4px]` with slight brightness lift (`brightness-105`).
- Quick actions on hover: Watchlist toggle, Watched toggle, and rating indicator.

### Personal Library
- Multi-tab organization: **Watched (觀影紀錄)**, **Watchlist (想看清單)**, **Favorites (特別珍藏)**, **Ratings (評分清單)**, and **Custom Collections (自訂片單)**.
- Multi-view presentation: Editorial Poster Grid, Compact Grid, and Detailed List view.

### Settings & Data
- **General Preferences**: Cinematic dark theme badge, default region selector (US, TW, GB, JP, KR, FR, DE, CA, AU), trending timeframe toggle, autoplay trailers toggle.
- **Account & Data Sync**: Authenticated profile details, JSON offline library backup export, JSON library restore with progress indicator.

---

## 5. Anti-Patterns (Strictly Banned)
- ❌ **No AI Purple / Neon Glows**: Do not apply saturated violet gradients or glowing halo borders.
- ❌ **No Text Wrapping in Navigation**: Never allow `"TV"` and `"Shows"` or button labels to wrap onto multiple lines.
- ❌ **No Gamification Bloat**: Journeys and Challenges are removed to keep the product focused on cinematic discovery, personal collections, and taste tracking.
- ❌ **No Generic Empty Spinners**: Always use skeleton placeholders or styled feedback indicators.
