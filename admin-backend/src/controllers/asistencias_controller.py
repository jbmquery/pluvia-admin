# src/controllers/asistencias_controller.py
from flask import g, request

from src.services import asistencias_service as svc
from src.utils.errors import AppError, handle_errors
from src.utils.response_utils import ok
from src.utils.serialize_utils import serialize_row, serialize_rows
from src.utils.validation_utils import get_date, get_int, get_str, get_time


def _body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise AppError("Datos inválidos.")
    return data


def _int_list(name, label, minimo, maximo, max_items):
    raw = request.args.get(name, "")
    partes = [p for p in raw.split(",") if p.strip() != ""]
    if not partes:
        return []
    if len(partes) > max_items:
        raise AppError(f"{label}: demasiados valores seleccionados.")
    try:
        valores = sorted({int(p) for p in partes})
    except ValueError:
        raise AppError(f"{label} no es válido.")
    if any(v < minimo or v > maximo for v in valores):
        raise AppError(f"{label} no es válido.")
    return valores


# ---------------- carga ----------------
@handle_errors
def init_data():
    d = svc.datos_iniciales()
    return ok(
        "Datos cargados.",
        hoy=d["hoy"].isoformat(),
        mes=d["mes"],
        anio=d["anio"],
        anios=d["anios"],
        usuarios=serialize_rows(d["usuarios"]),
        sedes=serialize_rows(d["sedes"]),
        turnos=serialize_rows(d["turnos"]),
        asistencias=serialize_rows(d["asistencias"]),
    )


@handle_errors
def listar():
    meses = _int_list("meses", "Los meses", 1, 12, 12)
    anios = _int_list("anios", "Los años", 2000, 2100, 30)
    if not meses or not anios:
        raise AppError("Selecciona al menos un mes y un año.")
    periodos = [(a, m) for a in anios for m in meses]
    return ok("Datos cargados.", asistencias=serialize_rows(svc.listar_asistencias(periodos)))


@handle_errors
def faltas():
    mes = _int_list("mes", "El mes", 1, 12, 1)
    anio = _int_list("anio", "El año", 2000, 2100, 1)
    usuarios = _int_list("usuarios", "Los usuarios", 0, 2**62, 500)
    if len(mes) != 1 or len(anio) != 1:
        raise AppError("Corregir funciona con un solo mes y un solo año a la vez.")
    return ok("Faltas detectadas.", faltas=serialize_rows(svc.listar_faltas(g.user, mes[0], anio[0], usuarios)))


# ---------------- corregir ----------------
@handle_errors
def corregir():
    data = _body()
    salidas_raw = data.get("salidas") or []
    faltas_raw = data.get("faltas") or []
    if not isinstance(salidas_raw, list) or not isinstance(faltas_raw, list):
        raise AppError("Datos inválidos.")
    if not salidas_raw and not faltas_raw:
        raise AppError("Selecciona al menos un registro para corregir.")
    if len(salidas_raw) > 2000 or len(faltas_raw) > 2000:
        raise AppError("Demasiados registros seleccionados.")

    ids_salidas = []
    for v in salidas_raw:
        ids_salidas.append(get_int({"v": v}, "v", "El ID de asistencia", minimum=0))
    ids_salidas = sorted(set(ids_salidas))

    faltas, vistos = [], set()
    for f in faltas_raw:
        if not isinstance(f, dict):
            raise AppError("Datos inválidos.")
        item = {
            "id_usuario": get_int(f, "id_usuario", "El usuario", minimum=0),
            "id_sede": get_int(f, "id_sede", "La sede", minimum=0),
            "id_turno": get_int(f, "id_turno", "El turno", minimum=0),
            "fecha": get_date(f, "fecha", "La fecha", required=True),
        }
        clave = (item["id_usuario"], item["fecha"])
        if clave in vistos:
            raise AppError("Hay faltas repetidas para el mismo usuario y fecha.")
        vistos.add(clave)
        faltas.append(item)

    r = svc.corregir(g.user, ids_salidas, faltas)
    msg = f"Corrección aplicada: {r['salidas']} salida(s) completada(s) y {r['faltas']} falta(s) registrada(s)."
    if r["omitidos"]:
        msg += f" {r['omitidos']} no se aplicaron porque ya no cumplían las condiciones."
    return ok(msg, salidas=r["salidas"], faltas=r["faltas"], omitidos=r["omitidos"])


# ---------------- editar ----------------
def _parse_asistencia(data):
    estado = get_str(data, "estado_asistencia", "El estado", 20)
    if estado not in svc.ESTADOS:
        raise AppError("El estado de asistencia no es válido.")
    return {
        "id_sede": get_int(data, "id_sede", "La sede", minimum=0),
        "id_turno": get_int(data, "id_turno", "El turno", minimum=0),
        "fecha": get_date(data, "fecha", "La fecha", required=True),
        "hora_entrada_horario": get_time(data, "hora_entrada_horario", "La hora de entrada del horario"),
        "hora_salida_horario": get_time(data, "hora_salida_horario", "La hora de salida del horario"),
        "hora_entrada_real": get_time(data, "hora_entrada_real", "La hora de entrada real", required=False),
        "hora_salida_real": get_time(data, "hora_salida_real", "La hora de salida real", required=False),
        "estado_asistencia": estado,
        "observacion": get_str(data, "observacion", "La observación", 255),  # obligatoria al actualizar
    }


@handle_errors
def actualizar(id_asistencia):
    svc.actualizar_asistencia(g.user, id_asistencia, _parse_asistencia(_body()))
    return ok("Asistencia actualizada correctamente.")
