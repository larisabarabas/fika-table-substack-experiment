import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AVATAR_HOSTS, safeAvatarUrl } from '../api/_avatar.js';

const config = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const headers = Object.fromEntries(config.headers[0].headers.map((h) => [h.key, h.value]));
const directive = (name) => {
  const part = headers['Content-Security-Policy'].split(';').map((d) => d.trim()).find((d) => d.startsWith(`${name} `));
  return part ? part.split(/\s+/).slice(1) : null;
};

test('scripts may only come from this site: no inline, no eval, no other hosts', () => {
  assert.deepEqual(directive('script-src'), ["'self'"]);
});

test('the page cannot be framed, and plugins, base tags and form posts are locked down', () => {
  assert.deepEqual(directive('frame-ancestors'), ["'none'"]);
  assert.deepEqual(directive('object-src'), ["'none'"]);
  assert.deepEqual(directive('base-uri'), ["'self'"]);
  assert.deepEqual(directive('form-action'), ["'self'"]);
});

test('requests and images go only where the app needs them', () => {
  assert.equal(directive('default-src').join(' '), "'self'");
  assert.ok(directive('connect-src').includes('https://*.supabase.co'));
  assert.ok(directive('connect-src').includes('wss://*.supabase.co'));
  assert.ok(!directive('img-src').includes('https:'), 'img-src must not allow every https host');
});

test('every avatar host the proxy allows is allowed by img-src, and nothing else is', () => {
  const imgHosts = directive('img-src').filter((s) => s.startsWith('https://')).map((s) => s.slice('https://'.length));
  assert.deepEqual([...imgHosts].sort(), [...AVATAR_HOSTS].sort());
});

test('the other security headers are present', () => {
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.ok(headers['Referrer-Policy']);
  assert.ok(headers['Permissions-Policy']);
});

test('avatar URLs: https pictures from Substack hosts pass, everything else is dropped', () => {
  const ok = 'https://substackcdn.com/image/fetch/f_auto/https%3A%2F%2Fexample.com%2Fa.jpg';
  assert.equal(safeAvatarUrl(ok), ok);
  assert.ok(safeAvatarUrl('https://substack-post-media.s3.amazonaws.com/public/images/a.png'));
  for (const bad of [
    'http://substackcdn.com/a.jpg',
    'https://evil.example/a.jpg',
    'https://substackcdn.com.evil.example/a.jpg',
    'https://user:pw@substackcdn.com/a.jpg',
    'https://substackcdn.com:8443/a.jpg',
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    '//substackcdn.com/a.jpg',
    '', null, undefined, 42,
  ]) assert.equal(safeAvatarUrl(bad), null, String(bad));
});
