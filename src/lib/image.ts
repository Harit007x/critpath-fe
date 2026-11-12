/** The longest side of a stored square image (e.g. a profile photo); it shows at 20–40 px. */
export const SQUARE_IMAGE_SIZE = 256;

/**
 * Crops the picked image to a centred square and scales it to 256 px, as WebP (PNG where the
 * browser cannot encode WebP), so the upload is a few kilobytes whatever the original was.
 * `as` asks for PNG or JPEG instead, which every browser encodes (the profile photo takes only
 * those).
 */
export async function squareImage(file: File, as?: "image/png" | "image/jpeg"): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const size = Math.min(side, SQUARE_IMAGE_SIZE);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not read the image");
    context.imageSmoothingQuality = "high";
    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    );
    const encode = (type: string) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
    if (as) {
      const blob = await encode(as);
      if (!blob) throw new Error("Could not read the image");
      return blob;
    }
    const webp = await encode("image/webp");
    // Safari before 17 answers PNG when asked for WebP; either is fine, as long as it says which.
    const blob = webp?.type === "image/webp" ? webp : await encode("image/png");
    if (!blob) throw new Error("Could not read the image");
    return blob;
  } finally {
    bitmap.close();
  }
}
