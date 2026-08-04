// REPL driver for fika-table-app (Vite + React SPA). Headless-Chromium via
// Playwright, since no `chromium-cli` is installed in this environment.
// Designed for agents: wrap in tmux, send-keys commands, capture-pane output.
//
// Assumes the Vite dev server and local Supabase are already running
// (see SKILL.md "Run (agent path)"). This driver only owns the browser.
import { chromium } from 'playwright';
import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const SHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/fika-shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

let browser = null;
let page = null;
const logs = []; // console.error + pageerror, newest last

// Splits a command line into args, honoring "..." / '...' quoting so a
// selector or text argument containing spaces (e.g. an aria-label or a
// placeholder string) can be passed as one token instead of being
// shredded by a naive whitespace split.
function tokenize(line) {
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  const out = [];
  let m;
  while ((m = re.exec(line)) !== null) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

function resolveUrl(u) {
  if (!u) return BASE_URL;
  return /^https?:\/\//.test(u) ? u : BASE_URL + (u.startsWith('/') ? u : '/' + u);
}

const COMMANDS = {
  async launch(url) {
    if (browser) return console.log('already launched');
    browser = await chromium.launch({ args: ['--no-sandbox'] });
    page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
    page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') logs.push('console.error: ' + m.text()); });
    await page.goto(resolveUrl(url), { waitUntil: 'domcontentloaded' });
    console.log('launched:', resolveUrl(url));
  },

  async nav(url) {
    if (!page) return console.log('ERROR: launch first');
    await page.goto(resolveUrl(url), { waitUntil: 'domcontentloaded' });
    console.log('nav →', resolveUrl(url));
  },

  async ss(name) {
    if (!page) return console.log('ERROR: launch first');
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png');
    await page.screenshot({ path: f });
    console.log('screenshot:', f);
  },

  // CSS-module class names are hashed (e.g. `_grid_pgvqp_1`) — never match
  // on the literal class from source. Use [class*="..."] substring matches
  // for anything styled via a .module.css file (i.e. most of this app).
  async click(sel) {
    if (!page) return console.log('ERROR: launch first');
    try { await page.locator(sel).first().click({ timeout: 5000 }); console.log('click', sel, '→ OK'); }
    catch (e) { console.log('click', sel, '→ FAIL:', e.message.split('\n')[0]); }
  },

  async 'click-text'(...parts) {
    if (!page) return console.log('ERROR: launch first');
    const text = parts.join(' ');
    try { await page.getByText(text, { exact: false }).first().click({ timeout: 5000 }); console.log('click-text', JSON.stringify(text), '→ OK'); }
    catch (e) { console.log('click-text', JSON.stringify(text), '→ FAIL:', e.message.split('\n')[0]); }
  },

  // React controlled inputs ignore a raw DOM `.value =` set — it never fires
  // onChange. Playwright's `.fill()` dispatches real input events, so it's
  // the one that actually updates React state (search box, textarea, etc).
  async fill(sel, ...rest) {
    if (!page) return console.log('ERROR: launch first');
    const text = rest.join(' ');
    try { await page.locator(sel).first().fill(text); console.log('fill', sel, '→ OK'); }
    catch (e) { console.log('fill', sel, '→ FAIL:', e.message.split('\n')[0]); }
  },

  async type(text) { if (page) await page.keyboard.type(text, { delay: 20 }); },
  async press(key) { if (page) await page.keyboard.press(key); },

  async wait(sel) {
    if (!page) return console.log('ERROR: launch first');
    try { await page.waitForSelector(sel, { timeout: 10_000 }); console.log('found:', sel); }
    catch { console.log('TIMEOUT:', sel); }
  },

  async 'wait-text'(...parts) {
    if (!page) return console.log('ERROR: launch first');
    const text = parts.join(' ');
    try { await page.getByText(text, { exact: false }).first().waitFor({ timeout: 10_000 }); console.log('found text:', text); }
    catch { console.log('TIMEOUT waiting for text:', text); }
  },

  async viewport(w, h) {
    if (!page) return console.log('ERROR: launch first');
    await page.setViewportSize({ width: Number(w), height: Number(h) });
    console.log('viewport →', w, 'x', h);
  },

  async eval(expr) {
    if (!page) return console.log('ERROR: launch first');
    try { console.log(JSON.stringify(await page.evaluate(expr))); }
    catch (e) { console.log('ERROR:', e.message); }
  },

  async text(sel) {
    if (!page) return console.log('ERROR: launch first');
    console.log(await page.evaluate(
      (s) => (s ? document.querySelector(s) : document.body)?.innerText ?? '(null)',
      sel || null,
    ));
  },

  // App-specific: counts masonry columns on the appreciation wall
  // (AppreciationWall.jsx renders one <div> per column inside the CSS-module
  // `.grid`). Useful for confirming the useMasonryColumns hook responded to
  // a resize or a mount/unmount cycle.
  async columns() {
    if (!page) return console.log('ERROR: launch first');
    const n = await page.evaluate(() => document.querySelector('[class*="grid"]')?.children.length ?? null);
    console.log('columns:', n);
  },

  async console(mode) {
    if (mode === '--errors' || !mode) {
      console.log(logs.length ? logs.join('\n') : '(no console/page errors captured)');
    } else {
      console.log('usage: console --errors');
    }
  },

  async sleep(ms) { await new Promise((r) => setTimeout(r, Number(ms) || 500)); },

  async quit() { if (browser) await browser.close().catch(() => {}); browser = null; page = null; },
  help() { console.log('commands:', Object.keys(COMMANDS).join(', ')); },
};

const stdin = fs.createReadStream(null, { fd: fs.openSync('/dev/stdin', 'r') });
const rl = readline.createInterface({ input: stdin, output: process.stdout, prompt: 'driver> ' });

// readline's 'line' event fires for every buffered line as soon as it's
// read — it does NOT wait for an async listener's promise to resolve
// before firing the next one. Piping a whole script via stdin (a heredoc,
// not interactive typing) delivers all lines in one chunk, so without this
// queue every command after the first starts before `launch` finishes and
// fails with "launch first". Chaining onto `queue` forces strict order
// regardless of how the input arrives.
let queue = Promise.resolve();

rl.on('line', (line) => {
  queue = queue.then(async () => {
    const [cmd, ...rest] = tokenize(line.trim());
    if (!cmd) return rl.prompt();
    const fn = COMMANDS[cmd];
    if (!fn) { console.log('unknown:', cmd, '— try: help'); return rl.prompt(); }
    try { await fn(...rest); } catch (e) { console.log('ERROR:', e.message); }
    if (cmd === 'quit') { rl.close(); process.exit(0); }
    rl.prompt();
  });
});
rl.on('close', async () => { await queue; await COMMANDS.quit(); process.exit(0); });

console.log('fika-table-app driver — "help" for commands, "launch [path]" to start (default: /)');
rl.prompt();
