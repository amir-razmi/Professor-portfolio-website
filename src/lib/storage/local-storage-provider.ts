import fs from "node:fs";
import { mkdir, open, readdir, lstat, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { assertSafeStorageKey, type StorageProvider, type StoredObject } from "./storage-provider";

export class LocalStorageProvider implements StorageProvider {
  readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private resolvePath(key: string): string {
    assertSafeStorageKey(key);
    const resolved = path.resolve(this.root, key);
    const relative = path.relative(this.root, resolved);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("Unsafe storage path.");
    }

    return resolved;
  }

  private async assertNoSymlinks(targetPath: string, allowMissingFinal = false): Promise<void> {
    const relative = path.relative(this.root, targetPath);
    const segments = relative ? relative.split(path.sep) : [];
    let current = this.root;

    for (let index = 0; index < segments.length; index += 1) {
      current = path.join(current, segments[index]);

      try {
        const info = await lstat(current);

        if (info.isSymbolicLink()) {
          throw new Error("Symbolic links are not allowed in local storage.");
        }
      } catch (error) {
        if (
          allowMissingFinal &&
          index === segments.length - 1 &&
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          return;
        }

        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
          return;
        }

        throw error;
      }
    }
  }

  private async prepareParent(targetPath: string): Promise<void> {
    const parent = path.dirname(targetPath);
    await mkdir(parent, { recursive: true });
    await this.assertNoSymlinks(parent);
  }

  async put(key: string, data: Uint8Array): Promise<void> {
    const targetPath = this.resolvePath(key);
    await this.prepareParent(targetPath);

    const handle = await open(targetPath, "wx");
    let closed = false;
    const closeHandle = async () => {
      if (!closed) {
        closed = true;
        await handle.close();
      }
    };

    try {
      await handle.writeFile(data);
    } catch (error) {
      await closeHandle().catch(() => undefined);
      await rm(targetPath, { force: true }).catch(() => undefined);
      await this.removeEmptyParents(path.dirname(targetPath));
      throw error;
    } finally {
      await closeHandle();
    }
  }

  async get(key: string): Promise<StoredObject | null> {
    const targetPath = this.resolvePath(key);
    await this.assertNoSymlinks(targetPath);

    let info;

    try {
      info = await stat(targetPath);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return null;
      }

      throw error;
    }

    if (!info.isFile()) {
      return null;
    }

    const stream = fs.createReadStream(targetPath);

    return {
      body: Readable.toWeb(stream) as ReadableStream<Uint8Array>,
      sizeBytes: info.size,
    };
  }

  async delete(key: string): Promise<void> {
    const targetPath = this.resolvePath(key);
    await this.assertNoSymlinks(targetPath);
    await rm(targetPath, { force: true });
    await this.removeEmptyParents(path.dirname(targetPath));
  }

  private async removeEmptyParents(startPath: string): Promise<void> {
    let current = path.resolve(startPath);

    while (current !== this.root && current.startsWith(`${this.root}${path.sep}`)) {
      try {
        const entries = await readdir(current);

        if (entries.length > 0) {
          return;
        }

        await rm(current);
        current = path.dirname(current);
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
          current = path.dirname(current);
          continue;
        }

        return;
      }
    }
  }
}
