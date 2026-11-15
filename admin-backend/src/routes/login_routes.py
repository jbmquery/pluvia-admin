# src/routes/login_routes.py
from flask import Blueprint

from src.controllers import login_controller as ctrl
from src.hooks.auth_hook import login_required

login_bp = Blueprint("login", __name__, url_prefix="/api/auth")

login_bp.add_url_rule("/login", view_func=ctrl.login, methods=["POST"])
login_bp.add_url_rule("/logout", view_func=ctrl.logout, methods=["POST"])
login_bp.add_url_rule("/me", view_func=login_required(ctrl.me), methods=["GET"])
login_bp.add_url_rule("/restaurar-password", view_func=ctrl.restaurar_password, methods=["POST"])
