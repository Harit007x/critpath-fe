import { describe, expect, it } from "vitest";

import { MAX_XER_BYTES, xerUploadProblem } from "./xer-upload";

const file = (name: string, size = 100) => ({ name, size });

describe("xerUploadProblem", () => {
  it("accepts a .xer file, whatever the case of its extension", () => {
    expect(xerUploadProblem(file("schedule.xer"))).toBeNull();
    expect(xerUploadProblem(file("SCHEDULE.XER", MAX_XER_BYTES))).toBeNull();
  });

  it("explains that spreadsheets need exporting as .xer", () => {
    expect(xerUploadProblem(file("schedule.xlsx"))).toMatch(/Export the schedule from P6 as a \.xer/);
    expect(xerUploadProblem(file("schedule.csv"))).toMatch(/Spreadsheets/);
  });

  it("turns away other files, empty files and files over 50 MB", () => {
    expect(xerUploadProblem(file("notes.pdf"))).toBe("Choose a Primavera P6 .xer file.");
    expect(xerUploadProblem(file("schedule.xer", 0))).toBe("This file is empty.");
    expect(xerUploadProblem(file("schedule.xer", MAX_XER_BYTES + 1))).toBe("Files can be at most 50 MB.");
  });
});
