# MARKD — AI Integration & Bilingual Design
*Version 1.0 • The AI is not a feature next to MARKD. The AI is a feature of MARKD.*

> Product & UX concept for making AI a native, quiet layer of MARKD — structured visual responses,
> product-component-driven, woven into library/search/details — fully bilingual
> (English + Taiwan Traditional Chinese, default `zh-TW`).

---

## 1. Product Vision

MARKD's AI is not a chatbot. It is **the library thinking back**.

When a user asks "what should I watch next?" the answer must feel the way it would feel if a
knowledgeable friend who knows your shelf looked at it and said *"Quiet and emotional, like the
films you love most. This one sits with you long after it ends."* — except the friend is the app
itself, using the exact same cards, buttons, and typography as everywhere else.

Three commitments:
1. **It belongs here.** No chat bubbles, no foreign card styles, no third-party personality.
2. **It shows, it doesn't tell.** Responses are poster cards, reasons, and actions — never prose dumps.
3. **It speaks the user's language.** Fully bilingual in every surface, including AI-generated text.

---

## 2. Current State & Gap

| Surface | Today | Target |
|---|---|---|
| `/ai` page + `AiChatBox` | Dedicated chat window with text + a few `recommendations` cards | Integrated companion surface; same engine, no "window" framing |
| `ChatMessage.recommendations` | Has `matchScore`, `matchReason` — plain | Structured blocks: interpretation, cards, reasons, refine, follow-up |
| `SearchOverlay` | TMDB only | Ask AI mode that renders the same structured blocks |
| Library | No AI presence | Inline nudges, smart-section headers, empty-state invitations |
| `taste-engine.ts` | DNA classifier (movie → traits) | Grounding source for "matches your taste" reasons |
| Locale | `messages/en.json` + `zh-TW.json` (parity checked) | Same parity enforced for every AI string; AI output language follows `useLocale()` |

The existing DNA classifier (`emotional`, `slowBurn`, `mindBending`, `sciFi`, …) is the backbone
for honest match reasons — the AI never invents a connection that isn't grounded in the data.

---

## 3. Integration Surface Map

AI appears **in context**, never only in a window (brief Rule 4):

