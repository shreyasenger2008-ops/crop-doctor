/**
 * Class labels sourced from:
 * https://raw.githubusercontent.com/Rishit-dagli/Greenathon-Plant-AI/main/models/plant_disease_tfjs/class_indices.json
 * Verified directly against the downloaded class_indices.json.
 * Index order matches model softmax output.
 */
export const CLASS_LABELS = {
  0:  "Apple — Apple Scab",
  1:  "Apple — Black Rot",
  2:  "Apple — Cedar Apple Rust",
  3:  "Apple — Healthy",
  4:  "Blueberry — Healthy",
  5:  "Cherry — Powdery Mildew",
  6:  "Cherry — Healthy",
  7:  "Corn — Cercospora Leaf Spot / Gray Leaf Spot",
  8:  "Corn — Common Rust",
  9:  "Corn — Northern Leaf Blight",
  10: "Corn — Healthy",
  11: "Grape — Black Rot",
  12: "Grape — Esca (Black Measles)",
  13: "Grape — Leaf Blight (Isariopsis Leaf Spot)",
  14: "Grape — Healthy",
  15: "Orange — Huanglongbing (Citrus Greening)",
  16: "Peach — Bacterial Spot",
  17: "Peach — Healthy",
  18: "Pepper Bell — Bacterial Spot",
  19: "Pepper Bell — Healthy",
  20: "Potato — Early Blight",
  21: "Potato — Late Blight",
  22: "Potato — Healthy",
  23: "Raspberry — Healthy",
  24: "Soybean — Healthy",
  25: "Squash — Powdery Mildew",
  26: "Strawberry — Leaf Scorch",
  27: "Strawberry — Healthy",
  28: "Tomato — Bacterial Spot",
  29: "Tomato — Early Blight",
  30: "Tomato — Late Blight",
  31: "Tomato — Leaf Mold",
  32: "Tomato — Septoria Leaf Spot",
  33: "Tomato — Spider Mites (Two-Spotted Spider Mite)",
  34: "Tomato — Target Spot",
  35: "Tomato — Yellow Leaf Curl Virus",
  36: "Tomato — Mosaic Virus",
  37: "Tomato — Healthy",
};

/**
 * Raw labels exactly as stored in class_indices.json (for index validation)
 */
export const RAW_CLASS_LABELS = {
  0:  "Apple___Apple_scab",
  1:  "Apple___Black_rot",
  2:  "Apple___Cedar_apple_rust",
  3:  "Apple___healthy",
  4:  "Blueberry___healthy",
  5:  "Cherry_(including_sour)___Powdery_mildew",
  6:  "Cherry_(including_sour)___healthy",
  7:  "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
  8:  "Corn_(maize)___Common_rust_",
  9:  "Corn_(maize)___Northern_Leaf_Blight",
  10: "Corn_(maize)___healthy",
  11: "Grape___Black_rot",
  12: "Grape___Esca_(Black_Measles)",
  13: "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
  14: "Grape___healthy",
  15: "Orange___Haunglongbing_(Citrus_greening)",
  16: "Peach___Bacterial_spot",
  17: "Peach___healthy",
  18: "Pepper,_bell___Bacterial_spot",
  19: "Pepper,_bell___healthy",
  20: "Potato___Early_blight",
  21: "Potato___Late_blight",
  22: "Potato___healthy",
  23: "Raspberry___healthy",
  24: "Soybean___healthy",
  25: "Squash___Powdery_mildew",
  26: "Strawberry___Leaf_scorch",
  27: "Strawberry___healthy",
  28: "Tomato___Bacterial_spot",
  29: "Tomato___Early_blight",
  30: "Tomato___Late_blight",
  31: "Tomato___Leaf_Mold",
  32: "Tomato___Septoria_leaf_spot",
  33: "Tomato___Spider_mites Two-spotted_spider_mite",
  34: "Tomato___Target_Spot",
  35: "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
  36: "Tomato___Tomato_mosaic_virus",
  37: "Tomato___healthy",
};

/** True if the class label indicates a healthy plant */
export function isHealthy(index) {
  return CLASS_LABELS[index]?.toLowerCase().includes("healthy") ?? false;
}

/** Get the crop name from class index */
export function getCropName(index) {
  const label = CLASS_LABELS[index] ?? "";
  return label.split(" — ")[0].trim();
}

/** Get the disease name from class index */
export function getDiseaseName(index) {
  const label = CLASS_LABELS[index] ?? "";
  const parts = label.split(" — ");
  return parts[1]?.trim() ?? label;
}
