import { describe, expect, it } from "vitest";

import { findingsOf, firstFlagged } from "@/pages/check/report/findings";
import type { CheckResult, XerReport } from "@/services/xer.service";

const check = (id: CheckResult["id"], count: number): CheckResult => ({
  id,
  name: id,
  rule: "",
  count,
  denominator: 10,
  pct: count * 10,
  activities: [],
});

const report = (counts: [number, number, number], brokenRows: number) =>
  ({
    checks: [check("missing_links", counts[0]), check("negative_float", counts[1]), check("high_float", counts[2])],
    brokenRows: Array.from({ length: brokenRows }, (_, line) => ({
      table: "TASK",
      line,
      rowNumber: null,
      kind: "value",
      field: null,
      reason: "",
    })),
  }) as unknown as XerReport;

describe("findingsOf", () => {
  it("lists the three checks, then broken rows", () => {
    const findings = findingsOf(report([1, 0, 2], 3));
    expect(findings.map((f) => [f.id, f.count])).toEqual([
      ["missing_links", 1],
      ["negative_float", 0],
      ["high_float", 2],
      ["broken_rows", 3],
    ]);
    expect(findings[0].scope).toBe("of 10 activities");
  });
});

describe("firstFlagged", () => {
  it("opens the first finding that flagged something", () => {
    expect(firstFlagged(findingsOf(report([0, 0, 4], 0)))).toBe("high_float");
    expect(firstFlagged(findingsOf(report([0, 0, 0], 2)))).toBe("broken_rows");
  });

  it("opens the first check when nothing is flagged", () => {
    expect(firstFlagged(findingsOf(report([0, 0, 0], 0)))).toBe("missing_links");
  });
});
