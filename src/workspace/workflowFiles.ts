const DATABASE_NAME = "sgp-klp-operational-files";
const STORE_NAME = "files";
const DATABASE_VERSION = 1;

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("File storage is unavailable in this browser."));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error || new Error("Unable to open file storage."));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const request = action(transaction.objectStore(STORE_NAME));
      request.onerror = () => reject(request.error || new Error("File storage operation failed."));
      request.onsuccess = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error || new Error("File storage transaction failed."));
    });
  } finally {
    database.close();
  }
}

export async function storeWorkflowFile(fileId: string, file: Blob) {
  if (file.size > 8 * 1024 * 1024) throw new Error("Files must be 8 MB or smaller in this local workspace.");
  await withStore("readwrite", (store) => store.put(file, fileId));
}

export async function readWorkflowFile(fileId: string) {
  return withStore<Blob | undefined>("readonly", (store) => store.get(fileId));
}

export async function removeWorkflowFile(fileId: string) {
  await withStore("readwrite", (store) => store.delete(fileId));
}

export async function clearWorkflowFiles() {
  await withStore("readwrite", (store) => store.clear());
}
