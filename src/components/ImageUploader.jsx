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
      aria-label="Upload a leaf image"
      aria-disabled={disabled}
      onClick={() => !disabled && fileInputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && !disabled && fileInputRef.current?.click()}
    >
      <div className={styles.inner}>
        <div className={styles.icon}>🌿</div>
        <p className={styles.mainText}>
          {dragging ? "Drop the leaf image here" : "Drop a leaf photo or click to browse"}
        </p>
        <p className={styles.subText}>JPG, PNG, WebP — up to 10 MB</p>
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.btn}
            disabled={disabled}
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            📁 Browse File
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.cameraBtn}`}
            disabled={disabled}
            onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
          >
            📷 Use Camera
          </button>
        </div>
      </div>

      {/* Hidden file inputs — value reset after each selection to allow re-upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
        className={styles.hiddenInput}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className={styles.hiddenInput}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}
