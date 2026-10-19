// Responsive check: drives every page and state of the app at many viewport sizes against
// the dev server, with Supabase and Substack mocked, and reports layout problems.
//
//   npm run dev -- --port 5185        (in another terminal)
//   node scripts/responsive-check.mjs
//
// Environment:  BASE_URL (default http://localhost:5185)   OUT_DIR (default /tmp/fika-responsive)
//               ONLY=welcome,give  limits to scenarios whose name starts with one of these
//               WIDTHS=320,390     limits the widths
//               SHOTS=0            skips screenshots
//
// For every scenario × viewport it checks: horizontal page overflow, elements poking past
// the screen edge, text spilling out of its box, modals that don't fit or hide their close
// button, buttons that can't be reached, overlapping controls, tiny tap targets and text,
// and console errors. Results go to OUT_DIR/report.json and a summary is printed.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:5185';
const OUT = process.env.OUT_DIR || '/tmp/fika-responsive';
const SHOTS = process.env.SHOTS !== '0';
const CONCURRENCY = 5;

// Widths sit on both sides of every breakpoint in the CSS (420, 480, 560, 640, 680, 900)
const WIDTHS = [320, 360, 390, 419, 421, 430, 479, 481, 559, 561, 639, 641, 679, 681, 768, 899, 901, 1024, 1280, 1440, 1920];
const heightFor = (w) => (w < 480 ? 740 : w < 900 ? 900 : 800);
const VIEWPORTS = [
  ...WIDTHS.map((w) => ({ w, h: heightFor(w), mobile: w <= 768 })),
  { w: 667, h: 375, mobile: true, name: 'landscape-phone' },
  { w: 844, h: 390, mobile: true, name: 'landscape-phone-large' },
].filter((v) => !process.env.WIDTHS || process.env.WIDTHS.split(',').includes(String(v.w)));

// ── Mock data: varied on purpose, with long names, unbroken strings and long links ──
const LONG_WORD = 'Supercalifragilisticexpialidocious_Supercalifragilisticexpialidocious';
const LONG_NAME = 'Maximilian-Alexander Featherstonehaugh-Wollstonecraft';
const LONG_LINK = 'https://example.com/a/very/long/path/that/goes/on/and/on/and/on/and/on/forever/and/ever?utm_source=newsletter&utm_medium=email&utm_campaign=kind_words';
const LONG_MSG = ('Your essay on slow newsletters taught me that a small audience can still be a conversation. ').repeat(9)
  + `Read it again here ${LONG_LINK} and also ${LONG_WORD}.`;
const LONG_BIO = 'Writes about slow newsletters, small audiences, kind words, and the quiet craft of paying attention to people over long periods of time.';

const iso = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString();
const row = (id, o) => ({
  id, idx: null, round: 1, from_name: 'Marcos', to_name: 'Elena', to_type: 'writer',
  message: 'Your essay made my week.', color: 0, created_at: iso(2), ...o,
});
const ROWS = [
  row('r0', { idx: 0, from_name: 'Marcos Lindqvist', to_name: '@elenavoss', message: LONG_MSG, color: 3 }),
  row('r1', { idx: 1, from_name: LONG_NAME, to_name: LONG_NAME, message: 'Short and sweet.', color: 1 }),
  row('r2', { idx: 2, from_name: LONG_WORD, to_name: LONG_WORD, message: LONG_WORD, color: 5 }),
  row('r3', { idx: 3, from_name: null, to_name: 'the table', to_type: 'anyone', message: 'This little corner of the internet is lovely.', color: 2 }),
  row('r4', { idx: 4, from_name: '@marcos', to_name: '@elenavoss', message: 'Thank you for the slow newsletter essays.', color: 4 }),
  row('r5', { idx: 5, message: LONG_LINK, color: 6 }),
  row('r6', { idx: 6, message: 'Hi', color: 7 }),
  ...Array.from({ length: 6 }, (_, i) => row(`r${7 + i}`, { round: 0, idx: i, message: `A kind word from an earlier week, number ${i + 1}.`, created_at: iso(30 + i), color: i })),
];
const SINGLES = {
  person: row('person', { from_name: 'Marcos Lindqvist', to_name: '@elenavoss', message: 'Your essay on slow newsletters made my week.', color: 3 }),
  long: row('long', { from_name: LONG_NAME, to_name: LONG_NAME, message: LONG_MSG, color: 1 }),
  longword: row('longword', { from_name: LONG_WORD, to_name: LONG_WORD, message: LONG_WORD, color: 5 }),
  table: row('table', { from_name: 'Marcos', to_name: 'the table', to_type: 'anyone', message: 'This little corner of the internet is lovely.', color: 5 }),
  anon: row('anon', { from_name: null, to_name: 'Elena', to_type: 'reader', message: 'You always leave the kindest comments.', color: 1 }),
  handle: row('handle', { from_name: '@marcos', to_name: '@elenavoss', message: 'Thank you for the essays.', color: 0 }),
};

