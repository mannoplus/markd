# MARKD — Library & Search Experience
*Version 1.0 • "My personal cinema collection."*

> A private film shelf, not a database. This document defines the complete product & UX design
> for the Library and Search experiences, grounded in the v3 design system (`DESIGN.md`),
> the existing `media_items` model, `LibraryTabs`, `SearchOverlay`, and the Cinema AI companion.

---

## 1. Product Vision

MARKD's library is the place where films stop being titles and become **memories**.

A normal movie database stores rows: title, status, rating. A personal cinema collection
holds *feelings*: the rainy night you watched *Amélie*, the friend who made you watch
*Interstellar* in IMAX, the sci-fi film you return to every year like an old friend.

### What makes this library feel special
- **Every film is a living object.** A poster, a memory, a small constellation of meaning the
  user attached to it — a note, a mood, a rewatch count, who they watched it with.
- **Shelf-first, not table-first.** The user walks their shelves. Nothing about the
  experience ever reads as a spreadsheet.
- **Quiet intelligence.** Smart shelves (Recently Watched, Hidden Gems, Revisit, Stale Watchlist)
  are *derived* from the user's own data — they feel like the collection is alive, not like a
  recommendation engine shouting at you.
- **AI as an extension of the library, not a separate product.** One search bar that knows when
  you're searching, when you're describing a mood, and when you're asking "what should I watch
  next, since I loved *Arrival*?" — and simply adjusts.

### How it differs from a normal movie database
| Database thinking | This product |
|---|---|
| Table rows and columns | Shelves and film objects |
| Filters | Perspectives (Watched, Watchlist, Rated, Mood…) |
| Empty = "no results" | Empty = an invitation ("start your shelf") |
| Search = title match | Search = title, person, mood, or a whole sentence |
| Lists = tags | Lists = curated collections with a personality |
| "Data entry" | "Keeping a film journal" |

---

## 2. Current State & Gap (grounding)

What exists today, and what this design changes:

| Surface | Today | Target |
|---|---|---|
| `/library` | `LibraryTabs` — 6 tabs (watching, plan_to_watch, completed, dropped, rated, lists) | Shelf rail + perspectives + smart shelves |
| Views | Editorial grid, compact grid, **list table** (`<table>`) | Grid, compact grid, **cinematic list rows** (no table) |
| Toolbar | Search-by-title, sort, view toggle | Per-shelf search + sort, view persistence |
| Custom lists | Basic create modal, no film membership UI | Real collections: add/remove films, cover art, order |
| Data (`media_items`) | `status`, `rating`, `season/episode progress` | + `favorite`, `watched_at`, `rewatch_count`, `note`, `mood_tags`, `watched_with`, `seen_in`, `want_to_rewatch`, `comfort` |
| Search | `SearchOverlay` → TMDB multi (Movies/TV/People) | Unified bar: Library · Discover · Ask AI (intent-driven) |
| AI | `/ai` chat + `AiChatBox` (separate surface) | Ask AI mode *feeds the same intelligence* from the search bar |
| Empty states | Generic `EmptyState` copy | Curated, inviting, action-oriented states per shelf |

Constraints honored from v3: bilingual first-class (`en` / `zh-TW`, default `zh-TW`), all strings
in `messages/`, no AI-purple/neon, no raw hex in components, `prefers-reduced-motion` support,
`EmptyState` / `ErrorState` reuse, focus-visible rings everywhere.

---

## 3. Information Architecture

### 3.1 The shelf room metaphor
The library page is a **room of shelves**. A left rail lists the shelves; the main area shows
one shelf at a time. Users can *pin* the shelves they love so the most important ones are always
one tap away.

