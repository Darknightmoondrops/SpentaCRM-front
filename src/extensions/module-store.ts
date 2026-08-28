const DB_NAME = "spentacrm-module-runtime";
const DB_VERSION = 1;
const STORE_NAME = "packages";

type StoredRuntimePackage = {
  extensionId: string;
  files: Record<string, ArrayBuffer>;
  installedAt: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "extensionId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open the SpentaCRM module store."));
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = run(tx.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Module storage operation failed."));
      tx.onabort = () => reject(tx.error ?? new Error("Module storage transaction was aborted."));
    });
  } finally {
    db.close();
  }
}

export async function saveRuntimePackage(extensionId: string, files: Record<string, ArrayBuffer>) {
  const value: StoredRuntimePackage = { extensionId, files, installedAt: new Date().toISOString() };
  await withStore("readwrite", store => store.put(value));
}

export async function removeRuntimePackage(extensionId: string) {
  await withStore("readwrite", store => store.delete(extensionId));
}

export async function readRuntimeFile(extensionId: string, path: string): Promise<ArrayBuffer | null> {
  const value = await withStore<StoredRuntimePackage | undefined>("readonly", store => store.get(extensionId));
  return value?.files[path] ?? null;
}

export async function runtimePackageExists(extensionId: string) {
  const value = await withStore<StoredRuntimePackage | undefined>("readonly", store => store.get(extensionId));
  return Boolean(value);
}
