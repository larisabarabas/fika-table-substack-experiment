// "today", "yesterday", "12 October", or "12 October 2025" for a slice's date.
// Local time, so a word left late in the evening still says "today" to the person who left it.
const FULL = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const SHORT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' });

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function formatDay(iso, now = new Date()) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return date.getFullYear() === now.getFullYear() ? SHORT.format(date) : FULL.format(date);
}
