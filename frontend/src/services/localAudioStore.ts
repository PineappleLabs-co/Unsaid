/**
 * Local Audio Storage Engine using native IndexedDB
 * Persists user voice recordings locally on the device.
 * Guarantees zero voice audio is sent to the cloud database,
 * while allowing instant, persistent playback across browser reloads.
 */

const DB_NAME = 'unsaid_local_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_recordings';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('Failed to open local audio IndexedDB:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Save an audio Blob locally for a given thought ID
 */
export async function saveAudioBlob(thoughtId: string, blob: Blob): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, thoughtId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`Could not save audio blob locally for ${thoughtId}:`, err);
  }
}

/**
 * Retrieve the raw audio Blob for a thought ID from local storage
 */
export async function getAudioBlob(thoughtId: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(thoughtId);

      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`Could not retrieve audio blob for ${thoughtId}:`, err);
    return null;
  }
}

/**
 * Creates an object URL for in-app audio playback.
 * Caller should release with URL.revokeObjectURL when done if necessary.
 */
export async function getAudioUrl(thoughtId: string): Promise<string | null> {
  const blob = await getAudioBlob(thoughtId);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

/**
 * Remove local audio recording when thought is deleted
 */
export async function deleteAudioBlob(thoughtId: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(thoughtId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`Could not delete audio blob for ${thoughtId}:`, err);
  }
}
