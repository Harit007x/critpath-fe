import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { authRedirectError } from "@/lib/auth-errors";

/**
 * Toasts the error Google sign-in came back with (`?error=…`, see `signInWithGoogle`), then drops
 * it from the URL so a reload or the next attempt does not show it again.
 */
export function useAuthRedirectError() {
  const [params, setParams] = useSearchParams();
  const code = params.get("error");

  useEffect(() => {
    if (code === null) return;
    const message = authRedirectError(code);
    // On a fresh load this runs before <Toaster> (after the routes in App.tsx) subscribes, and a
    // toast sent then is dropped. Not cleared on cleanup: dropping `error` below re-runs this.
    // A fixed id, as StrictMode runs it twice in development.
    if (message)
      setTimeout(() => toast.error(message, { id: "auth-redirect-error" }));
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("error");
        next.delete("error_description");
        return next;
      },
      { replace: true },
    );
  }, [code, setParams]);
}
