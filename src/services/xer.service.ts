import api, { API_BASE_URL } from "@/lib/api";

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

/** An upload's report; `alreadyStored` when the same file was uploaded before. */
export type XerUploadResult = XerReport & { alreadyStored: boolean };

export type XerReport = {
  file: {
    /** The stored upload; null for a bundled sample, which is not stored. */
    id: string | null;
    name: string;
    sizeBytes: number;
    sample: string | null;
    uploadedAt: string | null;
  };
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

/** One stored upload in the list (GET /xer/files). */
export type XerUpload = {
  id: string;
  fileName: string;
  sizeBytes: number;
  projectName: string | null;
  activities: number;
  relationships: number;
  brokenRowCount: number;
  missingLinks: number;
  negativeFloat: number;
  highFloat: number;
  uploadedAt: string;
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

  /** Checks and stores a file; the same file again returns the stored copy, with `alreadyStored`. */
  async checkFile(file: File): Promise<XerUploadResult> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<Envelope<XerUploadResult>>("/xer/check", form);
    return data.data;
  },

  async uploads(): Promise<XerUpload[]> {
    const { data } = await api.get<Envelope<XerUpload[]>>("/xer/files");
    return data.data;
  },

  async upload(id: string): Promise<XerReport> {
    const { data } = await api.get<Envelope<XerReport>>(`/xer/files/${encodeURIComponent(id)}`);
    return data.data;
  },

  /** A link that downloads the stored file as it was uploaded. */
  contentUrl(id: string): string {
    return `${API_BASE_URL}/xer/files/${encodeURIComponent(id)}/content`;
  },
};
