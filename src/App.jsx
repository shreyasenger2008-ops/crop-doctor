import { useState, useCallback, useEffect, useRef } from "react";
import { useModel } from "./hooks/useModel";
import { useIndexedDB } from "./hooks/useIndexedDB";
import { runInference } from "./utils/preprocess";
import { CLASS_LABELS } from "./utils/classLabels";
import ImageUploader from "./components/ImageUploader";
import ResultCard from "./components/ResultCard";
import HistoryDrawer from "./components/HistoryDrawer";
import OfflineBanner from "./components/OfflineBanner";
import "./App.css";

export default function App() {
  const { model, status, error, retryLoad } = useModel();
  const { history, loadHistory, saveDiagnosis, clearHistory, dbError } = useIndexedDB();

  const [imageUrl, setImageUrl]         = useState(null);
  const [imageName, setImageName]       = useState(null);
  const [predictions, setPredictions]   = useState(null);
  const [isUncertain, setIsUncertain]   = useState(false);
  const [inferring, setInferring]       = useState(false);
  const [inferError, setInferError]     = useState(null);
  const [uploadError, setUploadError]   = useState(null);
  const [historyOpen, setHistoryOpen]   = useState(false);

  // Keep the HTMLImageElement in a ref (not state) to avoid triggering re-renders.
  // It is only needed as an input to runInference; we do not display it directly.
  const imageElRef = useRef(null);

  // Load history on mount
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleImageSelected = useCallback(
    async (url, img, name) => {
      setImageUrl(url);
      setImageName(name ?? null);
      imageElRef.current = img;
      setPredictions(null);
      setIsUncertain(false);
      setInferError(null);
      setUploadError(null);

      if (!model) return;

      setInferring(true);
      try {
        const { predictions: preds, isUncertain: uncertain } =
          await runInference(model, img, 3);

        setPredictions(preds);
        setIsUncertain(uncertain);

        const topLabel = CLASS_LABELS[preds[0]?.index] ?? "Unknown";

        // Persist to IndexedDB (imageUrl intentionally excluded — see useIndexedDB.js)
        await saveDiagnosis({
          classIndex:     preds[0].index,
          confidence:     preds[0].confidence,
          isUncertain:    uncertain,
          displayLabel:   topLabel,
          allPredictions: preds,
          imageName:      name ?? null,
        });
      } catch (err) {
        console.error("[App] Inference failed:", err);
        setInferError(err.message || "Inference failed — please try again.");
      } finally {
        setInferring(false);
      }
    },
    [model, saveDiagnosis]
  );

  const handleUploadError = useCallback((msg) => {
    setUploadError(msg);
    setInferError(null);
  }, []);

  const handleReset = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageElRef.current = null;
    setImageUrl(null);
    setImageName(null);
    setPredictions(null);
    setIsUncertain(false);
    setInferError(null);
    setUploadError(null);
  }, [imageUrl]);

  // Status helpers
  const modelLoading = status === "loading" || status === "idle";
  const modelReady   = status === "ready";
  const modelError   = status === "error";

  return (
    <div className="app">
      <OfflineBanner />

      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <span className="header-icon">🌿</span>
          <div>
            <h1 className="header-title">Crop Doctor AI</h1>
            <p className="header-subtitle">Offline-capable plant disease detection</p>
          </div>
        </div>
        <button
          className="history-btn"
          onClick={() => setHistoryOpen(true)}
          aria-label="Open diagnosis history"
        >
          📋 History
          {history.length > 0 && (
            <span className="history-badge">{history.length}</span>
          )}
        </button>
      </header>

      {/* ── Main content ── */}
      <main className="main">

        {/* Model status bar */}
        {modelLoading && (
          <div className="status-bar loading">
            <span className="spinner" aria-hidden="true" />
            Loading AI model (~13 MB) — this may take a moment…
          </div>
        )}
        {modelError && (
          <div className="status-bar error">
            ⚠️ Model failed to load: {error}
            <button className="retry-btn" onClick={retryLoad}>Retry</button>
          </div>
        )}
        {modelReady && !imageUrl && (
          <div className="status-bar ready">
            ✅ Model ready — 38 plant disease classes loaded
          </div>
        )}

        {/* IndexedDB error (non-fatal) */}
        {dbError && (
          <div className="status-bar warning">
            ℹ️ {dbError}
          </div>
        )}

        {/* Upload or validation error */}
        {(uploadError || (inferError && !predictions)) && (
          <div className="card error-card">
            <p>⚠️ {uploadError || inferError}</p>
            <button className="retry-btn" onClick={handleReset}>Try Again</button>
          </div>
        )}

        {/* Upload area — hidden while results are shown or upload error displayed */}
        {!predictions && !inferring && !uploadError && (
          <>
            <div className="card uploader-card">
              <ImageUploader
                onImageSelected={(url, img) => {
                  // Pass file name via img dataset if available; ImageUploader
                  // stores it as img.dataset.fileName (set below in handleFile wrapper)
                  handleImageSelected(url, img, img.dataset?.fileName ?? null);
                }}
                onError={handleUploadError}
                disabled={!modelReady}
              />
            </div>

            {/* Preview while model is still loading */}
            {imageUrl && !modelReady && (
              <div className="card preview-card">
                <img src={imageUrl} alt="Selected leaf" className="preview-img" />
                <p className="preview-hint">
                  Waiting for model to finish loading…
                </p>
              </div>
            )}
          </>
        )}

        {/* Inference in progress */}
        {inferring && (
          <div className="card infer-card">
            <img src={imageUrl} alt="Analysing leaf" className="preview-img" />
            <div className="infer-status">
              <span className="spinner large" aria-hidden="true" />
              <p>Analysing leaf with AI model…</p>
            </div>
          </div>
        )}

        {/* Inference error (shown after upload succeeded but inference failed) */}
        {inferError && !predictions && !uploadError && (
          <div className="card error-card">
            <p>⚠️ {inferError}</p>
            <button className="retry-btn" onClick={handleReset}>Try Again</button>
          </div>
        )}

        {/* Results */}
        {predictions && !inferring && (
          <ResultCard
            predictions={predictions}
            isUncertain={isUncertain}
            imageUrl={imageUrl}
            onReset={handleReset}
          />
        )}

        {/* Supported crops note */}
        {!imageUrl && !predictions && !uploadError && (
          <details className="supported-crops">
            <summary>Supported crops (14 species, 38 classes)</summary>
            <p>Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato</p>
          </details>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        Model: <em>Greenathon Plant AI</em> by Rishit Dagli · Apache 2.0 ·
        Dataset: PlantVillage (CC0) · Runs fully offline
      </footer>

      {/* ── History Drawer ── */}
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onClear={clearHistory}
        dbError={dbError}
      />
    </div>
  );
}
