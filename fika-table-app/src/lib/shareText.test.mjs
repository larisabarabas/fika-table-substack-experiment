import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTellNote } from './shareText.js';

test('the Note puts the profile link first, the message in quotes, and the slice link last', () => {
  const note = buildTellNote({
    profileUrl: 'https://substack.com/@elenavoss',
    message: 'Your essay made my week.',
    noteUrl: 'https://fika.stefaniabarabas.com/note/abc',
  });
  assert.equal(note, 'A kind word for https://substack.com/@elenavoss on Fika:\n"Your essay made my week."\nhttps://fika.stefaniabarabas.com/note/abc');
  const lines = note.split('\n');
  assert.ok(lines[0].includes('/@elenavoss'));
  assert.ok(lines.at(-1).endsWith('/note/abc'));
});
