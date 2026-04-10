// Shared upload utilities for domain-specific form handlers (create post,
// update avatar, etc.) that handle file uploads server-side. The /media/
// routes themselves are read-only.

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export interface FileMeta {
  contentType: string;
  size: number;
  originalName: string;
  uploadedAt: string;
}

export const metaKey = (key: string) => `meta:${key}`;

export const sanitize = (name: string) => {
  const safe = name.replaceAll(/[^a-zA-Z0-9._-]/gu, "_").replace(/^\.+/u, "");
  const suffix = Math.random().toString(16).slice(2, 10);
  const dot = safe.lastIndexOf(".");
  return dot > 0
    ? `${safe.slice(0, dot)}-${suffix}${safe.slice(dot)}`
    : `${safe || "file"}-${suffix}`;
};
