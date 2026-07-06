// Vercel serverless function — fetches Substack profile data server-side to avoid CORS
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { handle } = req.query;
  if (!handle || !/^[A-Za-z0-9_.-]+$/.test(handle)) {
    return res.status(400).json({ error: 'Invalid handle' });
  }

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
    return res.status(200).json({ name, image, description });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}
