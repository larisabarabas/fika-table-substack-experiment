import { useState, useEffect, useCallback } from 'react';
import {
  LOOKUP, idleLookup, searchingLookup, classifyInput, lookupFromResult, linkTo,
} from '../lib/recipient.js';

// Runs the Substack lookup for one text field and keeps its state (see lib/recipient.js).
//   names: false  only handles and profile links are looked up (used for the signature)
//   initial       a value already in the field when the form opens; it is looked up straight away
export function useProfileLookup(value, { names = true, initial = '' } = {}) {
  const [lookup, setLookup] = useState(
    () => (classifyInput(initial, { names }).kind === 'none' ? idleLookup : searchingLookup),
  );
  const [attempt, setAttempt] = useState(0);

  // Look the value up once the person pauses. onTyping puts the field in "searching"
  // straight away, so a submit can't slip in before the answer.
  useEffect(() => {
    const input = classifyInput(value, { names });
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (cancelled) return;
      if (input.kind === 'none') { setLookup(idleLookup); return; }
      setLookup(searchingLookup);
      const giveUp = setTimeout(() => controller.abort(), 8000);
      try {
        const param = input.kind === 'handle' ? `handle=${encodeURIComponent(input.handle)}` : `query=${encodeURIComponent(input.query)}`;
        const res = await fetch(`/api/substack-profile?${param}`, { signal: controller.signal });
        const next = res.ok
          ? lookupFromResult(input.kind, { ok: true, data: await res.json() })
          : lookupFromResult(input.kind, { ok: false, status: res.status });
        if (!cancelled) setLookup(next);
      } catch {
        if (!cancelled) setLookup(lookupFromResult(input.kind, { network: true }));
      } finally {
        clearTimeout(giveUp);
      }
    }, input.kind === 'none' ? 0 : 600);
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [value, names, attempt]);

  const onTyping = useCallback(
    (next) => setLookup(classifyInput(next, { names }).kind === 'none' ? idleLookup : searchingLookup),
    [names],
  );
  const reset = useCallback(() => setLookup(idleLookup), []);
  const retry = useCallback(() => { setLookup(searchingLookup); setAttempt((n) => n + 1); }, []);
  // "Not them" on a loose match means none of the matches; on a confirmed one it just drops the link
  const reject = useCallback(
    () => setLookup((cur) => ({ ...idleLookup, status: cur.status === LOOKUP.LINKED ? LOOKUP.DISMISSED : LOOKUP.NONE })),
    [],
  );
  const keepPlain = useCallback(() => setLookup({ ...idleLookup, status: LOOKUP.DISMISSED }), []);
  const confirm = useCallback((profile) => setLookup(linkTo(profile)), []);

  return { lookup, onTyping, reset, retry, reject, keepPlain, confirm };
}
