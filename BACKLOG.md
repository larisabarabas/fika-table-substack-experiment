# BACKLOG — Fika Table

Single-tenant fika table for **Stef's Dev Notes** newsletter. Readers "pour a coffee, take a slice" by leaving a kind word for a writer, reader, friend, the host, or "the table." Weekly rounds (12 slices) keep it fresh; the appreciation wall accumulates forever.

**Strategy:** Validate the fika concept with Stef's own readers first. If engagement signals are strong (readers leave appreciations for *each other*, not just the host; returning visitors across rounds), invest in multi-tenant.

---

## Now

### Post-submit: open ReadModal (no forced share)
After submitting a slice, open the ReadModal so the user sees their note published — no need to hunt for it on the wall. Share button is one tap away; no auto-opened share sheet.

| # | File | What |
|---|---|---|
| — | `Cake.jsx` | In `handleGive`, on success: `setGiving(null)` + `setReading(result.data)` + `fireConfetti` |

**Effort:** XS

---

## Next

### Share page: brand link consistency + footer text wrap
Two small CSS fixes identified post-ship.

| # | File | What |
|---|---|---|
| — | `Share.jsx` + `Share.module.css` | "for Stef's Dev Notes" links to Substack URL (not `/`); footer sub-headline doesn't wrap awkwardly |

**Effort:** XS

---

### Measure share rate
Before any more share UX investment, know the baseline: what % of submissions result in a share action (copy link / copy text / native share)? Add a simple event if useful.

**Effort:** S

---

## Later

- **Phase 10 — Embed widget** ("What readers are saying" for a writer's Substack). Reduces adoption friction.
- **Phase 11 — Backend wall search** — move `@handle` search from frontend filter to Supabase query once the wall accumulates hundreds of slices.
- **Multi-tenant routing, cross-pub network, weekly automation, spam moderation, theme variants.**
- **Shareable image (OG card)** — render card as PNG via `html-to-image` or Canvas API. If link sharing shows demand but low engagement.

### Design constraint: no algorithmic discovery
Strategic decision validated by feedback: the app will not use charts, leaderboards, or "most appreciated" rankings. Discovery should feel like word of mouth, not a popularity contest.

Anti-patterns (explicitly avoided): trending lists, "top appreciated," popularity-weighted feeds, influencer-boosted discovery.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Readers only leave slices for the host | Medium | High | Ship, watch wall 1 week |
| **No growth loop — app becomes a "jar of notes"** | High | High | Phase 9 (shareable cards) provides v1 distribution test |
| **Separate app friction kills adoption** | Medium | High | Embed widget (Later) reduces barrier |
| **Validation skewed toward creators, not readers** | Medium | Medium | Real test is when Stef's readers interact with it |
