import { extractHandle } from './substack.js';

// The "Their name or Substack @handle" field has one lookup state. Everything the
// form shows, and what gets saved, follows from it.
export const LOOKUP = {
  IDLE: 'idle',               // nothing typed, or nothing to look up
  SEARCHING: 'searching',
  LINKED: 'linked',           // a Substack profile we are sure about
  CONFIRM: 'confirm',         // one loose match; the giver must say yes
  CHOOSE: 'choose',           // several people share the name
  NONE: 'none',               // the giver rejected every match
  NOT_FOUND: 'notfound',
  UNREACHABLE: 'unreachable', // Substack could not be reached
  DISMISSED: 'dismissed',     // the giver said "Not them" or chose to keep the name without a link
};

export const idleLookup = { status: LOOKUP.IDLE, profile: null, candidates: [] };
export const searchingLookup = { status: LOOKUP.SEARCHING, profile: null, candidates: [] };

// What kind of lookup a typed value needs, if any. With names: false only a handle or a
// profile link is looked up; a plain name is left alone (a signature is usually just a first name).
export function classifyInput(raw, { names = true } = {}) {
  const typed = (raw || '').trim();
  if (!typed) return { kind: 'none', typed };
  const handle = extractHandle(typed);
  if (handle) return { kind: 'handle', handle, typed };
  // Plain text with no '@' is a display name to search for. Anything containing '@'
  // that isn't a valid handle or profile URL (a stray "@", say) is left alone.
  if (names && !typed.includes('@')) return { kind: 'name', query: typed, typed };
  return { kind: 'none', typed };
}

const unreachable = { status: LOOKUP.UNREACHABLE, profile: null, candidates: [] };
const notFound = { status: LOOKUP.NOT_FOUND, profile: null, candidates: [] };

// Turns the lookup response into the next state. `result` is one of:
//   { ok: true, data }       the response body
//   { ok: false, status }    an HTTP error
//   { network: true }        the request failed or timed out
export function lookupFromResult(kind, result) {
  if (result.network) return unreachable;
  if (!result.ok) return result.status >= 500 ? unreachable : notFound;

  const data = result.data || {};
  if (kind === 'handle') {
    return data.error || !data.handle
      ? notFound
      : { status: LOOKUP.LINKED, profile: data, candidates: [] };
  }

  const found = Array.isArray(data.candidates) ? data.candidates : [];
  if (data.error || found.length === 0) return notFound;
  if (found.length > 1) return { status: LOOKUP.CHOOSE, profile: null, candidates: found };
  // Only an exact name match is trusted on its own; a partial match must be confirmed
  return found[0].match === 'exact'
    ? { status: LOOKUP.LINKED, profile: found[0], candidates: [] }
    : { status: LOOKUP.CONFIRM, profile: found[0], candidates: [] };
}

export function linkTo(profile) {
  return { status: LOOKUP.LINKED, profile, candidates: [] };
}

// What to save as the recipient. Only a profile we are sure about is saved as an
// @handle, because the wall turns any @handle into a link to that Substack profile.
// An unverified one is saved as plain text so a typo never links to a stranger.
export function recipientToSave({ typed, lookup }) {
  const text = (typed || '').trim();
  if (lookup.status === LOOKUP.LINKED && lookup.profile?.handle) {
    return { toName: '@' + lookup.profile.handle, verified: true, profile: lookup.profile };
  }
  const handle = extractHandle(text);
  const plain = (handle ?? text).replace(/^@+/, '');
  return { toName: plain, verified: false, profile: null };
}

const MAX_SHORT_NAME = 20;

// Name for a button ("Tell Elena on Substack"): a person's first word, the whole
// name when it is a single word, the @handle when there is no name. Long ones are cut.
export function shortName(profile) {
  const name = (profile?.name || '').trim();
  const base = name ? name.split(/\s+/)[0] : (profile?.handle ? '@' + profile.handle : '');
  return base.length > MAX_SHORT_NAME ? base.slice(0, MAX_SHORT_NAME - 1) + '…' : base;
}
