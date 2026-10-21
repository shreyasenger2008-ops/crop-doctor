import { getCropName, getDiseaseName, isHealthy } from "../utils/classLabels";
import { REMEDIES, SEVERITY_CONFIG } from "../utils/remedies";
import { LOW_CONFIDENCE_THRESHOLD } from "../utils/preprocess";
import styles from "./ResultCard.module.css";

/**
 * ResultCard — premium results view.
 *
 * Preserves ALL existing logic:
 * - 38 class labels from classLabels.js
 * - REMEDIES and SEVERITY_CONFIG from remedies.js
 * - LOW_CONFIDENCE_THRESHOLD from preprocess.js
 * - isUncertain flag from inference
 * - Accuracy disclaimer always shown
 * - Treatment tips suppressed when uncertain
 */
export default function ResultCard({ predictions, isUncertain, imageUrl, onReset }) {
  if (!predictions || predictions.length === 0) return null;

  const top            = predictions[0];
  const healthy        = isHealthy(top.index);
  const crop           = getCropName(top.index);
  const disease        = getDiseaseName(top.index);
  const remedy         = REMEDIES[top.index];
  const severity       = SEVERITY_CONFIG[remedy?.severity ?? "moderate"];
  const confidencePct  = (top.confidence * 100).toFixed(1);
  const uncertain      = isUncertain || !classLabelExists(top.index);

  // Pill class derived from severity
  const pillClassMap = {
    healthy:  "pill--healthy",
    moderate: "pill--warn",
    high:     "pill--danger",
    critical: "pill--critical",
  };
  const pillClass = uncertain ? "pill--neutral" : (pillClassMap[remedy?.severity] ?? "pill--warn");

  return (
    <div className={styles.root} style={{ animation: "fadeUp 0.25s ease both" }}>

      {/* ── Image + badge ── */}
      <div className={styles.imageWrap}>
        <img src={imageUrl} alt={`Leaf diagnosed as ${disease}`} className={styles.leafImage} />
        <div className={styles.imageBadgeRow}>
          <span className={`pill ${pillClass}`}>
            {uncertain ? "Low Confidence" : severity.label}
          </span>
        </div>
      </div>

      {/* ── Result body ── */}
      <div className={styles.body}>

        {/* Crop + disease */}
        <div className={styles.diagnoseHeader}>
          <p className={styles.cropLabel}>{crop}</p>
          <h2 className={styles.diseaseTitle} style={{ color: uncertain ? "var(--warn)" : severity.color }}>
            {healthy && !uncertain
              ? "Healthy Plant"
              : uncertain
                ? disease
                : disease}
          </h2>
          {healthy && !uncertain && (
            <p className={styles.healthyNote}>No signs of disease detected by the model.</p>
          )}
        </div>

        {/* Uncertain panel */}
        {uncertain && (
          <div className={styles.uncertainBox} role="alert">
            <div className={styles.uncertainHeader}>
              <svg viewBox="0 0 20 20" fill="currentColor" className={styles.uncertainIcon} aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <strong>Uncertain result ({confidencePct}% &lt; {(LOW_CONFIDENCE_THRESHOLD * 100).toFixed(0)}% threshold)</strong>
            </div>
            <p className={styles.uncertainBody}>This may happen when:</p>
            <ul className={styles.uncertainList}>
              <li>The crop is not among the 14 supported species</li>
              <li>The image is blurry, poorly lit, or not centred on a single leaf</li>
              <li>The photo shows soil, background, or a non-leaf subject</li>
            </ul>
            <p className={styles.uncertainAction}>
              Try a clearer, close-up photo against a plain background. The best guess is shown below for reference only.
            </p>
          </div>
        )}

        {/* Confidence bar */}
        <div className={styles.confidenceSection}>
          <div className={styles.confidenceHeader}>
            <span className={styles.confidenceLabel}>Model confidence</span>
            <span className={styles.confidenceValue} style={{ color: uncertain ? "var(--warn)" : severity.color }}>
              {confidencePct}%
            </span>
          </div>
          <div className={styles.barTrack} role="progressbar" aria-valuenow={parseFloat(confidencePct)} aria-valuemin="0" aria-valuemax="100">
            <div
              className={styles.barFill}
              style={{
                width: `${confidencePct}%`,
                background: uncertain ? "var(--warn)" : severity.color,
              }}
            />
          </div>
        </div>

        {/* Disclaimer — always shown */}
        <div className={styles.disclaimer}>
          <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1, color: "var(--warn)" }}>
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
          </svg>
          <span>
            <strong>For guidance only.</strong> Model accuracy has not been independently evaluated.
            A confidence score does not guarantee correctness. Confirm with a qualified agronomist
            before taking any action.
          </span>
        </div>

        {/* Treatment guidance — suppressed when uncertain */}
        {remedy && !uncertain && (
          <div className={styles.remedySection}>
            <p className="section-label">General Guidance</p>
            <div className={styles.remedyCard} style={{ borderColor: severity.color }}>
              <div className={styles.remedyBar} style={{ background: severity.color }} aria-hidden="true" />
              <div className={styles.remedyContent}>
                <p className={styles.remedyTitle} style={{ color: severity.color }}>
                  {healthy ? "Keep it up" : "Recommended steps"}
                </p>
                <p className={styles.remedyTip}>{remedy.tip}</p>
                <p className={styles.remedyDisclaimer}>
                  General agronomic information only — not a prescription. Consult a
                  professional before applying any treatment.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alternative predictions */}
        {predictions.length > 1 && (
          <div className={styles.altsSection}>
            <p className="section-label">Other possibilities</p>
            <div className={`card ${styles.altsList}`}>
              {predictions.slice(1).map(({ index, confidence: conf }, i) => (
                <div
                  key={index}
                  className={`${styles.altRow} ${i < predictions.length - 2 ? styles.altRowBorder : ""}`}
                >
                  <span className={styles.altLabel}>
                    {getCropName(index)} — {getDiseaseName(index)}
                  </span>
                  <span className={styles.altConf}>{(conf * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button className="btn-primary" onClick={onReset} aria-label="Analyse another leaf image">
            <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15" aria-hidden="true">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
            </svg>
            Analyse Another Image
          </button>
        </div>
      </div>
    </div>
  );
}

/** Guard: returns false if index is outside 0–37 */
function classLabelExists(index) {
  return Number.isInteger(index) && index >= 0 && index <= 37;
}
