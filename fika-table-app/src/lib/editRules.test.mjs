import test from 'node:test';
import assert from 'node:assert/strict';
import { editTimeLeft, editErrorFrom, EDIT_WINDOW_HOURS } from './editRules.js';

const made = new Date(2026, 9, 19, 12, 0).toISOString();
const after = (hours, minutes = 0) => new Date(new Date(made).getTime() + (hours * 60 + minutes) * 60000);

test('the window is open for 24 hours and says how long is left', () => {
  assert.equal(EDIT_WINDOW_HOURS, 24);
  assert.deepEqual(editTimeLeft(made, after(0)), { open: true, label: '24 hours left to edit' });
  assert.deepEqual(editTimeLeft(made, after(1, 30)), { open: true, label: '22 hours left to edit' });
  assert.deepEqual(editTimeLeft(made, after(22, 30)), { open: true, label: '1 hour left to edit' });
  assert.deepEqual(editTimeLeft(made, after(23, 30)), { open: true, label: 'Less than an hour left to edit' });
});

test('after 24 hours, or with a bad date, nothing can be edited', () => {
  assert.equal(editTimeLeft(made, after(24)).open, false);
  assert.equal(editTimeLeft(made, after(30)).open, false);
  assert.deepEqual(editTimeLeft('not a date', after(1)), { open: false, label: '' });
  assert.deepEqual(editTimeLeft(undefined, after(1)), { open: false, label: '' });
});

test('database errors map to what the page should say', () => {
  assert.equal(editErrorFrom({ message: 'window_closed' }), 'window_closed');
  assert.equal(editErrorFrom({ message: 'forbidden' }), 'forbidden');
  assert.equal(editErrorFrom({ message: 'TypeError: Failed to fetch' }), 'other');
  assert.equal(editErrorFrom(null), 'other');
});
