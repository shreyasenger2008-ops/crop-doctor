import * as tf from "@tensorflow/tfjs";

/**
 * CONFIDENCE THRESHOLD CONFIGURATION
 *
 * Predictions below LOW_CONFIDENCE_THRESHOLD are flagged as uncertain.
 * This value is provisional — it has not been calibrated against a labeled
 * test dataset. Adjust based on observed behaviour with real leaf images.
 *
 * Model accuracy has NOT been independently evaluated on a held-out set.
 * Do not rely on confidence scores alone to make agronomic decisions.
 */
export const LOW_CONFIDENCE_THRESHOLD = 0.50; // 50 % — provisional

/**
 * Preprocess an image element for the LeafDisease_MobileNet model.
 *
 * Verified normalization source:
 *   notebooks/plant-diseases-training.ipynb line 313:
 *   train_datagen = keras.preprocessing.image.ImageDataGenerator(rescale = 1/255.0)
 *
 * Input shape expected by model.json: [null, 224, 224, 3]  float32
 * Channel order: RGB (tf.browser.fromPixels returns RGB by default).
 * Normalization: pixel / 255.0  →  values in [0, 1].
 *
 * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} imageSource
 * @returns {tf.Tensor4D}  shape [1, 224, 224, 3], dtype float32
 * @throws {Error} if imageSource is null/undefined or has no pixel data
 */
export function preprocessImage(imageSource) {
  if (!imageSource) {
    throw new Error("preprocessImage: imageSource is null or undefined.");
  }

  return tf.tidy(() => {
    // tf.browser.fromPixels reads the image as [H, W, 3] uint8 in RGB order.
    // numChannels defaults to 3 — explicit here for clarity.
    const raw = tf.browser.fromPixels(imageSource, 3); // [H, W, 3] uint8 RGB

    if (raw.shape[0] === 0 || raw.shape[1] === 0) {
      raw.dispose();
      throw new Error("preprocessImage: image has zero height or width.");
    }

    const tensor = raw
      .resizeBilinear([224, 224])  // [224, 224, 3] — bilinear matches Keras default
      .toFloat()                   // [224, 224, 3] float32
      .div(255.0)                  // [224, 224, 3] float32, values in [0, 1]
      .expandDims(0);              // [1, 224, 224, 3] — batch dimension

    return tensor;
  });
}

/**
 * Run inference and return top-N predictions with an uncertainty flag.
 *
 * @param {tf.LayersModel} model
 * @param {HTMLImageElement|HTMLCanvasElement} imageSource
 * @param {number} topN   Number of top predictions to return (default 3)
 * @returns {Promise<{
 *   predictions: Array<{index: number, confidence: number}>,
 *   isUncertain: boolean,
 *   outputLength: number
 * }>}
 * @throws {Error} if model prediction fails or output length ≠ 38
 */
export async function runInference(model, imageSource, topN = 3) {
  if (!model) throw new Error("runInference: model is not loaded.");

  const inputTensor = preprocessImage(imageSource);
  let predictionTensor;

  try {
    predictionTensor = model.predict(inputTensor);

    // Validate output shape
    const outputShape = predictionTensor.shape;
    if (outputShape.length < 2 || outputShape[1] !== 38) {
      throw new Error(
        `Model output shape mismatch: expected [1, 38], got [${outputShape}]. ` +
        "The loaded model may not be the expected LeafDisease_MobileNet."
      );
    }

    const probabilities = await predictionTensor.data(); // Float32Array, length 38

    // Validate softmax (sum should be ≈ 1.0)
    const sum = Array.from(probabilities).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.05) {
      console.warn(`[runInference] Softmax sum is ${sum.toFixed(4)} — expected ~1.0. Results may be unreliable.`);
    }

    // Build sorted top-N
    const indexed = Array.from(probabilities)
      .map((confidence, index) => ({ index, confidence }));
    indexed.sort((a, b) => b.confidence - a.confidence);

    const topPredictions = indexed.slice(0, topN);
    const topConfidence  = topPredictions[0]?.confidence ?? 0;

    return {
      predictions: topPredictions,
      isUncertain: topConfidence < LOW_CONFIDENCE_THRESHOLD,
      outputLength: probabilities.length,
    };
  } finally {
    inputTensor.dispose();
    predictionTensor?.dispose();
  }
}
