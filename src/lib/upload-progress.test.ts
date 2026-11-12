import { describe, expect, it } from "vitest";

import { formatTimeLeft, uploadProgress } from "./upload-progress";

const MB = 1024 * 1024;

describe("uploadProgress", () => {
  it("works out the percent and the time left at the speed so far", () => {
    // 10 of 30 MB in 20 s: 20 MB to go at 0.5 MB/s.
    expect(uploadProgress(10 * MB, 30 * MB, 0, 20_000)).toEqual({
      loaded: 10 * MB,
      total: 30 * MB,
      percent: 33,
      secondsLeft: 40,
    });
  });

  it("has no estimate before anything is sent or in the first second", () => {
    expect(uploadProgress(0, 30 * MB, 0, 5_000).secondsLeft).toBeNull();
    expect(uploadProgress(MB, 30 * MB, 0, 500).secondsLeft).toBeNull();
  });

  it("stops at 100% with nothing left", () => {
    expect(uploadProgress(30 * MB, 30 * MB, 0, 60_000)).toMatchObject({ percent: 100, secondsLeft: 0 });
  });
});

describe("formatTimeLeft", () => {
  it("rounds to what a person needs to know", () => {
    expect(formatTimeLeft(3)).toBe("a few seconds left");
    expect(formatTimeLeft(37)).toBe("about 40 s left");
    expect(formatTimeLeft(170)).toBe("about 3 min left");
  });
});
