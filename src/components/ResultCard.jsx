import { getCropName, getDiseaseName, isHealthy } from "../utils/classLabels";
import { REMEDIES, SEVERITY_CONFIG } from "../utils/remedies";
import { LOW_CONFIDENCE_THRESHOLD } from "../utils/preprocess";
import styles from "./ResultCard.module.css";

/**
 * ResultCard — displays the top prediction, confidence, treatment guidance,
 * and appropriate epistemic caveats.
 *
 * Shows a distinct "uncertain" state when the top confidence is below
 * LOW_CONFIDENCE_THRESHOLD (currently 50 %, provisional — not calibrated).
 *
 * IMPORTANT DISCLAIMER (shown in UI):
 *   This model has not been independently evaluated on a labeled test set.
 *   Results are indicative only. Do not use as a sole basis for agronomic
 *   decisions. Consult a qualified agronomist for confirmation.
 *
 * @param {{
 *   predictions: Array<{index:number, confidence:number}>,
 *   isUncertain: boolean,
 *   imageUrl: string,
 *   onReset: () => void
 * }} props
 */
export default function ResultCard({ predictions, isUncertain, imageUrl, onReset }) {
  if (!predictions || predictions.length === 0) return null;

  const top       = predictions[0];
  const healthy   = isHealthy(top.index);
  const crop      = getCropName(top.index);
  const disease   = getDiseaseName(top.index);
  const remedy    = REMEDIES[top.index];
  const severity  = SEVERITY_CONFIG[remedy?.severity ?? "moderate"];
  const confidencePct = (top.confidence * 100).toFixed(1);

  // Uncertain: confidence below provisional threshold OR label not found
  const uncertain = isUncertain || !CLASS_LABEL_EXISTS(top.index);

  return (
    <div className={styles.card}>
      {/* Image preview */}
      <div className={styles.imageWrap}>
        <img src={imageUrl} alt="Analysed leaf" className={styles.leafImage} />
        {uncertain ? (
          <span className={styles.badge} style={{ background: "#fef3c7", color: "#92400e" }}>
            ⚠️ Low Confidence
          </span>
        ) : (
          <span className={styles.badge} style={{ background: severity.bg, color: severity.color }}>
            {severity.label}
          </span>
        )}
      </div>

      {/* ── Uncertain-result panel ── */}
      {uncertain && (
        <div className={styles.uncertainBox}>
          <p className={styles.uncertainTitle}>⚠️ Result is uncertain</p>
          <p className={styles.uncertainBody}>
            The model's confidence ({confidencePct}%) is below the provisional
            threshold of {(LOW_CONFIDENCE_THRESHOLD * 100).toFixed(0)}%.
            This can happen when:
          </p>
          <ul className={styles.uncertainList}>
            <li>The leaf crop is not in the 14 supported species.</li>
            <li>The image is blurry, poorly lit, or heavily cropped.</li>
            <li>The image shows a background, soil, or non-leaf subject.</li>
            <li>The disease pattern does not match the training data.</li>
          </ul>
          <p className={styles.uncertainAction}>
            Try a clearer, close-up photo of a single leaf against a plain background.
            The best prediction so far is shown below for reference only.
          </p>
        </div>
      )}

      {/* ── Primary result ── */}
      <div className={styles.result}>
        <div className={styles.cropTag}>🌱 {crop}</div>
        <h2
          className={styles.diseaseTitle}
          style={{ color: uncertain ? "#92400e" : severity.color }}
        >
          {healthy && !uncertain ? "✅ Healthy Plant" : `${uncertain ? "❓" : "⚠️"} ${disease}`}
        </h2>

        {/* Confidence bar */}
        <div className={styles.confidenceWrap}>
          <span className={styles.confidenceLabel}>Confidence</span>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{
                width: `${confidencePct}%`,
                background: uncertain ? "#f59e0b" : severity.color,
              }}
            />
          </div>
          <span className={styles.confidenceValue}>{confidencePct}%</span>
        </div>

        {/* ── Accuracy disclaimer ── always shown ── */}
        <p className={styles.disclaimer}>
          ⚠️ <strong>For guidance only.</strong> Model accuracy has not been independently
          evaluated. A confidence score does not guarantee correctness. Confirm with a
          qualified agronomist before taking any action.
        </p>

        {/* Treatment tip — only shown when confident and not uncertain */}
        {remedy && !uncertain && (
          <div
            className={styles.tipBox}
            style={{ borderColor: severity.color, background: severity.bg }}
          >
            <strong style={{ color: severity.color }}>
              {healthy ? "💚 Keep it up!" : "💊 General Guidance"}
            </strong>
            <p>{remedy.tip}</p>
            <p className={styles.tipDisclaimer}>
              This is general agronomic information, not a prescription.
              Consult a professional before applying any chemical treatment.
            </p>
          </div>
        )}
      </div>

      {/* ── Alternative predictions ── */}
      {predictions.length > 1 && (
        <div className={styles.alternatives}>
          <p className={styles.altHeading}>Other possibilities</p>
          {predictions.slice(1).map(({ index, confidence: conf }) => (
            <div key={index} className={styles.altRow}>
              <span>{getCropName(index)} — {getDiseaseName(index)}</span>
              <span className={styles.altConf}>{(conf * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}

      <button className={styles.resetBtn} onClick={onReset}>
        🔄 Analyse Another Image
      </button>
    </div>
  );
}

/** Guard: returns false if index is outside 0–37 */
function CLASS_LABEL_EXISTS(index) {
  return Number.isInteger(index) && index >= 0 && index <= 37;
}
