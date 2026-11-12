import api from "@/lib/api";

/** Mirrors critpath-be/src/lib/xer: the report for one checked XER file. */
export type BrokenRow = {
  table: string;
  line: number;
  rowNumber: number | null;
  kind: "structure" | "value" | "reference" | "duplicate";
  field: string | null;
  reason: string;
};

export type CheckedActivity = {
  taskId: string;
  code: string;
  name: string;
  type: string;
  status: string;
  calendar: string | null;
  totalFloatDays: number | null;
  predecessors: number;
  successors: number;
  line: number;
  detail: string;
};

export type CheckId = "missing_links" | "negative_float" | "high_float";

export type CheckResult = {
  id: CheckId;
  name: string;
  rule: string;
  count: number;
  denominator: number;
  pct: number;
  activities: CheckedActivity[];
};

export type XerReport = {
  file: { name: string; sizeBytes: number; sample: string | null };
  p6Version: string | null;
  exportDate: string | null;
  projects: { id: string; shortName: string; name: string; dataDate: string | null }[];
  tables: { name: string; rows: number }[];
  counts: {
    activities: number;
    checked: number;
    complete: number;
    excluded: number;
    relationships: number;
    noFloatValue: number;
  };
  brokenRows: BrokenRow[];
  checks: CheckResult[];
  floatHistogram: { id: string; label: string; count: number }[];
};

export type XerSample = {
  id: string;
  fileName: string;
  title: string;
  description: string;
  source: string;
};

type Envelope<T> = { success: boolean; data: T };

export const xerService = {
  async samples(): Promise<XerSample[]> {
    const { data } = await api.get<Envelope<XerSample[]>>("/xer/samples");
    return data.data;
  },

  async checkSample(id: string): Promise<XerReport> {
    const { data } = await api.get<Envelope<XerReport>>(`/xer/samples/${encodeURIComponent(id)}/check`);
    return data.data;
  },

  async checkFile(file: File): Promise<XerReport> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<Envelope<XerReport>>("/xer/check", form);
    return data.data;
  },
};
