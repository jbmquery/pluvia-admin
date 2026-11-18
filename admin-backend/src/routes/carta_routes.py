# src/routes/carta_routes.py
from flask import Blueprint

from src.controllers import carta_controller as c
from src.hooks.auth_hook import login_required

carta_bp = Blueprint("carta", __name__, url_prefix="/api/carta")


def _add(rule, view, methods):
    # Todas las rutas de esta página exigen sesión
    carta_bp.add_url_rule(rule, view_func=login_required(view), methods=methods)


_add("/init", c.init_data, ["GET"])

_add("/platos", c.crear_plato, ["POST"])
_add("/platos/<int:id_carta>", c.actualizar_plato, ["PUT"])
_add("/platos/<int:id_carta>", c.eliminar_plato, ["DELETE"])

_add("/categorias", c.crear_categoria, ["POST"])
_add("/categorias/<int:id_categoria>", c.actualizar_categoria, ["PUT"])
_add("/categorias/<int:id_categoria>", c.eliminar_categoria, ["DELETE"])

_add("/subcategorias", c.crear_subcategoria, ["POST"])
_add("/subcategorias/<int:id_subcat>", c.actualizar_subcategoria, ["PUT"])
_add("/subcategorias/<int:id_subcat>", c.eliminar_subcategoria, ["DELETE"])
