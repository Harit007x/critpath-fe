import { type KeyboardEvent, type PointerEvent, useState } from "react";

// 208, not 200 (owner, 2026-10-31): the Beta card's first line, "Expect some turbulence", needs
// 160 px inside it, which 200 left 2 px short of, wrapping it into three rows.
export const SIDEBAR_MIN = 208;
export const SIDEBAR_MAX = 380;
export const SIDEBAR_DEFAULT = 256;
/** Dragging the edge further in than this collapses the sidebar to its rail. */
const COLLAPSE_BELOW = 140;
const KEY = "critpath:sidebar-width";

const clamp = (value: number) =>
  Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(value)));

const readWidth = () => {
  try {
    const stored = Number(localStorage.getItem(KEY));
    return stored ? clamp(stored) : SIDEBAR_DEFAULT;
  } catch {
    return SIDEBAR_DEFAULT;
  }
};

const saveWidth = (width: number) => {
  try {
    localStorage.setItem(KEY, String(width));
  } catch {
    // Storage unavailable; the width just isn't remembered.
  }
};

/**
 * A drag-to-resize sidebar width, remembered per browser. Returns the width,
 * whether a drag is in progress (to switch off the width transition), and
 * props for the resize handle: drag it, double-click to reset, or focus it and
 * use the arrow keys.
 */
export function useSidebarWidth(onCollapse: () => void) {
  const [width, setWidth] = useState(readWidth);
  const [resizing, setResizing] = useState(false);

  const commit = (next: number) => {
    const value = clamp(next);
    setWidth(value);
    saveWidth(value);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    // The sidebar's left edge, so the width follows the pointer exactly.
    const left = handle.parentElement?.getBoundingClientRect().left ?? 0;
    let latest = width;
    setResizing(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const finish = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", finish);
      handle.removeEventListener("pointercancel", finish);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setResizing(false);
      if (latest < COLLAPSE_BELOW) onCollapse();
      else commit(latest);
    };
    const move = (moveEvent: globalThis.PointerEvent) => {
      latest = moveEvent.clientX - left;
      setWidth(clamp(latest));
    };

    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 48 : 16;
    if (event.key === "ArrowLeft") commit(width - step);
    else if (event.key === "ArrowRight") commit(width + step);
    else if (event.key === "Home") commit(SIDEBAR_MIN);
    else if (event.key === "End") commit(SIDEBAR_MAX);
    else return;
    event.preventDefault();
  };

  const handleProps = {
    role: "separator",
    "aria-orientation": "vertical" as const,
    "aria-label": "Resize sidebar",
    "aria-valuemin": SIDEBAR_MIN,
    "aria-valuemax": SIDEBAR_MAX,
    "aria-valuenow": width,
    tabIndex: 0,
    title: "Drag to resize · double-click to reset",
    onPointerDown,
    onKeyDown,
    onDoubleClick: () => commit(SIDEBAR_DEFAULT),
  };

  return { width, resizing, handleProps };
}
