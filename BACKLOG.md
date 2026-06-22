# BACKLOG — Fika Table

## Product
Single-tenant fika table for **Stef's Dev Notes** newsletter. Readers "pour a coffee, take a slice" by leaving a kind word for a writer, reader, friend, the host, or "the table." Weekly rounds (12 slices) keep it fresh; the appreciation wall accumulates forever.

**Strategy:** Validate the fika concept with Stef's own readers first. If engagement signals are strong (readers leave appreciations for *each other*, not just the host; returning visitors across rounds), invest in multi-tenant.

### Validation learnings (June 2026 — Substack note replies)
| Insight | Impact on product |
|---|---|
| Core hypothesis confirmed: people agree "kind words" are a stronger signal than subscribes | Keep differentiation — lean into *why*, not *what* |
| But adoption friction is the #1 open question | Embed/widget path moves up priority; reduce steps to participate |
| "Top" is gamed by influencers — friend-level trust is the real moat | Anti-gaming is a feature, not just hygiene; "friend" recommendation mechanic is the brand |
| No growth loop = risk of being a "jar of notes" | Need a v1 distribution experiment (shareable cards) |
| The app itself is the experiment | Ship small, watch whether appreciation drives any measurable growth |

---

## Now

### Phase 0: Foundation — database, config, data layer
Prerequisite for everything else. Deploy before any UI work.

| # | File | What |
|---|---|---|
| 0.1 | `supabase/schema.sql` | Add `round` column to `slices` (int); change idx CHECK to 0..11; drop single UNIQUE on `idx`, add `UNIQUE (round, idx)`; add `friend` to `to_type` CHECK; new table `cake_config(round int, round_size int default 12)`; update RLS for `'friend'`; add publication for `cake_config` |
| 0.2 | `src/config.js` | Rewrite all copy to fika; `sliceCapacity` 30→12; remove `age`; add `friend` to `TO_NAME_FALLBACK` and `TYPE_LABEL`; update `host` label |
| 0.3 | `src/hooks/useSlices.js` | Fetch `cake_config`; subscribe to realtime on both tables; derive `currentRound`, `roundSize`, `takenThisRound`; `insertSlice` sends `round`; handle `(round, idx)` conflicts; expose `freshCake` callback; `nextFreeIdx` searches 0..roundSize-1 |

**Effort:** M

---

## Next

### Phase 1: Welcome page rebrand
| # | File | What |
|---|---|---|
| 1.1 | `index.html` | Title → "Pull up a chair — a slice, a coffee & a word"; meta + OG tags |
| 1.2 | `src/pages/Welcome.jsx` | CSS coffee cup (mug + handle + coffee + foam + saucer + steam); eyebrow "Take a fika"; headline "Pull up" / "a chair"; fika lede; date pill "Fresh cake every week"; CTA "Pour a coffee, take a slice →" |
| 1.3 | `src/pages/Welcome.module.css` | Coffee cup styles + `@keyframes rise`; remove candle CSS; keep radial glow |
| 1.4 | Check `BdcFlame` usage | Remove when BdcRound no longer imports it (Phase 4) |

**Effort:** M

### Phase 2: Cake page rebrand (no coffee mode)
| # | File | What |
|---|---|---|
| 2.1 | `src/pages/Cake.jsx` | MODES: 'round' + 'cards'; fika copy everywhere; progress "{n} / {roundSize} this week"; "Take a slice" button; fresh-cake banner; fika footer |
| 2.2 | `src/pages/Cake.module.css` | Minor tweaks |
| 2.3 | `src/components/cake/SlicePicker.jsx` | Remove `BdcTiered`; only BdcRound + BdcCards |

**Effort:** M

### Phase 4: Round medallion rebrand
| # | File | What |
|---|---|---|
| 4.1 | `src/components/cake/BdcRound.jsx` | Remove BdcFlame + MINI_COLORS + mini candles; mini CSS coffee cup + "fika" script + new sub-line |
| 4.2 | `src/components/cake/BdcRound.module.css` | Replace candle styles with `.medCup`/`.medFika`; mini coffee cup CSS |

**Effort:** S

### Phase 5: Give modal — fika copy + friend type
| # | File | What |
|---|---|---|
| 5.1 | `src/components/modals/GiveModal.jsx` | 5 TYPE_OPTS (writer/reader/friend/host grid + anyone full width); default 'anyone'; placeholders; "Take the slice" button; "Foam" label; "Pour a coffee, take a slice" title |
| 5.2 | `src/components/modals/modals.module.css` | `.typeFull` style (grid-column: 1 / -1) |

