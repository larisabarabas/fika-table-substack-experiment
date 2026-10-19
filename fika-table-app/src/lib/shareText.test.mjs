import test from 'node:test';
import assert from 'node:assert/strict';
import { siteOrigin } from './shareText.js';

const SITE = 'https://fika-for-substack.vercel.app';
const loc = (hostname, origin) => ({ hostname, origin });

test('localhost and loopback fall back to the live site', () => {
  assert.equal(siteOrigin(loc('localhost', 'http://localhost:5173'), SITE), SITE);
  assert.equal(siteOrigin(loc('127.0.0.1', 'http://127.0.0.1:5173'), SITE), SITE);
  assert.equal(siteOrigin(loc('[::1]', 'http://[::1]:5173'), SITE), SITE);
});

test('home-network addresses (phone testing) fall back to the live site', () => {
  assert.equal(siteOrigin(loc('192.168.1.20', 'http://192.168.1.20:5173'), SITE), SITE);
  assert.equal(siteOrigin(loc('10.0.0.5', 'http://10.0.0.5:5173'), SITE), SITE);
  assert.equal(siteOrigin(loc('172.20.1.1', 'http://172.20.1.1:5173'), SITE), SITE);
});

test('the live site and preview deployments use their own address', () => {
  assert.equal(siteOrigin(loc('fika-for-substack.vercel.app', SITE), SITE), SITE);
  const preview = 'https://fika-git-tell-them-me.vercel.app';
  assert.equal(siteOrigin(loc('fika-git-tell-them-me.vercel.app', preview), SITE), preview);
});

test('public addresses that merely start with a private-looking number are not treated as private', () => {
  assert.equal(siteOrigin(loc('172.32.0.1', 'http://172.32.0.1'), SITE), 'http://172.32.0.1');
  assert.equal(siteOrigin(loc('100.example.com', 'https://100.example.com'), SITE), 'https://100.example.com');
});
