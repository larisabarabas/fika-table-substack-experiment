import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDay } from './dates.js';

const now = new Date(2026, 9, 19, 15, 30); // 19 October 2026, mid-afternoon, local time

test('same day and the day before', () => {
  assert.equal(formatDay(new Date(2026, 9, 19, 0, 5).toISOString(), now), 'today');
  assert.equal(formatDay(new Date(2026, 9, 19, 23, 59).toISOString(), now), 'today');
  assert.equal(formatDay(new Date(2026, 9, 18, 23, 59).toISOString(), now), 'yesterday');
});

test('older words show the day, with the year only when it is not this year', () => {
  assert.equal(formatDay(new Date(2026, 9, 12, 10).toISOString(), now), '12 October');
  assert.equal(formatDay(new Date(2026, 0, 3, 10).toISOString(), now), '3 January');
  assert.equal(formatDay(new Date(2025, 11, 31, 10).toISOString(), now), '31 December 2025');
});

test('a missing or bad date gives nothing, so the card just says who it is from', () => {
  assert.equal(formatDay(undefined, now), '');
  assert.equal(formatDay(null, now), '');
  assert.equal(formatDay('not a date', now), '');
});
