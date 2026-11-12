/** The file's SHA-256 in hex: the same fingerprint the API stores uploads under. */
export async function sha256Hex(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * The file gzipped, to send fewer bytes: an XER is text and shrinks about 6x. Browsers without
 * CompressionStream get the file back as it is, which the API also accepts.
 */
export async function gzip(file: Blob): Promise<Blob> {
  if (typeof CompressionStream === "undefined") return file;
  return new Response(file.stream().pipeThrough(new CompressionStream("gzip"))).blob();
}
