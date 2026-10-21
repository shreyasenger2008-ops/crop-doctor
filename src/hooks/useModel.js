import { useState, useEffect, useCallback, useRef } from "react";
import * as tf from "@tensorflow/tfjs";

const MODEL_URL = "/model/model.json";

/**
 * Hook to load the LeafDisease_MobileNet TF.js layers model.
 *
 * Lifecycle:
 *   idle → loading → ready | error
 *
 * The model reference is stored in a ref (not state) to avoid the stale-closure
 * problem in the cleanup function — `model?.dispose()` in a useEffect cleanup
 * would otherwise capture the initial null value.
 *
 * Returns { model, status, error, retryLoad }
 *   model:     tf.LayersModel | null
 *   status:    "idle" | "loading" | "ready" | "error"
 *   error:     string | null
 *   retryLoad: () => void
 */
export function useModel() {
  const [status, setStatus] = useState("idle");
  const [error,  setError]  = useState(null);

  // Use a ref so the cleanup closure always sees the current model
  const modelRef = useRef(null);

  // Expose model as state so components re-render when it becomes available
  const [model, setModel] = useState(null);

  const loadModel = useCallback(async () => {
    // Dispose any previously loaded model before reloading
    if (modelRef.current) {
      try { modelRef.current.dispose(); } catch (_) {}
      modelRef.current = null;
      setModel(null);
    }

    setStatus("loading");
    setError(null);

    try {
      // Prefer WebGL; fall back to CPU if WebGL is unavailable
      try {
        await tf.setBackend("webgl");
      } catch {
        console.warn("[useModel] WebGL unavailable, falling back to CPU backend.");
        await tf.setBackend("cpu");
      }
      await tf.ready();

      const loadedModel = await tf.loadLayersModel(MODEL_URL);

      // Verify output shape matches the 38-class model we expect
      const outputShape = loadedModel.outputs[0].shape;
      if (!outputShape || outputShape[outputShape.length - 1] !== 38) {
        loadedModel.dispose();
        throw new Error(
          `Unexpected model output shape [${outputShape}]. ` +
          "Expected a model with 38 output classes."
        );
      }

      // Warm-up inference — prevents a large latency spike on first real prediction
      tf.tidy(() => {
        const warmupInput  = tf.zeros([1, 224, 224, 3]);
        const warmupOutput = loadedModel.predict(warmupInput);
        warmupOutput.dispose();
      });

      modelRef.current = loadedModel;
      setModel(loadedModel);
      setStatus("ready");
    } catch (err) {
      console.error("[useModel] Failed to load model:", err);
      setError(err.message ?? "Failed to load the AI model.");
      setStatus("error");
    }
  }, []); // no deps — stable across re-renders

  useEffect(() => {
    loadModel();

    // Cleanup: dispose model when component unmounts
    return () => {
      if (modelRef.current) {
        try { modelRef.current.dispose(); } catch (_) {}
        modelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { model, status, error, retryLoad: loadModel };
}
