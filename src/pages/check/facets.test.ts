import { describe, expect, it } from "vitest";

import { facetOptions } from "@/pages/check/facets";

describe("facetOptions", () => {
  it("lists each value once, labelled and sorted by label", () => {
    const rows = [{ t: "TT_Task" }, { t: "TT_Mile" }, { t: "TT_Task" }, { t: "TT_New" }];
    expect(facetOptions(rows, (r) => r.t, { TT_Task: "Task", TT_Mile: "Start milestone" })).toEqual([
      { value: "TT_Mile", label: "Start milestone" },
      { value: "TT_Task", label: "Task" },
      { value: "TT_New", label: "TT_New" },
    ]);
  });
});