function installMocks(page, state) {
  const cors = { 'access-control-allow-origin': '*' };
  let posted = 0;
  page.route('**/rest/v1/slices*', async (r) => {
    const q = r.request();
    if (state.fail) return r.abort();
    if (q.method() === 'POST') {
      const body = JSON.parse(q.postData());
      posted += 1;
      return r.fulfill({ status: 201, json: { ...body, id: `new-${posted}`, created_at: new Date().toISOString() }, headers: cors });
    }
    const single = (q.headers().accept || '').includes('vnd.pgrst.object');
    if (single) {
      const key = (new URL(q.url()).searchParams.get('id') || '').replace('eq.', '');
      const found = SINGLES[key];
      return found
        ? r.fulfill({ json: found, headers: cors })
        : r.fulfill({ status: 406, json: { code: 'PGRST116', message: 'no rows' }, headers: cors });
    }
    return r.fulfill({ json: state.empty ? [] : ROWS, headers: cors });
  });
  page.route('**/rest/v1/cake_config*', (r) => (state.fail ? r.abort() : r.fulfill({ json: { round: 1, round_size: 12 }, headers: cors })));
  page.route('**/api/substack-profile*', async (r) => {
    const u = new URL(r.request().url());
    const h = u.searchParams.get('handle');
    const q = u.searchParams.get('query');
    await new Promise((x) => setTimeout(x, 80));
    if (h === 'elenavoss') return r.fulfill({ json: { name: 'Elena Voss', image: null, description: LONG_BIO, handle: 'elenavoss' } });
    if (h === 'marcos') return r.fulfill({ json: { name: 'Marcos Lindqvist', image: null, description: 'Reader', handle: 'marcos' } });
    if (h === 'longname') return r.fulfill({ json: { name: LONG_NAME, image: null, description: LONG_BIO, handle: 'longname' } });
    if (h === 'boom') return r.fulfill({ status: 503, json: { error: 'x' } });
    if (q === 'Alex Moreau') return r.fulfill({ json: { candidates: [{ name: 'Alex Moreau', image: null, description: 'Editor at The Margin', handle: 'alexmoreau', match: 'partial' }] } });
    if (q === 'Sam Lee') return r.fulfill({ json: { candidates: [
      { name: 'Sam Lee', image: null, description: LONG_BIO, handle: 'samlee', match: 'exact' },
      { name: 'Sam Lee', image: null, description: 'Food', handle: 'samlee2', match: 'exact' },
    ] } });
    return r.fulfill({ status: 404, json: { error: 'nf' } });
  });
}

// ── Scenarios ──
const openGive = async (p) => {
  await p.getByRole('button', { name: /take a slice/i }).last().click();
  await p.waitForSelector('[role=dialog]');
};
const giveWith = async (p, { to, from, message = 'Your essay made my week.' }) => {
  await openGive(p);
  await p.fill('#give-message', message);
  if (to !== undefined) await p.fill('#give-to', to);
  if (from !== undefined) await p.fill('#give-from', from);
  await p.waitForTimeout(1100);
};
const submitGive = async (p) => {
  await p.getByRole('button', { name: 'Take the slice' }).click();
  await p.waitForTimeout(900);
};
const table = (p) => p.goto(`${BASE}/table`).then(() => p.waitForTimeout(1500));

