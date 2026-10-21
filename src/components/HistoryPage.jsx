import { useEffect } from "react";
import { isHealthy } from "../utils/classLabels";
import styles from "./HistoryPage.module.css";

/**
 * HistoryPage — full-page history view built from IndexedDB records.
 *
 * imageUrl is intentionally NOT persisted (object URLs are revoked after use).
 * Uses displayLabel, imageName, isUncertain stored at diagnosis time.
 */
export default function HistoryPage({ history, onClear, dbError }) {
  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className="page-title">Scan History</h1>
          <p className="page-subtitle">
            All diagnoses are stored locally on this device using IndexedDB.
          </p>
        </div>
        {history.length > 0 && (
          <button
            className="btn-ghost"
            onClick={onClear}
            aria-label="Clear all diagnosis history"
            style={{ color: "var(--danger)", whiteSpace: "nowrap" }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15" aria-hidden="true">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            Clear all
          </button>
        )}
      </div>

      {dbError && (
        <div className={styles.dbError} role="alert">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
          {dbError}
        </div>
      )}

      {history.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="20" fill="var(--healthy-bg)" />
              <path d="M24 14 C18 19 16 27 20 33 C22 36 27 37 30 34 C33 30 34 23 31 18 C29 15 27 13 24 14Z"
                    fill="#3d7a56" opacity="0.7" />
              <path d="M24 14 C24 24 24 30 20 33" stroke="#2d5a3f" strokeWidth="1.5" fill="none" opacity="0.5"/>
            </svg>
          </div>
          <p className={styles.emptyTitle}>No diagnoses yet</p>
          <p className={styles.emptyDesc}>Upload a leaf image to start scanning. Your results will appear here.</p>
        </div>
      ) : (
        <div className={`card ${styles.list}`}>
          {history.map((item, i) => {
            const healthy   = isHealthy(item.classIndex);
            const label     = item.displayLabel ?? `Class ${item.classIndex}`;
            const uncertain = item.isUncertain;

            const pillClass = uncertain
              ? "pill--neutral"
              : healthy
                ? "pill--healthy"
                : "pill--danger";

            const pillLabel = uncertain ? "Uncertain" : healthy ? "Healthy" : "Disease";

            return (
              <div
                key={item.id}
                className={`${styles.item} ${i < history.length - 1 ? styles.itemBorder : ""}`}
              >
                <div className={styles.itemEmoji} aria-hidden="true">
                  {healthy ? "🌿" : "🍂"}
                </div>
                <div className={styles.itemBody}>
                  <p className={styles.itemLabel}>{label}</p>
                  {item.imageName && (
                    <p className={styles.itemFile} title={item.imageName}>
                      {item.imageName}
                    </p>
                  )}
                  <p className={styles.itemMeta}>
                    {(item.confidence * 100).toFixed(1)}% confidence
                    {uncertain ? " · Low confidence" : ""}
                    {" · "}
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                    {" "}
                    {new Date(item.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className={`pill ${pillClass}`}>{pillLabel}</span>
              </div>
            );
          })}
        </div>
      )}

      <p className={styles.footNote}>
        History is stored locally in your browser's IndexedDB. Clearing browser data will
        remove all records. No data is sent to any server.
      </p>
    </div>
  );
}
