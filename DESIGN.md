# MARKD — Design System & Semantic Guidelines
*Version 3.0 • The Cinematic Editorial Standard for Film & Television*

---

## 1. Design Philosophy & Brand Identity

MARKD is an editorial, high-density cinematic entertainment companion designed for passionate cinephiles, casual moviegoers, and television enthusiasts. It unites the visual gravity of a high-end film archive with the effortless discovery and tracking of personal taste.

### Core Principles
- **Cinematic Atmosphere**: Visuals are framed like movie film stills with deep obsidian slate backdrops, rich photography vignettes, and intentional negative space. Subtle film grain and layered scrims keep imagery alive while preserving legibility.
- **Editorial Typography**: Track-tight display headings, relaxed body text, and distinct metadata pills with high contrast and zero awkward line-wrapping.
- **Restrained Motion**: Hardware-accelerated transitions (`transform`, `opacity`) using an eased cubic-bezier curve (`cubic-bezier(0.22, 1, 0.36, 1)`). No distracting bouncy blobs or gratuitous animations. Fully respects `prefers-reduced-motion`.
- **Human-Designed & Anti-AI**: Strict ban on generic AI purple gradients, floating neon halos, rainbow progress bars, and repetitive card-only layouts. Every section has an intentional editorial role.
- **Bilingual First-Class**: Seamless layout scaling and font fallbacks across English (`en`) and Taiwan Traditional Chinese (`zh-TW`), the default locale. Chinese UI copy must be natural, Taiwan-standard Traditional Chinese — never machine-translation Englishisms.
- **Accessibility**: Visible `:focus-visible` rings on every interactive element, `role="switch"`/`aria-pressed` state disclosure, keyboard-operable dropdowns, skip-to-content link, and a viewport that allows user scaling.

---

## 2. Color System (Obsidian Slate & Pure White)

### Base Canvas & Surfaces
| Token | Hex / Value | Purpose |
|---|---|---|
| `--background` | `#0A0C11` | Deepest canvas background |
| `--background-secondary` | `#0F1219` | Secondary panel / page backgrounds |
| `--background-card` | `#131722` | Card & collection containers |
| `--background-elevated` | `#1A1F2D` | Elevated controls, menus, inputs |
| `--background-highlight` | `#222838` | Hover fill on elevated surfaces |
| `--border` | `rgba(255, 255, 255, 0.08)` | Standard structural hairpins |
| `--border-hover` | `rgba(255, 255, 255, 0.18)` | Interactive hover borders |
| `--border-active` | `rgba(255, 255, 255, 0.32)` | Focused / active borders |

### Typography & Status
| Token | Hex / Value | Purpose |
|---|---|---|
| `--foreground` | `#F5F5F8` | Primary headlines & titles |
| `--foreground-secondary` | `#C9C9D6` | Subheadings & active controls |
| `--foreground-muted` | `#9090A4` | Overviews, body text & metadata |
| `--foreground-subtle` | `#5C5C70` | Captions, dates & borders |
| `--accent` | `#FFFFFF` | Brand action color — pure white |
| `--accent-muted` | `rgba(255, 255, 255, 0.65)` | Muted brand accents |
| `--gold-star` | `#F5B84B` | TMDB ratings & awards |
| `--success` | `#34D399` | Watched state & high match scores |
| `--warning` | `#FBBF24` | Fallback / caution states |
| `--error` | `#F87171` | Danger zone & destructive actions |
| `--info` | `#38BDF8` | Neutral informational states |

### Elevation & Radius
| Token | Value | Purpose |
|---|---|---|
| `--radius-md` | `0.5rem` | Buttons, inputs, pills |
| `--radius-lg` | `0.75rem` | Cards, modals |
| `--shadow-card` | `0 1px 2px rgba(0,0,0,.4)` | Resting cards |
| `--shadow-elevated` | `0 12px 32px -8px rgba(0,0,0,.6)` | Hovered / modal surfaces |
| `--shadow-poster` | `0 16px 48px -12px rgba(0,0,0,.7)` | Large poster / hero |
| `--shadow-focus` | `0 0 0 3px rgba(255,255,255,.18)` | Focus rings |

---

## 3. Typography Architecture

