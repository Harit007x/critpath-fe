import { describe, expect, it } from "vitest";

import {
  meridiemOf,
  nextQuarterHour,
  parseLocal,
  serialiseLocal,
  stepWrapped,
  to12Hour,
  to24Hour,
  withDate,
  withTime,
} from "@/lib/datetime-value";

describe("parseLocal / serialiseLocal", () => {
  it("round-trips a value", () => {
    expect(serialiseLocal(parseLocal("2026-09-19T14:30")!)).toBe(
      "2026-09-19T14:30"
    );
  });

  it("reads the string as LOCAL time, not UTC", () => {
    // The whole reason this does not use `new Date(string)`. If it ever starts
    // parsing as UTC, this fails on every machine that is not on UTC — which
    // is the failure that would otherwise ship silently.
    const date = parseLocal("2026-09-19T14:30")!;
    expect(date.getHours()).toBe(14);
    expect(date.getMinutes()).toBe(30);
    expect(date.getDate()).toBe(19);
  });

  it("pads single-digit months, days, hours and minutes", () => {
    expect(serialiseLocal(new Date(2026, 0, 5, 9, 7))).toBe("2026-01-05T09:07");
  });

  it("returns null for empty or malformed input", () => {
    expect(parseLocal("")).toBeNull();
    expect(parseLocal("2026-09-19")).toBeNull();
    expect(parseLocal("nonsense")).toBeNull();
  });
});

describe("12-hour conversion", () => {
  it("treats 12 AM as midnight and 12 PM as noon", () => {
    // The pair that is wrong in most hand-rolled pickers.
    expect(to24Hour(12, "AM")).toBe(0);
    expect(to24Hour(12, "PM")).toBe(12);
  });

  it("converts the ordinary hours", () => {
    expect(to24Hour(1, "AM")).toBe(1);
    expect(to24Hour(11, "AM")).toBe(11);
    expect(to24Hour(1, "PM")).toBe(13);
    expect(to24Hour(11, "PM")).toBe(23);
  });

  it("inverts cleanly for all 24 hours", () => {
    for (let hour = 0; hour < 24; hour++) {
      expect(to24Hour(to12Hour(hour), meridiemOf(hour))).toBe(hour);
    }
  });

  it("shows midnight as 12 AM rather than 0", () => {
    expect(to12Hour(0)).toBe(12);
    expect(meridiemOf(0)).toBe("AM");
    expect(to12Hour(12)).toBe(12);
    expect(meridiemOf(12)).toBe("PM");
  });
});

describe("withDate", () => {
  it("moves the day and keeps the time", () => {
    expect(withDate("2026-09-19T14:30", new Date(2026, 8, 22))).toBe(
      "2026-09-22T14:30"
    );
  });

  it("keeps the time across a month boundary", () => {
    expect(withDate("2026-09-19T23:45", new Date(2026, 9, 1))).toBe(
      "2026-10-01T23:45"
    );
  });

  it("fills the clock from the fallback when nothing is set yet", () => {
    // Never emits midnight by accident: a bare date would be accepted by the
    // caller and scheduled for 00:00.
    const result = withDate(
      "",
      new Date(2026, 8, 22),
      () => new Date(2026, 0, 1, 9, 15)
    );
    expect(result).toBe("2026-09-22T09:15");
  });
});

describe("withTime", () => {
  it("moves the clock and keeps the day", () => {
    expect(withTime("2026-09-19T14:30", 23, 45)).toBe("2026-09-19T23:45");
  });

  it("writes midnight without rolling to the next day", () => {
    expect(withTime("2026-09-19T11:45", 0, 45)).toBe("2026-09-19T00:45");
  });

  it("fills the day from the fallback when nothing is set yet", () => {
    expect(withTime("", 13, 0, () => new Date(2026, 8, 22, 9, 15))).toBe(
      "2026-09-22T13:00"
    );
  });

  it("clears seconds so two equal-looking values are equal", () => {
    const date = parseLocal(withTime("2026-09-19T14:30", 9, 5))!;
    expect(date.getSeconds()).toBe(0);
    expect(date.getMilliseconds()).toBe(0);
  });
});

describe("nextQuarterHour", () => {
  it("advances to the next quarter", () => {
    expect(serialiseLocal(nextQuarterHour(new Date(2026, 8, 19, 14, 3)))).toBe(
      "2026-09-19T14:15"
    );
    expect(serialiseLocal(nextQuarterHour(new Date(2026, 8, 19, 14, 16)))).toBe(
      "2026-09-19T14:30"
    );
  });

  it("moves a whole quarter on when already exactly on one", () => {
    // Not a no-op: "soonest" has to be in the future, and returning the current
    // instant would offer a slot that is already gone by the time it is used.
    expect(serialiseLocal(nextQuarterHour(new Date(2026, 8, 19, 14, 30)))).toBe(
      "2026-09-19T14:45"
    );
  });

  it("rolls the hour, the day and the year", () => {
    expect(serialiseLocal(nextQuarterHour(new Date(2026, 8, 19, 14, 50)))).toBe(
      "2026-09-19T15:00"
    );
    expect(serialiseLocal(nextQuarterHour(new Date(2026, 11, 31, 23, 50)))).toBe(
      "2027-01-01T00:00"
    );
  });
});

describe("stepWrapped", () => {
  it("wraps the hour field at both ends", () => {
    expect(stepWrapped(12, 1, 1, 12)).toBe(1);
    expect(stepWrapped(1, -1, 1, 12)).toBe(12);
  });

  it("wraps the minute field at both ends", () => {
    expect(stepWrapped(59, 1, 0, 59)).toBe(0);
    expect(stepWrapped(0, -1, 0, 59)).toBe(59);
  });

  it("steps normally away from the edges", () => {
    expect(stepWrapped(11, 1, 1, 12)).toBe(12);
    expect(stepWrapped(30, -1, 0, 59)).toBe(29);
  });
});
