import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Where each history entry was scrolled to, so Back returns to it. Module-level: it outlives the
// layout remounting (sign-out and back in), like the browser's own history.
const positions = new Map<string, number>();

/**
 * Every signed-in page scrolls inside one container in the app layout, which stays mounted, so
 * without this a page opens at the previous page's scroll offset (a task opened from a board
 * scrolled down opened halfway down). A new page starts at the top; Back and Forward return to
 * where that entry was. A change to the query or hash alone (a filter, an Inbox tab) is the same
 * page and keeps its place. `ScrollRestoration` handles only the window, not an inner scroller.
 * Returns the ref to put on that container.
 */
export function useRouteScroll<T extends HTMLElement>() {
  const scroller = useRef<T>(null);
  const { key, pathname } = useLocation();
  const navigationType = useNavigationType();
  const current = useRef({ key, pathname });

  // Recorded as it scrolls: by the time a navigation commits, the new page is in the DOM and
  // the old offset may already be clamped to its height.
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const record = () => positions.set(current.current.key, element.scrollTop);
    element.addEventListener("scroll", record, { passive: true });
    return () => element.removeEventListener("scroll", record);
  }, []);

  // Before paint, so the old offset never flashes.
  useLayoutEffect(() => {
    const element = scroller.current;
    const previous = current.current;
    current.current = { key, pathname };
    if (!element || previous.pathname === pathname) return;
    element.scrollTop = navigationType === "POP" ? (positions.get(key) ?? 0) : 0;
  }, [key, pathname, navigationType]);

  return scroller;
}
