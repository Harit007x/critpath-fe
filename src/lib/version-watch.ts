import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Tells a tab left open across a deploy that it is running old code. The build stamps its id
 * into the bundle and publishes the same id as `/version.json` (vite.config.ts, served
 * `no-store` by public/_headers); when the two differ, a toast offers a Refresh.
 *
 * Off in dev: there is no version.json and HMR keeps the tab current.
 */
export const VERSION_TOASTER_ID = "version";

const CURRENT = import.meta.env.VITE_BUILD_ID as string | undefined;
const POLL_MS = 60_000;

export function useVersionWatch() {
  useEffect(() => {
    if (!CURRENT) return;
    let shown = false;

    const check = async () => {
      if (shown || document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const { buildId } = (await res.json()) as { buildId?: string };
        if (!buildId || buildId === CURRENT || shown) return;
        shown = true;
        toast("New version of CritPath is available", {
          toasterId: VERSION_TOASTER_ID,
          id: "new-version",
          duration: Infinity,
          action: { label: "Refresh", onClick: () => window.location.reload() },
        });
      } catch {
        // Offline or mid-deploy: try again on the next tick.
      }
    };

    const timer = window.setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, []);
}
