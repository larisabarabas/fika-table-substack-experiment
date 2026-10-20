import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { siteUrlFromEnv } from './scripts/siteUrl.js'

const siteUrl = siteUrlFromEnv(process.env)

// Fills __SITE_URL__ in index.html (the og:url and og:image tags). Link previews need
// absolute addresses, and a preview deployment's must point at itself.
const siteUrlTags = {
  name: 'site-url-tags',
  transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), siteUrlTags],
})
