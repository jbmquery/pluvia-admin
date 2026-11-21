# src/controllers/pedidos_pagos_controller.py
from flask import request

from src.services import pedidos_pagos_service as svc
from src.utils.errors import AppError, handle_errors
from src.utils.request_utils import periodos_de_la_peticion
from src.utils.response_utils import ok
from src.utils.serialize_utils import serialize_rows
from src.utils.validation_utils import get_bool, get_date, get_datetime, get_decimal, get_int, get_str, get_time


def _body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise AppError("Datos inválidos.")
    return data


# ---------------- carga ----------------
@handle_errors
def init_data():
    d = svc.datos_iniciales()
    return ok(
        "Datos cargados.",
        hoy=d["hoy"].isoformat(), mes=d["mes"], anio=d["anio"], anios=d["anios"],
        mesas=serialize_rows(d["mesas"]), usuarios=serialize_rows(d["usuarios"]), carta=serialize_rows(d["carta"]),
        pedidos=serialize_rows(d["pedidos"]), detalle=serialize_rows(d["detalle"]), pagos=serialize_rows(d["pagos"]),
    )


@handle_errors
def listar_pedidos():
    return ok("Datos cargados.", pedidos=serialize_rows(svc.listar_pedidos(periodos_de_la_peticion())))


@handle_errors
def listar_detalle():
    return ok("Datos cargados.", detalle=serialize_rows(svc.listar_detalle(periodos_de_la_peticion())))


@handle_errors
def listar_pagos():
    return ok("Datos cargados.", pagos=serialize_rows(svc.listar_pagos(periodos_de_la_peticion())))


# ---------------- editar ----------------
@handle_errors
def actualizar_pedido(id_pedido):
    data = _body()
    d = {
        "id_mesa": get_int(data, "id_mesa", "La mesa", required=False, minimum=0),
        "id_cliente": get_int(data, "id_cliente", "El cliente", required=False, minimum=0),
        "id_usuario": get_int(data, "id_usuario", "El usuario", required=False, minimum=0),
        "fecha": get_date(data, "fecha", "La fecha"),
        "hora_pedido": get_time(data, "hora_pedido", "La hora del pedido"),
        "hora_entrega": get_time(data, "hora_entrega", "La hora de entrega", required=False),
        "hora_pago": get_time(data, "hora_pago", "La hora de pago", required=False),
        "estado": get_str(data, "estado", "El estado", 20, required=False),
        "cantidad_clientes": get_int(data, "cantidad_clientes", "La cantidad de clientes", required=False, minimum=0, maximum=100000),
        "observacion": get_str(data, "observacion", "La observación", 100, required=False),
        "forma_pago": get_str(data, "forma_pago", "La forma de pago", 20, required=False),
        "puntos_canjeados_total": get_int(data, "puntos_canjeados_total", "Los puntos canjeados", required=False, minimum=0, maximum=1_000_000_000),
        "monto_pagado": get_decimal(data, "monto_pagado", "El monto pagado"),
        "monto_vuelto": get_decimal(data, "monto_vuelto", "El monto de vuelto"),
    }
    svc.actualizar_pedido(id_pedido, d)
    return ok("Pedido actualizado correctamente.")


@handle_errors
def actualizar_detalle(id_detalle):
    data = _body()
    d = {
        "id_carta": get_int(data, "id_carta", "El plato", minimum=0),
        "cantidad": get_int(data, "cantidad", "La cantidad", minimum=0, maximum=100000),
        "precio_unitario": get_decimal(data, "precio_unitario", "El precio unitario"),
        "observacion": get_str(data, "observacion", "La observación", 1000, required=False),
        "es_canjeable": get_bool(data, "es_canjeable", "El campo «es canjeable»"),
        "estado": get_str(data, "estado", "El estado", 20, required=False),
        "cuenta": get_int(data, "cuenta", "La cuenta", required=False, minimum=0, maximum=100000),
    }
    svc.actualizar_detalle(id_detalle, d)
    return ok("Detalle actualizado correctamente.")


@handle_errors
def actualizar_pago(id_pago):
    data = _body()
    d = {
        "cuenta": get_int(data, "cuenta", "La cuenta", minimum=0, maximum=100000),
        "monto_total": get_decimal(data, "monto_total", "El monto total", required=True),
        "metodo_pago": get_str(data, "metodo_pago", "El método de pago", 50),
        "fecha_pago": get_datetime(data, "fecha_pago", "La fecha de pago"),
        "observacion": get_str(data, "observacion", "La observación", 1000, required=False),
    }
    svc.actualizar_pago(id_pago, d)
    return ok("Pago actualizado correctamente.")