```
┌────────────────────────────────────────────────────────────────────┐
│  eyebrow: MY CINEMA COLLECTION                                      │
│  title:   My Collection                            [＋ New List]    │
│                                                                     │
│  ┌───────────────┐  ┌────────────────────────────────────────────┐ │
│  │ SHELVES       │  │  SHELF: WATCHLIST        view: [≡][▦][≡]   │ │
│  │───────────────│  │  sort ▾   filter ▾   search ▾   (42 films)  │ │
│  │ ★ All Films   │  │────────────────────────────────────────────│ │
│  │ ● Watchlist   │  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐  │ │
│  │ ● Watched     │  │  │post│ │post│ │post│ │post│ │post│ │post│  │ │
│  │ ● Favorites   │  │  │    │ │    │ │    │ │    │ │    │ │    │  │ │
│  │ ● Rated       │  │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘  │ │
│  │ · …            │  └────────────────────────────────────────────┘ │
│  │────────────────│                                                  │
│  │ SMART          │                                                  │
│  │ ◇ Recently     │                                                  │
│  │ ◇ Revisit      │                                                  │
│  │ ◇ Hidden Gems  │                                                  │
│  │ ◇ Stale List   │                                                  │
│  │────────────────│                                                  │
│  │ COLLECTIONS    │                                                  │
│  │ ○ Sci-Fi Shelf │                                                  │
│  │ ○ Rainy Day    │                                                  │
│  └───────────────┘                                                  │
└────────────────────────────────────────────────────────────────────┘
```

### 3.2 Main shelves (perspectives on the same data — never duplication)
- **All Films** — the whole collection, unified.
- **Watchlist** — `plan_to_watch` (your "next up" shelf).
- **Watched** — `completed` + `dropped`? No — **Watched** = `completed`; **Abandoned** stays separate but quieter.
- **Favorites** — `favorite = true`. Pinned by default; this is the user's identity shelf.
- **Rated** — items with a personal rating > 0.

### 3.3 Smart shelves (derived, read-only, labeled as suggestions)
- **Recently Watched** — `watched_at` within ~30 days, newest first.
- **Ready to Revisit** — `want_to_rewatch = true` OR `rewatch_count > 0` with high rating; a shelf for returning to old friends.
- **Hidden Gems** — high personal rating but low TMDB popularity; the collection's secret treasures.
- **Needs a Rating** — items with no rating yet; an invitation, not a chore.
- **Gathering Dust** — `plan_to_watch` older than ~90 days; gently nudge "still want to see these?"
- **Top of the Collection** — top personal ratings, ordered by rating then rewatch count.

> Smart shelves are **count-stable, quiet, and honest**. They never claim to be magic; a small
> "Auto shelf" glyph (◇) on the rail tells the user these are computed from their own history.

