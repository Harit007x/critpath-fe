import type { CheckId, XerReport } from "@/services/xer.service";

export type FindingId = CheckId | "broken_rows";

/** One thing the report can flag: a schedule check, or rows of the file that couldn't be read. */
export type Finding = {
  id: FindingId;
  name: string;
  rule: string;
  count: number;
  /** What `count` is out of, e.g. "of 120 activities". */
  scope: string;
};

/** The report's findings in display order: the three checks, then broken rows. */
export function findingsOf(report: XerReport): Finding[] {
  return [
    ...report.checks.map((check) => ({
      id: check.id,
      name: check.name,
      rule: check.rule,
      count: check.count,
      scope: `of ${check.denominator} activities`,
    })),
    {
      id: "broken_rows" as const,
      name: "Broken rows",
      rule: "Rows that couldn't be read, with their line number.",
      count: report.brokenRows.length,
      scope: report.brokenRows.length === 1 ? "row" : "rows",
    },
  ];
}

/** The finding to open first: the first one that flagged something, else the first. */
export function firstFlagged(findings: Finding[]): FindingId {
  return (findings.find((f) => f.count > 0) ?? findings[0]).id;
}
