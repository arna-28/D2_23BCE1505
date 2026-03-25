from flask import Flask, render_template, request
import joblib
import numpy as np
import librosa
import os
import uuid

app = Flask(__name__)

# ---------------- LOAD MODEL ----------------
data = joblib.load("../model.pkl")

# supports BOTH old and new saves
if isinstance(data, dict):
    model = data["model"]
    THRESHOLD = data.get("threshold", 0.35)
else:
    model = data
    THRESHOLD = 0.35

print("Model loaded")
print("Decision threshold:", THRESHOLD)

# Expected feature size (important debug check)
EXPECTED_FEATURES = model.named_steps["scaler"].n_features_in_
print("Model expects features:", EXPECTED_FEATURES)


# ---------------- HOME ----------------
@app.route("/")
def home():
    return render_template("index.html")


# ---------------- FEATURE EXTRACTION ----------------
def extract_features(filepath):
    y, sr = librosa.load(filepath, sr=None)

    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    delta = librosa.feature.delta(mfcc)

    mfcc_mean = np.mean(mfcc.T, axis=0)
    mfcc_std = np.std(mfcc.T, axis=0)
    delta_mean = np.mean(delta.T, axis=0)

    features = np.hstack([mfcc_mean, mfcc_std, delta_mean]).reshape(1, -1)

    return features


# ---------------- PREDICT ----------------
@app.route("/predict", methods=["POST"])
def predict():

    if "audio" not in request.files:
        return render_template("index.html", error="No file uploaded")

    file = request.files["audio"]

    if file.filename == "":
        return render_template("index.html", error="Empty file")

    # unique temp file (prevents overwrite bugs)
    filename = f"temp_{uuid.uuid4().hex}.wav"
    filepath = os.path.join(".", filename)

    try:
        file.save(filepath)

        # -------- feature extraction --------
        features = extract_features(filepath)

        print("Extracted feature shape:", features.shape)

        # safety check
        if features.shape[1] != EXPECTED_FEATURES:
            return render_template(
                "index.html",
                error=f"Feature mismatch! Got {features.shape[1]}, expected {EXPECTED_FEATURES}"
            )

        # -------- prediction --------
        probs = model.predict_proba(features)[0]
        dementia_prob = probs[1]

        prediction = 1 if dementia_prob >= THRESHOLD else 0

        print("Dementia probability:", dementia_prob)
        print("Final prediction:", prediction)

        confidence = max(probs) * 100

        result = (
            "Dementia Risk Detected"
            if prediction == 1
            else "No Dementia Detected"
        )

        return render_template(
            "index.html",
            prediction=result,
            confidence=f"{confidence:.2f}%"
        )

    finally:
        # always delete temp file
        if os.path.exists(filepath):
            os.remove(filepath)


# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(debug=True)