// Shared storage utilities for domain-specific form handlers (create post,
// update avatar, etc.) that handle file uploads server-side.

import { HTTPException } from "hono/http-exception";
import type { Storage } from "unstorage";
import { v7 as uuidv7 } from "uuid";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

function matchContentType(type: string, pattern: string): boolean {
  if (pattern.endsWith("/*")) {
    return type.startsWith(pattern.slice(0, -1));
  }
  return type === pattern;
}

export interface FileMeta {
  contentType: string;
  size: number;
  originalName: string;
  uploadedAt: number;
}

/** UUID v7 key (time-sortable) with the original file extension preserved. */
export function generateKey(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const rawExt = dot > 0 ? filename.slice(dot) : "";
  const ext = rawExt.replaceAll(/[^a-zA-Z0-9.]/gu, "");
  return `${uuidv7()}${ext}`;
}

export interface StoreFileOptions {
  key?: string;
  maxBytes?: number;
  allowedTypes?: string[];
  meta?: Partial<FileMeta>;
}

/**
 * Validates, stores, and records metadata for a file upload.
 *
 * Returns the storage key (generated or provided via `key`).
 * Throws 415 if the file type is not allowed.
 * Throws 413 if the file exceeds the size limit.
 */
export async function storeFile(
  storage: Storage,
  file: File,
  {
    key,
    maxBytes = MAX_UPLOAD_BYTES,
    allowedTypes,
    meta,
  }: StoreFileOptions = {},
): Promise<{ key: string }> {
  if (allowedTypes?.every((pattern) => !matchContentType(file.type, pattern))) {
    throw new HTTPException(415, { message: "unsupported file type" });
  }

  if (file.size > maxBytes) {
    throw new HTTPException(413, { message: "file too large" });
  }

  const resolvedKey = key ?? generateKey(file.name);
  const bytes = new Uint8Array(await file.arrayBuffer());
  await storage.setItemRaw(resolvedKey, bytes);
  await storage.setMeta(resolvedKey, {
    contentType: file.type || "application/octet-stream",
    size: file.size,
    originalName: file.name,
    uploadedAt: Date.now(),
    ...meta,
  });

  return { key: resolvedKey };
}
