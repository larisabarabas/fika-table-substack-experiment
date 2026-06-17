# BACKLOG — Fika Table

## Product
Single-tenant fika table for **Stef's Dev Notes** newsletter. Readers "pour a coffee, take a slice" by leaving a kind word for a writer, reader, friend, the host, or "the table." Weekly rounds (12 slices) keep it fresh; the appreciation wall accumulates forever.

**Strategy:** Validate the fika concept with Stef's own readers first. If engagement signals are strong (readers leave appreciations for *each other*, not just the host; returning visitors across rounds), invest in multi-tenant.

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
- Multi-tenant routing, embed script, cross-pub network, weekly automation, spam moderation, theme variants.

---

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Readers only leave slices for the host | Medium | High | Ship, watch wall 1 week |
| Schema breaks existing slices | Low | High | Default `round=null` to round 0 |
| `friend` type is confusing | Medium | Low | Easy to remove |

---

## Order
**0 → 1 → 2 → 4 → 5 → 6 → 8.** Phase 7 merged into 0.3. Phases 4 and 1 can overlap.
