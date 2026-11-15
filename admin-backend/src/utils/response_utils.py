# src/utils/response_utils.py
from flask import jsonify


def ok(message="OK", status=200, **data):
    resp = jsonify({"status": "success", "message": message, **data})
    resp.status_code = status
    return resp


def fail(message, status=400, **data):
    resp = jsonify({"status": "error", "message": message, **data})
    resp.status_code = status
    return resp
