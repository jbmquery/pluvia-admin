# src/routes/asistencias_routes.py
from flask import Blueprint

from src.controllers import asistencias_controller as c
from src.hooks.auth_hook import login_required

asistencias_bp = Blueprint("asistencias", __name__, url_prefix="/api/asistencias")


def _add(rule, view, methods):
    # Todas las rutas de esta página exigen sesión
    asistencias_bp.add_url_rule(rule, view_func=login_required(view), methods=methods)


_add("/init", c.init_data, ["GET"])
_add("/data", c.listar, ["GET"])
_add("/faltas", c.faltas, ["GET"])
_add("/corregir", c.corregir, ["POST"])
_add("/<int:id_asistencia>", c.actualizar, ["PUT"])
