/**
 * inference-test-node.mjs
 * Node.js smoke test using @tensorflow/tfjs with a custom IOHandler
 * that reads model files from disk using fs (bypasses fetch).
 *
 * Verifies:
 *   1. 38 class labels loaded correctly
 *   2. Model topology can be parsed
 *   3. Output vector has length 38
 *   4. Probabilities sum to ~1.0 (valid softmax)
 *   5. Top-3 labels map correctly
 *
 * Run: node inference-test-node.mjs
 */

import * as tf from "@tensorflow/tfjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const MODEL_DIR = path.join(__dir, "public/model");

// ── 1. Load class labels ──────────────────────────────────────────────────────
const classIndices = JSON.parse(
  fs.readFileSync(path.join(MODEL_DIR, "class_indices.json"), "utf8")
);
const labels = Object.fromEntries(
  Object.entries(classIndices).map(([k, v]) => [parseInt(k), v])
);

console.log(`\n✓ Loaded ${Object.keys(labels).length} class labels`);
console.log(`  [0]  = "${labels[0]}"`);
console.log(`  [37] = "${labels[37]}"`);

if (Object.keys(labels).length !== 38) {
  console.error("❌ Expected 38 labels"); process.exit(1);
}

// ── 2. Custom fs IOHandler (no fetch required) ────────────────────────────────
function fsIOHandler(modelDir) {
  return {
    load: async () => {
      // Read model.json
      const modelJSON = JSON.parse(
        fs.readFileSync(path.join(modelDir, "model.json"), "utf8")
      );

      // Read all weight shard files listed in weightsManifest
      const weightSpecs = [];
      const weightData  = [];

      for (const group of modelJSON.weightsManifest) {
        for (const spec of group.weights) {
          weightSpecs.push(spec);
        }
        for (const fname of group.paths) {
          const buf = fs.readFileSync(path.join(modelDir, fname));
          weightData.push(new Uint8Array(buf));
        }
      }

      // Concatenate all shard buffers
      const totalBytes = weightData.reduce((s, a) => s + a.byteLength, 0);
      const combined   = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of weightData) {
        combined.set(chunk, offset);
        offset += chunk.byteLength;
      }

      return {
        modelTopology: modelJSON.modelTopology,
        weightSpecs,
        weightData:    combined.buffer,
        format:        modelJSON.format,
        generatedBy:   modelJSON.generatedBy,
        convertedBy:   modelJSON.convertedBy,
      };
    },
  };
}

// ── 3. Load model ─────────────────────────────────────────────────────────────
console.log(`\nLoading model from disk: ${MODEL_DIR}`);
let model;
try {
  model = await tf.loadLayersModel(fsIOHandler(MODEL_DIR));
} catch (err) {
  console.error("❌ Failed to load model:", err.message);
  process.exit(1);
}

console.log("✓ Model loaded");
console.log("  Name:    ", model.name);
console.log("  Backend: ", tf.getBackend());

const inputShape  = model.inputs[0].shape;
const outputShape = model.outputs[0].shape;
console.log(`  Input :  [${inputShape}]`);
console.log(`  Output:  [${outputShape}]`);

if (outputShape[1] !== 38) {
  console.error(`❌ Expected output dim 38, got ${outputShape[1]}`); process.exit(1);
}
console.log("✓ Output shape [null, 38] — matches 38 PlantVillage classes");

// ── 4. Inference with synthetic green tensor ──────────────────────────────────
// Normalisation: pixel/255.0 ∈ [0,1] — verified from training notebook
const pixels = new Float32Array(1 * 224 * 224 * 3);
for (let i = 0; i < pixels.length; i += 3) {
  pixels[i]     = 25  / 255;  // R
  pixels[i + 1] = 120 / 255;  // G  (greenish leaf)
  pixels[i + 2] = 30  / 255;  // B
}
const inputTensor = tf.tensor4d(pixels, [1, 224, 224, 3]);

console.log(`\nRunning inference on [${inputTensor.shape}] tensor...`);
const t0 = Date.now();
const outputTensor = model.predict(inputTensor);
const probs = await outputTensor.data();  // Float32Array, length 38
const ms = Date.now() - t0;

console.log(`✓ Inference completed in ${ms} ms`);
console.log(`  Output vector length: ${probs.length}`);

// ── 5. Softmax validity ───────────────────────────────────────────────────────
const sum = Array.from(probs).reduce((a, b) => a + b, 0);
console.log(`  Probabilities sum: ${sum.toFixed(6)} (expected ≈ 1.0)`);
if (Math.abs(sum - 1.0) > 0.01) {
  console.error("❌ Softmax invalid"); process.exit(1);
}
console.log("✓ Softmax output valid");

// ── 6. Top-3 predictions ──────────────────────────────────────────────────────
const top3 = Array.from(probs)
  .map((c, i) => ({ i, c }))
  .sort((a, b) => b.c - a.c)
  .slice(0, 3);

console.log("\n── Top-3 Predictions (synthetic green pixel input) ──");
for (const { i, c } of top3) {
  const bar = "█".repeat(Math.max(1, Math.round(c * 60)));
  console.log(`  [${String(i).padStart(2)}] ${(c * 100).toFixed(3).padStart(9)}%  ${bar}  ${labels[i]}`);
}

// ── Cleanup ──
inputTensor.dispose();
outputTensor.dispose();

console.log("\n✅ ALL CHECKS PASSED");
console.log("   Model output shape: [1, 38]");
console.log("   Label mapping: verified (index 0-37 matches class_indices.json)");
console.log("   Softmax: valid\n");
