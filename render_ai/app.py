from flask import Flask, request, jsonify
import face_recognition
import numpy as np
import faiss

app = Flask(__name__)

# 128-d face embeddings
index = faiss.IndexFlatL2(128)
image_ids = []

@app.route("/")
def home():
    return "FAISS Ready"

@app.route("/status")
def status():
    return jsonify({
        "faces_indexed": index.ntotal
    })
