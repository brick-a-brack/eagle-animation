import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_HISTORY = 50;

export function useHistory({ key, serialize = JSON.stringify }) {
  const historyRef = useRef([]);
  const cursorRef = useRef(-1);
  const cursorFPRef = useRef(null);
  const [undoState, setUndoState] = useState({ canUndo: false, canRedo: false });

  useEffect(() => {
    historyRef.current = [];
    cursorRef.current = -1;
    cursorFPRef.current = null;
    setUndoState({ canUndo: false, canRedo: false });
  }, [key]);

  const push = useCallback(
    (data) => {
      const fp = serialize(data);
      if (fp === cursorFPRef.current) return false;

      const newHistory = [...historyRef.current.slice(0, cursorRef.current + 1), data];
      historyRef.current = newHistory.slice(-MAX_HISTORY);
      cursorRef.current = historyRef.current.length - 1;
      cursorFPRef.current = fp;
      setUndoState({ canUndo: cursorRef.current > 0, canRedo: false });
      return true;
    },
    [serialize]
  );

  const undo = useCallback(() => {
    if (cursorRef.current <= 0) return null;
    cursorRef.current--;
    const target = historyRef.current[cursorRef.current];
    cursorFPRef.current = serialize(target);
    setUndoState({ canUndo: cursorRef.current > 0, canRedo: true });
    return target;
  }, [serialize]);

  const redo = useCallback(() => {
    if (cursorRef.current >= historyRef.current.length - 1) return null;
    cursorRef.current++;
    const target = historyRef.current[cursorRef.current];
    cursorFPRef.current = serialize(target);
    setUndoState({ canUndo: true, canRedo: cursorRef.current < historyRef.current.length - 1 });
    return target;
  }, [serialize]);

  return { push, undo, redo, ...undoState };
}
