import os
import io
import numpy as np
import faiss
import face_recognition
import requests

def load_drive_image(file_id):
    url = f"https://drive.google.com/uc?id={file_id}"
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    return face_recognition.load_image_file(io.BytesIO(r.content))


from flask import Flask, request, jsonify, abort

# ---------------- BASIC SETUP ----------------

app = Flask(__name__)

SCHOOL_KEY = os.environ.get("SCHOOL_KEY")

# ---------------- SECURITY ----------------

@app.before_request
def protect():
    if request.headers.get("X-School-Key") != SCHOOL_KEY:
        abort(403)

# ---------------- FAISS SETUP ----------------

index = faiss.IndexFlatL2(128)
image_ids = []   # stores Google Drive FILE_IDs

# ⚠️ MANUALLY ADD FILE IDS (PUBLIC DRIVE FILES)
DRIVE_FILE_IDS = [
    "FILE_ID_1",
    "FILE_ID_2",
    "FILE_ID_3"
]

def drive_url(file_id):
    return f"https://drive.google.com/uc?id={file_id}"

def build_index():
    for fid in DRIVE_FILE_IDS:
        try:
            img = load_drive_image(fid)
            encs = face_recognition.face_encodings(img)

            if encs:
                index.add(np.array([encs[0]], dtype="float32"))
                image_ids.append(fid)

        except Exception as e:
            print("Skipping:", fid, e)


build_index()

# ---------------- ROUTES ----------------

@app.route("/")
def home():
    return "Face AI Backend Live"

@app.route("/status")
def status():
    return jsonify({
        "faces_indexed": index.ntotal
    })

@app.route("/match", methods=["POST"])
def match():
    if "file" not in request.files:
        return jsonify({"photos": []})

    img = face_recognition.load_image_file(request.files["file"])
    encs = face_recognition.face_encodings(img)

    if not encs:
        return jsonify({"photos": []})

    q = np.array([encs[0]], dtype="float32")
    D, I = index.search(q, 10)

    results = []
    for idx, dist in zip(I[0], D[0]):
        if idx < len(image_ids) and dist < 0.6:
            results.append(drive_url(image_ids[idx]))

    return jsonify({"photos": results})
