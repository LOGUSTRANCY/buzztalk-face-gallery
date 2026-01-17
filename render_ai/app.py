from flask import Flask, jsonify
import face_recognition

app = Flask(__name__)

@app.route("/")
def home():
    return "Face Recognition Ready!"

@app.route("/test")
def test():
    return jsonify({
        "face_recognition_loaded": True
    })
