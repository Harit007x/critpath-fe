export const SIGNUPS_CLOSED_MESSAGE =
  "Sign-ups are closed on CritPath. Ask the owner for an invite to join.";

/**
 * The toast for an error Better Auth sent back on the URL after Google (`?error=…`), or null for
 * none. It sends the API's message with spaces as underscores ("Sign-ups_are_closed_on_this_CritPath."),
 * and only to `errorCallbackURL`: its own error page turns that code into UNKNOWN over the full stop.
 */
export function authRedirectError(code: string | null): string | null {
  if (!code) return null;
  if (isSignupsClosed(code)) return SIGNUPS_CLOSED_MESSAGE;
  // They pressed Cancel on Google's screen: nothing went wrong.
  if (code === "access_denied") return null;
  return "Google sign-in didn’t work. Try again, or use your email and password.";
}

/** The API's refusal (`lib/auth.ts`), from a sign-up response or a redirect's code. */
export const isSignupsClosed = (message: string) =>
  /sign-ups are closed/i.test(message.replaceAll("_", " "));
