/**
 * inference-test.mjs
 * Node.js smoke test for the LeafDisease_MobileNet TF.js model.
 *
 * Verifies:
 *   1. Model loads from public/model/model.json
 *   2. Output shape is [1, 38]  (matching 38 PlantVillage classes)
 *   3. Probabilities sum to ~1.0 (valid softmax)
 *   4. Top prediction maps correctly to a class label
 *
 * Run: node inference-test.mjs
 */

import * as tf from "@tensorflow/tfjs-node";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Class labels (0-37, matching class_indices.json) ──
const classIndices = JSON.parse(
  fs.readFileSync(path.join(__dirname, "public/model/class_indices.json"), "utf8")
);
// class_indices.json maps "0" -> "Apple___Apple_scab" etc.
const labels = Object.fromEntries(
  Object.entries(classIndices).map(([k, v]) => [parseInt(k), v])
);

console.log(`\n✓ Loaded ${Object.keys(labels).length} class labels from class_indices.json`);
if (Object.keys(labels).length !== 38) {
  console.error("❌ Expected 38 labels, got", Object.keys(labels).length);
  process.exit(1);
}

// ── Load model ──
const modelPath = `file://${path.join(__dirname, "public/model/model.json")}`;
console.log(`\nLoading model from: ${modelPath}`);
const model = await tf.loadLayersModel(modelPath);
console.log("✓ Model loaded successfully");
console.log("  Model name:", model.name);

// ── Verify input/output shape ──
const inputShape  = model.inputs[0].shape;
const outputShape = model.outputs[0].shape;
console.log(`\n  Input  shape: [${inputShape}]`);
console.log(`  Output shape: [${outputShape}]`);

if (outputShape[1] !== 38) {
  console.error(`❌ Expected output shape [null, 38], got [${outputShape}]`);
  process.exit(1);
}
console.log("✓ Output shape matches 38 classes");

// ── Create test tensor ──
// Use a synthetic green pixel tensor [1, 224, 224, 3]
// Normalised to [0, 1] as per training (ImageDataGenerator rescale=1/255)
const testPixels = new Float32Array(1 * 224 * 224 * 3);
for (let i = 0; i < testPixels.length; i += 3) {
  // green-ish pixel: R=0.1, G=0.6, B=0.1
  testPixels[i]     = 0.1; // R
  testPixels[i + 1] = 0.6; // G
  testPixels[i + 2] = 0.1; // B
}
const inputTensor = tf.tensor4d(testPixels, [1, 224, 224, 3]);
console.log(`\n  Test tensor shape: [${inputTensor.shape}]`);

// ── Run inference ──
console.log("\nRunning inference...");
const t0 = Date.now();
const outputTensor = model.predict(inputTensor);
const probabilities = await outputTensor.data();
const elapsed = Date.now() - t0;

console.log(`✓ Inference completed in ${elapsed} ms`);
console.log(`  Output array length: ${probabilities.length}`);

if (probabilities.length !== 38) {
  console.error(`❌ Expected 38 probabilities, got ${probabilities.length}`);
  process.exit(1);
}

// ── Validate softmax sum ──
const sum = Array.from(probabilities).reduce((a, b) => a + b, 0);
console.log(`  Probabilities sum: ${sum.toFixed(6)} (should be ≈ 1.0)`);
if (Math.abs(sum - 1.0) > 0.01) {
  console.error("❌ Probabilities do not sum to ~1.0 — invalid softmax output");
  process.exit(1);
}
console.log("✓ Softmax output is valid");

// ── Top-3 predictions ──
const sorted = Array.from(probabilities)
  .map((conf, idx) => ({ index: idx, conf }))
  .sort((a, b) => b.conf - a.conf)
  .slice(0, 3);

console.log("\n── Top-3 Predictions ──");
for (const { index, conf } of sorted) {
  const label = labels[index] ?? "UNKNOWN";
  const bar = "█".repeat(Math.round(conf * 40));
  console.log(`  [${String(index).padStart(2)}] ${(conf * 100).toFixed(2).padStart(6)}%  ${bar}  ${label}`);
}

// ── Cleanup ──
inputTensor.dispose();
outputTensor.dispose();

console.log("\n✅ All checks passed — model is compatible with the 38-class label mapping.\n");
