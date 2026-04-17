import { createReadStream, createWriteStream } from "node:fs";
import {
  access,
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  validatingStream,
  type DriverOptions,
  type StorageDriver,
  type StorageObject,
  type StoragePutOptions,
} from "../driver";

// Sidecar JSON stored in a parallel `meta/` subtree, separate from `data/`.
// Splitting the trees prevents user keys from colliding with another key's
// sidecar (e.g. uploading `foo.meta.json` would otherwise overwrite the
// sidecar of `foo`). Dev/test only — production uses R2/S3.
interface FsSidecar {
  contentType: string;
  cacheControl?: string;
  size: number;
  metadata: Record<string, string>;
}

/** Local filesystem driver. Metadata stored as `<key>.meta.json` sidecars. */
export class FsDriver implements StorageDriver {
  constructor(
    private readonly base: string,
    private readonly options: DriverOptions = {},
  ) {}

  private path(key: string): string {
    return join(this.base, "data", key);
  }

  private metaPath(key: string): string {
    return join(this.base, "meta", `${key}.json`);
  }

  async get(key: string): Promise<StorageObject | null> {
    let raw: string;
    try {
      raw = await readFile(this.metaPath(key), "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw err;
    }

    const sidecar = JSON.parse(raw) as FsSidecar;
    const nodeStream = createReadStream(this.path(key));
    const body = Readable.toWeb(nodeStream);

    return {
      body,
      contentType: sidecar.contentType,
      cacheControl: sidecar.cacheControl,
      size: sidecar.size,
      metadata: sidecar.metadata,
    };
  }

  async put(
    key: string,
    body: ReadableStream<Uint8Array> | Uint8Array,
    options: StoragePutOptions,
  ): Promise<void> {
    const {
      sizeHint,
      contentType,
      cacheControl = this.options.defaultCacheControl,
      metadata = {},
    } = options;

    const filePath = this.path(key);
    const tmpPath = `${filePath}.tmp`;
    await mkdir(dirname(filePath), { recursive: true });

    let size: number;
    try {
      const verified = validatingStream(body, sizeHint);
      if (verified instanceof Uint8Array) {
        await writeFile(tmpPath, verified);
        size = verified.byteLength;
      } else {
        // Cast bridges the global ReadableStream to node:stream/web's variant
        // expected by Readable.fromWeb.
        const source = Readable.fromWeb(verified);
        await pipeline(source, createWriteStream(tmpPath));
        size = sizeHint ?? (await stat(tmpPath)).size;
      }
      await rename(tmpPath, filePath);
    } catch (err) {
      await rm(tmpPath, { force: true });
      throw err;
    }

    const sidecar: FsSidecar = { contentType, cacheControl, size, metadata };
    try {
      await writeFile(this.metaPath(key), JSON.stringify(sidecar));
    } catch (err) {
      // Sidecar is the source of truth for has()/get(); without it the data
      // file is orphaned and unreachable. Remove it to keep state consistent.
      await rm(filePath, { force: true });
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.metaPath(key), { force: true });
    await rm(this.path(key), { force: true });
  }

  async has(key: string): Promise<boolean> {
    try {
      await access(this.metaPath(key));
      return true;
    } catch {
      return false;
    }
  }
}
