// The picture URL in a Substack response is still untrusted input to us, like the handle is.
// Only https pictures from Substack's own image hosts are shown; anything else falls back to
// the initials avatar. Keep this list in step with img-src in vercel.json (scripts/csp.test.mjs
// checks that they match).
export const AVATAR_HOSTS = [
  'substackcdn.com',
  'substack-post-media.s3.amazonaws.com',
  'bucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com',
];

export function safeAvatarUrl(value) {
  if (typeof value !== 'string') return null;
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.port || url.username || url.password) return null;
  return AVATAR_HOSTS.includes(url.hostname) ? url.href : null;
}
