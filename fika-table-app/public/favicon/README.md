# Fika — favicon / app-icon files

The Cup Tile mark, terracotta colorway. Drop the files into your app's
public/static root and paste the tags below into your `<head>`.

## Files
| File | Use |
|------|-----|
| `favicon.svg`          | Modern browsers — scalable, sharpest |
| `favicon.ico`          | Legacy fallback (16/32/48 bundled) |
| `favicon-16.png`       | Browser tab |
| `favicon-32.png`       | Browser tab / bookmarks (retina) |
| `favicon-48.png`       | Windows / general |
| `apple-touch-icon.png` | 180×180 — iOS home screen |
| `icon-192.png`         | Android / PWA manifest |
| `icon-512.png`         | PWA splash / store listing |

## Paste into <head>
```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

## PWA manifest (optional)
```json
"icons": [
  { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
  { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
]
```

## Colorway
Tile `#c9756e` (terracotta accent), artwork `#f3e7cf` (cream).
Want espresso (`#5a3826`) or inverted cream instead? Ask and I'll regenerate the set.
