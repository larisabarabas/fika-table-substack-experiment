// Vercel serverless function — fetches Substack profile data server-side to avoid CORS
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

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
    });

    if (!resp.ok) return res.status(404).json({ error: 'Profile not found' });

    const html = await resp.text();

    const decode = (s) => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

    const getMeta = (attr, value) => {
      const a = html.match(new RegExp(`<meta[^>]+${attr}=["']${value}["'][^>]+content=["']([^"']+)["']`, 'i'));
      if (a) return decode(a[1]);
      const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${value}["']`, 'i'));
      return b ? decode(b[1]) : null;
    };

    // Prefer the real avatar from JSON-LD Person schema over the og:image social card
    let image = null;
    const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const data = JSON.parse(jsonLdMatch[1]);
        const objs = Array.isArray(data) ? data : [data];
        for (const obj of objs) {
          if (obj['@type'] === 'Person' && obj.image) {
            image = typeof obj.image === 'string' ? obj.image : obj.image?.url ?? null;
            break;
          }
        }
      } catch { /* ignore parse errors */ }
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
