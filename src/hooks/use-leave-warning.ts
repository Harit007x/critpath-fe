import { useEffect } from "react";

/**
 * While `active`, reloading or closing the tab asks "Leave site?" first. Used during an upload,
 * which a reload would cancel with nothing to show for it.
 */
export function useLeaveWarning(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [active]);
}
