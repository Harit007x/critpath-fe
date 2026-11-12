/** How far an upload has got. Most of the wait for a big file is sending it; checking takes seconds. */
export type UploadProgress = {
  loaded: number;
  total: number;
  /** 0 to 100. */
  percent: number;
  /** At the average speed so far; null until there is enough to go on. */
  secondsLeft: number | null;
};

/** The upload's progress `now`, from bytes sent so far and when it started (both from the browser). */
export function uploadProgress(loaded: number, total: number, startedAt: number, now: number): UploadProgress {
  const percent = total > 0 ? Math.min(100, Math.floor((loaded / total) * 100)) : 0;
  const elapsed = (now - startedAt) / 1000;
  const secondsLeft =
    loaded > 0 && elapsed >= 1 ? Math.max(0, Math.round(((total - loaded) / loaded) * elapsed)) : null;
  return { loaded, total, percent, secondsLeft };
}

/** "a few seconds left", "about 40 s left", "about 3 min left". */
export function formatTimeLeft(seconds: number): string {
  if (seconds < 5) return "a few seconds left";
  if (seconds < 60) return `about ${Math.ceil(seconds / 5) * 5} s left`;
  return `about ${Math.round(seconds / 60)} min left`;
}
