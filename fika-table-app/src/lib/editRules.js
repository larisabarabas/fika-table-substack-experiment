// Rules for editing your own slice. The window must match update_slice in
// supabase/migrations/00000000000002_edit_own_slices.sql.
export const EDIT_WINDOW_HOURS = 24;

const HOUR = 3600 * 1000;

// Whether the slice can still be edited, and how to say how long is left
export function editTimeLeft(createdAt, now = new Date()) {
  const made = new Date(createdAt).getTime();
  if (Number.isNaN(made)) return { open: false, label: '' };
  const left = made + EDIT_WINDOW_HOURS * HOUR - new Date(now).getTime();
  if (left <= 0) return { open: false, label: '' };
  const hours = Math.floor(left / HOUR);
  if (hours < 1) return { open: true, label: 'Less than an hour left to edit' };
  return { open: true, label: `${hours} hour${hours === 1 ? '' : 's'} left to edit` };
}

// update_slice and delete_slice raise 'forbidden' (wrong token or unknown id, deliberately
// the same) and 'window_closed'; anything else is a failure worth retrying.
export function editErrorFrom(error) {
  const text = String(error?.message ?? '');
  if (text.includes('window_closed')) return 'window_closed';
  if (text.includes('forbidden')) return 'forbidden';
  return 'other';
}
