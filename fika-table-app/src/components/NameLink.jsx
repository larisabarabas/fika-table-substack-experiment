import { parseSubstackUrl } from '../lib/substack';

// Inside cards/buttons — visual cue only, no nested <a>
export function NameSpan({ name, fallback }) {
  const url = parseSubstackUrl(name);
  const display = url ? name.replace(/^@{2,}/, '@') : name;
  if (!url) return <span>{display || fallback}</span>;
  return <span className="sub-name" title={url}>{display}</span>;
}

// Inside modals where a real link is valid
export function NameLink({ name, fallback }) {
  const url = parseSubstackUrl(name);
  const display = url ? name.replace(/^@{2,}/, '@') : name;
  if (!url) return <span>{display || fallback}</span>;
  return (
    <a
      className="sub-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {display}<span className="sub-arr">↗</span>
    </a>
  );
}
