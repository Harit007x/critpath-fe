/** Display text for the P6 codes and kinds the checker returns, and shared formatting. */

export const STATUS_LABEL: Record<string, string> = {
  TK_NotStart: "Not started",
  TK_Active: "In progress",
  TK_Complete: "Complete",
};

export const TYPE_LABEL: Record<string, string> = {
  TT_Task: "Task",
  TT_Rsrc: "Resource dependent",
  TT_Mile: "Start milestone",
  TT_FinMile: "Finish milestone",
  TT_LOE: "Level of effort",
  TT_WBS: "WBS summary",
};

export const BROKEN_KIND_LABEL: Record<string, string> = {
  structure: "Structure",
  value: "Bad value",
  reference: "Broken link",
  duplicate: "Duplicate",
};

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

/** Where each view lives; the report screens are their own URLs so Back and reload work. */
export const checkPaths = {
  library: "/check",
  upload: (id: string) => `/check/files/${encodeURIComponent(id)}`,
  sample: (id: string) => `/check/samples/${encodeURIComponent(id)}`,
};
