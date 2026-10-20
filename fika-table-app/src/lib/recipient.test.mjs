import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOOKUP, idleLookup, classifyInput, lookupFromResult, linkTo, recipientToSave, shortName,
} from './recipient.js';

const elena = { name: 'Elena Voss', image: null, description: 'Writes', handle: 'elenavoss' };

test('classifyInput: handles, URLs, names and junk', () => {
  assert.deepEqual(classifyInput('@elenavoss'), { kind: 'handle', handle: 'elenavoss', typed: '@elenavoss' });
  assert.equal(classifyInput('https://substack.com/@elenavoss').kind, 'handle');
  assert.equal(classifyInput('  Alex Moreau ').kind, 'name');
  assert.equal(classifyInput('').kind, 'none');
  assert.equal(classifyInput('   ').kind, 'none');
  assert.equal(classifyInput('@').kind, 'none');
  assert.equal(classifyInput('@bob smith').kind, 'none');
});

test('lookupFromResult: an exact handle is linked', () => {
  const s = lookupFromResult('handle', { ok: true, data: elena });
  assert.equal(s.status, LOOKUP.LINKED);
  assert.equal(s.profile.handle, 'elenavoss');
});

test('lookupFromResult: a handle that is not found, and bad requests', () => {
  assert.equal(lookupFromResult('handle', { ok: false, status: 404 }).status, LOOKUP.NOT_FOUND);
  assert.equal(lookupFromResult('handle', { ok: false, status: 400 }).status, LOOKUP.NOT_FOUND);
  assert.equal(lookupFromResult('handle', { ok: true, data: { error: 'Profile not found' } }).status, LOOKUP.NOT_FOUND);
});

test('lookupFromResult: server errors, rate limits and network failures are unreachable, never "not found"', () => {
  assert.equal(lookupFromResult('handle', { ok: false, status: 503 }).status, LOOKUP.UNREACHABLE);
  assert.equal(lookupFromResult('name', { ok: false, status: 500 }).status, LOOKUP.UNREACHABLE);
  assert.equal(lookupFromResult('name', { network: true }).status, LOOKUP.UNREACHABLE);
});

test('lookupFromResult: a single name match always has to be confirmed, exact or partial', () => {
  for (const match of ['exact', 'partial', undefined]) {
    const s = lookupFromResult('name', { ok: true, data: { candidates: [{ ...elena, match }] } });
    assert.equal(s.status, LOOKUP.CONFIRM, `match: ${match}`);
    assert.equal(s.profile.handle, 'elenavoss');
  }
});

test('lookupFromResult: a handle or profile link still links on its own', () => {
  assert.equal(lookupFromResult('handle', { ok: true, data: elena }).status, LOOKUP.LINKED);
});

test('lookupFromResult: several people share the name, or nobody matches', () => {
  const many = lookupFromResult('name', { ok: true, data: { candidates: [{ ...elena, match: 'exact' }, { ...elena, handle: 'elena2', match: 'exact' }] } });
  assert.equal(many.status, LOOKUP.CHOOSE);
  assert.equal(many.candidates.length, 2);
  assert.equal(lookupFromResult('name', { ok: true, data: { candidates: [] } }).status, LOOKUP.NOT_FOUND);
  assert.equal(lookupFromResult('name', { ok: false, status: 404 }).status, LOOKUP.NOT_FOUND);
});

test('recipientToSave: only a linked profile is saved as @handle', () => {
  const saved = recipientToSave({ typed: 'Elena', lookup: linkTo(elena) });
  assert.deepEqual({ toName: saved.toName, verified: saved.verified }, { toName: '@elenavoss', verified: true });
  assert.equal(saved.profile.handle, 'elenavoss');
});

test('recipientToSave: a typed @handle that was not verified is saved without the @', () => {
  const saved = recipientToSave({ typed: '@nobody123', lookup: { ...idleLookup, status: LOOKUP.NOT_FOUND } });
  assert.deepEqual({ toName: saved.toName, verified: saved.verified, profile: saved.profile }, { toName: 'nobody123', verified: false, profile: null });
});

test('recipientToSave: unverified profile URLs, doubled @ and fast submits never become links', () => {
  const idle = idleLookup;
  assert.equal(recipientToSave({ typed: 'https://substack.com/@bob', lookup: idle }).toName, 'bob');
  assert.equal(recipientToSave({ typed: '@@bob', lookup: idle }).toName, 'bob');
  assert.equal(recipientToSave({ typed: '@elenavoss', lookup: { ...idle, status: LOOKUP.SEARCHING } }).toName, 'elenavoss');
});

test('recipientToSave: an unconfirmed loose match, a rejected match and a dismissed card save the typed name', () => {
  for (const status of [LOOKUP.CONFIRM, LOOKUP.CHOOSE, LOOKUP.NONE, LOOKUP.DISMISSED]) {
    const saved = recipientToSave({ typed: 'Alex Moreau', lookup: { status, profile: { handle: 'alexmoreau' }, candidates: [] } });
    assert.equal(saved.toName, 'Alex Moreau', status);
    assert.equal(saved.verified, false, status);
  }
});

test('recipientToSave: plain names and blanks are left alone', () => {
  assert.equal(recipientToSave({ typed: '  Maria  ', lookup: idleLookup }).toName, 'Maria');
  assert.equal(recipientToSave({ typed: '', lookup: idleLookup }).toName, '');
  assert.equal(recipientToSave({ typed: undefined, lookup: idleLookup }).toName, '');
});

test('shortName: first word of a name, the handle when there is no name, long ones cut', () => {
  assert.equal(shortName({ name: 'Elena Voss', handle: 'elenavoss' }), 'Elena');
  assert.equal(shortName({ name: 'Madonna', handle: 'madonna' }), 'Madonna');
  assert.equal(shortName({ name: '', handle: 'elenavoss' }), '@elenavoss');
  assert.equal(shortName({ name: null, handle: 'elenavoss' }), '@elenavoss');
  assert.equal(shortName({ name: '  Alexandrina Wilhelmina Voss ', handle: 'x' }), 'Alexandrina');
  const long = shortName({ name: 'Supercalifragilisticexpialidocious Smith', handle: 'x' });
  assert.equal(long.length, 20);
  assert.ok(long.endsWith('…'));
  assert.equal(shortName(null), '');
});

test('a signature is saved like a recipient: verified handle linked, anything else plain', () => {
  const marcos = { name: 'Marcos Lindqvist', handle: 'marcos' };
  assert.equal(recipientToSave({ typed: 'marcs', lookup: linkTo(marcos) }).toName, '@marcos');
  assert.equal(recipientToSave({ typed: '@marcs', lookup: { ...idleLookup, status: LOOKUP.NOT_FOUND } }).toName, 'marcs');
  assert.equal(recipientToSave({ typed: 'Marcos', lookup: idleLookup }).toName, 'Marcos');
});
