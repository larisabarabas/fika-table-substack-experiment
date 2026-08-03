import { useEffect, useMemo, useRef, useState } from 'react';

// Mirrors the old `columns: 3 260px` fluid breakpoint: as many >=260px
// columns as fit, capped at 3, collapsing to 1 below 560px.
const MIN_COLUMN_WIDTH = 260;
const MAX_COLUMNS = 3;
const GAP = 16;
const MOBILE_BREAKPOINT = 560;

// No fixed aspect-ratio exists for these cards (message length varies), so
// height is estimated from text length rather than read from known data.
const CARD_CHROME_HEIGHT = 40 + 7 + 18; // borders/padding/gaps + frost + tag
const NAME_LINE_HEIGHT = 30;
const MESSAGE_LINE_HEIGHT = 21;
const CHARS_PER_NAME_LINE = 30;
const MESSAGE_CHAR_WIDTH = 7; // avg px per char at 13.5px body text
const CARD_MARGIN_BOTTOM = 16;

function estimateCardHeight(item, columnWidth) {
  const nameChars = (item.fromName?.length ?? 0) + (item.toName?.length ?? 0);
  const nameLines = Math.max(1, Math.ceil(nameChars / CHARS_PER_NAME_LINE));

  const charsPerMessageLine = Math.max(10, Math.floor(columnWidth / MESSAGE_CHAR_WIDTH));
  const messageLines = Math.max(1, Math.ceil((item.message?.length ?? 0) / charsPerMessageLine));

  return CARD_CHROME_HEIGHT
    + nameLines * NAME_LINE_HEIGHT
    + messageLines * MESSAGE_LINE_HEIGHT
    + CARD_MARGIN_BOTTOM;
}

function columnsForWidth(width) {
  if (width <= 0) return MAX_COLUMNS;
  if (width < MOBILE_BREAKPOINT) return 1;
  return Math.max(1, Math.min(MAX_COLUMNS, Math.floor((width + GAP) / (MIN_COLUMN_WIDTH + GAP))));
}

// Greedily assigns items to whichever column has the smallest running
// estimated height — a masonry layout in plain flexbox, replacing CSS
// `columns` to avoid Safari's columns+break-inside-avoid+hover-transform
// flicker bug.
export function useMasonryColumns(items) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 0 : window.innerWidth));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columnCount = columnsForWidth(width);

  const columns = useMemo(() => {
    const cols = Array.from({ length: columnCount }, () => []);
    const heights = new Array(columnCount).fill(0);
    const columnWidth = (width - GAP * (columnCount - 1)) / columnCount;

    for (const item of items) {
      let shortest = 0;
      for (let i = 1; i < columnCount; i++) {
        if (heights[i] < heights[shortest]) shortest = i;
      }
      cols[shortest].push(item);
      heights[shortest] += estimateCardHeight(item, columnWidth);
    }
    return cols;
  }, [items, columnCount, width]);

  return { containerRef, columns };
}