- **Display & Titles**: `Inter` (Latin) + `Noto Sans TC` (Traditional Chinese), loaded as `--font-sans` / `--font-tc`. Tight tracking (`letter-spacing: -0.02em`), bold/black weights, and tight leading. `.title-cinematic` is reserved for full-bleed hero displays.
- **Editorial Hierarchy**: `.eyebrow` (10px, uppercase, wide tracking) → `.section-title` (24–32px bold) → `.lede` (subheading, muted) for consistent section rhythm across pages.
- **Body & Overview**: Generous line height, constrained measure (`max-w-2xl`–`3xl`) for effortless reading.
- **Metadata & Labels**: 11–13px with `whitespace-nowrap` on all interactive button labels and pills. `:lang(zh-TW)` overrides tune letter-spacing and line-height for CJK rendering.

---

## 4. Components & Conventions

### Section Header (`.eyebrow` + title + optional action)
Every home section uses the `SectionHeader` component: eyebrow label, editorial title, optional description, and an optional right-aligned action slot (tabs, toggle groups, or "See More" links). This replaces ad-hoc headers and gives the page a consistent editorial rhythm.

### Media Rails
Horizontal scrolling rows of `MovieCard` use the `.media-rail` utility: negative-margin edge bleed on mobile, edge fade masks on desktop, `scrollbar-hide`, and touch scroll snap. Prefer rails for discovery, grids for library/collection views.

### Hero Carousel
- Full-bleed cinematic backdrops with crossfade transitions, layered horizontal/vertical scrims, and the `.film-grain` texture.
- Horizontal metadata pill rail: year, rating, media type, and DNA tone tags.
- Action row: `Watch Trailer` (primary), Watchlist toggle, and `View Details` — all localized.
- Auto-advance pauses on hover and under `prefers-reduced-motion`; pagination dots + slide counter; chevrons revealed on group hover/focus.

### Movie Cards
- 2:3 posters with hairline border, resting `shadow-card`, and hover lift + `shadow-elevated`.
- Top-left media-type chip; top-right rating / RT / match-score badges; status badge bottom-anchored.
- Hover reveals a play affordance and cinematic scrim. `MovieCardSkeleton` covers loading states.
- `StatusBadge` labels are localized (`plan_to_watch`, `watching`, `completed`, `dropped`).

### Search Overlay
- ⌘K / `/` keyboard shortcut opens a full-screen overlay.
- Skeleton loading, grouped results (Movies / TV / People), keyboard navigation (↑/↓/Enter), Escape to close.

### Navbar / Bottom Nav / Footer
- Desktop navbar: click-based accessible menus (never hover-only), user menu, active-route underline.
- Mobile: bottom nav with `aria-current`, safe-area padding, hidden on `md+`.
- Consistent token-based surfaces (`glass` where appropriate).

### Personal Library
- Tabs: Watching, Plan to Watch, Completed, Dropped, Rated, and Custom Collections.
- Toolbar: search, sort, and three view modes (editorial grid / compact grid / list table).
- Localized empty states via the shared `EmptyState` / `ErrorState` components.

### Settings & Data
- **General Preferences**: theme badge, default region selector, trending timeframe toggle, autoplay trailers + sound toggles (`role="switch"`).
- **Account & Data Sync**: authenticated profile card, JSON export, JSON restore with progress, and a danger zone (delete account).

---

## 5. Anti-Patterns (Strictly Banned)
- ❌ **No AI Purple / Neon Glows**: Do not apply saturated violet gradients, rainbow DNA bars, or glowing halo borders. Taste/affinity visuals use neutral white fills.
- ❌ **No Text Wrapping in Navigation**: Never allow `"TV"` / `"Shows"` or button labels to wrap onto multiple lines.
- ❌ **No Gamification Bloat**: Journeys and Challenges are removed — no references, routes, actions, or marketing copy remain.
- ❌ **No Generic Empty Spinners**: Always use skeleton placeholders, `EmptyState`, or styled feedback indicators.
- ❌ **No Hardcoded UI Strings**: All user-facing copy lives in `messages/en.json` / `messages/zh-TW.json` (next-intl). Bilingual parity is required for every surface.
- ❌ **No Raw Hex in Components**: Use the tokenized utilities (`bg-background-card`, `border-border`, `text-foreground-muted`, `shadow-elevated`, …) mapped via `@theme inline` in `globals.css`.