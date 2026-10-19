export function getShareUrl(id) {
  return `${window.location.origin}/share/${id}`;
}

export function getShareText(slice) {
  const to = (slice.toName || 'the table').replace(/^@{2,}/, '@');
  return `A kind word for ${to} on Fika for Substack:\n"${slice.message}"\n${getShareUrl(slice.id)}`;
}
