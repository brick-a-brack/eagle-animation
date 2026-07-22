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
// placed on the first side of the hole where it fits, trying below, above, right
// and left in turn. Falls back to centering when the target is too large to leave
// room on any side, so the card never overflows the viewport.
export const computeCardStyle = (hole, vw, vh) => {
  const cardWidth = Math.min(CARD_WIDTH, vw - 2 * CARD_MARGIN);
  const centered = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: `${cardWidth}px` };
  if (!hole) {
    return centered;
  }

  const centerX = (hole.left + hole.right) / 2;
  const centerY = (hole.top + hole.bottom) / 2;
  // Cross-axis position, centered on the hole and clamped inside the viewport.
  const clampedLeft = Math.min(Math.max(centerX - cardWidth / 2, CARD_MARGIN), vw - cardWidth - CARD_MARGIN);
  const clampedTop = Math.min(Math.max(centerY - CARD_ESTIMATED_HEIGHT / 2, CARD_MARGIN), vh - CARD_ESTIMATED_HEIGHT - CARD_MARGIN);

  // Below the hole
  if (hole.bottom + CARD_MARGIN + CARD_ESTIMATED_HEIGHT <= vh - CARD_MARGIN) {
    return { left: `${clampedLeft}px`, top: `${hole.bottom + CARD_MARGIN}px`, width: `${cardWidth}px` };
  }
  // Above the hole (anchored by its bottom edge, so the actual height doesn't matter)
  if (hole.top - CARD_MARGIN - CARD_ESTIMATED_HEIGHT >= CARD_MARGIN) {
    return { left: `${clampedLeft}px`, bottom: `${vh - hole.top + CARD_MARGIN}px`, width: `${cardWidth}px` };
  }
  // To the right of the hole
  if (hole.right + CARD_MARGIN + cardWidth <= vw - CARD_MARGIN) {
    return { left: `${hole.right + CARD_MARGIN}px`, top: `${clampedTop}px`, width: `${cardWidth}px` };
  }
  // To the left of the hole
  if (hole.left - CARD_MARGIN - cardWidth >= CARD_MARGIN) {
    return { left: `${hole.left - CARD_MARGIN - cardWidth}px`, top: `${clampedTop}px`, width: `${cardWidth}px` };
  }

  // Target too large to leave room on any side — center to stay on-screen.
  return centered;
};
