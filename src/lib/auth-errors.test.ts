import { describe, expect, it } from "vitest";
import { authRedirectError, isSignupsClosed, SIGNUPS_CLOSED_MESSAGE } from "./auth-errors";

describe("authRedirectError", () => {
  it("explains closed sign-ups from Google's redirect", () => {
    expect(authRedirectError("Sign-ups_are_closed_on_this_CritPath.")).toBe(SIGNUPS_CLOSED_MESSAGE);
  });

  it("says nothing without an error or when they cancelled", () => {
    expect(authRedirectError(null)).toBeNull();
    expect(authRedirectError("")).toBeNull();
    expect(authRedirectError("access_denied")).toBeNull();
  });

  it("falls back for anything else", () => {
    expect(authRedirectError("invalid_code")).toMatch(/Google sign-in didn’t work/);
  });
});

describe("isSignupsClosed", () => {
  it("matches the API's message with spaces or underscores", () => {
    expect(isSignupsClosed("Sign-ups are closed on this CritPath.")).toBe(true);
    expect(isSignupsClosed("Sign-ups_are_closed_on_this_CritPath.")).toBe(true);
    expect(isSignupsClosed("User already exists")).toBe(false);
  });
});
