const DB_NAME = 'RuteroOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

class OfflineStoreClass {
    constructor() {
        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = (event) => reject("IndexedDB error: " + event.target.error);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    async setItem(key, value) {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(value, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getItem(key) {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async removeItem(key) {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getKeysByPrefix(prefix) {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAllKeys();
            request.onsuccess = () => {
                const keys = request.result.filter(k => typeof k === 'string' && k.startsWith(prefix));
                resolve(keys);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async clearUserPrefix(prefix) {
        const keys = await this.getKeysByPrefix(prefix);
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            if (keys.length === 0) return resolve();
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            keys.forEach(k => store.delete(k));
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }
}

window.OfflineStore = new OfflineStoreClass();
