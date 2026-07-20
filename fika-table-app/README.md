# Fika for Substack 🍰

A single-tenant "fika table" built for [Stef's Dev Notes](https://substack.com/@stefanialarisa) on Substack. Fika is the Swedish ritual of stopping for coffee, cake, and a little time for each other — this app turns that into a small web ritual for newsletter readers.

Readers **pour a coffee and take a slice** of the weekly cake by leaving a kind word for a writer, a fellow reader, a friend, the host, or "the table." Each round holds 12 slices; once a round is cut, everyone's notes stay forever on the public appreciation wall.

This is a validation experiment, not a finished product: the goal is to see whether readers leave appreciation for *each other*, not just the host, before investing in a multi-tenant version (every writer gets their own table). See [`../BACKLOG.md`](../BACKLOG.md) for the current roadmap and [`../docs/product/fika-product-validation.md`](../docs/product/fika-product-validation.md) for the fuller product thesis.

## How it works

- **Welcome page** (`/`) — intro to the fika ritual and a CTA to take a slice.
- **Cake page** (`/cake`) — the weekly cake, rendered as 12 slices. Picking an empty slice opens a form to leave a kind word (`GiveModal`); reading a taken slice opens its message (`ReadModal`).
- **Appreciation wall** — every slice ever given, across all rounds, searchable by `@handle`.
- **Share page** (`/share/:id`) — a shareable card for a single slice, with Substack profile metadata (name, avatar, description) fetched server-side.
- **Privacy page** (`/privacy`).
- Rounds reset via a Supabase Postgres function (`increment_round`), run manually by the host from the Supabase SQL editor.

## Tech stack

- **React 19 + Vite** — SPA, routed with `react-router-dom` and lazy-loaded pages.
- **Supabase** — Postgres database, Row Level Security policies, and realtime subscriptions (new slices and round changes push to the UI live via `useSlices`).
- **Vercel** — hosting, plus a serverless function (`api/substack-profile.js`) that scrapes a Substack profile's OG/JSON-LD metadata server-side to avoid CORS issues.
- **Vercel Analytics**.

## Project structure

```
src/
  pages/         Welcome, Cake, Share, Privacy
  components/
    cake/        the cake round, slice cards, slice picker
    modals/      give/read modals + shared overlay
    wall/        appreciation wall + wall card
    share/       share sheet
  hooks/
    useSlices.js Supabase data + realtime subscriptions + optimistic inserts
  lib/           Supabase client, API helpers, Substack profile fetch, confetti
  config.js      newsletter/host copy, pastel palette, slice-type labels
api/
  substack-profile.js   Vercel serverless function for Substack profile lookups
supabase/
  schema.sql             tables, RLS policies, increment_round()
  seed-test-slices.sql   sample data for local testing
  functions/increment-round/   Supabase edge function
```

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + publishable key
npm run dev
```

### Environment variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |

### Database setup

Run `supabase/schema.sql` in the Supabase SQL editor. This creates the `slices` and `cake_config` tables, enables RLS with public-read / visitor-insert policies, and defines `increment_round()` for starting a fresh weekly round.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Deployment

Deployed on Vercel (see `vercel.json` for the SPA rewrite rule). Point the deployed URL from your Substack publication once a round is seeded.

## Design principle

No algorithmic discovery: intentionally no charts, leaderboards, or "most appreciated" rankings. Discovery is meant to feel like word of mouth, not a popularity contest.
