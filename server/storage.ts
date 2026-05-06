/**
 * Local filesystem storage for portraits and uploads.
 * Files are stored in ./uploads/ relative to the working directory.
 * In production, mount this directory as a persistent volume.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "./uploads";

export function ensureUploadsDir() {
  const portraitsDir = path.join(UPLOADS_DIR, "portraits");
  if (!fs.existsSync(portraitsDir)) {
    fs.mkdirSync(portraitsDir, { recursive: true });
  }
}

/**
 * Download a remote image URL and save it locally.
 * Returns the public URL path (e.g. /uploads/portraits/abc123.png).
 */
export async function downloadAndSavePortrait(remoteUrl: string): Promise<string> {
  ensureUploadsDir();

  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`Failed to download portrait: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = "png";
  const filename = `${crypto.randomBytes(16).toString("hex")}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, "portraits", filename);

  fs.writeFileSync(filePath, buffer);
  return `/uploads/portraits/${filename}`;
}

/**
 * Save an uploaded file buffer locally.
 * Returns the public URL path.
 */
export function saveUploadedFile(buffer: Buffer, originalName: string, subdir = "portraits"): string {
  ensureUploadsDir();
  const dir = path.join(UPLOADS_DIR, subdir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const ext = path.extname(originalName) || ".bin";
  const filename = `${crypto.randomBytes(16).toString("hex")}${ext}`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${subdir}/${filename}`;
}

/**
 * Delete a locally stored file by its public URL path.
 */
export function deleteLocalFile(publicPath: string) {
  try {
    const relative = publicPath.replace(/^\/uploads\//, "");
    const filePath = path.join(UPLOADS_DIR, relative);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // Ignore deletion errors
  }
}
