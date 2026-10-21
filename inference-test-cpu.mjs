/**
 * inference-test-cpu.mjs
 * Node.js smoke test using @tensorflow/tfjs (CPU backend — no native addon needed).
 * Verifies output shape, softmax validity, and label mapping.
 *
 * Run: node inference-test-cpu.mjs
 */

// Use the browser-compatible CPU backend (no native bindings required)
import * as tf from "@tensorflow/tfjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load class labels ──
const classIndices = JSON.parse(
  fs.readFileSync(path.join(__dirname, "public/model/class_indices.json"), "utf8")
);
const labels = Object.fromEntries(
  Object.entries(classIndices).map(([k, v]) => [parseInt(k), v])
);

console.log(`\n✓ Loaded ${Object.keys(labels).length} class labels`);
console.log(`  First label:  [0] = "${labels[0]}"`);
console.log(`  Last  label: [37] = "${labels[37]}"`);

if (Object.keys(labels).length !== 38) {
  console.error("❌ Expected 38 labels, got", Object.keys(labels).length);
  process.exit(1);
}

// ── Load TF.js model ──
// tf.loadLayersModel in Node.js can read local files via the file:// scheme
const modelPath = `file://${path.join(__dirname, "public/model/model.json").replace(/\\/g, "/")}`;
console.log(`\nLoading model: ${modelPath}`);

let model;
try {
  model = await tf.loadLayersModel(modelPath);
} catch (err) {
  console.error("❌ Failed to load model:", err.message);
  process.exit(1);
}

console.log("✓ Model loaded");
console.log("  Model name:", model.name);
console.log("  Backend:   ", tf.getBackend());

// ── Shape checks ──
const inputShape  = model.inputs[0].shape;
const outputShape = model.outputs[0].shape;
console.log(`\n  Input  shape: [${inputShape}]`);
console.log(`  Output shape: [${outputShape}]`);

if (outputShape[1] !== 38) {
  console.error(`❌ Expected output dim 38, got ${outputShape[1]}`);
  process.exit(1);
}
console.log("✓ Output shape [null, 38] — matches 38 PlantVillage classes");

// ── Inference with a synthetic green pixel tensor ──
// Normalisation: pixel / 255.0  (as per training notebook rescale=1/255.0)
const testData = new Float32Array(1 * 224 * 224 * 3);
for (let i = 0; i < testData.length; i += 3) {
  testData[i]     = 25 / 255;   // R
  testData[i + 1] = 120 / 255;  // G  (greenish leaf)
  testData[i + 2] = 30 / 255;   // B
}
const inputTensor = tf.tensor4d(testData, [1, 224, 224, 3]);

console.log(`\nRunning inference on synthetic green-pixel input [${inputTensor.shape}]...`);
const t0 = Date.now();
const outputTensor = model.predict(inputTensor);
const probs = await outputTensor.data();
const elapsed = Date.now() - t0;

console.log(`✓ Inference completed in ${elapsed} ms`);
console.log(`  Output vector length: ${probs.length}`);

// ── Softmax validity ──
const sum = Array.from(probs).reduce((a, b) => a + b, 0);
console.log(`  Probabilities sum: ${sum.toFixed(6)} (expected ≈ 1.0)`);
if (Math.abs(sum - 1.0) > 0.01) {
  console.error("❌ Probabilities do not sum to 1 — softmax invalid");
  process.exit(1);
}
console.log("✓ Softmax output is valid");

// ── Top-3 predictions ──
const top3 = Array.from(probs)
  .map((c, i) => ({ i, c }))
  .sort((a, b) => b.c - a.c)
  .slice(0, 3);

console.log("\n── Top-3 Predictions ──");
for (const { i, c } of top3) {
  const pct = (c * 100).toFixed(3);
  const bar = "█".repeat(Math.max(1, Math.round(c * 50)));
  console.log(`  [${String(i).padStart(2)}] ${pct.padStart(8)}%  ${bar}  ${labels[i]}`);
}

// ── Cleanup ──
inputTensor.dispose();
outputTensor.dispose();

console.log("\n✅ All checks passed — model output is compatible with 38-class label mapping.\n");
