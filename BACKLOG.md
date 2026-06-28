# BACKLOG — Fika Table

Single-tenant fika table for **Stef's Dev Notes** newsletter. Readers "pour a coffee, take a slice" by leaving a kind word for a writer, reader, friend, the host, or "the table." Weekly rounds (12 slices) keep it fresh; the appreciation wall accumulates forever.

**Strategy:** Validate the fika concept with Stef's own readers first. If engagement signals are strong (readers leave appreciations for *each other*, not just the host; returning visitors across rounds), invest in multi-tenant.

---

## Now

### Launch MVP — host seed notes + deploy
MVP is feature-complete. Remaining launch tasks:
- [ ] Run `schema.sql` in Supabase SQL editor (tables, RLS, policies, realtime)
- [ ] Add 4 host seed notes via the UI (CodeLikeAGirl, Marcos, Alex, Elena)
- [ ] Test full flow: submit → ReadModal → confetti → wall → share page
- [ ] Deploy to Vercel
- [ ] Point Substack to deployed URL

**Effort:** S

---

## Next

### Post-launch: measure signal
Ship first, then watch. Key signals to monitor in week 1:
- Do readers leave slices for each other, not just the host?
- Do visitors return across rounds?
- Share rate baseline (what % submit → share?)

No dashboards needed — just watch the wall and check the Supabase table in week 1.

---

### Share page: brand link consistency + footer text wrap (post-ship polish)
Two small CSS fixes.

| # | File | What |
|---|---|---|
| — | `Share.jsx` + `Share.module.css` | "for Stef's Dev Notes" links to Substack URL (not `/`); footer sub-headline doesn't wrap awkwardly |

**Effort:** XS

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
|---|---|---|---|---|
| **Schema not applied / DB not ready on launch day** | High | High | Confirm schema.sql was run in Supabase before deploy |
| Readers only leave slices for the host | Medium | High | Ship, watch wall 1 week |
| **No growth loop — app becomes a "jar of notes"** | High | High | Shareable cards (later) provide v1 distribution test |
| **Separate app friction kills adoption** | Medium | High | Embed widget (later) reduces barrier |
| **Validation skewed toward creators, not readers** | Medium | Medium | Real test is when Stef's readers interact with it |