1. **Search overlay → Ask AI mode.** The same bar as Discover/Library; structured blocks below.
2. **Library inline nudges.** A gentle one-line suggestion above a shelf ("Revisit these quiet
   sci-fi films you loved?") that expands into cards on tap.
3. **Smart section headers.** "Recently Watched" can carry an AI subtitle like *"You rewatched
   three films last month — a good month for comfort."*
4. **Empty states.** "Your watchlist is a blank screen." + sample query chips instead of dead text.
5. **Film detail page.** A "Why this may fit you" strip, grounded in rated films and the DNA engine.
6. **`/ai` companion.** The one place for long, continuing conversations — but rendered with the
   same card-based blocks, not a messaging window.

The rule: **if the answer can be shown, it is shown with product components.**

---

## 4. AI Response Architecture

Every film-bearing response follows the same five-part flow:

```
  1  INTERPRETATION   (subtle, one line, editable via chips)
  2  RECOMMENDATION   (poster cards grid — MovieCard-grade, no chat styling)
  3  MATCH REASONS    (one honest sentence per card)
  4  ACTIONS          (inline: watchlist / watched / favorite / rate / list / details / dismiss)
  5  REFINE + FOLLOW-UP (chips, then a continuing input)
```

### 4.1 Interpretation line
- One quiet sentence restating what the AI understood.
- EN: *"Films like Arrival — thoughtful sci-fi, emotional, visually quiet."*
- ZH-TW: *「類似《異星入境》的作品——深思型科幻、情感細膩、畫面安靜。」*
- It is **collapsible** (power users skip it) and carries the refine chips (see 4.5).
- Never phrased as "I detected from your viewing history…".

### 4.2 Recommendation cards
- Use the existing `MovieCard` anatomy (poster 2:3, title, year, runtime, genre) plus a
  **match-reason strip** and an **action rail**. Not a new "AI card".
- Runtime formatted per locale: `2h 49m` / `2小時49分`. Genres localized: `Sci-Fi` / `科幻`.
- Grid density: 2 columns mobile, 3 desktop inside the response block — tighter than a shelf so it
  reads as *results*, not a wall.

### 4.3 Match reasons (the "why")
One sentence, grounded in real data. Sources, in priority order:
1. **Direct relation:** "Because you loved *Arrival*." / *「因為你喜歡《異星入境》。」*
2. **Your data:** "You rated *Contact* highly — this explores similar themes." /
   *「你給《接觸未來》高分——這部探討相似主題。」*
3. **Constraint:** "Under two hours. Emotional. Visually stunning." / *「兩小時內。情感濃烈。畫面絕美。」*
4. **History:** "From your watchlist — you saved this three months ago." /
   *「來自你的待看清單——三個月前收藏的。」*
5. **Taste (DNA engine):** "Matches your taste: slow-burn, character-driven." /
   *「符合你的品味：慢火細燉、以人物為核心。」*

Rules: one sentence, no lists-in-sentences, never "Based on your viewing history, I recommend…".

### 4.4 Actions
Every card has an action rail, one tap, no modal detour:
`＋ Watchlist · ✓ Watched · ♥ Favorite · ★ Rate · Folder Add-to-list · ↗ Details · ✕ Not interested`
On mobile, actions collapse into a single "⋮" sheet; `✕` always available to retrain quietly.

### 4.5 Refine + follow-up
Chips that re-run with an edited interpretation: **Mood · Length · Genre · Watched/Unwatched ·
Source (library / discover)**. Below the block, a compact follow-up input with the last suggestion
style: *"Not so dark — and under two hours."* / *「不要那麼沉重，而且兩小時以內。」*

### 4.6 Progressive depth (Rule 5)
- **First response:** cards + short reasons. Never more.
- **"Tell me more" / "Why this one?"** on a card → expands *in place* to a small, themed panel:
  themes, tone comparisons, connection to their watch history. Content stays ≤ 2 short paragraphs.
- No "load everything" front-loading.

---

## 5. Visual Integration Rules (as implemented)

| Rule | Implementation |
|---|---|
| 1. Product components | Only `MovieCard`, `SectionHeader`, `EmptyState`, chips, `Link` — a `RecommendationBlock` composer, no bespoke styles |
| 2. No chat bubbles | Responses are full-width blocks with a hairline divider, left-aligned like shelf content; the *user's* query is a small `eyebrow`-style label, not a bubble |
| 3. Blend into library | "Show me my top-rated sci-fi" renders as a filtered shelf with a one-line header — indistinguishable from browsing to it |
| 4. Contextual placement | AI lives on all six surfaces from §3; no surface is a "chat window" except the companion's deep-thread mode |
| 5. Progressive depth | Cards first; reasoning on demand |

Visual character: obsidian background, hairline borders, `shadow-card` resting states,
`shadow-elevated` on hover, `cubic-bezier(0.22,1,0.36,1)` motion, `.fade-in` between blocks.
No purple gradients, no glowing halos, no "robot" iconography — the sparkle ✦ glyph is the only
AI marker, used sparingly.

---

## 6. Tone & Voice

**Voice: a calm, knowledgeable friend who loves film.**

| Good | Bad |
|---|---|
| "Quiet and emotional, like the films you love most." | "Based on your viewing history, I recommend the following titles." |
| "This one sits with you long after it ends." | "Here are 5 movies similar to Arrival!" |
| "You haven't watched this yet — it's been on your list since March." | "Sure! I'd be happy to help you find a movie!" |
| 安靜而深沉，像你最愛的那類電影。 | 根據您的觀看歷史，我推薦以下片單。 |
| 看完之後，會在你心裡停留很久。 | 這裡有 5 部與《異星入境》相似的電影！ |

Guardrails: never generic-assistant, never enthusiastic-chatbot, never critic-lecturing, never
over-personal ("you seem sad today"). Rewatch/month references are facts from data, not judgments.

---

## 7. Localization Architecture

### 7.1 Rules (from the brief, made concrete)
1. **Every UI string** lives in `messages/en.json` / `messages/zh-TW.json`; parity is enforced
   (`missing en→zh: []`, `missing zh→en: []`) before ship.
2. **AI output language** = `useLocale()` of the requesting session. `zh-TW` ⇒ Taiwan Traditional
   Chinese; **never Simplified, never English fallback**.
3. **Personal content** (notes, reviews, list names, `watched_with`) is never auto-translated.
4. **Language switching** at any time: UI flips instantly; future AI turns follow the new locale;
   history and personal content stay untouched.
5. **No mixed-language UI.** No English labels inside the Chinese interface.

### 7.2 AI prompt design (bilingual guarantees)
System prompt must carry, verbatim in spirit:
- `You answer in the user's UI locale (locale passed in context). If locale is zh-TW, write Taiwan Traditional Chinese — never Simplified Chinese, never English.`
- `Localize film titles using the TMDB zh-TW title when available; keep the original in parentheses, e.g. 《銀翼殺手2049》(Blade Runner 2049).`
- `Localize all genre/mood/runtime/date expressions in the response body.`
- `Ground every match reason in the provided user data (ratings, watchlist, watch dates, rewatch counts, DNA traits). Never invent a "you liked X".`
- `Never output a plain-text list of films. Always emit structured recommendation blocks.`

### 7.3 Metadata localization
| en | zh-TW |
|---|---|
| Sci-Fi | 科幻 |
| 2h 49m | 2小時49分 |
| Watched on Jan 15 | 1月15日觀看 |
| rewatched ×2 | 重看 ×2 |

### 7.4 Layout accommodation
Chinese is compact; English runs longer. All action rails and reason lines use `flex-wrap` /
`min-w-0 truncate`, never `whitespace-nowrap` on whole sentences. `:lang(zh-TW)` overrides adjust
letter-spacing and line-height (already in v3 typography).

---

## 8. Grounding & Personalization

Match reasons must be **true**. The grounding layer reads:
- `media_items`: `status`, `rating`, `watched_at`, `rewatch_count`, `favorite`, `mood_tags`,
  `want_to_rewatch`, `comfort`.
- `taste-engine.ts` DNA traits per film (the "matches your taste" source).
- Collection membership (`collection_items`) — "In your Sci-Fi Shelf."

If a claim can't be grounded, the reason falls back to a constraint statement ("Under two hours")
or a general taste match — never a fabricated personal fact. The AI may say
*"I can't ground that — here's what's close"* when the query is too vague, with sample queries.

---

## 9. UX Flows

### 9.1 Search → Ask AI ("I loved Arrival. What should I watch next?")
Type in the bar → intent flips to Ask AI → interpretation line → card grid → reasons → actions →
refine chips → follow-up input. ~20 seconds, never leaves the bar.

### 9.2 Library inline nudge
Shelf header shows a quiet one-liner ("Revisit these quiet sci-fi films you loved?") → tap expands
in place to a `RecommendationBlock`, no page change.

### 9.3 Empty-state invitation
Watchlist empty → "Your watchlist is a blank screen." + chips:
"Try: *a feel-good movie*" / *「試試：一部讓人心情好的電影」* → tapping runs Ask AI inline.

### 9.4 Detail-page "Why this may fit you"
Under the hero: 2–3 cards of similar films with grounded reasons. Non-intrusive, below the fold.

### 9.5 Companion deep-thread
`/ai` retains long conversations, but rendered as flowing blocks (divider-separated), not bubbles;
threads can be resumed and reference the library context.

### 9.6 "Not interested"
`✕` on a card feeds a local negative signal so the same film isn't re-suggested in this thread
(and, optionally, becomes a soft negative for future suggestions).

---

## 10. Microcopy (AI surfaces)

New namespace proposal: `Ai` (used by both overlay Ask AI mode and companion), keeping existing
`AiCompanion` keys where they already exist.

| en | zh-TW |
|---|---|
| Ask AI | 問 AI |
| Interpreting… | 正在理解… |
| Films like {title} — {summary}. | 類似《{title}》的作品——{summary}。 |
| Because you loved {title}. | 因為你喜歡《{title}》。 |
| You rated {title} highly — this explores similar themes. | 你給《{title}》高分——這部探討相似主題。 |
| From your watchlist — saved {n} months ago. | 來自你的待看清單——{n}個月前收藏的。 |
| Matches your taste: {traits}. | 符合你的品味：{traits}。 |
| Not so dark — and under two hours. | 不要那麼沉重，而且兩小時以內。 |
| Tell me more | 想多了解一點 |
| Why this one? | 為什麼推薦這部？ |
| Not interested | 不感興趣 |
| Your watchlist is a blank screen. | 你的待看清單還是一片空白。 |
| Try: a feel-good movie | 試試：一部讓人心情好的電影 |

> Note: the app's existing watchlist label is `想看` (`Library.planToWatch`); the AI copy above
> uses `待看清單` per this brief — keep one canonical term across namespaces to avoid mixed language.

---

## 11. Empty States & Edge Cases (AI-specific)

| Case | Response |
|---|---|
| Query too vague | "Give me a little more to go on." + sample query chips |
| No grounded match | "I couldn't find a close match yet." + mood/source chips to loosen |
| User not signed in | "Sign in to let MARKD learn your taste." (no AI personalization) |
| Provider error | `ErrorState` with "Try again" — never a raw JSON/error dump |
| Language switch mid-thread | New turns in new locale; header note "繼續以繁體中文回覆" |
| Simplified Chinese input | Respond in `zh-TW` regardless; never echo simplified |
| "✕" spam | Soft-negative stored; no visible feedback beyond the card leaving |

---

## 12. Localization Testing Criteria (gate before ship)

- [ ] All AI surface text renders in `en` and `zh-TW`; message parity diff is empty.
- [ ] AI responses generate in the session locale; `zh-TW` never outputs Simplified or English.
- [ ] No English fallback visible in the Chinese interface (string audit + screenshot pass).
- [ ] Dates (`1月15日觀看`) and runtimes (`2小時49分`) follow locale formats.
- [ ] Layouts survive both languages (wrap/truncate audit on action rails + reason lines).
- [ ] Film titles show localized (zh-TW) titles with originals in parentheses where available.
- [ ] Empty states, placeholders, and example queries work in both languages.
- [ ] User-generated content (notes, list names, `watched_with`) is never auto-translated.
- [ ] Language switching updates UI + future AI turns immediately.
- [ ] Reduced-motion: blocks fade without animation.

---

## 13. Design Principles (AI)

**Always**
- Show with product components; reason in one grounded sentence; act in one tap.
- Keep AI placement contextual; keep the sparkle ✦ the only AI marker.
- Match the user's language exactly; keep personal content untouched.
- Let the user go deeper on demand, never dump depth.

**Never**
- Plain-text film lists, chat bubbles, "AI-only" card styles, robot/anime mascots, purple glows.
- "Based on your viewing history, I recommend…" phrasing.
- Fabricated personal connections; simplified Chinese in `zh-TW` mode; English-only features.

---

## 14. Implementation Phases

1. **Phase A — Response architecture:** `RecommendationBlock` composer (interpretation line,
   card grid from `MovieCard`, reason strip, action rail, refine chips, follow-up input);
   bilingual strings; replace prose rendering in `/ai` and `AiChatBox`.
2. **Phase B — Ask AI mode in SearchOverlay:** intent detection (title vs. sentence) +
   Ask AI chip; renders the same `RecommendationBlock`; reuses the existing engine.
3. **Phase C — Contextual placement:** library inline nudges, smart-section headers, empty-state
   sample queries, detail-page "Why this may fit you".
4. **Phase D — Grounding upgrade:** feed `media_items` + `taste-engine` DNA into prompts; "Not
   interested" soft-negative; progressive-depth expand.
5. **Phase E — Bilingual gate:** parity scripts, locale-driven prompt verification (zh-TW spot
   checks for Simplified leakage), layout audit, lint + `next build`, push.

---

## 15. Anti-Patterns Checklist (never ship)

- ❌ Walls of AI prose listing films.
- ❌ Chat-bubble UI anywhere (except the companion's intentionally immersive thread — still block-based).
- ❌ English strings inside the Chinese interface (audit greps for `[A-Za-z]{4,}` in rendered text).
- ❌ AI refusing to speak Traditional Chinese or answering in English.
- ❌ Auto-translating user notes/reviews/list names.
- ❌ New components that don't reuse `MovieCard` / `EmptyState` / v3 tokens.
- ❌ Purple gradients, neon halos, robot avatars, "AI assistant" persona names.