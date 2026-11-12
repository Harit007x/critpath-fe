/**
 * Where to go after signing in: the `next` query parameter, when it is a path inside this app.
 * Anything else (another origin, `//host`, `/\host`) is ignored, so the parameter cannot be used
 * to send someone off-site after they sign in.
 */
export function nextPath(search: string, fallback = "/home"): string {
  const next = new URLSearchParams(search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : fallback;
}

/** `?next=…` for the current location, to carry through sign-in. */
export const nextQuery = (path: string) =>
  path && path !== "/" ? `?next=${encodeURIComponent(path)}` : "";

/** `/verify-email` for someone who must open their verification link. */
export function verifyEmailPath(email: string, next: string, from?: "signin"): string {
  const params = new URLSearchParams({ email });
  if (next !== "/home") params.set("next", next);
  if (from) params.set("from", from);
  return `/verify-email?${params}`;
}

