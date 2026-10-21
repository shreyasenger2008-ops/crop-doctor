import { useState, useCallback, useEffect, useRef } from "react";
import { useModel } from "./hooks/useModel";
import { useIndexedDB } from "./hooks/useIndexedDB";
import { runInference } from "./utils/preprocess";
import { CLASS_LABELS } from "./utils/classLabels";
import OverviewPage from "./components/OverviewPage";
import DiagnosePage from "./components/DiagnosePage";
import ResultCard from "./components/ResultCard";
import HistoryPage from "./components/HistoryPage";
import "./App.css";

/* ── SVG icon helpers ─────────────────────────────────────────────────────── */
const IconHome = ({ cls }) => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={cls} aria-hidden="true">
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
  </svg>
);
const IconScan = ({ cls }) => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={cls} aria-hidden="true">
    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"/>
  </svg>
);
const IconHistory = ({ cls }) => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={cls} aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
  </svg>
);
const IconLeaf = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
  </svg>
);

const NAV_ITEMS = [
  { id: "overview",  label: "Overview",  Icon: IconHome    },
  { id: "diagnose",  label: "Diagnose",  Icon: IconScan    },
  { id: "history",   label: "History",   Icon: IconHistory },
];

/* ─────────────────────────────────────────────────────────────────────────── */

export default function App() {
  const { model, status: modelStatus, error: modelError, retryLoad } = useModel();
  const { history, loadHistory, saveDiagnosis, clearHistory, dbError } = useIndexedDB();

  /* ── Navigation ── */
  const [view, setView] = useState("overview");

  /* ── Diagnosis state ── */
  const [imageUrl, setImageUrl]       = useState(null);
  const [imageName, setImageName]     = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [isUncertain, setIsUncertain] = useState(false);
  const [inferring, setInferring]     = useState(false);
  const [inferError, setInferError]   = useState(null);
  const [uploadError, setUploadError] = useState(null);

  /* ── Offline ── */
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const imageElRef = useRef(null);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  useEffect(() => {
    const up   = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online",  up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  /* ── Inference ── */
  const handleImageSelected = useCallback(
    async (url, img) => {
      setImageUrl(url);
      setImageName(img.dataset?.fileName ?? null);
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
        await saveDiagnosis({
          classIndex:     preds[0].index,
          confidence:     preds[0].confidence,
          isUncertain:    uncertain,
          displayLabel:   topLabel,
          allPredictions: preds,
          imageName:      img.dataset?.fileName ?? null,
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

  /* ── Navigate to diagnose + reset ── */
  const goToDiagnose = useCallback(() => {
    handleReset();
    setView("diagnose");
  }, [handleReset]);

  /* ── After a result, if user clicks "Analyse Another" ── */
  const handleAnalyseAnother = useCallback(() => {
    handleReset();
    // Stay on diagnose view
  }, [handleReset]);

  /* ── Model status dot ── */
  const modelDotClass = modelStatus === "ready" ? "ready" : modelStatus === "loading" || modelStatus === "idle" ? "loading" : "error";
  const modelStatusText =
    modelStatus === "ready"   ? "Model ready"    :
    modelStatus === "error"   ? "Model failed"   :
    "Loading model…";

  /* ── Render the current page ── */
  const renderPage = () => {
    if (view === "overview") {
      return (
        <OverviewPage
          history={history}
          modelStatus={modelStatus}
          onNavigateDiagnose={goToDiagnose}
          onNavigateHistory={() => setView("history")}
        />
      );
    }

    if (view === "diagnose") {
      // Show result if we have predictions
      if (predictions && !inferring) {
        return (
          <div className={diagPageStyles}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h1 className="page-title">Diagnosis Result</h1>
              <p className="page-subtitle">
                AI analysis complete · {imageName ?? "Uploaded image"}
              </p>
            </div>
            <ResultCard
              predictions={predictions}
              isUncertain={isUncertain}
              imageUrl={imageUrl}
              onReset={handleAnalyseAnother}
            />
          </div>
        );
      }

      return (
        <DiagnosePage
          model={model}
          modelStatus={modelStatus}
          imageUrl={imageUrl}
          imageName={imageName}
          inferring={inferring}
          inferError={inferError}
          uploadError={uploadError}
          onImageSelected={handleImageSelected}
          onUploadError={handleUploadError}
          onReset={handleReset}
        />
      );
    }

    if (view === "history") {
      return (
        <HistoryPage
          history={history}
          onClear={clearHistory}
          dbError={dbError}
        />
      );
    }

    return null;
  };

  return (
    <div className="shell">

      {/* ════════════════════════════════════════════════════
          SIDEBAR (desktop)
      ════════════════════════════════════════════════════ */}
      <nav className="sidebar" aria-label="Main navigation">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div className="brand-icon">
              <IconLeaf />
            </div>
            <div className="brand-text">
              <span className="brand-name">Crop Doctor AI</span>
              <span className="brand-tagline">On-Device Plant Health</span>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div className="sidebar-nav">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`nav-item ${view === id ? "active" : ""}`}
              onClick={() => {
                if (id === "diagnose" && (predictions || inferring)) {
                  // Keep current diagnose state, just switch view
                  setView("diagnose");
                } else {
                  setView(id);
                }
              }}
              aria-current={view === id ? "page" : undefined}
              aria-label={label}
            >
              <Icon cls="nav-icon" />
              {label}
              {id === "history" && history.length > 0 && (
                <span className="nav-badge">{history.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Footer — status */}
        <div className="sidebar-footer">
          <div className="model-status">
            <span className={`model-status-dot ${modelDotClass}`} aria-hidden="true" />
            {modelStatusText}
          </div>
          {!isOnline && (
            <div className="offline-dot" role="status" aria-live="polite">
              <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" aria-hidden="true">
                <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 00.808 9.636a1 1 0 001.414-1.414 9 9 0 0112.728 0 1 1 0 001.414-1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 11-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414z" clipRule="evenodd"/>
                <circle cx="10" cy="15" r="2"/>
              </svg>
              Offline — cached model in use
            </div>
          )}
          <p className="sidebar-credits">
            Model: Greenathon Plant AI<br />
            Apache 2.0 · PlantVillage (CC0)
          </p>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════
          TOPBAR (mobile)
      ════════════════════════════════════════════════════ */}
      <header className="topbar" aria-label="App header">
        <div className="topbar-brand">
          <div className="topbar-icon" aria-hidden="true">
            <IconLeaf />
          </div>
          <span className="topbar-name">Crop Doctor AI</span>
        </div>
        <div className="topbar-status" aria-live="polite">
          <span className={`model-status-dot ${modelDotClass}`} aria-hidden="true" />
          {!isOnline && <span style={{ color: "#fb923c" }}>Offline</span>}
        </div>
      </header>

      {/* ════════════════════════════════════════════════════
          CONTENT
      ════════════════════════════════════════════════════ */}
      <main className="content" id="main-content">
        <div className="page">
          {renderPage()}
        </div>
      </main>

      {/* ════════════════════════════════════════════════════
          BOTTOM NAV (mobile)
      ════════════════════════════════════════════════════ */}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        <div className="bottom-nav-inner">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`bottom-nav-item ${view === id ? "active" : ""}`}
              onClick={() => setView(id)}
              aria-current={view === id ? "page" : undefined}
              aria-label={label}
            >
              {id === "history" && history.length > 0 && (
                <span className="bottom-nav-badge" aria-label={`${history.length} history items`}>
                  {history.length}
                </span>
              )}
              <Icon cls={undefined} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}


