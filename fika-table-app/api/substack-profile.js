// Matches a Substack handle: what fetchByHandle accepts as input, and what we
// re-check any handle against before trusting it — including ones that come back
// from Substack's own search response, since that's still untrusted input to us
const RE_HANDLE = /^[A-Za-z0-9_.-]+$/;

// Matches a person's display name: letters (incl. accented), digits, spaces, and common name punctuation
const RE_NAME_QUERY = /^[\p{L}\p{N} '.-]{1,100}$/u;

// Vercel serverless function — fetches Substack profile data server-side to avoid CORS.
// No Access-Control-Allow-Origin header: the frontend only ever calls this via a
// same-origin relative path, so no cross-origin access is needed — omitting it keeps
// this from being usable as an open proxy from other sites' client-side JS.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { handle, query } = req.query;

  if (handle) {
    if (!RE_HANDLE.test(handle)) {
      return res.status(400).json({ error: 'Invalid handle' });
    }
    return fetchByHandle(handle, res);
  }

  if (query) {
    if (!RE_NAME_QUERY.test(query)) {
      return res.status(400).json({ error: 'Invalid query' });
    }
    return fetchByName(query, res);
  }

  return res.status(400).json({ error: 'Invalid handle' });
}

// Cap how many same-name candidates we ask the user to disambiguate between
const MAX_CANDIDATES = 5;

// Substack's own site search (used by substack.com/search) — public, no auth required.
// Ranked by a blended relevance/popularity score rather than strict name match, so
// results aren't sorted by name similarity, and more than one person can share the
// same exact name — return every exact match as a candidate for the caller to
// disambiguate instead of guessing which one is "right".
async function fetchByName(query, res) {
  try {
    const resp = await fetch(`https://substack.com/api/v1/profile/search?query=${encodeURIComponent(query)}&page=0`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; fika-table/1.0)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!resp.ok) {
      if (resp.status === 429 || resp.status >= 500) {
        return res.status(503).json({ error: 'Service unavailable' });
      }
      return res.status(404).json({ error: 'Profile not found' });
    }

    const data = await resp.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    const q = query.trim().toLowerCase();

    // Substack's own data, but still untrusted input to us — drop anything whose
    // handle doesn't look like a real handle before it can become a link/stored value
    const validResults = results.filter((r) => RE_HANDLE.test(r.handle || ''));

    const exactMatches = validResults.filter((r) => (r.name || '').trim().toLowerCase() === q);
    let picks = exactMatches;
    if (picks.length === 0) {
      const substringMatch = validResults.find((r) => (r.name || '').toLowerCase().includes(q));
      picks = substringMatch ? [substringMatch] : [];
    }

    if (picks.length === 0) return res.status(404).json({ error: 'Profile not found' });

    const candidates = picks.slice(0, MAX_CANDIDATES).map((r) => ({
      name: r.name || null,
      image: r.photo_url || null,
      description: r.bio || null,
      handle: r.handle,
    }));

    res.setHeader('Cache-Control', 'public, s-maxage=3600, max-age=3600');
    return res.status(200).json({ candidates });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

async function fetchByHandle(handle, res) {
  try {
    const resp = await fetch(`https://substack.com/@${handle}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; fika-table/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    });

    // Distinguish rate-limits / server errors from "handle doesn't exist"
    if (!resp.ok) {
      if (resp.status === 429 || resp.status >= 500) {
        return res.status(503).json({ error: 'Service unavailable' });
      }
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Substack redirects non-existent handles away; also accept subdomain form (publications)
    const finalUrl = resp.url.toLowerCase();
    const handleLower = handle.toLowerCase();
    if (!finalUrl.includes(`/@${handleLower}`) && !finalUrl.includes(`${handleLower}.substack.com`)) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const html = await resp.text();

    const decode = (s) => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

    // Match by actual quote type to avoid truncation on apostrophes in content
    const getMeta = (attr, value) => {
      const patterns = [
        new RegExp(`<meta[^>]+${attr}=["']${value}["'][^>]+content="([^"]+)"`, 'i'),
        new RegExp(`<meta[^>]+${attr}=["']${value}["'][^>]+content='([^']+)'`, 'i'),
        new RegExp(`<meta[^>]+content="([^"]+)"[^>]+${attr}=["']${value}["']`, 'i'),
        new RegExp(`<meta[^>]+content='([^']+)'[^>]+${attr}=["']${value}["']`, 'i'),
      ];
      for (const re of patterns) {
        const m = html.match(re);
        if (m) return decode(m[1]);
      }
      return null;
    };

    // Prefer the real avatar from JSON-LD Person schema over the og:image social card.
    // matchAll scans all <script type="application/ld+json"> blocks in case Person is not first.
    let image = null;
    for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const data = JSON.parse(m[1]);
        const objs = Array.isArray(data) ? data : [data];
        for (const obj of objs) {
          if (obj['@type'] === 'Person' && obj.image) {
            image = typeof obj.image === 'string' ? obj.image : (obj.image?.url ?? null);
            break;
          }
        }
      } catch { /* ignore parse errors */ }
      if (image) break;
    }
    if (!image) image = getMeta('property', 'og:image') || getMeta('name', 'twitter:image');

    // Strip " | Substack" suffix from the og:title
    const rawName = getMeta('property', 'og:title') || getMeta('name', 'twitter:title');
    const name = rawName?.replace(/\s*\|\s*Substack\s*$/i, '').trim() || null;

    const description = getMeta('property', 'og:description') || getMeta('name', 'twitter:description');

    if (!name) return res.status(404).json({ error: 'Profile not found' });

    res.setHeader('Cache-Control', 'public, s-maxage=3600, max-age=3600');
    return res.status(200).json({ name, image, description, handle });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}
