# src/routes/usuarios_routes.py
from flask import Blueprint

from src.controllers import usuarios_controller as c
from src.hooks.auth_hook import login_required

usuarios_bp = Blueprint("usuarios", __name__, url_prefix="/api/usuarios")


def _add(rule, view, methods):
    # Todas las rutas de esta página exigen sesión
    usuarios_bp.add_url_rule(rule, view_func=login_required(view), methods=methods)


_add("/init", c.init_data, ["GET"])

_add("/usuarios", c.crear_usuario, ["POST"])
_add("/usuarios/<int:id_usuario>", c.actualizar_usuario, ["PUT"])
_add("/usuarios/<int:id_usuario>", c.eliminar_usuario, ["DELETE"])
_add("/usuarios/<int:id_usuario>/reset-password", c.reset_password_usuario, ["POST"])

_add("/empleados", c.crear_empleado, ["POST"])
_add("/empleados/<int:id_empleado>", c.actualizar_empleado, ["PUT"])
_add("/empleados/<int:id_empleado>", c.eliminar_empleado, ["DELETE"])

_add("/niveles", c.crear_nivel, ["POST"])
_add("/niveles/<int:id_nivel>", c.actualizar_nivel, ["PUT"])
_add("/niveles/<int:id_nivel>", c.eliminar_nivel, ["DELETE"])
