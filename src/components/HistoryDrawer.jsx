import { useEffect } from "react";
import { isHealthy } from "../utils/classLabels";
import styles from "./HistoryDrawer.module.css";

/**
 * Slide-in drawer showing IndexedDB diagnosis history.
 *
 * Note: imageUrl is no longer persisted in IndexedDB (object URLs are
 * revoked after use and would be broken after a page refresh). Instead,
 * the original filename (imageName) and the human-readable label
 * (displayLabel) are stored and displayed here.
 */
export default function HistoryDrawer({ open, onClose, history, onClear, dbError }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      {open && <div className={styles.backdrop} onClick={onClose} />}

      <aside className={`${styles.drawer} ${open ? styles.open : ""}`} aria-label="Diagnosis history">
        <div className={styles.header}>
          <h2 className={styles.title}>📋 History</h2>
          <div className={styles.headerActions}>
            {history.length > 0 && (
              <button className={styles.clearBtn} onClick={onClear}>Clear all</button>
            )}
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close history">✕</button>
          </div>
        </div>

        {/* Non-fatal IndexedDB warning */}
        {dbError && (
          <p className={styles.dbError}>ℹ️ {dbError}</p>
        )}

        <div className={styles.list}>
          {history.length === 0 ? (
            <p className={styles.empty}>No diagnoses yet. Upload a leaf image to start.</p>
          ) : (
            history.map((item) => {
              const healthy    = isHealthy(item.classIndex);
              // displayLabel was stored at save time; fall back for legacy records
              const label      = item.displayLabel ?? `Class ${item.classIndex}`;
              const uncertain  = item.isUncertain;

              return (
                <div key={item.id} className={styles.item}>
                  {/* Leaf emoji replaces broken imageUrl thumbnail */}
                  <div className={styles.itemLeft}>
                    <span className={styles.leafEmoji} role="img" aria-label="Leaf">
                      {healthy ? "🌿" : "🍂"}
                    </span>
                  </div>

                  <div className={styles.itemRight}>
                    {/* Primary label */}
                    <div
                      className={styles.diseaseLabel}
                      style={{ color: uncertain ? "#92400e" : (healthy ? "#16a34a" : "#dc2626") }}
                    >
                      {uncertain
                        ? `⚠️ Uncertain — ${label}`
                        : healthy
                          ? `✅ ${label}`
                          : `⚠️ ${label}`}
                    </div>

                    {/* Original filename if available */}
                    {item.imageName && (
                      <div className={styles.imageName} title={item.imageName}>
                        📄 {item.imageName}
                      </div>
                    )}

                    <div className={styles.meta}>
                      {(item.confidence * 100).toFixed(1)}% confidence{uncertain ? " (uncertain)" : ""} &bull;{" "}
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
