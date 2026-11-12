import { describe, expect, it } from "vitest";

import { nextPath, verifyEmailPath } from "./next-path";

describe("nextPath", () => {
  it("keeps a path inside the app and refuses anything else", () => {
    expect(nextPath("?next=%2Fsettings")).toBe("/settings");
    expect(nextPath("?next=%2F%2Fevil.com")).toBe("/check");
    expect(nextPath("?next=https%3A%2F%2Fevil.com")).toBe("/check");
    expect(nextPath("")).toBe("/check");
  });
});

describe("verifyEmailPath", () => {
  it("carries the email, and next only when it is not the checker", () => {
    expect(verifyEmailPath("a+b@x.com", "/check")).toBe("/verify-email?email=a%2Bb%40x.com");
    expect(verifyEmailPath("a@x.com", "/settings", "signin")).toBe(
      "/verify-email?email=a%40x.com&next=%2Fsettings&from=signin",
    );
  });
});
