# Crop Doctor AI — Manual Browser Test Procedure

> **IMPORTANT**: This procedure verifies the *application pipeline only* — it does not
> establish model accuracy.  The LeafDisease_MobileNet model has **not been independently
> evaluated on a labeled held-out test set**.  Results are indicative only and must be
> confirmed by a qualified agronomist before any action is taken.

---

## 1  Start the Development Server

```powershell
# From the project root
npm run dev
```

Open `http://localhost:5173/` in a Chromium-based browser (Chrome, Edge, or Brave).
Firefox works but WebGL backend availability may differ.

---

## 2  Obtain Test Images

The model was trained on the **PlantVillage dataset** (38 classes).
Use images that closely match those classes.

### Option A — Kaggle (recommended, free account required)
- Dataset: [PlantVillage Disease Classification](https://www.kaggle.com/datasets/emmarex/plantdisease)
- Download a few images from:
  - `Tomato/Tomato_healthy/` — a healthy green tomato leaf
  - `Tomato/Tomato___Late_blight/` — brown/dark lesions on tomato leaf
  - `Apple/Apple___Apple_scab/` — scab lesions on apple leaf
  - `Corn_(maize)/Corn_(maize)___Common_rust_/` — rust pustules on corn leaf

### Option B — Google Image Search (quick, lower quality)
Search specifically for:
- `tomato leaf healthy PlantVillage` — download a clear single-leaf shot
- `tomato late blight leaf disease` — look for obvious brown lesions

### Option C — Your own photographs
Take a clear, well-lit close-up photo of a single leaf against a plain or natural background.
Supported crops: Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Pepper, Potato,
Raspberry, Soybean, Squash, Strawberry, Tomato.

---

## 3  Test Cases

Run each test case in order.  Tick off each ✓ item.

---

### Test 1 — Healthy leaf (expected: high confidence, Healthy label)

1. Wait for the green **"✅ Model ready — 38 plant disease classes loaded"** bar.
2. Upload `Tomato_healthy.jpg` (or equivalent) via drag-drop or **Browse File**.
3. The spinner appears briefly; a result card is shown.

**Verify:**
- [ ] Disease title contains "Healthy"
- [ ] Confidence bar is **≥ 50 %** (no ⚠️ Low Confidence badge)
- [ ] Green treatment tip is shown ("💚 Keep it up!")
- [ ] Accuracy disclaimer is visible below the confidence bar
- [ ] History drawer (📋 History) shows 1 entry after the result
- [ ] History entry shows the filename and a 🌿 emoji (no broken image)
- [ ] Refresh the page; re-open History — record still present with correct label

---

### Test 2 — Diseased leaf (expected: high confidence, disease label)

1. Click **🔄 Analyse Another Image**.
2. Upload `Tomato___Late_blight.jpg`.

**Verify:**
- [ ] Disease title contains "Late Blight" (or similar)
- [ ] Confidence ≥ 50 % and ⚠️ badge shows a severity level
- [ ] Treatment tip is visible with the treatment disclaimer
- [ ] "Other possibilities" section shows 2 additional classes
- [ ] History now shows 2 entries; newest is at the top

---

### Test 3 — Non-leaf / unsupported image (expected: uncertain state)

1. Click **🔄 Analyse Another Image**.
2. Upload any photograph that is **not** a plant leaf
   (e.g. a landscape photo, a person, a dog, a car).

**Verify:**
- [ ] Yellow ⚠️ **"Low Confidence"** badge appears on the image
- [ ] Orange uncertain-result panel is shown with the bullet-point list
- [ ] **No treatment tip** is shown (tips are suppressed when uncertain)
- [ ] Accuracy disclaimer is still shown
- [ ] History entry shows the uncertain flag in the label text

---

### Test 4 — Same file re-uploaded (re-upload must work)

1. Click **🔄 Analyse Another Image**.
2. Upload `Tomato_healthy.jpg` again (same file as Test 1).

**Verify:**
- [ ] A new prediction is produced without needing to refresh the page
- [ ] No browser console error about "Cannot re-select the same file"
- [ ] History now shows 4 entries total

---

### Test 5 — Unsupported file type (expected: inline error, no crash)

1. Click **🔄 Analyse Another Image**.
2. Try to upload a `.pdf` or `.txt` file.

**Verify:**
- [ ] An inline error card appears: *"... is not a supported image format."*
- [ ] The uploader resets and is ready to accept a new file immediately
- [ ] No unhandled exception in the browser console

---

### Test 6 — Oversized file (expected: inline error)

1. Attempt to upload any image file larger than 10 MB.
   (You can check file size in Windows Explorer → Properties.)

**Verify:**
- [ ] An inline error card appears: *"... is too large ... Maximum is 10 MB."*
- [ ] Application does not crash or hang

---

### Test 7 — Offline functionality (PWA cache)

1. Open DevTools → **Application** → **Service Workers**.
2. Confirm a service worker is registered and active.
3. Tick **Offline** in DevTools → **Network** tab.
4. Refresh the page.

**Verify:**
- [ ] Page loads without a network error
- [ ] Model loads from cache (may take a few seconds from cache)
- [ ] Upload and classify an image — inference completes offline
- [ ] Orange **"You are offline"** banner is visible at the top

---

### Test 8 — History persists across sessions

1. Make several predictions across different browser sessions
   (close the tab completely and reopen).

**Verify:**
- [ ] All previously saved records appear in the History drawer
- [ ] No broken image thumbnails (only 🌿/🍂 emoji and filename are shown)
- [ ] Timestamps are correct and sorted newest-first

---

## 4  What These Tests Do NOT Prove

- They **do not** demonstrate that the model correctly classifies any particular disease.
- They **do not** establish precision, recall, or F1 score for any class.
- The model has **not been evaluated** on a held-out labeled test set by this project.
- A high confidence score does **not** mean the prediction is correct.
- Always consult a qualified agronomist before making crop-management decisions.

---

## 5  Console Warnings to Expect (Non-Fatal)

| Warning | Source | Severity |
|---|---|---|
| `Some chunks are larger than 500 kB` | Vite build | ⚪ Info — expected (TF.js bundle) |
| `[Violation] 'setTimeout' handler took N ms` | TF.js WebGL init | ⚪ Info — harmless |
| `[useModel] Falling back to CPU backend` | useModel.js | ⚪ Info — inference still works |
| `Softmax sum is X — expected ~1.0` | preprocess.js | 🟡 Warning — investigate if seen |

---

## 6  Reporting Issues

If a test fails, note:
1. Browser and version (e.g. Chrome 126)
2. OS (Windows 11)
3. Which test case failed
4. The exact error message from the browser console (F12 → Console tab)
5. The filename and approximate size of the test image used
