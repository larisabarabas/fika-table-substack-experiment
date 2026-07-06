// Vercel serverless function — fetches Substack OG meta server-side to avoid CORS
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

    const getMeta = (attr, value) => {
      const decode = (s) => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      const a = html.match(new RegExp(`<meta[^>]+${attr}=["']${value}["'][^>]+content=["']([^"']+)["']`, 'i'));
      if (a) return decode(a[1]);
      const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${value}["']`, 'i'));
      return b ? decode(b[1]) : null;
    };

    const name        = getMeta('property', 'og:title')       || getMeta('name', 'twitter:title');
    const image       = getMeta('property', 'og:image')       || getMeta('name', 'twitter:image');
    const description = getMeta('property', 'og:description') || getMeta('name', 'twitter:description');

    if (!name) return res.status(404).json({ error: 'Profile not found' });

    res.setHeader('Cache-Control', 'public, s-maxage=3600, max-age=3600');
    return res.status(200).json({ name, image, description });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}
