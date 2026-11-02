const OFFER_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const TARGET_MAX_BYTES = 2 * 1024 * 1024;

/** Resize/compress large photos so admin uploads succeed and pages stay fast. */
export async function prepareImageForUpload(file: File): Promise<File> {
  const ext = OFFER_IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Use a JPG, PNG, WebP, or GIF");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Keep the image under 50 MB (try a smaller export from your phone).");
  }
  if (file.type === "image/gif" || file.size <= TARGET_MAX_BYTES) return file;

  const bitmap = await createImageBitmap(file);
  const maxSide = 2000;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let quality = 0.88;
  let blob: Blob | null = null;
  for (let i = 0; i < 6; i++) {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) break;
    if (blob.size <= TARGET_MAX_BYTES) break;
    quality -= 0.12;
  }
  if (!blob) return file;
  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

export { OFFER_IMAGE_TYPES, MAX_UPLOAD_BYTES };
