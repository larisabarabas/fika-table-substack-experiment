// The address link previews should point at. Build-time only: used by vite.config.js to
// fill the social tags in index.html, so a preview deployment shows its own image
// instead of the live site's.
export const PRODUCTION_URL = 'https://fika.stefaniabarabas.com';

// Vercel sets VERCEL_ENV (production, preview or development) and VERCEL_URL (this
// deployment's own address, without https://) during its builds.
export function siteUrlFromEnv(env) {
  if (env.VERCEL_ENV === 'preview' && env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return PRODUCTION_URL;
}
