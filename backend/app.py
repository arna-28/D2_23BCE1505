from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import librosa
import os
import uuid
import sqlite3
import hashlib

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

# ---------------- DATABASE ----------------

DB_PATH = "users.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            age INTEGER NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# ---------------- LOAD MODEL ----------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "model.pkl"))

print("Loading model from:", MODEL_PATH)
print("Exists:", os.path.exists(MODEL_PATH))

data = joblib.load(MODEL_PATH)

if isinstance(data, dict):
    model = data["model"]
    THRESHOLD = data.get("threshold", 0.35)
else:
    model = data
    THRESHOLD = 0.35

print("Model loaded successfully")
print("Decision threshold:", THRESHOLD)

EXPECTED_FEATURES = model.named_steps["scaler"].n_features_in_
print("Model expects features:", EXPECTED_FEATURES)

# ---------------- HOME ----------------

@app.route("/")
def home():
    return render_template("index.html")

# ---------------- AUTH ROUTES ----------------

@app.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return "", 204

    data = request.get_json()

    name     = data.get("name", "").strip()
    email    = data.get("email", "").strip()
    age      = data.get("age", "")
    password = data.get("password", "")

    if not name or not email or not age or not password:
        return jsonify({"error": "All fields are required"}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute(
            "INSERT INTO users (name, email, age, password) VALUES (?, ?, ?, ?)",
            (name, email, int(age), hash_password(password))
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Registration successful"}), 201

    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already registered"}), 409

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return "", 204

    data = request.get_json()

    email    = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute(
            "SELECT id, name, email, age FROM users WHERE email=? AND password=?",
            (email, hash_password(password))
        )
        row = c.fetchone()
        conn.close()

        if not row:
            return jsonify({"error": "Invalid email or password"}), 401

        return jsonify({
            "message": "Login successful",
            "user": {
                "id":    row[0],
                "name":  row[1],
                "email": row[2],
                "age":   row[3]
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- FEATURE EXTRACTION ----------------

def extract_features(filepath):
    y, sr = librosa.load(filepath, sr=None)

    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    delta = librosa.feature.delta(mfcc)

    mfcc_mean = np.mean(mfcc.T, axis=0)
    mfcc_std  = np.std(mfcc.T, axis=0)
    delta_mean = np.mean(delta.T, axis=0)

    features = np.hstack([mfcc_mean, mfcc_std, delta_mean]).reshape(1, -1)
    return features

# ---------------- PREDICT ----------------

@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return "", 204

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    language = request.form.get("language", "English")
    user_id  = request.form.get("user_id", None)

    if file.filename == "":
        return jsonify({"error": "Empty file"}), 400

    filename = f"temp_{uuid.uuid4().hex}.wav"
    filepath = os.path.join(".", filename)

    try:
        file.save(filepath)

        features = extract_features(filepath)

        print("Extracted feature shape:", features.shape)
        print("Language received:", language)
        print("User ID received:", user_id)

        if features.shape[1] != EXPECTED_FEATURES:
            return jsonify({
                "error": f"Feature mismatch! Got {features.shape[1]}, expected {EXPECTED_FEATURES}"
            }), 400

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

        return jsonify({
            "prediction":  result,
            "confidence":  f"{confidence:.2f}%",
            "probability": float(dementia_prob),
            "language":    language,
            "user_id":     user_id
        })

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"error": str(e)}), 500

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

# ---------------- RUN ----------------

print("Starting Flask server...")

if __name__ == "__main__":
    app.run(debug=False, use_reloader=False)