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

### Shipped last round — FIKA-1, FIKA-2, FIKA-3
For reference, not action. Three share-flow tickets from last week's round are done:
- **FIKA-1 (open shareable link in new tab)** — shipped. "Preview link" in `ShareSheet.jsx` opens `/share/:id` with `target="_blank" rel="noopener noreferrer"`.
- **FIKA-2 (downloadable share-card PNG)** — shipped. `ShareSheet.jsx` renders `SharePoster` and captures it via `modern-screenshot`'s `domToPng`, downloads as `fika-slice-{id}.png`.
- **FIKA-3 (resolve competing CTAs on `/share/:id`)** — shipped, resolved differently than either originally-proposed option. Neither "Subscribe primary" (A) nor "Pass a slice primary" (B) was picked — instead a third action, **"Copy note & open Substack,"** was added and made the sole primary (`.cta`, solid) CTA. Both "Pass a slice to someone" and "Subscribe to @handle" were demoted to secondary/ghost (`.subscribe`) style. So there is exactly one primary CTA, per the acceptance criteria — just not the one either option anticipated.
  **Revisit when:** click data exists on `/share/:id`. Open question: does "Copy note & open Substack" actually out-convert what a Subscribe-primary or Pass-a-slice-primary page would have done? No data yet either way.

---

### Share-card preview inside the read modal (FIKA-4) — reconsider before building
**Problem as originally scoped:** no way to see the share card without leaving `/cake` — the only render of `SharePoster` lives inside `ShareSheet.jsx`'s `.captureStage`, which is `position: fixed; left: -9999px` (offscreen, built purely to rasterize for the FIKA-2 PNG download, never shown to the user).

**Why this is now lower priority than it looks:** the original rationale was "auto-opening `/share/:id` on card click would hijack read-modal browsing, so give an inline 'see before you send' preview instead." But FIKA-1's shipped "Preview link" button already does exactly that — one click opens the live `/share/:id` page in a *new tab*, so `/cake` stays put and nothing is hijacked. The core need ("see before you send" without losing your place) is already met. What's left for FIKA-4 to add is narrower than originally framed: skipping a tab-open/page-load in exchange for a thumbnail rendered inline — a friction reduction, not a missing capability.

**Trigger to pick this up:** evidence that people aren't using "Preview link" (or are confused by it), or direct feedback that a new tab is too much friction before sharing. Absent that signal, treat as optional polish, not a next-up gap.

**Effort if built:** S — cheaper than originally scoped, since the render logic already exists (`SharePoster`, proven via the download path); it would just need to become visible instead of off-screen.

---

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

### Customizable share-card templates — deprioritized, don't build yet
2-3 template options for the downloadable share card (current default + a bolder/quote-forward variant + a minimal one).

**Why not now:** reviewed with ux-critic and product-owner. This optimizes a funnel (share-card variety) before the funnel itself is validated — no confirmed signal yet that the download gets used, that the new "Copy note & open Substack" CTA on `/share/:id` converts, or that readers share at all. Building template variety now is design effort on a problem that isn't confirmed to exist.

**If revisited later:**
- Placement: the picker belongs in `ShareSheet` at download time, **not** the give flow — `GiveModal` already stacks five decisions before submit, and bolting a template choice onto composition time undercuts the "one kind word, low friction" premise.
- Trigger: replace "meaningful download usage" (a soft "never" — there's no analytics dashboard, no threshold, no owner watching for it) with something concrete and checkable, e.g. "≥10 logged downloads" or explicit "I wish it looked different" feedback from testers — not a vibe.
- Each added template multiplies the text-wrapping/legibility QA surface (2–1000 char messages) — budget for 2-3x the QA, not +1.

**Effort:** L

---

### Rich text in the message field (bold / italic / quotes)
Not recommended for now; keep here with rationale so it doesn't get re-proposed without re-litigating.

**Why deprioritized:**
- Runs against the "one kind word" framing — a formatting toolbar invites composing, not blurting.
- Adds a sanitization surface on an anonymous, unauthenticated insert path; formatted content would need to render consistently across three targets: wall card, read modal, and the share-card image.
- No signal yet that plain text is a blocker.

**Re-open condition:** multiple testers explicitly ask for formatting, or messages visibly break without it (e.g. pasted markdown rendering as literal asterisks).

---

### Copy branded image to clipboard (Share-on-Substack flow)
Use the Clipboard API (`navigator.clipboard.write` + `ClipboardItem`) to copy the branded PNG itself — not just text — so pasting into Substack Notes drops the image directly, instead of a plain-text link.

**Why deferred:** the current "Copy note & open Substack" button doesn't even have solid feedback for the simple text-copy case yet. Adding an async render (`domToBlob`) + feature detection (`ClipboardItem.supports()`, Firefox lag on PNG clipboard writes) + text/image fallback branching is real added complexity for an unvalidated benefit — no signal yet that Substack Notes readers want an image-first post over text.

**Trigger to pick up:** outreach data shows the Download feature is actually used. Ship as a separate "Copy image" action rather than overloading the existing CTA.

**Effort:** M

---

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
