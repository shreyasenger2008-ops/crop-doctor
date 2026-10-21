/**
 * Brief treatment tips keyed by disease class index.
 * Sourced from general plant pathology knowledge.
 * Not a substitute for professional agronomic advice.
 */
export const REMEDIES = {
  0:  { tip: "Remove infected leaves. Apply fungicides containing captan or mancozeb. Ensure good air circulation.", severity: "moderate" },
  1:  { tip: "Prune infected branches. Apply copper-based fungicide. Remove mummified fruit.", severity: "high" },
  2:  { tip: "Apply fungicide (myclobutanil) in spring. Remove infected leaves. Plant resistant varieties.", severity: "moderate" },
  3:  { tip: "Plant looks healthy! Continue regular watering, fertilisation, and monitoring.", severity: "healthy" },
  4:  { tip: "Plant looks healthy! Blueberries thrive with acidic soil (pH 4.5–5.5).", severity: "healthy" },
  5:  { tip: "Apply sulfur-based fungicide. Improve air circulation. Avoid overhead watering.", severity: "moderate" },
  6:  { tip: "Plant looks healthy! Cherries need well-drained soil and full sun.", severity: "healthy" },
  7:  { tip: "Apply fungicide (azoxystrobin). Rotate crops. Remove debris after harvest.", severity: "moderate" },
  8:  { tip: "Apply fungicide at first sign. Plant resistant hybrids. Remove volunteer plants.", severity: "moderate" },
  9:  { tip: "Apply fungicide (propiconazole). Plant resistant varieties. Avoid excessive nitrogen.", severity: "moderate" },
  10: { tip: "Plant looks healthy! Corn needs consistent moisture and nitrogen-rich soil.", severity: "healthy" },
  11: { tip: "Apply copper fungicide early. Remove mummified berries. Prune for air flow.", severity: "high" },
  12: { tip: "No effective cure. Remove and destroy infected vines. Prevent wounds to trunk.", severity: "high" },
  13: { tip: "Apply copper-based fungicide. Remove infected leaves. Ensure good drainage.", severity: "moderate" },
  14: { tip: "Plant looks healthy! Grapes benefit from regular pruning and trellising.", severity: "healthy" },
  15: { tip: "Remove infected trees. Control Asian citrus psyllid vector. No chemical cure; prevention is key.", severity: "critical" },
  16: { tip: "Apply copper-based bactericide. Remove infected leaves. Avoid overhead irrigation.", severity: "moderate" },
  17: { tip: "Plant looks healthy! Peaches need full sun and well-draining soil.", severity: "healthy" },
  18: { tip: "Apply copper hydroxide. Use resistant varieties. Avoid working with wet plants.", severity: "moderate" },
  19: { tip: "Plant looks healthy! Peppers need warm temperatures and consistent watering.", severity: "healthy" },
  20: { tip: "Apply chlorothalonil fungicide. Rotate crops. Remove infected plant debris.", severity: "moderate" },
  21: { tip: "Apply metalaxyl or mancozeb. Destroy infected tubers. Avoid wet conditions.", severity: "high" },
  22: { tip: "Plant looks healthy! Potatoes prefer cool climates with well-drained, loamy soil.", severity: "healthy" },
  23: { tip: "Plant looks healthy! Raspberries thrive with trellising and good air circulation.", severity: "healthy" },
  24: { tip: "Plant looks healthy! Soybeans fix nitrogen — monitor for pests rather than disease.", severity: "healthy" },
  25: { tip: "Apply potassium bicarbonate or neem oil. Reduce humidity. Improve air circulation.", severity: "moderate" },
  26: { tip: "Apply fungicide (captan). Remove infected leaves. Avoid water stress.", severity: "moderate" },
  27: { tip: "Plant looks healthy! Strawberries need well-drained, slightly acidic soil.", severity: "healthy" },
  28: { tip: "Apply copper-based bactericide. Remove infected material. Avoid overhead watering.", severity: "moderate" },
  29: { tip: "Apply fungicide (chlorothalonil). Mulch around plants. Avoid wetting foliage.", severity: "moderate" },
  30: { tip: "Apply metalaxyl fungicide. Remove infected plants immediately. Improve drainage.", severity: "high" },
  31: { tip: "Increase air circulation. Apply fungicide (chlorothalonil). Avoid overhead watering.", severity: "moderate" },
  32: { tip: "Apply copper or chlorothalonil fungicide. Remove lower infected leaves. Mulch around base.", severity: "moderate" },
  33: { tip: "Apply miticide or insecticidal soap. Increase humidity. Introduce predatory mites.", severity: "moderate" },
  34: { tip: "Apply fungicide (azoxystrobin). Remove infected fruit. Rotate crops annually.", severity: "moderate" },
  35: { tip: "Remove and destroy infected plants. Control whitefly vectors. Use resistant varieties.", severity: "high" },
  36: { tip: "Remove infected plants. Disinfect tools. Plant certified virus-free seeds.", severity: "high" },
  37: { tip: "Plant looks healthy! Tomatoes need consistent moisture and support for heavy fruit.", severity: "healthy" },
};

export const SEVERITY_CONFIG = {
  healthy:  { color: "#16a34a", bg: "#dcfce7", label: "Healthy" },
  moderate: { color: "#d97706", bg: "#fef3c7", label: "Attention Needed" },
  high:     { color: "#dc2626", bg: "#fee2e2", label: "Action Required" },
  critical: { color: "#7c2d12", bg: "#fef2f2", label: "Critical — Act Now" },
};
