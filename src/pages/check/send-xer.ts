import { gzip, sha256Hex } from "@/lib/file-prep";
import { uploadProgress } from "@/lib/upload-progress";
import { xerService, type XerUploadResult } from "@/services/xer.service";

/** Where a file is on its way to a report. */
export type UploadStage =
  { stage: "preparing" } | { stage: "uploading"; percent: number; secondsLeft: number | null } | { stage: "checking" };

/**
 * Gets a file's report with as little uploading as possible:
 * 1. A file already stored (same SHA-256) opens its saved report, with no upload.
 * 2. Otherwise it is gzipped (about 6x smaller) and uploaded, reporting progress.
 */
export async function sendXer(file: File, onStage: (stage: UploadStage) => void): Promise<XerUploadResult> {
  onStage({ stage: "preparing" });
  // A failed lookup only costs the shortcut; the upload still works.
  const stored = await sha256Hex(file)
    .then(xerService.findStored)
    .catch(() => null);
  if (stored) return { ...(await xerService.upload(stored.id)), alreadyStored: true };

  const body = await gzip(file);
  const startedAt = Date.now();
  onStage({ stage: "uploading", percent: 0, secondsLeft: null });
  return xerService.checkFile(body, file.name, (loaded, total) => {
    const { percent, secondsLeft } = uploadProgress(loaded, total, startedAt, Date.now());
    onStage(percent >= 100 ? { stage: "checking" } : { stage: "uploading", percent, secondsLeft });
  });
}
