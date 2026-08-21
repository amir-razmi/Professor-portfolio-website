export type StoredObject = {
  body: ReadableStream<Uint8Array>;
  sizeBytes: number;
};

export interface StorageProvider {
  put(key: string, data: Uint8Array): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}

const storageKeyPattern = /^(?:[a-z0-9][a-z0-9_-]{0,40}\/)+[a-f0-9-]{16,64}\.[a-z0-9]{1,10}$/;

export function assertSafeStorageKey(key: string): string {
  if (
    !storageKeyPattern.test(key) ||
    key.includes("\\") ||
    key.includes("..") ||
    key.startsWith("/") ||
    key.includes("\0")
  ) {
    throw new Error("Unsafe storage key.");
  }

  return key;
}
