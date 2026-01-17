import os
from flask import abort, request

SCHOOL_KEY = os.environ.get("SCHOOL_KEY")

@app.before_request
def protect():
    if request.headers.get("X-School-Key") != SCHOOL_KEY:
        abort(403)
import requests
import io

from flask import Flask, jsonify
import face_recognition
import numpy as np
import faiss

app = Flask(__name__)

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
DRIVE_FOLDER_ID = "PUT_YOUR_FOLDER_ID_HERE"

# FAISS index
index = faiss.IndexFlatL2(128)
image_map = []  # index -> Drive fileId


# ---------- GOOGLE DRIVE HELPERS ----------

def list_drive_images():
    """List image files from a public Google Drive folder"""
    url = "https://www.googleapis.com/drive/v3/files"
    params = {
        "q": f"'{DRIVE_FOLDER_ID}' in parents and mimeType contains 'image/'",
        "fields": "files(id, name)",
        "key": GOOGLE_API_KEY
    }

    r = requests.get(url, params=params, timeout=20)
    r.raise_for_status()
    return r.json().get("files", [])


def download_drive_image(file_id):
    """Download image bytes using public Drive access"""
    url = f"https://www.googleapis.com/drive/v3/files/{file_id}"
    params = {
        "alt": "media",
        "key": GOOGLE_API_KEY
    }

    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    return r.content


# ---------- INDEX BUILD (RUN ONCE PER DEPLOY) ----------

def build_faiss_index():
    global image_map
    files = list_drive_images()

    for f in files:
        try:
            img_bytes = download_drive_image(f["id"])
            img = face_recognition.load_image_file(io.BytesIO(img_bytes))
            encs = face_recognition.face_encodings(img)

            if encs:
                index.add(np.array([encs[0]], dtype="float32"))
                image_map.append(f["id"])

        except Exception as e:
            print("Skipping file:", f["name"], str(e))


build_faiss_index()


# ---------- ROUTES ----------

@app.route("/")
def home():
    return "Drive + Face Recognition Ready"


@app.route("/status")
def status():
    return jsonify({
        "faces_indexed": index.ntotal
    })


@app.route("/match", methods=["POST"])
def match():
    file = requests.files.get("file")
    if not file:
        return jsonify({"error": "No file"}), 400

    img = face_recognition.load_image_file(file)
    encs = face_recognition.face_encodings(img)

    if not encs:
        return jsonify({"photos": []})

    q = np.array([encs[0]], dtype="float32")
    D, I = index.search(q, 10)

    results = []
    for idx, dist in zip(I[0], D[0]):
        if idx < len(image_map) and dist < 0.6:
            fid = image_map[idx]
            results.append(f"https://drive.google.com/uc?id={fid}")

    return jsonify({"photos": results})
