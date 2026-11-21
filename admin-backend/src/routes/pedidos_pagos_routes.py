# src/routes/pedidos_pagos_routes.py
from flask import Blueprint

from src.controllers import pedidos_pagos_controller as c
from src.hooks.auth_hook import login_required

pedidos_pagos_bp = Blueprint("pedidos_pagos", __name__, url_prefix="/api/pedidos-pagos")


def _add(rule, view, methods):
    # Todas las rutas de esta página exigen sesión
    pedidos_pagos_bp.add_url_rule(rule, view_func=login_required(view), methods=methods)


_add("/init", c.init_data, ["GET"])

_add("/pedidos", c.listar_pedidos, ["GET"])
_add("/pedidos/<int:id_pedido>", c.actualizar_pedido, ["PUT"])

_add("/detalle", c.listar_detalle, ["GET"])
_add("/detalle/<int:id_detalle>", c.actualizar_detalle, ["PUT"])

_add("/pagos", c.listar_pagos, ["GET"])
_add("/pagos/<int:id_pago>", c.actualizar_pago, ["PUT"])
