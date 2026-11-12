import { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuthStore, isSessionActive } from "@/store/auth-store";
import { nextPath, nextQuery } from "@/lib/next-path";

/** Wraps the whole tree: signs the user out locally when the session expires. */
export function SessionWatcher() {
  const navigate = useNavigate();
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!isAuthenticated || expiresAt === null) return;

    const endSession = () => {
      logout();
      toast.info("Your session has expired. Please log in again.");
      navigate("/login", { replace: true });
    };

    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      endSession();
      return;
    }

    const timer = setTimeout(endSession, remaining);
    return () => clearTimeout(timer);
  }, [expiresAt, isAuthenticated, logout, navigate]);

  return <Outlet />;
}

/** Auth screens: unreachable while signed in (they go on to `?next=`, or Home). */
export function GuestRoute() {
  const sessionActive = useAuthStore(isSessionActive);
  const { search } = useLocation();
  return sessionActive ? <Navigate to={nextPath(search)} replace /> : <Outlet />;
}

/** App screens: require a session. Signing in comes back here (`?next=`). */
export function ProtectedRoute() {
  const sessionActive = useAuthStore(isSessionActive);
  const { pathname, search } = useLocation();
  return sessionActive ? (
    <Outlet />
  ) : (
    <Navigate to={`/login${nextQuery(pathname + search)}`} replace />
  );
}

export function RootRedirect() {
  const sessionActive = useAuthStore(isSessionActive);
  return <Navigate to={sessionActive ? "/home" : "/login"} replace />;
}
