# src/routes/sedes_turnos_routes.py
from flask import Blueprint

from src.controllers import sedes_turnos_controller as c
from src.hooks.auth_hook import login_required

sedes_turnos_bp = Blueprint("sedes_turnos", __name__, url_prefix="/api/sedes-turnos")


def _add(rule, view, methods):
    # Todas las rutas de esta página exigen sesión
    sedes_turnos_bp.add_url_rule(rule, view_func=login_required(view), methods=methods)


_add("/init", c.init_data, ["GET"])

_add("/sedes", c.crear_sede, ["POST"])
_add("/sedes/<int:id_sede>", c.actualizar_sede, ["PUT"])
_add("/sedes/<int:id_sede>", c.eliminar_sede, ["DELETE"])

_add("/turnos", c.crear_turno, ["POST"])
_add("/turnos/<int:id_turno>", c.actualizar_turno, ["PUT"])
_add("/turnos/<int:id_turno>", c.eliminar_turno, ["DELETE"])
