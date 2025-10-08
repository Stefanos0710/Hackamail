"""
HackClub Mail API Proxy
Routes for all public API endpoints
"""
import os
from dotenv import load_dotenv
from flask import Flask, jsonify
import requests

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
MAIL_API_KEY = os.getenv("MAIL_API_KEY")
MAIL_API_BASE_URL = "https://mail.hackclub.com"

if not MAIL_API_KEY:
    raise ValueError("MAIL_API_KEY not found")


def make_api_request(endpoint):
    """
    Helper function to make requests to the HackClub Mail API.

    Args:
        endpoint (str): The API endpoint path (e.g., '/api/public/v1/mail')

    Returns:
        tuple: JSON response and status code

    Raises:
        Returns error JSON with 500 status on request failure
    """
    try:
        headers = {
            "Authorization": f"Bearer {MAIL_API_KEY}",
            "Content-Type": "application/json"
        }

        response = requests.get(
            f"{MAIL_API_BASE_URL}{endpoint}",
            headers=headers,
            timeout=10
        )

        response.raise_for_status()
        return jsonify(response.json()), response.status_code

    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": f"Error retrieving data from {endpoint}",
            "details": str(e)
        }), 500


@app.route("/api/public/v1/me", methods=["GET"])
def get_me():
    """
    Get current user information.

    Endpoint: GET /api/public/v1/me

    Returns:
        JSON object containing user profile data
    """
    return make_api_request("/api/public/v1/me")


@app.route("/api/public/v1/mail", methods=["GET"])
def get_mail():
    """
    Get mail data (the important one).

    Endpoint: GET /api/public/v1/mail

    Returns:
        JSON object containing mail data
    """
    return make_api_request("/api/public/v1/mail")


@app.route("/api/public/v1/letters", methods=["GET"])
def get_letters():
    """
    Get all letters.

    Endpoint: GET /api/public/v1/letters

    Returns:
        JSON array containing all letters
    """
    return make_api_request("/api/public/v1/letters")


@app.route("/api/public/v1/letters/<letter_id>", methods=["GET"])
def get_letter_by_id(letter_id):
    """
    Get a specific letter by ID.

    Endpoint: GET /api/public/v1/letters/:id

    Args:
        letter_id (str): The unique identifier of the letter

    Returns:
        JSON object containing letter data
    """
    return make_api_request(f"/api/public/v1/letters/{letter_id}")


@app.route("/api/public/v1/packages", methods=["GET"])
def get_packages():
    """
    Get all packages.

    Endpoint: GET /api/public/v1/packages

    Returns:
        JSON array containing all packages
    """
    return make_api_request("/api/public/v1/packages")


@app.route("/api/public/v1/packages/<package_id>", methods=["GET"])
def get_package_by_id(package_id):
    """
    Get a specific package by ID.

    Endpoint: GET /api/public/v1/packages/:id

    Args:
        package_id (str): The unique identifier of the package

    Returns:
        JSON object containing package data
    """
    return make_api_request(f"/api/public/v1/packages/{package_id}")


@app.route("/api/public/v1/lsv", methods=["GET"])
def get_lsv():
    """
    Get LSV (Letter Service Verification) data.

    Endpoint: GET /api/public/v1/lsv

    Returns:
        JSON object containing LSV data
    """
    return make_api_request("/api/public/v1/lsv")


@app.route("/api/public/v1/lsv/<lsv_type>/<lsv_id>", methods=["GET"])
def get_lsv_by_type_and_id(lsv_type, lsv_id):
    """
    Get specific LSV data by type and ID.

    Endpoint: GET /api/public/v1/lsv/:type/:id

    Args:
        lsv_type (str): The type of LSV record
        lsv_id (str): The unique identifier of the LSV record

    Returns:
        JSON object containing LSV data
    """
    return make_api_request(f"/api/public/v1/lsv/{lsv_type}/{lsv_id}")


@app.route("/", methods=["GET"])
def index():
    """
    API documentation route.

    Returns:
        JSON object listing all available endpoints
    """
    return jsonify({
        "message": "HackClub Mail API Proxy",
        "endpoints": [
            {"path": "/api/public/v1/me", "method": "GET", "description": "Get current user information"},
            {"path": "/api/public/v1/mail", "method": "GET", "description": "Get mail data (important)"},
            {"path": "/api/public/v1/letters", "method": "GET", "description": "Get all letters"},
            {"path": "/api/public/v1/letters/:id", "method": "GET", "description": "Get letter by ID"},
            {"path": "/api/public/v1/packages", "method": "GET", "description": "Get all packages"},
            {"path": "/api/public/v1/packages/:id", "method": "GET", "description": "Get package by ID"},
            {"path": "/api/public/v1/lsv", "method": "GET", "description": "Get LSV data"},
            {"path": "/api/public/v1/lsv/:type/:id", "method": "GET", "description": "Get LSV by type and ID"}
        ]
    })


if __name__ == "__main__":
    app.run(debug=True)
