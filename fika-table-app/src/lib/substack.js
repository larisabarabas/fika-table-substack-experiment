// Hoisted to module scope — not recreated on every call (rule: js-hoist-regexp)
const RE_HANDLE      = /^@([A-Za-z0-9_.-]+)$/;
const RE_SUBSTACK_AT = /^(?:https?:\/\/)?(?:www\.)?substack\.com\/@([A-Za-z0-9_.-]+)\/?$/i;
const RE_SUBSTACK_SUB = /^(?:https?:\/\/)?([A-Za-z0-9-]+)\.substack\.com\/?$/i;

// Returns the bare handle string (no @) if input is a @handle or substack.com/@handle URL, else null
export function extractHandle(input) {
  if (!input) return null;
  const n = String(input).trim().replace(/^@{2,}/, '@');
  let m = n.match(RE_HANDLE);
  if (m) return m[1];
  m = n.match(RE_SUBSTACK_AT);
  if (m) return m[1];
  return null;
}

export function parseSubstackUrl(name) {
  if (!name) return null;
  const n = String(name).trim().replace(/^@{2,}/, '@');

  let m = n.match(RE_HANDLE);
  if (m) return 'https://substack.com/@' + m[1];

  m = n.match(RE_SUBSTACK_AT);
  if (m) return 'https://substack.com/@' + m[1];

  m = n.match(RE_SUBSTACK_SUB);
  if (m && m[1].toLowerCase() !== 'www') return 'https://' + m[1] + '.substack.com';

  return null;
}
