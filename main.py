"""
/api/public/v1/me
/api/public/v1/mail (the important one)
/api/public/v1/letters
/api/public/v1/letters/:id
/api/public/v1/packages
/api/public/v1/packages/:id
/api/public/v1/lsv
/api/public/v1/lsv/:type/:id

"""
import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify
import requests

# Lade Umgebungsvariablen aus .env
load_dotenv()

app = Flask(__name__)
MAIL_API_KEY = os.getenv("MAIL_API_KEY")
MAIL_API_BASE_URL = os.getenv("MAIL_API_BASE_URL", "https://api.example.com")  # Basis-URL anpassen

if not MAIL_API_KEY:
    raise ValueError("MAIL_API_KEY not found")

@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    # Flask im Debug-Modus starten (nur lokal)
    app.run(debug=True)
