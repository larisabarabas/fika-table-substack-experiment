import test from 'node:test';
import assert from 'node:assert/strict';
import { rememberSlice, editTokenFor, forgetSlice } from './ownedSlices.js';

const fakeStorage = (initial = {}) => {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    data,
  };
};

test('a remembered slice gives its token back, and only its own', () => {
  const s = fakeStorage();
  assert.equal(rememberSlice('a', 'tok-a', s), true);
  rememberSlice('b', 'tok-b', s);
  assert.equal(editTokenFor('a', s), 'tok-a');
  assert.equal(editTokenFor('b', s), 'tok-b');
  assert.equal(editTokenFor('c', s), null);
});

test('forgetting removes one slice and keeps the rest', () => {
  const s = fakeStorage();
  rememberSlice('a', 'tok-a', s);
  rememberSlice('b', 'tok-b', s);
  forgetSlice('a', s);
  assert.equal(editTokenFor('a', s), null);
  assert.equal(editTokenFor('b', s), 'tok-b');
});

test('only the newest hundred are kept', () => {
  const s = fakeStorage();
  for (let i = 0; i < 105; i++) rememberSlice(`id${i}`, `t${i}`, s, 1000 + i);
  assert.equal(editTokenFor('id0', s), null);
  assert.equal(editTokenFor('id4', s), null);
  assert.equal(editTokenFor('id5', s), 't5');
  assert.equal(editTokenFor('id104', s), 't104');
});

test('a missing id or token is not stored', () => {
  const s = fakeStorage();
  assert.equal(rememberSlice('', 'tok', s), false);
  assert.equal(rememberSlice('a', undefined, s), false);
  assert.deepEqual(s.data, {});
});

test('missing or throwing storage never breaks giving a slice', () => {
  const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.equal(rememberSlice('a', 'tok', broken), false);
  assert.equal(editTokenFor('a', broken), null);
  assert.doesNotThrow(() => forgetSlice('a', broken));
  assert.equal(rememberSlice('a', 'tok', undefined), false);
  assert.equal(editTokenFor('a', undefined), null);
});

test('damaged stored data reads as empty and is replaced on the next save', () => {
  const s = fakeStorage({ 'fika.ownedSlices': '{not json' });
  assert.equal(editTokenFor('a', s), null);
  assert.equal(rememberSlice('a', 'tok-a', s), true);
  assert.equal(editTokenFor('a', s), 'tok-a');
  const arr = fakeStorage({ 'fika.ownedSlices': '[1,2]' });
  assert.equal(editTokenFor('a', arr), null);
});
