// The slices this browser gave, with the secret that lets it edit or delete them.
// Only per-browser: clear the site data and the token is gone, which is why the
// success screen also offers it as a private link. Storage can be missing or throw
// (private windows, blocked data), so every call degrades to "nothing remembered".

const KEY = 'fika.ownedSlices';
const KEEP = 100;

function readAll(storage) {
  try {
    const all = JSON.parse(storage.getItem(KEY));
    return all && typeof all === 'object' && !Array.isArray(all) ? all : {};
  } catch {
    return {};
  }
}

export function rememberSlice(id, token, storage = globalThis.localStorage, now = Date.now()) {
  if (!id || !token) return false;
  try {
    const all = readAll(storage);
    all[id] = { token, at: now };
    const newest = Object.entries(all).sort((a, b) => (b[1]?.at ?? 0) - (a[1]?.at ?? 0)).slice(0, KEEP);
    storage.setItem(KEY, JSON.stringify(Object.fromEntries(newest)));
    return true;
  } catch {
    return false;
  }
}

export function editTokenFor(id, storage = globalThis.localStorage) {
  const entry = readAll(storage)[id];
  return typeof entry?.token === 'string' ? entry.token : null;
}

// Ids of every slice this browser can still edit or delete
export function ownedIds(storage = globalThis.localStorage) {
  return new Set(Object.keys(readAll(storage)));
}

export function forgetSlice(id, storage = globalThis.localStorage) {
  try {
    const all = readAll(storage);
    if (!(id in all)) return;
    delete all[id];
    storage.setItem(KEY, JSON.stringify(all));
  } catch {
    // nothing to forget if storage is unavailable
  }
}
