/**
 * No-Retreat Mode: Smart key blocking that only prevents deletion
 * of NEW text written during the current session.
 *
 * Pre-existing text (before sessionStartOffset) is protected — users
 * cannot delete it. New text (after sessionStartOffset) is also protected
 * when no-retreat is active.
 *
 * The always-on blocking in flow-editor.tsx blocks ALL destructive keys.
 * This handler is the smart alternative: it blocks only in the "new text zone."
 */

interface ShouldBlockKeyParams {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  cursorPos: number;
  selectionStart: number;
  selectionEnd: number;
  sessionStartOffset: number;
}

/**
 * Determines whether a destructive key event should be blocked in No-Retreat mode.
 *
 * Rules:
 * - Destructive keys in the pre-existing zone (before sessionStartOffset): always blocked
 * - Destructive keys in the new-text zone (at or after sessionStartOffset): blocked in no-retreat
 * - Selection spanning the boundary: blocked (conservative)
 * - Non-destructive keys: never blocked
 */
export function shouldBlockKey({
  key,
  ctrlKey,
  metaKey,
  cursorPos,
  selectionStart,
  selectionEnd,
  sessionStartOffset,
}: ShouldBlockKeyParams): boolean {
  // Only consider destructive keys
  if (!isDestructiveKey(key, ctrlKey, metaKey)) {
    return false;
  }

  // If there's a selection that spans the boundary, always block
  if (selectionStart !== selectionEnd) {
    if (selectionStart < sessionStartOffset && selectionEnd >= sessionStartOffset) {
      return true;
    }
    // Selection entirely in pre-existing zone: block
    if (selectionEnd <= sessionStartOffset) {
      return true;
    }
    // Selection entirely in new zone: block (no-retreat active)
    return true;
  }

  // No selection — cursor position determines zone
  // Backspace deletes char before cursor, Delete deletes char at cursor
  if (key === 'Backspace') {
    // Would delete into pre-existing zone
    if (cursorPos <= sessionStartOffset) return true;
    // In new zone: block (no-retreat active)
    return true;
  }

  if (key === 'Delete') {
    // In pre-existing zone
    if (cursorPos < sessionStartOffset) return true;
    // In new zone: block (no-retreat active)
    return true;
  }

  // Ctrl+Z, Ctrl+X, Ctrl+Backspace, Ctrl+Delete — always block when no-retreat is active
  return true;
}

function isDestructiveKey(key: string, ctrlKey: boolean, metaKey: boolean): boolean {
  if (key === 'Backspace' || key === 'Delete') return true;
  if ((ctrlKey || metaKey) && key === 'z') return true;
  if ((ctrlKey || metaKey) && key === 'x') return true;
  if (ctrlKey && key === 'Backspace') return true;
  if (ctrlKey && key === 'Delete') return true;
  return false;
}

export { isDestructiveKey };
