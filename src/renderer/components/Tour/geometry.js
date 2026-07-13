// Pure geometry helpers for the tour overlay: they take viewport-relative
// rectangles and return the boxes used to render the spotlight and the card.
// Kept free of React so they stay easy to reason about and test.

export const SPOTLIGHT_PADDING = 8;
const CARD_MARGIN = 12;
const CARD_WIDTH = 340;
const CARD_ESTIMATED_HEIGHT = 210;

// Union of the rects of all visible elements matching the selector.
// Returns `null` for selector-less (centered) steps and `false` if nothing matches.
export const measureStep = (selector) => {
  if (!selector) {
    return null;
  }
  const rects = [...document.querySelectorAll(selector)].map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
  if (!rects.length) {
    return false;
  }
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.right));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return { left, top, right, bottom };
};

// The transparent cut-out around the highlighted element, padded and clamped to
// the viewport. Returns `null` for centered steps (no highlighted element).
export const computeHole = (rect, vw, vh) => {
  if (!rect) {
    return null;
  }
  return {
    left: Math.max(rect.left - SPOTLIGHT_PADDING, 0),
    top: Math.max(rect.top - SPOTLIGHT_PADDING, 0),
    right: Math.min(rect.right + SPOTLIGHT_PADDING, vw),
    bottom: Math.min(rect.bottom + SPOTLIGHT_PADDING, vh),
  };
};

// Absolute position for the step card: centered when there is no hole, otherwise
// below the hole when there is room, above it as a fallback.
export const computeCardStyle = (hole, vw, vh) => {
  const cardWidth = Math.min(CARD_WIDTH, vw - 2 * CARD_MARGIN);
  if (!hole) {
    return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: `${cardWidth}px` };
  }
  const centerX = (hole.left + hole.right) / 2;
  const left = Math.min(Math.max(centerX - cardWidth / 2, CARD_MARGIN), vw - cardWidth - CARD_MARGIN);
  if (hole.bottom + CARD_MARGIN + CARD_ESTIMATED_HEIGHT <= vh - CARD_MARGIN) {
    return { left: `${left}px`, top: `${hole.bottom + CARD_MARGIN}px`, width: `${cardWidth}px` };
  }
  return { left: `${left}px`, bottom: `${vh - hole.top + CARD_MARGIN}px`, width: `${cardWidth}px` };
};
