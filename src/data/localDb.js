const DB_NAME = 'desktop-widgets-local';
const DB_VERSION = 3;
const DB_OPEN_TIMEOUT_MS = 10000;

const DATA_STORES = [
  'settings',
  'widgets',
  'todos',
  'markdown_entries',
  'daily_reviews',
  'pomodoro_sessions',
  'assets',
  'pinned_notes',
];

let dbPromise;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    let settled = false;
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      dbPromise = null;
      reject(new Error('本地数据库打开超时。请关闭其他正在打开的本页面或 PWA 窗口后刷新。'));
    }, DB_OPEN_TIMEOUT_MS);

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      callback(value);
    };

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('widgets')) {
        db.createObjectStore('widgets', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('todos')) {
        const store = db.createObjectStore('todos', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('markdown_entries')) {
        db.createObjectStore('markdown_entries', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('daily_reviews')) {
        db.createObjectStore('daily_reviews', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('pomodoro_sessions')) {
        const store = db.createObjectStore('pomodoro_sessions', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('assets')) {
        const store = db.createObjectStore('assets', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
      }
      if (!db.objectStoreNames.contains('backup_snapshots')) {
        const store = db.createObjectStore('backup_snapshots', { keyPath: 'id' });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
      if (!db.objectStoreNames.contains('pinned_notes')) {
        db.createObjectStore('pinned_notes', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      if (settled) {
        db.close();
        return;
      }
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      finish(resolve, db);
    };
    request.onerror = () => {
      dbPromise = null;
      finish(reject, request.error || new Error('本地数据库打开失败'));
    };
    request.onblocked = () => {
      dbPromise = null;
      finish(reject, new Error('本地数据库升级被其他页面占用。请关闭其他标签页或旧 PWA 窗口后刷新。'));
    };
  });

  return dbPromise;
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function store(name, mode = 'readonly') {
  const db = await openDb();
  return db.transaction(name, mode).objectStore(name);
}

export async function getRecord(name, key) {
  return requestToPromise((await store(name)).get(key));
}

export async function putRecord(name, value) {
  return requestToPromise((await store(name, 'readwrite')).put(value));
}

export async function deleteRecord(name, key) {
  return requestToPromise((await store(name, 'readwrite')).delete(key));
}

export async function getAllRecords(name) {
  return requestToPromise((await store(name)).getAll());
}

export async function clearStore(name) {
  return requestToPromise((await store(name, 'readwrite')).clear());
}

export async function getByIndex(name, indexName, value) {
  const objectStore = await store(name);
  return requestToPromise(objectStore.index(indexName).getAll(value));
}

export async function getSetting(key, fallback = null) {
  const row = await getRecord('settings', key);
  return row ? row.value : fallback;
}

export async function setSetting(key, value) {
  await putRecord('settings', { key, value, updated_at: new Date().toISOString() });
  return value;
}

export async function exportAllStores() {
  const data = {};
  for (const name of DATA_STORES) {
    data[name] = await getAllRecords(name);
  }
  return data;
}

export async function importAllStores(data) {
  for (const name of DATA_STORES) {
    await clearStore(name);
  }

  for (const name of DATA_STORES) {
    const rows = data[name] || [];
    for (const row of rows) {
      await putRecord(name, row);
    }
  }
}

export async function estimateStorage() {
  if (!navigator.storage?.estimate) return null;
  return navigator.storage.estimate();
}

export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return false;
  return navigator.storage.persist();
}

export async function isPersistentStorage() {
  if (!navigator.storage?.persisted) return false;
  return navigator.storage.persisted();
}
