import { CONFIG } from '../config.js';

// Addresses only this machine or network can open — a link to one is dead for anyone else
const RE_PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\]$)/;

// Origin to put in links we hand out. Local addresses fall back to the live site;
// a preview deployment or the live site itself uses its own address.
export function siteOrigin(location, siteUrl = CONFIG.siteUrl) {
  return RE_PRIVATE_HOST.test(location.hostname) ? siteUrl : location.origin;
}

export function getShareUrl(id) {
  return `${siteOrigin(window.location)}/share/${id}`;
}

export function getShareText(slice) {
  const to = (slice.toName || 'the table').replace(/^@{2,}/, '@');
  return `A kind word for ${to} on Fika for Substack:\n"${slice.message}"\n${getShareUrl(slice.id)}`;
}
