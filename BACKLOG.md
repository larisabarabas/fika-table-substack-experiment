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

### Konditori redesign — what's left (branch `design/konditori-foundation`)
Done on the branch (9 commits before this note, not pushed or merged): marzipan/cocoa palette, Fraunces + Figtree, sentence-case labels, frosting-drip cards (wall, welcome, share), cake ring where available slices are cake, message-first give form, centered welcome with one primary button, share page and poster restyle, "slice lifts off the cake" motion, green favicons and a new `og-image.jpg`. Plan page: https://claude.ai/artifact/HfRpQQrZ5MQWNb7F76VUhj

**Open work**
- [x] Social tags (`og:url`, `og:image`) point to the live address `fika.stefaniabarabas.com`. After release, re-check a pasted link's preview, since Substack and others cache old previews.
- [ ] Open a PR for the branch, then deploy. The new `og-image.jpg` only shows once deployed, and Substack/LinkedIn cache old previews, so re-scrape the link after deploy.
- [ ] Poster PNG: the solid "Pass a slice to someone" button does nothing in an image. Replace it with a plain line of text (for example the site URL) or remove it.
- [ ] `/privacy` page: not reviewed against the new palette and fonts. It inherits the tokens but nobody has looked at it.
- [ ] Read modal: the colored band at the top is still a flat block and it still shows "for a writer" under the message. Give it the frosting edge and decide whether the type line stays.
- [ ] Welcome headline: "Take a slice." is still a different color from the first line (the single-word-accent habit the plan called out). Decide: same color, or keep.
- [ ] Footer copy in `config.js` (`footerSub`) still has a dash: "Pull up a chair whenever you like — there's always more coffee."
- [ ] Docs are stale: `docs/design_handoff_*` and `favicon/README.md` context still describe the rose/Newsreader look. Mark them as superseded or update.
- [ ] Slices from other people arrive on the wall with no animation (`ux-product-gap.md` #8). The new motion only plays for your own slice.

**Not verified yet (check by hand)**
- [ ] Phone: after taking a slice the cake animates but the new wall card may be off-screen; nothing scrolls to it.
- [ ] Drip cards with very long names/handles, one-word messages, and all eight colors at 390px.
- [ ] Give form: Substack name lookup flow after the restructure (`GIVE_MODAL_TEST_PLAN.md` sections A–H, plus the new section I). That file is gitignored, so section I exists only on this machine.
- [ ] Share page with real data (my checks used mocked rows) and a downloaded poster with a long message.
- [ ] Favicon at 16px in a real browser tab, the 48px tile and the ICO. Only the 512px and 32px icons and the social image were looked at.
- [ ] Welcome page gaps were measured at 1360px only; 390px was not re-measured.

**Effort:** S–M

---

### Brainstorm: make receiving a note easier, and reach people on Substack
**The problem:** a reader leaves a kind word for someone, but the person it is for has no way to find out. This is gap #1 in `docs/ux/ux-product-gap.md` (no identity, the loop never closes). It is also the biggest growth question: the recipients are Substack writers, so reaching them where they already are is the distribution channel.

**Questions to answer first**
- Who has to do the telling: the giver, the app, or the host? Anything the app sends on its own needs identity or an email, which we don't have. Anything the giver sends needs to be one tap.
- What does a writer actually see when they are mentioned or sent a link on Substack (Notes, DMs, comments, email)? Verify what is possible rather than assuming; in particular whether Notes can be opened with text already filled in, beyond the current "copy, then paste" step.
- Is the goal "the writer sees it" or "the writer's readers see it"? The second matters more for reaching new people.

**Ideas to explore (none are decided)**
1. **"Tell them" step after giving.** When the giver typed a Substack @handle (the lookup already resolves it), the success screen offers a prefilled note that mentions that handle, one tap to copy and open Substack. Today "Copy note & open Substack" is only on the share page and in the read modal.
2. **A per-person link.** `/table?mentions=@handle` already filters the wall. Present it as "Slices for you", short enough to put in a DM or note, so the recipient sees all their words in one place.
3. **A preview that shows the actual word.** `/share/:id` currently shares the same static `og-image.jpg` for every slice, so a link pasted into Notes or a DM looks identical every time. Generate a per-slice preview image (a Vercel function, using the frosting card) so the link itself carries the kind word.
4. **Copy the image, not just the text** (already in Later). Pair with idea 3 so the Note carries the card.
5. **Writer-side claim.** A writer opens their link, proves they are that handle in the lightest way possible, and gets a view of their slices. Blocked on identity (see the weekly digest item) but is the real fix.
6. **Email fallback.** Optional "email me when someone leaves me a word", with the recipient entering their email on the slices-for-you page. No account, just a notify list. Weigh against the spam and privacy cost.
7. **Embed or badge for a writer's own site.** Phase 10 in Later; reaches readers who don't know the table exists.
8. **Ask the host to amplify.** A weekly "this week at the table" note that the host posts, drafted automatically from the round. It reaches readers without any identity.

**What to decide tomorrow:** which one or two of these to test on Stef's readers first. Suggested order to discuss: 1 and 3 (small, no identity needed), then 2, then 5/6 only if the first signals are strong.

**Decisions so far (flow draft: https://claude.ai/artifact/RWQtyJ2Mcv6VZwsSu3pbo5)**
- Verify the person while typing. A handle that is not found, or a name match the giver has not confirmed, is saved as plain text and never becomes a link.
- After giving, one primary button ("Tell {Name} on Substack") **replaces** the current share row. This is an experiment: Copy link, Download card and Preview link move under "Other ways to share".
- The copied Note contains the profile link, not a typed @handle. The giver reads the exact text first; copy and open Substack happen in one tap.
- Recipient page on its own address (`/note/:id`), no confetti, "Pass a slice back" only when the giver signed.
- No takedown or "ask us to remove this" button on the recipient page for now. Removal goes through the Privacy page, which already says to email the support address.

**Release rule:** nothing merges to main until the redesign and the tell-them flow are both ready. Everything lands on `design/konditori-foundation`, then one release PR. Needs a preview deployment for the Substack tests (and a separate database, or manual cleanup, so test slices don't reach the live wall).

**Build plan:** https://claude.ai/artifact/5VoEPsTChzQZ8uddJUTz65 (steps: typing-time verification, success screen, recipient page `/note/:id`, then measure; the site-address step was dropped).

**Known gaps after step 2 (typing-time verification)**
- The Signed field is not verified: a typo'd own handle still becomes a link on the wall.
- A publication address typed in full (`x.substack.com`) still links as typed; publications are not looked up.
- The lookup scrapes Substack pages, so it can break or be rate-limited. "Couldn't reach Substack" never blocks giving.

**Takedown trigger (build only when one of these happens)**
- [ ] Someone asks to have a card removed, or
- [ ] The "tell them" step is used for a message that isn't kind.

If triggered: add an "Ask us to take this down" action on the recipient page, and a way for the host to hide a slice without editing the database by hand (a `hidden` flag the wall ignores).

**Constraint:** keep the no-rankings rule. Nothing here should surface "most appreciated" writers.

**Effort:** unscoped (brainstorm)

---

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

### Weekly recap / digest — not started, blocked on identity
A writer has no way to know a slice was left for them, let alone see a rollup of who appreciated them that week. This is distinct from (and more specific than) the general "no return triggers" gap in `docs/ux/ux-product-gap.md` — it's the specific "weekly digest showing who appreciated you back" mechanic that a designer sketched but that has no data model, auth, or notification channel behind it today.

**Who it's for:** a writer (Stef, or a future multi-tenant writer) who wants to know appreciation happened without manually scrolling the whole wall.

**Blocked on:** identity/auth (`ux-product-gap.md` gap #1) — without a verified writer account, there's no inbox to build a digest for. Do not scope this before identity is scoped.

**Effort:** L (new data model to associate slices with a specific writer, a scheduled job, a delivery channel — likely email — and identity as a hard prerequisite)

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
