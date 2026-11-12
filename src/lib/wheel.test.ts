import { describe, expect, it } from "vitest";

import { clampTime, middleIndex, nextMinute, recentre, timeOptions, wheelIndex, wheelValue } from "@/lib/wheel";

describe("wheel arithmetic", () => {
  it("maps any row to its value, negatives included", () => {
    expect(wheelValue(0, 12)).toBe(0);
    expect(wheelValue(13, 12)).toBe(1);
    expect(wheelValue(-1, 12)).toBe(11);
  });

  it("reads the centred row from the scroll offset, rounding to the nearest", () => {
    expect(wheelIndex(0, 32)).toBe(0);
    expect(wheelIndex(47, 32)).toBe(1);
    expect(wheelIndex(49, 32)).toBe(2);
  });

  it("opens a looping wheel on the middle copy", () => {
    expect(middleIndex(5, 60, 9)).toBe(245);
  });

  it("jumps back to the middle copy only from the first or last copy", () => {
    // 12 values, 9 copies: rows 0–11 and 96–107 are the edge copies.
    expect(recentre(3, 12, 9)).toBe(51);
    expect(recentre(100, 12, 9)).toBe(52);
    expect(recentre(12, 12, 9)).toBe(12);
    expect(recentre(95, 12, 9)).toBe(95);
  });
});

describe("past times are not offered", () => {
  const at = (h: number, m: number, day = 4) => new Date(2026, 10, day, h, m);
  const min = at(6, 27);

  it("starts at the next whole minute", () => {
    expect(nextMinute(new Date(2026, 10, 4, 6, 26, 40))).toEqual(min);
  });

  it("moves a time before the earliest up to it", () => {
    expect(clampTime(at(1, 0), min)).toEqual(min);
    expect(clampTime(at(9, 0), min)).toEqual(at(9, 0));
  });

  it("today, in the morning: AM and PM, hours from 6, minutes from 27 in that hour", () => {
    const o = timeOptions(at(6, 30), min);
    expect(o.meridiems).toEqual(["AM", "PM"]);
    expect(o.hours).toEqual([6, 7, 8, 9, 10, 11]);
    expect(o.minutes[0]).toBe(27);
    expect(o.limited).toBe(true);
    expect(timeOptions(at(9, 0), min).minutes).toHaveLength(60);
  });

  it("today, in the afternoon: PM only, hours from now", () => {
    const afternoon = at(15, 10);
    const o = timeOptions(at(16, 0), afternoon);
    expect(o.meridiems).toEqual(["PM"]);
    expect(o.hours).toEqual([15, 16, 17, 18, 19, 20, 21, 22, 23]);
  });

  it("another day: everything, looping", () => {
    const o = timeOptions(at(9, 0, 5), min);
    expect(o.hours).toHaveLength(12);
    expect(o.minutes).toHaveLength(60);
    expect(o.limited).toBe(false);
    expect(timeOptions(at(9, 0), null).limited).toBe(false);
  });
});
