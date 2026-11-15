# src/hooks/request_hooks.py
from flask import request

from src.utils.response_utils import fail

UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def register_hooks(app):
    @app.before_request
    def csrf_guard():
        # El frontend envía X-Requested-With en cada petición que modifica datos.
        # Un sitio externo no puede enviar ese header (el CORS se lo impide).
        if request.method in UNSAFE_METHODS and request.headers.get("X-Requested-With") != "fetch":
            return fail("Petición no permitida.", 403)

    @app.after_request
    def security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "same-origin"
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response
