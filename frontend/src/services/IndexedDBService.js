// src/services/IndexedDBService.js
const DB_NAME = 'StoreStudioCache';
const DB_VERSION = 1;
const STORE_NAME = 'assets';

export class IndexedDBService {
  constructor() {
    this.dbPromise = this.initDB();
  }

  initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // Store: { url: string, blob: Blob, timestamp: number, type: string }
          db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        }
      };
    });
  }

  async getCachedAsset(url) {
    const db = await this.dbPromise;
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);
      request.onsuccess = () => {
        const record = request.result;
        // Cache valid for 7 days
        if (record && (Date.now() - record.timestamp < 7 * 24 * 60 * 60 * 1000)) {
          resolve(URL.createObjectURL(record.blob));
        } else {
          resolve(null); // Cache miss or expired
        }
      };
      request.onerror = () => resolve(null);
    });
  }

  async cacheAsset(url, blob, type = 'model') {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        url,
        blob,
        timestamp: Date.now(),
        type
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Hook into Three.js loaders to check cache first
  async loadWithCache(url, loader, onLoad) {
    const cachedUrl = await this.getCachedAsset(url);
    if (cachedUrl) {
      console.log(`[Cache Hit] ${url}`);
      loader.load(cachedUrl, onLoad, undefined, () => {
        URL.revokeObjectURL(cachedUrl); // Clean up memory
      });
    } else {
      console.log(`[Cache Miss] Fetching ${url}`);
      // Fetch as blob first to cache it, then load
      const response = await fetch(url);
      const blob = await response.blob();
      await this.cacheAsset(url, blob);
      const objectUrl = URL.createObjectURL(blob);
      loader.load(objectUrl, onLoad, undefined, () => {
        URL.revokeObjectURL(objectUrl);
      });
    }
  }
}

export const idbService = new IndexedDBService();