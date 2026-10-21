import { useState, useCallback } from "react";
import { openDB } from "idb";

const DB_NAME    = "crop-doctor-db";
const DB_VERSION = 1;
const STORE_NAME = "diagnoses";

/**
 * Schema:
 * {
 *   id          : number (auto-increment, primary key)
 *   createdAt   : number (Date.now() — Unix ms, indexed)
 *   classIndex  : number (0–37, model output index)
 *   confidence  : number (0–1, top prediction probability)
 *   isUncertain : boolean (true if confidence < threshold)
 *   displayLabel: string (human-readable class label at time of save)
 *   allPredictions: Array<{index, confidence}> (top-3)
 *   imageName   : string (original file name if available)
 *   // Note: imageUrl (object URL) is intentionally NOT persisted —
 *   // object URLs are revoked after use and would be broken after refresh.
 * }
 */
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("createdAt", "createdAt");
      }
    },
  });
}

/**
 * Hook for reading and writing diagnosis history in IndexedDB.
 *
 * Graceful degradation: if IndexedDB is unavailable (e.g. private browsing
 * in some browsers) all operations silently fail and history stays empty.
 */
export function useIndexedDB() {
  const [history, setHistory] = useState([]);
  const [dbError, setDbError] = useState(null);

  const loadHistory = useCallback(async () => {
    try {
      const db  = await getDB();
      const all = await db.getAllFromIndex(STORE_NAME, "createdAt");
      setHistory(all.reverse()); // newest first
    } catch (err) {
      console.warn("[useIndexedDB] Could not load history:", err.message);
      setDbError("History unavailable — IndexedDB may be blocked in this browser.");
    }
  }, []);

  /**
   * Save a diagnosis record.
   *
   * IMPORTANT: imageUrl (object URL) is NOT saved because object URLs are
   * tab-local and get revoked — they would appear broken after a page refresh.
   * Pass imageName from the original File object instead.
   *
   * @param {object} record
   * @param {number}  record.classIndex
   * @param {number}  record.confidence      0–1
   * @param {boolean} record.isUncertain
   * @param {string}  record.displayLabel    human-readable label
   * @param {Array}   record.allPredictions  top-3 [{index, confidence}]
   * @param {string}  [record.imageName]     original filename (optional)
   */
  const saveDiagnosis = useCallback(async (record) => {
    // Strip any object URL — it won't survive a refresh
    // eslint-disable-next-line no-unused-vars
    const { imageUrl, ...safeRecord } = record;

    try {
      const db = await getDB();
      await db.add(STORE_NAME, {
        ...safeRecord,
        createdAt: Date.now(),
      });
      await loadHistory();
    } catch (err) {
      console.warn("[useIndexedDB] Could not save diagnosis:", err.message);
    }
  }, [loadHistory]);

  const clearHistory = useCallback(async () => {
    try {
      const db = await getDB();
      await db.clear(STORE_NAME);
      setHistory([]);
    } catch (err) {
      console.warn("[useIndexedDB] Could not clear history:", err.message);
    }
  }, []);

  return { history, loadHistory, saveDiagnosis, clearHistory, dbError };
}
