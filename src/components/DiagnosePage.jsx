import ImageUploader from "./ImageUploader";
import styles from "./DiagnosePage.module.css";

/**
 * DiagnosePage — the upload / inference view.
 * All state and logic live in App.jsx; this component is purely presentational.
 */
export default function DiagnosePage({
  model,
  modelStatus,
  imageUrl,
  imageName,
  inferring,
  inferError,
  uploadError,
  onImageSelected,
  onUploadError,
  onReset,
}) {
  const modelReady   = modelStatus === "ready";
  const modelLoading = modelStatus === "loading" || modelStatus === "idle";
  const modelError   = modelStatus === "error";

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <h1 className="page-title">Diagnose a Leaf</h1>
        <p className="page-subtitle">
          Upload a clear, close-up photo of a single leaf. The AI runs locally on your device.
        </p>
      </div>

      {/* Model status */}
      <div className={styles.modelStatusRow}>
        {modelLoading && (
          <div className={`${styles.statusChip} ${styles.statusLoading}`}>
            <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2, color: "var(--info)" }} aria-hidden="true" />
            Loading AI model (~13 MB)…
          </div>
        )}
        {modelReady && !inferring && !imageUrl && (
          <div className={`${styles.statusChip} ${styles.statusReady}`}>
            <span className={styles.dot} />
            Model ready · 38 classes · runs offline
          </div>
        )}
        {modelError && (
          <div className={`${styles.statusChip} ${styles.statusError}`}>
            ⚠ Model failed to load
          </div>
        )}
      </div>

      {/* Error state */}
      {(uploadError || (inferError && !inferring)) && (
        <div className={styles.errorBox} role="alert">
          <svg viewBox="0 0 20 20" fill="currentColor" className={styles.errorIcon} aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          <div className={styles.errorBody}>
            <p className={styles.errorMsg}>{uploadError || inferError}</p>
            <button className={`btn-ghost ${styles.errorRetry}`} onClick={onReset}>
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Upload zone */}
      {!inferring && !uploadError && (
        <div className={`card card--elevated ${styles.uploaderWrap}`}>
          <ImageUploader
            onImageSelected={onImageSelected}
            onError={onUploadError}
            disabled={!modelReady}
          />

          {/* Preview while model loading */}
          {imageUrl && modelLoading && (
            <div className={styles.previewPending}>
              <img src={imageUrl} alt="Selected leaf" className={styles.previewImg} />
              <p className={styles.previewHint}>
                <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} aria-hidden="true" />
                Waiting for model to finish loading…
              </p>
            </div>
          )}
        </div>
      )}

      {/* Inference in progress */}
      {inferring && (
        <div className={`card card--elevated ${styles.inferCard}`}>
          <img src={imageUrl} alt="Analysing leaf" className={styles.inferImg} />
          <div className={styles.inferOverlay}>
            <div className={styles.inferSpinner}>
              <span className="spinner spinner--lg" style={{ color: "#fff" }} aria-hidden="true" />
            </div>
            <p className={styles.inferLabel}>Analysing with on-device AI…</p>
            {imageName && <p className={styles.inferFile}>{imageName}</p>}
          </div>
        </div>
      )}

      {/* Tips */}
      {!inferring && !uploadError && !inferError && (
        <div className={styles.tips}>
          <p className="section-label" style={{ marginBottom: "0.6rem" }}>Tips for best results</p>
          <ul className={styles.tipList}>
            {[
              "Use a clear, well-lit photo of a single leaf.",
              "Photograph the leaf flat against a plain background.",
              "Capture the full leaf including margins and any lesions.",
              "Supported crops: Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato.",
            ].map((tip, i) => (
              <li key={i} className={styles.tipItem}>
                <span className={styles.tipDot} aria-hidden="true" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