### 3.4 Collections (user-created, permanent, opinionated)
Custom lists, upgraded from the current basic modal:
- A collection has a **name, a short description, and an optional cover** (auto = first film's poster, or a 4-poster mosaic).
- Films can be ordered by hand (drag) or by any sort.
- Privacy: **Personal** (default) / **Public**. Public collections are shareable as a clean link.
- Suggested seed names in the create flow: *Sci-Fi Shelf · Rainy Day Films · Rewatch Forever · Guilty Pleasures*.

### 3.5 Navigation model
- **Desktop:** left rail (collapsible to icons), main area = selected shelf. No tab duplication.
- **Mobile:** rail becomes a horizontal scrollable chip row under the page header (thumb-reach), or a "Shelves" sheet. The chip row is scroll-snapped and `scrollbar-hide`.
- **URL state:** `/library` (All), `/library/watchlist`, `/library/favorites`, `/library/list/{slug}` — deep-linkable and back-button friendly.

---

## 4. Library Layout System

Three density modes. The **mode choice is remembered per shelf** (`localStorage` keyed by shelf id), because browsing Watchlist in grid but managing All Films in list is a real workflow.

### 4.1 Grid ("Shelf Walk")
- Large 2:3 poster cards, 2–6 columns responsive (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`), `gap-6`.
- Built on the upgraded `MovieCard` (see §5.1). Best for browsing and emotional viewing.
- Hover reveals quick actions; no metadata rows.

### 4.2 Compact grid ("Quick Scan")
- Dense poster tiles with no text overlay until focus (title tooltip / subtle label). 3–8 columns.
- One-tap actions on the tile corner (heart, eye). Best for large collections.
- Reuses the current compact rendering, upgraded with the state chips.

### 4.3 List ("Journal")
- **Not a table.** Rows are rich, bordered cards: poster thumbnail (h-14 w-10), title, year,
  runtime, genre, mood tags, personal rating ★, watched date, rewatch count, note preview
  (1 line, italic), status pill, and quick-action icon buttons on the right.
- Row height ~64px; hover raises a subtle background; the title links to details.
- Best for scanning, sorting, and managing.

### 4.4 Switching
A segmented control (identical to today's 3-button toggle) in the toolbar. Layout preference
persists per shelf. Animated fade between modes (`fade-in`), never a jarring remount.

### 4.5 Toolbar (per shelf)
- Search within shelf (title + person + year + mood tags, when available).
- Sort: Added (newest) · Rating (high→low) · Title · Release · Runtime — all already present in `LibraryViews` messages; add **Rewatch count** for Watched shelf.
- Filter chip: All / Movies / TV (reuses `LibraryViews.movies`/`tv`).
- Count in the shelf header ("42 films" via existing `filmsInCollection`).

---

## 5. Film Card System

### 5.1 Primary card anatomy (Grid)
```
┌────────────────┐
│ [Film chip]  ★7.9│   ← media type chip (TL), personal rating / match badge (TR)
│                │
│     POSTER     │   ← 2:3, hairline border, resting shadow-card, hover lift
│  (cinematic     │   ← hover: scrim + play affordance (existing behavior)
│   scrim)        │
│   ♥  ✔  …      │   ← hover quick actions: Favorite, Mark watched, More
│ [STATUS pill]   │   ← bottom-anchored StatusBadge (existing)
└────────────────┘
  Title            ← line-clamp-2, hover→accent
  2016 · 2h49m · Sci-Fi
  rewatched ×2 · Mood: 太空、史詩  ← NEW: subtle personal line
```
Personal metadata is shown in **layers**: always (status), on hover (actions), and optionally
a "personal line" under the title showing the single most meaningful signal (rewatch, note,
mood, watched date) — never all of them at once.

### 5.2 Compact card anatomy
Poster tile + corner chips (♥ if favorite, ✔ if watched, ★N if rated). Text only on focus via a
tooltip, so dense shelves stay clean.

### 5.3 List row anatomy (Journal view)
```
[poster]  Interstellar          2014  2h49m  Sci-Fi  ★9  [已看過]  ♥  … 
          [italic] "第一次IMAX，太空的寂靜讓人心醉"   11 Feb 2026 · rewatched ×2
```

### 5.4 States & how they read
| State | Visual |
|---|---|
| Watchlist | `status` pill `plan_to_watch` (info tone) |
| Watched | `status` pill `completed` (accent-muted tone) + check mark on compact tile |
| Favorite | filled heart ♥, accent-muted; shelf header shows count |
| Rated | gold ★ with the user's score; "Needs a Rating" shelf lists those without |
| Rewatched | "rewatched ×N" pill; shown again on `watched_at` line |
| Dropped | `dropped` pill, muted; never highlighted |

All states localized via `StatusSelector` keys; icons carry `aria-hidden` with text labels for screen readers.

---

## 6. Personalization System (the memory box)

### 6.1 Data model extensions (`media_items`)
Add columns (nullable, no forced onboarding — everything is optional and can be set later):
- `favorite: boolean` (default false)
- `watched_at: timestamptz | null`
- `rewatch_count: int` (default 0)
- `note: text | null` — a diary line, max ~280 chars
- `mood_tags: text[]` — small set: 治癒/溫暖/沉重/刺激/科幻/奇幻/愛情/黑色/經典/放鬆…
- `watched_with: text | null` — "Alex", "myself", "my kids"
- `seen_in: enum ('cinema' | 'home' | null)` — 院線 / 在家
- `want_to_rewatch: boolean`
- `comfort: boolean` — a "comfort film" you return to
- Custom list membership via a join table `collection_items (collection_id, tmdb_id, media_type, position, added_at)`.

### 6.2 Where personalization lives
- **Details page** (primary surface): a "Keep" panel — rate, favorite, status, and the emotional
  fields (note, mood tags, watched with, seen in, rewatch). No forms feel: `mood_tags` are tappable
  chips; note is a single line with placeholder "有什麼想記住的畫面或感覺？…".
- **Quick actions** on cards (heart, eye, rate) for the 90% case.
- **Shelf header** on Favorites/Watched shows a small summary ("12 favorites · 3 rewatched this year").

### 6.3 Rewatch behavior
Marking an already-`completed` item as watched again **increments `rewatch_count`** and updates
`watched_at`. No second row. The "Ready to Revisit" smart shelf is the gentle nudge; the Journal
line "rewatched ×2" is the record.

---

## 7. Search Experience

### 7.1 One bar, three quiet modes
A single search entry point (the existing navbar field + ⌘K / `/` overlay). The bar stays the same;
the experience beneath it shifts by intent. Three tiny **mode chips** appear *after* focus, so the
user never has to decide up front — they are labels, not a maze:

```
[ 🔍  I want a sad movie under two hours…            ⌘K ]
[ Library ▾ ] [ Discover ] [ Ask AI ]
```
- **Library** — search inside the user's own collection (title, person, year, mood tag, note).
- **Discover** — the current TMDB multi-search (Movies / TV / People) against everything.
- **Ask AI** — natural-language interpretation + conversational recommendations, powered by the
  existing Cinema AI backend. Shown with a restrained sparkle icon, never a "robot".

### 7.2 Intent detection (subtle, automatic)
| Typed | Detected | What shows |
|---|---|---|
| `Interstellar` | Library title match (fast) | Direct film card + your state (★9, watched 11 Feb) + people + "Add to…" quick actions |
| `interstellar` (not in library) | Discover | TMDB direct result first, then related |
| `a sad movie under two hours` | Ask AI | Interpretation card + filters + matched films with one-line reasons |
| `I loved Arrival. What should I watch next?` | Ask AI | Recommendation cards with "Because you loved Arrival." |
| `sci-fi I haven't watched` | Ask AI (library-aware) | Watchlist & unseen sci-fi, reasons, refine chips |

Detection heuristics: query is a person or title fragment → Library/Discover; query has verbs,
lengths, moods, or "I loved/anything like" → Ask AI. The user can always override by tapping a mode chip.

### 7.3 Traditional search (Library & Discover)
- Instant: debounced (existing `useDebounce`, 250ms), skeletons, keyboard nav (↑/↓/Enter/Esc) — all current behavior preserved.
- Typo tolerance: `damerau-levenshtein` distance ≤ 2 fallback, or simple prefix + token matching on the client for library titles; TMDB handles the global side.
- Results grouped: **In your library** (first, with watch state) → **Movies** → **TV** → **People**.
- Each library hit shows your rating/status so "did I see this?" is answered at a glance.

### 7.4 Natural-language search (Ask AI)
Rendered as an **interpretation card** — grounding first, then results:
```
┌────────────────────────────────────────────────────────────┐
│ ✦ Interpreting: “I want a sad movie under two hours.”      │
│   mood: 沉重 · length: <2h · status: any · source: all      │
│   [ 加重 ✗ ] [ 改長度 2h+ ] [ 只看片庫 ]                     │
├────────────────────────────────────────────────────────────┤
│  Past Lives (2023) · 1h45m · 愛情/成長       ★8  · from library│
│    "Because it matches your mood: quiet, melancholy, short."  │
│  Aftersun (2022) · 1h42m · 成長              · to watchlist   │
│    "Gentle and devastating — and under two hours."            │
└────────────────────────────────────────────────────────────┘
```
The user can **tap any chip to refine** (mood, length, watched/unwatched, genre, source) — every
refinement re-runs and re-explains. The interpretation card is *collapsible* so power users skip it.

### 7.5 Conversational discovery (Ask AI)
Follow-ups stay in the same thread ("not too long", "and not so dark", "something from my watchlist").
Recommendation cards include a one-line reason (see §8) and always expose the personal dimension
when it exists: "In your watchlist since March."

---

## 8. Search Results & Recommendation UI

### 8.1 Result card anatomy (shared)
```
[poster]  Title (Year)                      [★ your rating] [status pill]
          Runtime · Genres · Mood tags
          “reason line”                     [＋Watchlist] [✔ Watched] [♥] [Details]
```
- Direct results: reason = watch state ("Watched · 11 Feb 2026 · rewatched ×1") or plain metadata.
- AI results: reason is always one honest sentence — never a paragraph.

### 8.2 Explanation patterns (concise, honest)
- "Because you loved *Arrival*." (direct connection to a rated/favorited film)
- "Matches your mood: quiet sci-fi, emotional." (taste/mood match)
- "Under two hours and visually intimate." (constraint match)
- "From your watchlist." (source match)
- "High match with your Favorites." (aggregate, no invented specifics)

### 8.3 Refinement options
Chips: Mood · Length · Genre · Watched/Unwatched · Source (library/discover/all) · Year.
Clicking a chip re-filters results and rewrites the reasons — the model is "you said, we did."

### 8.4 Empty / fallback behavior
If Ask AI can't ground a query (too vague): an invitation card with 2–3 **sample queries**
("Try: “a feel-good movie from my watchlist”" / "「從我的片庫找一部可以重看的科幻片」"), never a dead error.

---

## 9. Empty States & Edge Cases

All empty states are warm invitations, built on the shared `EmptyState` component, with
shelf-specific copy and an action.

| State | Title (en) | Subline + action |
|---|---|---|
| Empty watchlist | "Your watchlist is a blank screen." | "Save films you want to see — start with your favorites." → [Discover films] |
| Empty library | "Your shelf is waiting for its first film." | "Add something you love, and MARKD will remember it." → [Browse Now Showing] |
| Empty Favorites | "No favorites yet." | "Tap ♥ on films that feel like yours." |
| No search results | "Nothing by that name." | "Check spelling, or try describing a mood: “quiet sci-fi I haven't seen”" |
| Ask AI too vague | "Give me a little more to go on." | Sample query chips. |
| No recommendations | "I couldn't find a match yet." | "Try a different mood, or browse your Watchlist." |
| Empty collection | "This collection has no films yet." | "Add films from any shelf or a search result." → [Add from library] |
| Not rated anything | "Your ratings are the story of your taste." | "Rate a few films and watch your shelves come alive." |

New-user onboarding touch: the first visit shows a one-line hero under the title —
"You don't need to organize everything at once. Start with the films you love."
No multi-step wizard, no checklist.

---

## 10. UX Flows

### 10.1 First-time user opening the library
1. Empty shelves, all counts 0. The rail shows Watchlist, Watched, Favorites, Rated + the smart shelves.
2. Hero line reassures; the only strong CTA is "Discover films" which opens Discover, not settings.
3. First film added → toast "Saved to your Watchlist" and the shelf count increments with a micro-scale animation (respecting reduced motion).

### 10.2 Adding a film to watchlist
Card hover → ✔ quick action (or details page "Watchlist" toggle) → status = `plan_to_watch` →
toast → appears under Watchlist. From search result: `[＋ Watchlist]` button on the result row.

### 10.3 Marking as watched
Card hover → ✔ → if previously `completed`, confirm intent subtly: "Rewatch? ✓ Update rewatch count"
(one-tap, non-modal). Sets `status=completed`, `watched_at=now`, optionally increments rewatch.

### 10.4 Rating a film
Card hover → ★N badge → tap to set a score in a small radial popover (0–10). Journal row shows
the ★. Details "Keep" panel persists. The Rated shelf updates instantly.

### 10.5 Creating a personal collection
Shelf rail → `[＋ New List]` (existing modal, upgraded) → name + optional note + privacy →
then "Add films" by toggling cards (multi-select mode) or from a search result's overflow menu.

### 10.6 Searching for a known title
Focus bar → type `Interstellar` → "In your library" card first with your ★/status →
Enter opens details; ↓ navigates; Esc closes. All current keyboard behavior preserved.

### 10.7 Asking a natural-language query
Type a sentence → intent flips to Ask AI → interpretation card + refine chips → results with
reason lines → tap a chip to refine → thread continues for follow-ups.

### 10.8 Asking "I loved X, what next?"
Type `I loved Arrival` → recommendation cards, each with "Because you loved *Arrival*." →
refine by mood/length/status → add to watchlist from the card → done in ~20 seconds, never leaving the bar.

---

## 11. Microcopy (bilingual)

New / updated copy. All strings live in `messages/en.json` / `messages/zh-TW.json` (parity required).

### Section & shelf labels
| en | zh-TW |
|---|---|
| My Cinema Collection | 我的影劇收藏庫 |
| All Films | 全部影劇 |
| Watchlist | 片單（想看） |
| Watched | 已看過 |
| Favorites | 摯愛收藏 |
| Rated | 已評分 |
| Recently Watched | 最近觀看 |
| Ready to Revisit | 想再看一次 |
| Hidden Gems | 滄海遺珠 |
| Needs a Rating | 等你的評分 |
| Gathering Dust | 沉睡的片單 |
| Top of the Collection | 收藏之最 |
| Auto shelf | 自動片架 |

### Toolbar & views
| en | zh-TW |
|---|---|
| Grid · Shelf Walk | 網格 · 漫步片架 |
| Compact · Quick Scan | 精簡 · 快速瀏覽 |
| List · Journal | 清單 · 觀影日記 |
| Search your shelf… | 搜尋你的片架… |
| Sort: Rewatched most | 重看次數（最多） |

### Search modes
| en | zh-TW |
|---|---|
| Library | 我的片庫 |
| Discover | 探索 |
| Ask AI | 問 AI |
| In your library | 在你的片庫中 |
| Interpreting… | 正在理解… |
| Try: “a feel-good movie from my watchlist” | 試試：「從我的片單找一部心情好的電影」 |

### Buttons & actions
| en | zh-TW |
|---|---|
| Add to Watchlist | 加入片單 |
| Mark as watched | 標記為已看 |
| Favorite | 加入摯愛 |
| Add to a collection | 加入片單集 |
| View details | 查看詳情 |
| Rewatch ✓ | 再看一次 ✓ |
| Create New Collection | 建立新片單 |

### Reason lines
| en | zh-TW |
|---|---|
| Because you loved *{title}*. | 因為你喜歡《{title}》。 |
| Matches your mood: {moods}. | 符合你的心情：{moods}。 |
| Under two hours and visually intimate. | 兩小時內，而且視覺上很親密。 |
| From your watchlist. | 來自你的片單。 |
| Watched · {date} · rewatched ×{n} | 已看過 · {date} · 重看 ×{n} |

### Empty states
| en | zh-TW |
|---|---|
| Your shelf is waiting for its first film. | 你的片架正等著第一部作品。 |
| Save films you want to see — start with your favorites. | 把你未來想看的電影存起來，先從喜歡的開始。 |
| Your ratings are the story of your taste. | 你的評分，就是你的品味故事。 |
| Give me a little more to go on. | 再多給我一點線索吧。 |

### Film diary fields
| en | zh-TW |
|---|---|
| Watched with | 和誰一起看 |
| Where did you see it? · Cinema / Home | 在哪裡看？· 戲院 / 家中 |
| A note for this film… | 為這部片留句話… |
| What moods fit this film? | 這部片適合什麼心情？ |

---

## 12. Visual Direction

Mood: **a private screening room** — obsidian, warm white highlights, one glowing poster at a time.

- **Layout language:** shelf rails and section rhythm already in v3. The library page reads like
  a long single scroll of themed shelves on mobile; on desktop the rail gives structure. No floating
  panels, no dashboard cards everywhere.
- **Color:** existing obsidian palette. Add *one* warm accent for "personal" signals: the existing
  `--gold-star` (#F5B84B) for hearts/favorites and the ★, `--success` for watched, `--info` for
  watchlist. **No purple, no neon** (v3 rule).
- **Typography:** `--font-sans` + `--font-tc`. Shelf titles use `.section-title`; the rail uses
  `eyebrow`-scale labels; Journal note lines are `italic` at `foreground-muted`.
- **Motion:** `cubic-bezier(0.22, 1, 0.36, 1)`, transform/opacity only. Shelf changes fade;
  counts tick up; toasts slide. All gated on `prefers-reduced-motion`.
- **Depth:** `shadow-card` at rest, `shadow-elevated` on hover — never drop shadows behind text.
  Poster cards keep the hairline border so posters never float.
- **Film grain & scrims:** reuse `.film-grain` on the library header band; posters keep the hover
  scrim. This is what makes it feel like a cinema, not a store.

---

## 13. Responsiveness & Accessibility

- **Desktop:** rail + large grids; richer Journal rows; hover quick actions.
- **Tablet:** rail collapses to icon rail; grids at 3–4 columns.
- **Mobile:** rail → horizontal chip shelf under the header (scroll-snap, `scrollbar-hide`);
  quick actions move to a long-press or details panel; toolbar wraps; all touch targets ≥ 44px.
- **Accessibility:**
  - Keyboard: rail and tabs are a `tablist`; search keeps ↑/↓/Enter/Esc; modals trap focus and close on Esc.
  - Screen readers: card links carry descriptive labels ("Interstellar (2014), watched, rated 9");
    decorative icons `aria-hidden`; state never conveyed by color alone (every color has a label or icon).
  - Contrast: all copy uses v3 tokens (`foreground`, `foreground-secondary`, `muted`, `subtle`);
    status pills pair text with an icon (♥/✔/★/⟳).
  - Focus: `:focus-visible` rings on every control; skip-to-content link present.

---

## 14. Design Principles

**Always does**
- Puts the poster first; text never outweighs the film object.
- Remembers the user (per-shelf view mode, pinned shelves, thread continuity).
- Explains AI in one honest sentence, grounded in the user's own data.
- Treats every interaction as part of a personal journal.
- Bilingual and accessible by default.

**Avoids**
- Tables, dense dashboards, enterprise chrome.
- AI that looks like a separate product or a magic box.
- Forced organization (no "fill in your moods or you lose them").
- Gamified rewards (no streaks/badges — v3 removed Journeys/Challenges).
- Asking the user to do data entry; every field is optional and deferred.

---

## 15. Implementation Phases

1. **Phase A — Library shells:** shelf rail + perspectives over existing `status`/`rating`;
   cinematic Journal view replaces the `<table>`; per-shelf view persistence. No schema change.
2. **Phase B — Memory box:** schema migrations (`favorite`, `watched_at`, `rewatch_count`,
   `note`, `mood_tags`, `watched_with`, `seen_in`, `want_to_rewatch`, `comfort`); "Keep" panel on
   details; rewatch behavior; Favorites shelf; smart shelves (Recently Watched, Needs a Rating).
3. **Phase C — Collections:** `collection_items` join; card multi-select "add to collection";
   ordering, cover mosaic, privacy/share.
4. **Phase D — Search:** unified bar with mode chips; library-aware search with typo tolerance;
   intent detection; Ask AI mode reusing the existing Cinema AI backend; interpretation cards,
   reason lines, refine chips; empty-state sample queries.
5. **Phase E — Polish:** motion pass, accessibility audit, bilingual parity check
   (`missing en→zh: []`, `missing zh→en: []`), lint + `next build`.

---

## 16. Anti-patterns checklist (never ship)

- ❌ `<table>` in Journal view — use rich rows.
- ❌ "Ask AI" looking robotic (blue/purple glow, robot mascot) — restrained sparkle only.
- ❌ Filter bars that look like spreadsheet column headers.
- ❌ Recommending films with fake authority ("100% match") — use `matchPercent` sparingly, always with a reason.
- ❌ Emotional fields required at any point.
- ❌ Hardcoded copy — every string above belongs in `messages/` in both locales.
