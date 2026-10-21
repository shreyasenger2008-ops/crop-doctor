import { useState, useRef, useCallback } from "react";
import styles from "./ImageUploader.module.css";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];

/**
 * ImageUploader — drag-drop, file browse, and camera capture.
 *
 * Validates:
 *   - Must be an image MIME type
 *   - Max 10 MB
 *   - Image element must load without error (catches corrupted files)
 *
 * Resets the file input after each selection so the same file can be
 * re-uploaded (e.g. to retry after a prediction error).
 *
 * On success calls onImageSelected(objectURL, HTMLImageElement).
 * On failure calls onError(message).
 */
export default function ImageUploader({ onImageSelected, onError, disabled }) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef   = useRef(null);
  const cameraInputRef = useRef(null);
  // Track the current object URL so we can revoke it if another file is chosen
  const currentUrlRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;

      // ── Type check ──────────────────────────────────────────────────────────
      if (!ACCEPTED_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
        onError?.(`"${file.name}" is not a supported image format. Please upload JPG, PNG, or WebP.`);
        return;
      }

      // ── Size check ──────────────────────────────────────────────────────────
      if (file.size > MAX_FILE_BYTES) {
        onError?.(`"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`);
        return;
      }

      // Revoke previous URL to free memory
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }

      const url = URL.createObjectURL(file);
      currentUrlRef.current = url;

      const img = new Image();

      img.onload = () => {
        // Basic sanity: image must have non-zero dimensions
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
          URL.revokeObjectURL(url);
          currentUrlRef.current = null;
          onError?.("The image could not be read (zero dimensions). It may be corrupted.");
          return;
        }
        // Attach original filename so callers can persist it without an extra arg
        img.dataset.fileName = file.name;
        onImageSelected(url, img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        currentUrlRef.current = null;
        onError?.(`"${file.name}" could not be decoded. The file may be corrupted or in an unsupported format.`);
      };

      img.src = url;

      // Reset file inputs so the same file can be selected again
      if (fileInputRef.current)   fileInputRef.current.value   = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    },
    [onImageSelected, onError]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      handleFile(file);
    },
    [handleFile]
  );

  const onDragOver  = useCallback((e) => { e.preventDefault(); setDragging(true);  }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);

  return (
    <div
      className={`${styles.dropzone} ${dragging ? styles.dragging : ""} ${disabled ? styles.disabled : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload a leaf image — drag and drop or click to browse"
      aria-disabled={disabled}
      onClick={() => !disabled && fileInputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && !disabled && fileInputRef.current?.click()}
    >
      <div className={styles.inner}>
        {/* Upload icon */}
        <div className={styles.uploadIcon} aria-hidden="true">
          {dragging ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16"/>
              <line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          )}
        </div>

        <p className={styles.mainText}>
          {dragging ? "Drop to analyse" : "Drop a leaf photo here"}
        </p>
        <p className={styles.subText}>or choose from your device · JPG, PNG, WebP · up to 10 MB</p>

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.btn}
            disabled={disabled}
            aria-label="Browse for an image file"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
            </svg>
            Browse File
          </button>
          <button
            type="button"
            className={styles.btn}
            disabled={disabled}
            aria-label="Use device camera to take a photo"
            onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
            </svg>
            Use Camera
          </button>
        </div>
      </div>

      {/* Hidden file inputs — value reset after each selection to allow re-upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
        className={styles.hiddenInput}
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className={styles.hiddenInput}
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}
