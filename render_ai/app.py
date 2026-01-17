import os
import io
import requests
import numpy as np
import faiss
import face_recognition
from flask import Flask, request, jsonify

# -----------------------------
# App & Security
# -----------------------------

app = Flask(__name__)

SCHOOL_KEY = os.environ.get("SCHOOL_KEY", "dev-key")

# -----------------------------
# FAISS GLOBAL INDEX (in-memory)
# -----------------------------

DIMENSIONS = 128  # face_recognition embedding size
face_index = faiss.IndexFlatL2(DIMENSIONS)
face_images = []  # maps index → image URL

# -----------------------------
# Health Check
# -----------------------------

@app.route("/", methods=["GET"])
def home():
    return "Buzztalk Face AI running", 200


@app.route("/status", methods=["GET"])
def status():
    return jsonify({
        "faces_indexed": face_index.ntotal
    })


# -----------------------------
# INDEX NEW IMAGE (from R2)
# -----------------------------

@app.route("/index", methods=["POST"])
def index_image():
    # Security check
    if request.headers.get("X-School-Key") != SCHOOL_KEY:
        return "Unauthorized", 403

    data = request.get_json()
    if not data or "image_url" not in data:
        return "Missing image_url", 400

    image_url = data["image_url"]

    try:
        # Download image
        img_bytes = requests.get(image_url, timeout=10).content
        image = face_recognition.load_image_file(
            io.BytesIO(img_bytes)
        )

        encodings = face_recognition.face_encodings(image)

        if not encodings:
            return jsonify({"indexed": 0})

        for enc in encodings:
            vec = np.array([enc]).astype("float32")
            face_index.add(vec)
            face_images.append(image_url)

        return jsonify({"indexed": len(encodings)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
# MATCH SELFIE → PHOTOS
# -----------------------------

@app.route("/match", methods=["POST"])
def match_face():
    # Security check
    if request.headers.get("X-School-Key") != SCHOOL_KEY:
        return "Unauthorized", 403

    if "photo" not in request.files:
        return jsonify({"photos": []})

    try:
        selfie = face_recognition.load_image_file(
            request.files["photo"]
        )
        encs = face_recognition.face_encodings(selfie)

        if not encs or face_index.ntotal == 0:
            return jsonify({"photos": []})

        query = np.array([encs[0]]).astype("float32")

        # Search top 10 closest faces
        D, I = face_index.search(query, 10)

        results = []
        for idx in I[0]:
            if 0 <= idx < len(face_images):
                results.append(face_images[idx])

        # Remove duplicates
        results = list(dict.fromkeys(results))

        return jsonify({"photos": results})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
# Local run (Render ignores this)
# -----------------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
