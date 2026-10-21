import { useMemo } from "react";
import { isHealthy, getCropName, getDiseaseName } from "../utils/classLabels";
import styles from "./OverviewPage.module.css";

const CROPS = ["Apple","Blueberry","Cherry","Corn","Grape","Orange","Peach","Pepper","Potato","Raspberry","Soybean","Squash","Strawberry","Tomato"];

/**
 * OverviewPage — dashboard shown on first load.
 * All statistics are derived from real IndexedDB history; none are fabricated.
 */
export default function OverviewPage({ history, modelStatus, onNavigateDiagnose, onNavigateHistory }) {
  /* ── Derive real stats from history ── */
  const stats = useMemo(() => {
    const total    = history.length;
    const healthy  = history.filter(r => isHealthy(r.classIndex)).length;
    const diseased = total - healthy;
    const uncertain= history.filter(r => r.isUncertain).length;

    // Most recent 3 for the quick-view list
    const recent = history.slice(0, 3);

    return { total, healthy, diseased, uncertain, recent };
  }, [history]);

  const modelReady   = modelStatus === "ready";
  const modelLoading = modelStatus === "loading" || modelStatus === "idle";
  const modelError   = modelStatus === "error";

  return (
    <div className={styles.root}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            Offline-First · 38 Disease Classes · On-Device AI
          </div>
          <h1 className={styles.heroTitle}>
            Identify crop diseases<br />
            <span className={styles.heroAccent}>before they spread.</span>
          </h1>
          <p className={styles.heroDesc}>
            Upload a photo of any leaf from 14 supported crops. The AI model
            runs entirely on your device — no internet required after first load.
          </p>
          <div className={styles.heroCtas}>
            <button
              className="btn-primary"
              onClick={onNavigateDiagnose}
              disabled={!modelReady}
              aria-label="Start a new leaf diagnosis"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
              </svg>
              {modelLoading ? "Loading model…" : modelError ? "Model unavailable" : "Diagnose a Leaf"}
            </button>
            {stats.total > 0 && (
              <button className="btn-secondary" onClick={onNavigateHistory} aria-label="View diagnosis history">
                View history ({stats.total})
              </button>
            )}
          </div>
          {modelLoading && (
            <p className={styles.modelNote}>
              <span className="spinner" style={{ width: 13, height: 13 }} aria-hidden="true" />
              Loading AI model (~13 MB)…
            </p>
          )}
          {modelError && (
            <p className={styles.modelNoteError}>
              ⚠ Model failed to load. Check your connection and refresh the page.
            </p>
          )}
        </div>
        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.heroIllustration}>
            {/* SVG leaf illustration — decorative */}
            <svg viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="110" cy="110" rx="90" ry="90" fill="var(--healthy-bg)" />
              <path d="M110 40 C60 70 50 130 80 170 C95 192 130 195 150 175 C175 150 180 100 160 70 C145 48 130 35 110 40Z"
                    fill="#3d7a56" opacity="0.85" />
              <path d="M110 40 C110 100 115 150 80 170" stroke="#2d5a3f" strokeWidth="2" fill="none" opacity="0.5"/>
              <path d="M110 80 C125 90 140 105 135 125" stroke="#2d5a3f" strokeWidth="1.5" fill="none" opacity="0.4"/>
              <path d="M110 100 C95 108 85 120 88 138" stroke="#2d5a3f" strokeWidth="1.5" fill="none" opacity="0.4"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ── Stats row — only render if history exists ── */}
      {stats.total > 0 && (
        <section className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{stats.total}</span>
            <span className={styles.statLabel}>Total Scans</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum} style={{ color: "var(--healthy)" }}>{stats.healthy}</span>
            <span className={styles.statLabel}>Healthy Results</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum} style={{ color: "var(--danger)" }}>{stats.diseased}</span>
            <span className={styles.statLabel}>Disease Detected</span>
          </div>
          {stats.uncertain > 0 && (
            <div className={styles.statCard}>
              <span className={styles.statNum} style={{ color: "var(--warn)" }}>{stats.uncertain}</span>
              <span className={styles.statLabel}>Low Confidence</span>
            </div>
          )}
        </section>
      )}

      {/* ── Recent diagnoses ── */}
      {stats.recent.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className="section-label">Recent Diagnoses</p>
            <button className="btn-ghost" onClick={onNavigateHistory} style={{ fontSize: "0.8rem" }}>
              View all →
            </button>
          </div>
          <div className={`card ${styles.recentList}`}>
            {stats.recent.map((item, i) => {
              const healthy   = isHealthy(item.classIndex);
              const label     = item.displayLabel ?? `Class ${item.classIndex}`;
              const uncertain = item.isUncertain;
              const pillClass = uncertain ? "pill--neutral" : healthy ? "pill--healthy" : "pill--danger";
              return (
                <div key={item.id} className={`${styles.recentItem} ${i < stats.recent.length - 1 ? styles.recentItemBorder : ""}`}>
                  <div className={styles.recentEmoji} aria-hidden="true">{healthy ? "🌿" : "🍂"}</div>
                  <div className={styles.recentDetails}>
                    <span className={styles.recentLabel}>{label}</span>
                    {item.imageName && (
                      <span className={styles.recentFile}>{item.imageName}</span>
                    )}
                  </div>
                  <div className={styles.recentRight}>
                    <span className={`pill ${pillClass}`}>
                      {uncertain ? "Uncertain" : healthy ? "Healthy" : "Disease"}
                    </span>
                    <span className={styles.recentConf}>{(item.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <section className={styles.section}>
        <p className="section-label">How It Works</p>
        <div className={styles.stepsGrid}>
          {[
            {
              n: "1",
              title: "Upload a leaf photo",
              desc: "Use your camera or pick a file. The image stays on your device.",
              icon: (
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 5 2-3 3 6z" clipRule="evenodd"/>
                </svg>
              ),
            },
            {
              n: "2",
              title: "On-device AI analysis",
              desc: "A MobileNet model classifies the leaf against 38 disease categories—locally.",
              icon: (
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.396 0 2.7.37 3.82 1.016A7.969 7.969 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
                </svg>
              ),
            },
            {
              n: "3",
              title: "See the result & guidance",
              desc: "Crop, disease, confidence, and general agronomic guidance—instantly.",
              icon: (
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              ),
            },
          ].map(step => (
            <div key={step.n} className={styles.stepCard}>
              <div className={styles.stepIcon}>{step.icon}</div>
              <div className={styles.stepBody}>
                <p className={styles.stepTitle}>{step.title}</p>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Supported crops ── */}
      <section className={styles.section}>
        <p className="section-label">Supported Crops — 14 Species, 38 Classes</p>
        <div className={`card ${styles.cropsCard}`}>
          <div className={styles.cropsGrid}>
            {CROPS.map(c => (
              <span key={c} className={styles.cropChip}>{c}</span>
            ))}
          </div>
          <p className={styles.cropsNote}>
            Only these 14 crops are recognised. Results for other plants will show low confidence.
          </p>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <div className="disclaimer-box" style={{ marginBottom: "1rem" }}>
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
        </svg>
        <span>
          <strong>For guidance only.</strong> This tool has not been independently evaluated on a
          labeled test set. Confidence scores do not guarantee correctness. Always consult a
          qualified agronomist before taking any crop-management action.
        </span>
      </div>
    </div>
  );
}
