/** Same limit as critpath-be's upload route, checked here first so a bad file is turned away at once. */
export const MAX_XER_BYTES = 25 * 1024 * 1024;

/** Why this file cannot be uploaded, in words to show the user; null when it can. */
export function xerUploadProblem(file: Pick<File, "name" | "size">): string | null {
  if (/\.(xlsx?|xlsm|csv)$/i.test(file.name)) {
    return "Spreadsheets can't be checked. Export the schedule from P6 as a .xer file.";
  }
  if (!/\.xer$/i.test(file.name)) return "Choose a Primavera P6 .xer file.";
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_XER_BYTES) return "Files can be at most 25 MB.";
  return null;
}
