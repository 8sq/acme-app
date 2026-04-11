// Shared storage utilities for domain-specific form handlers (create post,
// update avatar, etc.) that handle file uploads server-side.

import { v7 as uuidv7 } from "uuid";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export interface FileMeta {
  contentType: string;
  size: number;
  originalName: string;
  uploadedAt: string;
}

export const metaKey = (key: string) => `meta:${key}`;

/** UUID v7 key (time-sortable) with the original file extension preserved. */
export function generateKey(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const rawExt = dot > 0 ? filename.slice(dot) : "";
  const ext = rawExt.replaceAll(/[^a-zA-Z0-9.]/gu, "");
  return `${uuidv7()}${ext}`;
}
