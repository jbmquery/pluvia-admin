# src/services/pedidos_pagos_service.py
# Consultas SQL y reglas de negocio de la página Pedidos y Pagos.
# Estas tablas las alimenta otro aplicativo: aquí solo se consulta y se edita (no se crea ni se elimina).
from database import run_query
from src.utils.errors import AppError
from src.utils.periodo_utils import where_periodos

ESTADOS_PEDIDO = ("completado", "cancelado", "inconcluso")
ESTADOS_DETALLE = ("pendiente", "cancelado", "perdida", "pagado")
METODOS_PAGO = ("yape", "efectivo", "plin", "transferencia", "agora", "bim")

NOMBRE_USUARIO = "u.nombres || ' ' || u.ape_paterno || ' ' || u.ape_materno"
NOMBRE_CLIENTE = "NULLIF(TRIM(CONCAT_WS(' ', c.nombres, c.ape_paterno, c.ape_materno)), '')"


def _uno(sql, params):
    return run_query(sql, params, fetch="one")


# =====================================================================
# Carga de datos (por mes y año)
# =====================================================================
def listar_pedidos(periodos):
    donde, params = where_periodos("p.fecha", periodos)
    return run_query(
        f"""
        SELECT p.id_pedido, p.numero_orden,
               p.id_mesa, m.nombre AS nombre_mesa,
               p.id_cliente, {NOMBRE_CLIENTE} AS nombre_cliente, c.dni AS dni_cliente,
               p.id_usuario, u.apodo AS apodo_usuario, {NOMBRE_USUARIO} AS nombres_usuario,
               p.fecha, p.hora_pedido, p.hora_entrega, p.hora_pago, p.estado,
               p.cantidad_clientes, p.observacion, p.forma_pago, p.puntos_canjeados_total,
               p.monto_pagado, p.monto_vuelto,
               CEIL(EXTRACT(DAY FROM p.fecha) / 7.0)::int AS semana_mes
        FROM public.pedidos p
        LEFT JOIN public.mesas    m ON m.id_mesas    = p.id_mesa
        LEFT JOIN public.clientes c ON c.id_cliente  = p.id_cliente
        LEFT JOIN public.usuarios u ON u.id_usuario  = p.id_usuario
        WHERE {donde}
        ORDER BY p.fecha DESC, p.id_pedido DESC
        """,
        tuple(params),
    )


def listar_detalle(periodos):
    donde, params = where_periodos("p.fecha", periodos)
    return run_query(
        f"""
        SELECT d.id_detalle, d.id_pedido, p.numero_orden, p.fecha AS fecha_pedido,
               d.id_carta, ca.nombre AS nombre_carta, ca.porcion, ca.unidad_medida,
               d.cantidad, d.precio_unitario, d.observacion, d.es_canjeable, d.estado,
               d.canjeado_por, d.cuenta, d.id_detalle_padre
        FROM public.detalle_pedido d
        INNER JOIN public.pedidos p ON p.id_pedido = d.id_pedido
        LEFT JOIN  public.carta  ca ON ca.id_carta = d.id_carta
        WHERE {donde}
        ORDER BY d.id_pedido DESC, d.id_detalle DESC
        """,
        tuple(params),
    )


def listar_pagos(periodos):
    donde, params = where_periodos("pg.fecha_pago", periodos)
    return run_query(
        f"""
        SELECT pg.id_pago, pg.id_pedido, p.numero_orden, pg.cuenta, pg.monto_total,
               pg.metodo_pago, pg.fecha_pago, pg.observacion,
               CEIL(EXTRACT(DAY FROM pg.fecha_pago) / 7.0)::int AS semana_mes
        FROM public.pagos pg
        INNER JOIN public.pedidos p ON p.id_pedido = pg.id_pedido
        WHERE {donde}
        ORDER BY pg.fecha_pago DESC, pg.id_pago DESC
        """,
        tuple(params),
    )


def datos_iniciales():
    hoy = _uno(
        "SELECT CURRENT_DATE AS hoy, EXTRACT(YEAR FROM CURRENT_DATE)::int AS anio, "
        "EXTRACT(MONTH FROM CURRENT_DATE)::int AS mes", None)
    r1 = _uno("SELECT MIN(fecha) AS minimo, MAX(fecha) AS maximo FROM public.pedidos", None)
    r2 = _uno("SELECT MIN(fecha_pago)::date AS minimo, MAX(fecha_pago)::date AS maximo FROM public.pagos", None)
    minimos = [x.year for x in (r1["minimo"], r2["minimo"]) if x] + [hoy["anio"]]
    maximos = [x.year for x in (r1["maximo"], r2["maximo"]) if x] + [hoy["anio"]]

    mesas = run_query("SELECT id_mesas, nombre, capacidad, disponibilidad, tipo_mesa FROM public.mesas ORDER BY nombre")
    usuarios = run_query(f"""
        SELECT u.id_usuario, u.apodo, {NOMBRE_USUARIO} AS nombres_completos
        FROM public.usuarios u ORDER BY nombres_completos
    """)
    carta = run_query("""
        SELECT id_carta, nombre, porcion, unidad_medida, estado
        FROM public.carta ORDER BY nombre, porcion
    """)
    periodo = [(hoy["anio"], hoy["mes"])]
    return {
        "hoy": hoy["hoy"], "mes": hoy["mes"], "anio": hoy["anio"],
        "anios": list(range(max(maximos), min(minimos) - 1, -1)),
        "mesas": mesas, "usuarios": usuarios, "carta": carta,
        "pedidos": listar_pedidos(periodo),
        "detalle": listar_detalle(periodo),
        "pagos": listar_pagos(periodo),
    }


