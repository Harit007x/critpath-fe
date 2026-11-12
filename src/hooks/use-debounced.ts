import { useEffect, useRef, useState } from "react";

/**
 * Settle a value before it reaches the network.
 *
 * Used by the caption studio, where the preview is driven by local state and
 * repaints on every keystroke — this is only about how often the job is
 * WRITTEN. 500ms is long enough that dragging a slider is one request rather
 * than sixty, and short enough that a creator who closes the tab straight after
 * a change does not lose it.
 *
 * The first value passes through immediately rather than after a delay: the
 * initial state is what was loaded from the server, and debouncing it would fire
 * a pointless write of the values that came from there.
 *
 * Its own file rather than living beside the controls it serves, because a
 * module that exports both a component and a hook breaks Fast Refresh.
 */
export function useDebounced<T>(value: T, delayMs = 500): T {
  const [settled, setSettled] = useState(value);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}
