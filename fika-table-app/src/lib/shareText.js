export function getShareUrl(id) {
  return `${window.location.origin}/share/${id}`;
}

// Where the person a kind word is for lands when they follow a Note's link
export function getNoteUrl(id) {
  return `${window.location.origin}/note/${id}`;
}

// The giver's private link to change or delete their own slice: it opens the table with the
// give form filled in. The token sits in the #fragment, which browsers never send to a
// server, so it stays out of logs and analytics.
export function getEditUrl(id, token) {
  return `${window.location.origin}/table?edit=${id}#${token}`;
}

// The Note the giver posts on Substack. The profile link comes first so Substack can
// turn it into a mention; the slice link last so it can become the preview card.
export function buildTellNote({ profileUrl, message, noteUrl }) {
  return `A kind word for ${profileUrl} on Fika:\n"${message}"\n${noteUrl}`;
}

export function getShareText(slice, url = getShareUrl(slice.id)) {
  const to = (slice.toName || 'the table').replace(/^@{2,}/, '@');
  return `A kind word for ${to} on Fika for Substack:\n"${slice.message}"\n${url}`;
}
