"use client";

/**
 * Offline-First IndexedDB Helper untuk Kasir POS
 * Menyimpan data produk, customer, dan antrean transaksi offline saat internet terputus.
 */

const DB_NAME = "kasirku_pos_offline_db";
const DB_VERSION = 1;

function openOfflineDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB tidak didukung pada browser ini."));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("offline_products")) {
        db.createObjectStore("offline_products", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pending_transactions")) {
        db.createObjectStore("pending_transactions", { keyPath: "offlineId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cache produk aktif ke IndexedDB untuk keperluan transaksi offline.
 */
export async function cacheProductsForOffline(products: any[]): Promise<void> {
  try {
    const db = await openOfflineDatabase();
    const tx = db.transaction("offline_products", "readwrite");
    const store = tx.objectStore("offline_products");
    store.clear();
    for (const p of products) {
      store.put(p);
    }
  } catch (err) {
    console.warn("Gagal menyimpan cache produk offline:", err);
  }
}

/**
 * Mengambil cache produk saat kasir dalam mode offline.
 */
export async function getOfflineCachedProducts(): Promise<any[]> {
  try {
    const db = await openOfflineDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("offline_products", "readonly");
      const store = tx.objectStore("offline_products");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return [];
  }
}

/**
 * Menyimpan transaksi kasir ke antrean offline lokal.
 */
export async function queueOfflineTransaction(transactionData: any): Promise<string> {
  const offlineId = `OFFLINE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const db = await openOfflineDatabase();

  const record = {
    ...transactionData,
    offlineId,
    queuedAt: new Date().toISOString(),
    isSynced: false,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_transactions", "readwrite");
    const store = tx.objectStore("pending_transactions");
    const req = store.add(record);
    req.onsuccess = () => resolve(offlineId);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Mengambil seluruh transaksi yang tertunda sinkronisasi.
 */
export async function getPendingOfflineTransactions(): Promise<any[]> {
  try {
    const db = await openOfflineDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("pending_transactions", "readonly");
      const store = tx.objectStore("pending_transactions");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return [];
  }
}

/**
 * Menghapus transaksi yang telah berhasil disinkronisasi ke server.
 */
export async function removeSyncedOfflineTransaction(offlineId: string): Promise<void> {
  try {
    const db = await openOfflineDatabase();
    const tx = db.transaction("pending_transactions", "readwrite");
    const store = tx.objectStore("pending_transactions");
    store.delete(offlineId);
  } catch (err) {
    console.warn("Gagal menghapus transaksi offline yang tersinkron:", err);
  }
}