# =====================================================================
# Validaciones comunes
# =====================================================================
def _check_valor(valor, permitidos, actual, label):
    """Acepta un valor de la lista, vacío, o el mismo que ya tenía la fila (datos antiguos)."""
    actual_limpio = actual.strip() if isinstance(actual, str) else actual
    if valor is None or valor in permitidos or valor == actual or valor == actual_limpio:
        return
    adjetivo = "válida" if label.lower().startswith(("la ", "las ")) else "válido"
    raise AppError(f"{label} no es {adjetivo}. Valores permitidos: {', '.join(permitidos)}.")


# =====================================================================
# Editar pedido (id_pedido y numero_orden no se pueden cambiar)
# =====================================================================
def actualizar_pedido(id_pedido, d):
    actual = _uno("SELECT id_pedido, estado, forma_pago FROM public.pedidos WHERE id_pedido = %s", (id_pedido,))
    if not actual:
        raise AppError("El pedido no existe.", 404)

    if d["id_mesa"] is not None and not _uno("SELECT 1 AS ok FROM public.mesas WHERE id_mesas = %s", (d["id_mesa"],)):
        raise AppError("La mesa seleccionada no existe.")
    if d["id_cliente"] is not None and not _uno("SELECT 1 AS ok FROM public.clientes WHERE id_cliente = %s", (d["id_cliente"],)):
        raise AppError(f"No existe un cliente con el ID {d['id_cliente']}.")
    if d["id_usuario"] is not None and not _uno("SELECT 1 AS ok FROM public.usuarios WHERE id_usuario = %s", (d["id_usuario"],)):
        raise AppError("El usuario seleccionado no existe.")
    _check_valor(d["estado"], ESTADOS_PEDIDO, actual["estado"], "El estado")
    _check_valor(d["forma_pago"], METODOS_PAGO, actual["forma_pago"], "La forma de pago")

    run_query(
        """
        UPDATE public.pedidos
        SET id_mesa = %s, id_cliente = %s, id_usuario = %s, fecha = %s,
            hora_pedido = %s, hora_entrega = %s, hora_pago = %s, estado = %s,
            cantidad_clientes = %s, observacion = %s, forma_pago = %s,
            puntos_canjeados_total = %s, monto_pagado = %s, monto_vuelto = %s
        WHERE id_pedido = %s
        """,
        (d["id_mesa"], d["id_cliente"], d["id_usuario"], d["fecha"],
         d["hora_pedido"], d["hora_entrega"], d["hora_pago"], d["estado"],
         d["cantidad_clientes"], d["observacion"], d["forma_pago"],
         d["puntos_canjeados_total"], d["monto_pagado"], d["monto_vuelto"], id_pedido),
        fetch=None,
    )


# =====================================================================
# Editar detalle (id_detalle, id_pedido, id_detalle_padre y canjeado_por no se cambian)
# =====================================================================
def actualizar_detalle(id_detalle, d):
    actual = _uno("SELECT id_detalle, estado FROM public.detalle_pedido WHERE id_detalle = %s", (id_detalle,))
    if not actual:
        raise AppError("El detalle no existe.", 404)
    if not _uno("SELECT 1 AS ok FROM public.carta WHERE id_carta = %s", (d["id_carta"],)):
        raise AppError("El plato seleccionado no existe.")
    _check_valor(d["estado"], ESTADOS_DETALLE, actual["estado"], "El estado")

    run_query(
        """
        UPDATE public.detalle_pedido
        SET id_carta = %s, cantidad = %s, precio_unitario = %s, observacion = %s,
            es_canjeable = %s, estado = %s, cuenta = %s
        WHERE id_detalle = %s
        """,
        (d["id_carta"], d["cantidad"], d["precio_unitario"], d["observacion"],
         d["es_canjeable"], d["estado"], d["cuenta"], id_detalle),
        fetch=None,
    )


# =====================================================================
# Editar pago (id_pago e id_pedido no se pueden cambiar)
# =====================================================================
def actualizar_pago(id_pago, d):
    actual = _uno("SELECT id_pago, metodo_pago FROM public.pagos WHERE id_pago = %s", (id_pago,))
    if not actual:
        raise AppError("El pago no existe.", 404)
    _check_valor(d["metodo_pago"], METODOS_PAGO, actual["metodo_pago"], "El método de pago")

    run_query(
        """
        UPDATE public.pagos
        SET cuenta = %s, monto_total = %s, metodo_pago = %s, fecha_pago = %s, observacion = %s
        WHERE id_pago = %s
        """,
        (d["cuenta"], d["monto_total"], d["metodo_pago"], d["fecha_pago"], d["observacion"], id_pago),
        fetch=None,
    )