const SCENARIOS = {
  'welcome': async (p) => { await p.goto(`${BASE}/`); await p.waitForTimeout(3600); },
  'welcome-empty': async (p, s) => { s.empty = true; await p.goto(`${BASE}/`); await p.waitForTimeout(3600); },
  'welcome-error': async (p, s) => { s.fail = true; await p.goto(`${BASE}/`); await p.waitForTimeout(3600); },
  'table': async (p) => { await table(p); },
  'table-empty': async (p, s) => { s.empty = true; await table(p); },
  'table-error': async (p, s) => { s.fail = true; await table(p); },
  'table-search': async (p) => { await table(p); await p.fill('input[type=text]', LONG_WORD); await p.waitForTimeout(300); },
  'give-default': async (p) => { await table(p); await giveWith(p, {}); },
  'give-types-colors': async (p) => {
    await table(p); await giveWith(p, { to: 'Maria' });
    await p.getByRole('button', { name: 'Change', exact: true }).click();
    await p.getByRole('button', { name: 'Change color' }).click(); await p.waitForTimeout(200);
  },
  'give-linked': async (p) => { await table(p); await giveWith(p, { to: '@elenavoss' }); },
  'give-confirm': async (p) => { await table(p); await giveWith(p, { to: 'Alex Moreau' }); },
  'give-choose': async (p) => { await table(p); await giveWith(p, { to: 'Sam Lee' }); },
  'give-notfound': async (p) => { await table(p); await giveWith(p, { to: '@nobody123' }); },
  'give-unreachable': async (p) => { await table(p); await giveWith(p, { to: '@boom' }); },
  'give-signed': async (p) => { await table(p); await giveWith(p, { to: '@elenavoss', from: '@marcos' }); },
  'give-signed-name': async (p) => { await table(p); await giveWith(p, { to: '@elenavoss', from: 'Alex Moreau' }); },
  'give-signed-choose': async (p) => { await table(p); await giveWith(p, { to: 'Maria', from: 'Sam Lee' }); },
  'give-signed-typo': async (p) => { await table(p); await giveWith(p, { to: '@longname', from: '@marcs' }); },
  'give-long': async (p) => { await table(p); await giveWith(p, { to: LONG_WORD, from: LONG_NAME, message: LONG_MSG.slice(0, 1000) }); },
  'read-modal': async (p) => { await table(p); await p.locator('[class*="_card_"]').first().click(); await p.waitForSelector('[role=dialog]'); await p.waitForTimeout(400); },
  'success-person': async (p) => { await table(p); await giveWith(p, { to: '@elenavoss', from: 'Marcos' }); await submitGive(p); },
  'success-long': async (p) => { await table(p); await giveWith(p, { to: '@longname', from: LONG_NAME, message: LONG_MSG.slice(0, 600) }); await submitGive(p); },
  'success-unmatched': async (p) => { await table(p); await giveWith(p, { to: '@nobody123' }); await submitGive(p); },
  'success-table': async (p) => {
    await table(p); await openGive(p); await p.fill('#give-message', 'Hello table.');
    await p.getByRole('button', { name: 'Change', exact: true }).click();
    await p.getByRole('button', { name: 'Leave it on the table' }).click(); await submitGive(p);
  },
  'success-note': async (p) => {
    await table(p); await giveWith(p, { to: '@elenavoss' }); await submitGive(p);
    await p.getByRole('button', { name: /^Tell .* on Substack$/ }).click(); await p.waitForTimeout(300);
  },
  'success-note-copied': async (p, s, ctx) => {
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
    await ctx.route('https://substack.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>n</title>' }));
    await table(p); await giveWith(p, { to: '@elenavoss' }); await submitGive(p);
    await p.getByRole('button', { name: /^Tell .* on Substack$/ }).click();
    await p.getByRole('button', { name: 'Copy and open Substack' }).click(); await p.waitForTimeout(500);
  },
  'share-person': async (p) => { await p.goto(`${BASE}/share/person`); await p.waitForTimeout(1500); },
  'share-long': async (p) => { await p.goto(`${BASE}/share/long`); await p.waitForTimeout(1500); },
  'share-longword': async (p) => { await p.goto(`${BASE}/share/longword`); await p.waitForTimeout(1500); },
  'share-table': async (p) => { await p.goto(`${BASE}/share/table`); await p.waitForTimeout(1500); },
  'share-error': async (p) => { await p.goto(`${BASE}/share/nope`); await p.waitForTimeout(1500); },
  'note-signed': async (p) => { await p.goto(`${BASE}/note/person`); await p.waitForTimeout(1300); },
  'note-handle': async (p) => { await p.goto(`${BASE}/note/handle`); await p.waitForTimeout(1300); },
  'note-anon': async (p) => { await p.goto(`${BASE}/note/anon`); await p.waitForTimeout(1300); },
  'note-table': async (p) => { await p.goto(`${BASE}/note/table`); await p.waitForTimeout(1300); },
  'note-long': async (p) => { await p.goto(`${BASE}/note/long`); await p.waitForTimeout(1300); },
  'note-longword': async (p) => { await p.goto(`${BASE}/note/longword`); await p.waitForTimeout(1300); },
  'note-error': async (p) => { await p.goto(`${BASE}/note/nope`); await p.waitForTimeout(1300); },
  'note-passback': async (p) => {
    await p.goto(`${BASE}/note/handle`); await p.waitForTimeout(1000);
    await p.getByRole('link', { name: /a kind word back/ }).click(); await p.waitForTimeout(1500);
  },
  'privacy': async (p) => { await p.goto(`${BASE}/privacy`); await p.waitForTimeout(800); },
};

