import os
import io
import json
import requests
import numpy as np
import faiss
import face_recognition
from flask import Flask, request, jsonify

# ---------------------------------
# CONFIG
# ---------------------------------

SCHOOL_KEY = os.environ.get("SCHOOL_KEY", "dev-key")
R2_BUCKET_URL = os.environ.get("R2_BUCKET_URL")

INDEX_FILE = "faiss.index"
META_FILE = "faces.json"

DIMENSIONS = 128

# ---------------------------------
# APP INIT
# ---------------------------------

app = Flask(__name__)

face_index = faiss.IndexFlatL2(DIMENSIONS)
face_images = []

# ---------------------------------
# LOAD INDEX FROM R2 (ON STARTUP)
# ---------------------------------

def load_index():
    global face_index, face_images

    try:
        idx_resp = requests.get(f"{R2_BUCKET_URL}/{INDEX_FILE}", timeout=10)
        meta_resp = requests.get(f"{R2_BUCKET_URL}/{META_FILE}", timeout=10)

        if idx_resp.status_code == 200 and meta_resp.status_code == 200:
            with open("/tmp/faiss.index", "wb") as f:
                f.write(idx_resp.content)

            face_index = faiss.read_index("/tmp/faiss.index")
            face_images = meta_resp.json()

            print(f"✅ Loaded {face_index.ntotal} faces from R2")
        else:
            print("ℹ️ No existing index found in R2")

    except Exception as e:
        print("⚠️ Index load failed:", e)

load_index()

# ---------------------------------
# SAVE INDEX TO R2
# ---------------------------------

def save_index():
    try:
        faiss.write_index(face_index, "/tmp/faiss.index")

        requests.put(
            f"{R2_BUCKET_URL}/{INDEX_FILE}",
            data=open("/tmp/faiss.index", "rb"),
            headers={"Content-Type": "application/octet-stream"}
        )

        requests.put(
            f"{R2_BUCKET_URL}/{META_FILE}",
            json=face_images,
            headers={"Content-Type": "application/json"}
        )

    except Exception as e:
        print("⚠️ Index save failed:", e)

# ---------------------------------
# ROUTES
# ---------------------------------

@app.route("/", methods=["GET"])
def home():
    return "Buzztalk Face AI running", 200


@app.route("/status", methods=["GET"])
def status():
    return jsonify({"faces_indexed": face_index.ntotal})


@app.route("/index", methods=["POST"])
def index_image():
    if request.headers.get("X-School-Key") != SCHOOL_KEY:
        return "Unauthorized", 403

    data = request.get_json()
    image_url = data.get("image_url")

    if not image_url:
        return "Missing image_url", 400

    try:
        img = requests.get(image_url, timeout=10).content
        image = face_recognition.load_image_file(io.BytesIO(img))
        encodings = face_recognition.face_encodings(image)

        added = 0
        for enc in encodings:
            vec = np.array([enc]).astype("float32")
            face_index.add(vec)
            face_images.append(image_url)
            added += 1

        if added > 0:
            save_index()

        return jsonify({"indexed": added})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/match", methods=["POST"])
def match_face():
    if request.headers.get("X-School-Key") != SCHOOL_KEY:
        return "Unauthorized", 403

    if "photo" not in request.files:
        return jsonify({"photos": []})

    try:
        selfie = face_recognition.load_image_file(request.files["photo"])
        encs = face_recognition.face_encodings(selfie)

        if not encs or face_index.ntotal == 0:
            return jsonify({"photos": []})

        query = np.array([encs[0]]).astype("float32")
        D, I = face_index.search(query, 10)

        results = []
        for idx in I[0]:
            if 0 <= idx < len(face_images):
                results.append(face_images[idx])

        return jsonify({"photos": list(dict.fromkeys(results))})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------
# MAIN
# ---------------------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
