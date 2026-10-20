import test from 'node:test';
import assert from 'node:assert/strict';
import { siteUrlFromEnv, PRODUCTION_URL } from './siteUrl.js';

test('a preview deployment points its tags at itself', () => {
  assert.equal(
    siteUrlFromEnv({ VERCEL_ENV: 'preview', VERCEL_URL: 'fika-abc123-team.vercel.app' }),
    'https://fika-abc123-team.vercel.app',
  );
});

test('production, local builds and unknown environments use the live address', () => {
  assert.equal(siteUrlFromEnv({ VERCEL_ENV: 'production', VERCEL_URL: 'fika-abc123-team.vercel.app' }), PRODUCTION_URL);
  assert.equal(siteUrlFromEnv({}), PRODUCTION_URL);
  assert.equal(siteUrlFromEnv({ VERCEL_ENV: 'development' }), PRODUCTION_URL);
});

test('a preview with no address falls back to the live address instead of an empty one', () => {
  assert.equal(siteUrlFromEnv({ VERCEL_ENV: 'preview' }), PRODUCTION_URL);
});