// ── The checks, run inside the page ──
function pageChecks() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const issues = [];
  const label = (el) => {
    const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean).map((c) => c.replace(/_[a-z0-9]{5,}_\d+$/i, '')).slice(0, 2).join('.') : '';
    const txt = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${txt ? ` "${txt}"` : ''}`;
  };
  const hidden = (el) => {
    const cs = getComputedStyle(el);
    return cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0;
  };
  const inCapture = (el) => !!el.closest('[class*="captureStage"]');
  const clipped = (el, r) => {
    for (let a = el.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (['hidden', 'auto', 'scroll', 'clip'].includes(cs.overflowX) && a.getBoundingClientRect().right <= vw + 1) return true;
    }
    return false;
  };

  if (document.documentElement.scrollWidth > vw + 1) {
    issues.push({ type: 'page-overflow', detail: `page is ${document.documentElement.scrollWidth}px wide on a ${vw}px screen` });
  }

  // With a dialog open, only the dialog is checked: the page behind the scrim isn't in play
  const openDialog = document.querySelector('[role=dialog]');
  const scope = openDialog || document.body;
  const all = [...scope.querySelectorAll('*')].filter((el) => !inCapture(el) && !hidden(el));
  const seen = new Set();
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if ((r.right > vw + 1 || r.left < -1) && !clipped(el, r) && getComputedStyle(el).position !== 'fixed') {
      const key = label(el);
      if (!seen.has(key)) { seen.add(key); issues.push({ type: 'past-edge', detail: `${key} spans ${Math.round(r.left)}–${Math.round(r.right)} on a ${vw}px screen` }); }
    }
  }

  // A control cut off by the box that holds it (a modal, a card) is as bad as one off the screen
  for (const el of all.filter((x) => x.matches('button, a[href], input, select, textarea'))) {
    if (el.closest('[aria-hidden="true"]')) continue; // e.g. the spam-trap field, off screen on purpose
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    for (let anc = el.parentElement; anc && anc !== document.body; anc = anc.parentElement) {
      const cs = getComputedStyle(anc);
      if (cs.overflowX === 'visible') continue;
      const ar = anc.getBoundingClientRect();
      if (r.right > ar.right + 1 || r.left < ar.left - 1) {
        issues.push({ type: 'control-cut-off', detail: `${label(el)} sticks out of its container by ${Math.round(Math.max(r.right - ar.right, ar.left - r.left))}px` });
        break;
      }
    }
  }

  // Text that spills out of its own box
  for (const el of all) {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'inline') continue;
    if (cs.overflowX === 'visible' && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
      issues.push({ type: 'text-spill', detail: `${label(el)} content ${el.scrollWidth}px in a ${el.clientWidth}px box` });
    }
  }

  // Tap targets and tiny text
  let tapWarn = 0;
  const tapList = [];
  const interactive = all.filter((el) => el.matches('button, a[href], input:not([type=hidden]), select, textarea, [role=button]'));
  for (const el of interactive) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') continue;
    if (el.closest('[class*="honeypot"]')) continue;
    const small = Math.min(r.width, r.height);
    if (small < 24) issues.push({ type: 'tap-too-small', detail: `${label(el)} is ${Math.round(r.width)}×${Math.round(r.height)}` });
    else if (small < 44 && vw <= 768) { tapWarn += 1; tapList.push(`${label(el)} ${Math.round(r.width)}×${Math.round(r.height)}`); }
  }
  const fontSeen = new Set();
  for (const el of all) {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 11) { const k = label(el); if (!fontSeen.has(k)) { fontSeen.add(k); issues.push({ type: 'text-too-small', detail: `${k} is ${fs}px` }); } }
  }

  // Controls sitting on top of each other
  const vis = interactive.map((el) => ({ el, r: el.getBoundingClientRect() })).filter((x) => x.r.width > 0 && x.r.height > 0 && x.r.bottom > 0 && x.r.top < vh);
  for (let i = 0; i < vis.length; i += 1) {
    for (let j = i + 1; j < vis.length; j += 1) {
      const a = vis[i]; const b = vis[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const stuck = (el) => { for (let x = el; x && x !== document.body; x = x.parentElement) if (getComputedStyle(x).position === 'sticky') return true; return false; };
      if (stuck(a.el) || stuck(b.el)) continue; // a sticky header passes over what scrolls beneath it
      const inside = (x, y) => x.left >= y.left - 1 && x.right <= y.right + 1 && x.top >= y.top - 1 && x.bottom <= y.bottom + 1;
      if (inside(a.r, b.r) || inside(b.r, a.r)) continue; // e.g. a clear button inside its input
      const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (w > 2 && h > 2 && (w * h) / Math.min(a.r.width * a.r.height, b.r.width * b.r.height) > 0.25) {
        issues.push({ type: 'controls-overlap', detail: `${label(a.el)} overlaps ${label(b.el)}` });
      }
    }
  }

  // A dialog must fit the screen and keep its close button reachable
  const dialog = document.querySelector('[role=dialog]');
  if (dialog) {
    const modal = dialog.firstElementChild;
    const r = modal.getBoundingClientRect();
    if (r.top < -1 || r.bottom > vh + 1 || r.left < -1 || r.right > vw + 1) {
      issues.push({ type: 'modal-off-screen', detail: `dialog at ${Math.round(r.left)},${Math.round(r.top)}–${Math.round(r.right)},${Math.round(r.bottom)} on ${vw}×${vh}` });
    }
    const close = dialog.querySelector('[aria-label="Close"]');
    if (close) {
      const c = close.getBoundingClientRect();
      if (c.top < 0 || c.bottom > vh || c.right > vw || c.left < 0) issues.push({ type: 'close-not-visible', detail: 'close button is outside the screen' });
    }
  }
  return { issues, tapWarn, tapList };
}

// Can the main button of an open dialog be scrolled to and clicked, not covered by anything?
async function reachability(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector('[role=dialog]');
    if (!dialog) return [];
    const out = [];
    const buttons = [...dialog.querySelectorAll('button.btn-solid, button[class*="fullBtn"]')]
      .filter((b) => b.offsetParent !== null && !b.disabled);
    for (const b of buttons) {
      b.scrollIntoView({ block: 'center' });
      const r = b.getBoundingClientRect();
      const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!(at === b || b.contains(at))) out.push({ type: 'button-covered', detail: `"${b.innerText.trim().slice(0, 30)}" is covered by ${at ? at.tagName.toLowerCase() : 'nothing'}` });
      if (r.bottom > innerHeight + 1 || r.top < -1) out.push({ type: 'button-unreachable', detail: `"${b.innerText.trim().slice(0, 30)}" cannot be scrolled into view` });
    }
    return out;
  });
}

// ── Runner ──
async function runOne(browser, vp, name, attempt = 1) {
  const context = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: vp.mobile ? 2 : 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push(m.text()); });
  const state = {};
  installMocks(page, state);
  const result = { scenario: name, viewport: `${vp.name ?? vp.w}${vp.name ? '' : 'x' + vp.h}`, w: vp.w, issues: [], tapWarn: 0, errors };
  try {
    await SCENARIOS[name](page, state, context);
    const { issues, tapWarn, tapList } = await page.evaluate(pageChecks);
    result.issues.push(...issues);
    result.tapWarn = tapWarn;
    result.tapList = tapList;
    result.issues.push(...(await reachability(page)));
    if (SHOTS) {
      const file = path.join(OUT, 'shots', `${name}__${vp.name ?? vp.w}.png`);
      await page.screenshot({ path: file, fullPage: !(await page.locator('[role=dialog]').count()) });
      result.shot = file;
    }
  } catch (e) {
    result.issues.push({ type: 'scenario-failed', detail: String(e.message).split('\n')[0].slice(0, 160) });
  }
  if (errors.length) result.issues.push({ type: 'console-error', detail: errors[0].slice(0, 160) });
  await context.close();
  if (attempt === 1 && result.issues.some((i) => i.type === 'scenario-failed')) return runOne(browser, vp, name, 2);
  return result;
}

const names = Object.keys(SCENARIOS).filter((n) => !process.env.ONLY || process.env.ONLY.split(',').some((o) => n.startsWith(o)));
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
const jobs = VIEWPORTS.flatMap((vp) => names.map((n) => [vp, n]));
const browser = await chromium.launch();
const results = [];
let next = 0;
const started = Date.now();
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < jobs.length) {
    const [vp, n] = jobs[next++];
    results.push(await runOne(browser, vp, n));
  }
}));
await browser.close();

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 1));
const bad = results.filter((r) => r.issues.length);
const byType = {};
for (const r of bad) for (const i of r.issues) { (byType[i.type] ||= []).push(`${r.scenario} @ ${r.viewport}: ${i.detail}`); }
console.log(`\n${results.length} runs (${names.length} scenarios × ${VIEWPORTS.length} viewports) in ${Math.round((Date.now() - started) / 1000)}s`);
console.log(`${results.length - bad.length} clean, ${bad.length} with problems\n`);
for (const [type, list] of Object.entries(byType)) {
  console.log(`${type} (${list.length})`);
  for (const l of list.slice(0, 8)) console.log(`   ${l}`);
  if (list.length > 8) console.log(`   … and ${list.length - 8} more`);
}
const warn = results.filter((r) => r.tapWarn).length;
const small = {};
for (const r of results) for (const t of r.tapList || []) { const k = t.replace(/ \d+×\d+$/, ''); small[k] = (small[k] || 0) + 1; }
console.log(`\nTap targets under 44px (not failures, WCAG asks for 24px): present in ${warn} runs. Most common:`);
for (const [k, v] of Object.entries(small).sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`   ${v}x ${k}`);
process.exitCode = bad.length ? 1 : 0;
