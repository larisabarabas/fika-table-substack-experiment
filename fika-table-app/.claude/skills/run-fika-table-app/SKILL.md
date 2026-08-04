---
name: run-fika-table-app
description: Build, run, and drive fika-table-app (the React/Vite/Supabase appreciation-wall SPA, package name "have-a-slice"). Use when asked to start the app, take a screenshot of it, click through a flow, verify a UI/CSS change actually renders, or check that a hook/component behaves correctly in the real browser.
---

fika-table-app is a Vite + React 19 SPA backed by local Supabase. There's no `chromium-cli` or `tmux` in this environment, so it's driven via a small Playwright REPL at `.claude/skills/run-fika-table-app/driver.mjs` — pipe it a script of commands over stdin (see Run below).

All paths below are relative to `fika-table-app/` (this repo has the app one level below repo root, alongside `docs/`, `BACKLOG.md`, etc. — `cd fika-table-app` first if you're at repo root).

## Prerequisites

- Docker Desktop running (local Supabase's Postgres/API containers run in it).
- Supabase CLI (`supabase --version` → this session had v2.108.0).
- Playwright's Chromium binary — **not preinstalled**, had to fetch it:

```bash
npx playwright install chromium
```

## Setup

```bash
npm install
```

`.env.local` already points at the local Supabase stack (`VITE_SUPABASE_URL=http://127.0.0.1:54321`) and takes priority over `.env` (which points at the real prod project) — Vite's env loading means you get local data automatically, nothing to change.

Bring up local Supabase (safe to run even if it's already up — confirmed this session, it just reports "already running"):

```bash
supabase start
```

`supabase status`/`start` may report `imgproxy`/`pooler` as stopped — harmless, the app only needs the `api` and `db` services, which are up.

## Build

No separate build step for driving the app — `npm run dev` runs Vite directly. (`npm run build` exists for a production bundle, not needed here.)

## Run (agent path)

Start the dev server in the background on a port of your choice (5173 may already be taken by another session — check first) and wait for it to answer:

```bash
lsof -i :5173 -sTCP:LISTEN            # check before assuming 5173 is free
npm run dev -- --port 5185 > /tmp/vite-fika.log 2>&1 &
disown
for i in $(seq 1 20); do curl -sf http://localhost:5185 >/dev/null 2>&1 && echo UP && break; sleep 0.5; done
```

Then drive it. `NODE_PATH` is required because the driver file lives outside `fika-table-app/`'s own directory tree (inside `.claude/skills/...`), so plain `require`/`import` resolution from that path won't find `node_modules` — reusing the app's own tree is enough (no separate install needed):

```bash
NODE_PATH="$PWD/node_modules" BASE_URL="http://localhost:5185" SCREENSHOT_DIR="/tmp/fika-shots" \
  node .claude/skills/run-fika-table-app/driver.mjs <<'EOF'
launch /cake
wait-text The appreciation table
ss 01-wide
columns
viewport 400 900
sleep 300
columns
ss 02-narrow
quit
EOF
```

The whole script above is one verified, real run from this session (see the fix history in Gotchas for why piping it all at once is safe). Screenshots land in `$SCREENSHOT_DIR` (default `/tmp/fika-shots`).

If `tmux` is available in your environment (it wasn't in this one), you can instead run the driver interactively and `send-keys`/`capture-pane` one command at a time — the driver's stdin protocol is identical either way.

### Commands

| command | what it does |
|---|---|
| `launch [path]` | launch headless Chromium, navigate to `BASE_URL + path` (default `/`) |
| `nav <path-or-url>` | navigate the existing page |
| `ss [name]` | screenshot → `$SCREENSHOT_DIR/<name>.png` |
| `wait <css-sel>` | wait up to 10s for a selector |
| `wait-text <text>` | wait up to 10s for text anywhere on the page (quote multi-word text) |
| `click <css-sel>` | click first match |
| `click-text <text>` | click first element containing this text |
| `fill <css-sel> <text>` | Playwright `.fill()` — use for any input, not raw DOM `.value =` (see Gotchas) |
| `type <text>` / `press <key>` | keyboard input |
| `viewport <w> <h>` | resize the page viewport (for responsive/masonry checks) |
| `columns` | app-specific: counts masonry columns on the appreciation wall (`[class*="grid"]` children) |
| `eval <js-expr>` | evaluate JS in the page, prints JSON |
| `text [css-sel]` | print `innerText` of an element (default: whole body) |
| `sleep <ms>` | pause — use after `viewport` before asserting layout (see Gotchas) |
| `console --errors` | print captured `console.error`/`pageerror` since launch |
| `quit` | close the browser |

## Run (human path)

```bash
npm run dev   # opens on http://localhost:5173, Ctrl-C to stop
```
Visit `/cake` for the wall/cake UI — `/` is a separate marketing/welcome page and won't show what most UI changes touch.

## Test

No automated test suite in this project (no `test` script, no `*.test.*` files). `npm run lint` is the only automated check:

```bash
npm run lint
```

## Gotchas

- **The interesting UI is at `/cake`, not `/`.** `/` is a static welcome/landing page; the cake round and the appreciation wall (search, masonry grid, give/read modals) all live at `/cake`.
- **CSS Modules hash every class name** (e.g. `.grid` becomes `_grid_pgvqp_1` at runtime). Never select on the literal class from source — use `[class*="grid"]`-style substring attribute selectors, or select by role/text/placeholder instead.
- **React controlled inputs ignore a raw `element.value = '...'` set via `eval`** — no `onChange` fires, so React state never updates. Always drive text inputs with the `fill` command (Playwright's `.fill()`), which dispatches real input events.
- **Quote any selector or text argument that contains spaces.** The driver's command parser only special-cases quotes; `fill input[placeholder="Search by @handle"] ...` typed unquoted gets shredded into multiple bogus tokens and fails with a CSS parse error. Always write it as `fill "input[placeholder='Search by @handle']" ...`.
- **Piping a whole command script via heredoc "just works" now, but almost didn't:** `readline`'s `line` event doesn't wait for an async listener to resolve before firing the next line, so a bulk-piped script (all lines arrive in one chunk) started every command before `launch` finished, and everything after the first line failed with "launch first". The driver serializes commands through an internal promise queue specifically so heredoc scripts are safe — if you fork this driver, keep that queue.
- **`ResizeObserver` fires asynchronously relative to `viewport`.** Calling `columns` immediately after `viewport` can read stale layout state from before the resize's callback fired and React re-rendered — it's flaky, not deterministic. Add `sleep 300` (or poll) between a `viewport` change and any command that asserts on layout.
- **Port 5173 may already be in use** by another dev-server instance (it was, this session) — check with `lsof -i :5173 -sTCP:LISTEN` before assuming it's free, and pass a different `--port` + matching `BASE_URL` if so.

## Troubleshooting

- **`browserType.launch: Executable doesn't exist at .../chrome-headless-shell`**: Playwright's browser binary isn't downloaded in this environment. Run `npx playwright install chromium` (this session only fetched `chromium-headless-shell` + ffmpeg, no full "chromium" head needed for headless use).
- **`Cannot find module 'playwright'` running the driver**: the driver lives outside `fika-table-app/`'s own directory (`.claude/skills/...`), so plain module resolution won't see `fika-table-app/node_modules`. Set `NODE_PATH="$PWD/node_modules"` (run from `fika-table-app/`) before `node driver.mjs`.
- **`locator.fill`/`.click`: "Unexpected token" parsing a CSS selector**: an unquoted selector or text argument containing spaces got tokenized into multiple words. Wrap it in quotes.
- **Empty/blank screenshot at `/`**: not a bug — `/` is the welcome page and won't contain the cake/wall UI; navigate to `/cake`.
