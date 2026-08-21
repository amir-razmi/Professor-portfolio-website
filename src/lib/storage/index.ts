import "server-only";

import { getLocalStorageRoot } from "@/lib/env";

import { LocalStorageProvider } from "./local-storage-provider";
import type { StorageProvider } from "./storage-provider";

let provider: StorageProvider | undefined;

export function getStorageProvider(): StorageProvider {
  provider ??= new LocalStorageProvider(getLocalStorageRoot());
  return provider;
}

export type { StorageProvider, StoredObject } from "./storage-provider";
export { LocalStorageProvider } from "./local-storage-provider";