**Effort:** S

### Phase 6: Appreciation wall rebrand
| # | File | What |
|---|---|---|
| 6.1 | `src/components/wall/AppreciationWall.jsx` | Filters: "Everyone" / "Passed to someone" / "Left on the table"; lede; empty state |

**Effort:** S

### Phase 9: Shareable appreciation card (growth loop v1)
Ship alongside the rebrand to test whether appreciation drives any subscription traffic.

**Approach:** Start with Option A (link) + D (text) — lowest effort, tests if people want to share at all before investing in images or serverless.

| # | File | What |
|---|---|---|
| 9.1 | `src/components/modals/ReadModal.jsx` | Add "Share" button that opens a share sheet with "Copy link" + "Copy as text" (and native Share API on mobile) |
| 9.2 | New page `src/pages/Share.jsx` | Route `/share/:id` — renders a minimal, centered appreciation card with note, names, color band, "Subscribe to [handle]" link, and "Leave your own note" back-link |
| 9.3 | `src/App.jsx` | Add route `/share/:id` → `Share.jsx` |
| 9.4 | New component `src/components/share/ShareSheet.jsx` | Inline share UI: Copy link, Copy as text, and native Share |

**Share card layout (route `/share/:id`):**
```
┌─────────────────────────────┐
│                             │
│  ┌───────┐                  │
│  │ color │                   │
│  │ band  │                   │
│  └───────┘                  │
│                             │
│  "Your words made my week"  │
│                             │
│  — Stef → @writerhandle     │
│                             │
│  [Subscribe to writer]      │
│  [Leave a kind note →]      │
│                             │
└─────────────────────────────┘
```

**Future share options (deferred):**
| Option | Approach | When |
|---|---|---|
| **B — Shareable image** | Render card as PNG via `html-to-image` or Canvas API | If link sharing shows demand but low engagement |
| **C — Dynamic OG image** | Serverless function to generate Open Graph image per slice | If cross-platform visibility becomes important |

**Effort:** M

### Phase 8: Polish & Cleanup
| # | File | What |
|---|---|---|
| 8.1 | `src/styles/tokens.css` | `--coffee-fill` variable; "Foam pastels" comment |
| 8.2 | Remaining CSS | Remove stale candle/birthday/thirty references |
| 8.3–8.4 | Remove BdcFlame, BdcTiered files | Dead code |
| 8.5 | `.env.example` | Update app name |

**Effort:** S

---

## Later
- **Phase 3 — Coffee cups (`BdcCoffee`)** — full grid with steam. Deferred until validation.
- **Phase 10 — Embed widget** ("What readers are saying" for a writer's Substack). Reduces friction concern.
- Multi-tenant routing, cross-pub network, weekly automation, spam moderation, theme variants.

### Design constraint: no algorithmic discovery
Strategic decision validated by feedback: the app will not use charts, leaderboards, or "most appreciated" rankings. Discovery should feel like word of mouth, not a popularity contest.

Alternative discovery mechanics (for multi-tenant / beyond single-newsletter):
| Mechanic | How it works | When |
|---|---|---|
| **Share-driven** (Phase 9) | Someone shares an appreciation card → their followers see it → click through to the writer | MVP — building now |
| **Follow-network** | "See what [person you trust] appreciates" — discovery through people you already follow | Deferred until multi-tenant validation |
| **Curiosity browsing** | Unranked directory of writers by topic — browse without scores | Deferred |
| **Search** | Relevance-matched results from appreciation note content | Deferred |

Anti-patterns (explicitly avoided): trending lists, "top appreciated," popularity-weighted feeds, influencer-boosted discovery.

---

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Readers only leave slices for the host | Medium | High | Ship, watch wall 1 week |
| Schema breaks existing slices | Low | High | Default `round=null` to round 0 |
| `friend` type is confusing | Medium | Low | Easy to remove |
| **No growth loop — app becomes a "jar of notes"** | High | High | Phase 9 (shareable cards) provides v1 distribution test |
| **Separate app friction kills adoption** | Medium | High | Embed widget (Later) reduces barrier; Phase 9 helps writers distribute externally |
| **Validation skewed toward creators, not readers** | Medium | Medium | Real test is when Stef's readers interact with it |

---

## Order
**0 → 1 → 2 → 4 → 5 → 6 → 9 → 8.** Phase 7 merged into 0.3. Phase 9 (shareable cards via link + text) inserted before polish to test the growth loop early. Future share options (B/C) deferred until link sharing data is available. Phases 4 and 1 can overlap.
