# src/controllers/sedes_turnos_controller.py
from flask import request

from src.services import sedes_turnos_service as svc
from src.utils.errors import AppError, handle_errors
from src.utils.response_utils import ok
from src.utils.serialize_utils import serialize_rows
from src.utils.validation_utils import get_bool, get_float, get_int, get_str, get_time


def _body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise AppError("Datos inválidos.")
    return data


# ---------------- parsers ----------------
def _parse_sede(data):
    latitud = get_float(data, "latitud", "La latitud", -90, 90)
    longitud = get_float(data, "longitud", "La longitud", -180, 180)
    if (latitud is None) != (longitud is None):
        raise AppError("Indica latitud y longitud juntas, o deja ambas vacías.")
    return {
        "nombre_sede": get_str(data, "nombre_sede", "El nombre de la sede", 50),
        "direccion": get_str(data, "direccion", "La dirección", 50, required=False),
        "latitud": latitud,
        "longitud": longitud,
        "capacidad": get_int(data, "capacidad", "La capacidad", required=False, minimum=0, maximum=1_000_000_000),
        "estado": get_bool(data, "estado", "El estado"),
        "tipo_sede": get_str(data, "tipo_sede", "El tipo de sede", 15, required=False),
    }


def _parse_turno(data):
    inicio = get_time(data, "hora_inicio", "La hora de inicio")
    fin = get_time(data, "hora_fin", "La hora de fin")
    if inicio == fin:
        raise AppError("La hora de inicio y la hora de fin no pueden ser iguales.")
    return {
        "id_sede": get_int(data, "id_sede", "La sede", minimum=0),
        "nombre_turno": get_str(data, "nombre_turno", "El nombre del turno", 20),
        "hora_inicio": inicio,
        "hora_fin": fin,
        "tolerancia_minutos": get_int(data, "tolerancia_minutos", "La tolerancia", required=False, minimum=0, maximum=240),
        "estado": get_bool(data, "estado", "El estado"),
    }


# ---------------- carga inicial ----------------
@handle_errors
def init_data():
    return ok(
        "Datos cargados.",
        sedes=serialize_rows(svc.listar_sedes()),
        turnos=serialize_rows(svc.listar_turnos()),
    )


# ---------------- sedes ----------------
@handle_errors
def crear_sede():
    new_id = svc.crear_sede(_parse_sede(_body()))
    return ok("Sede creada correctamente.", 201, id_sede=new_id)


@handle_errors
def actualizar_sede(id_sede):
    svc.actualizar_sede(id_sede, _parse_sede(_body()))
    return ok("Sede actualizada correctamente.")


@handle_errors
def eliminar_sede(id_sede):
    svc.eliminar_sede(id_sede)
    return ok("Sede eliminada correctamente.")


# ---------------- turnos ----------------
@handle_errors
def crear_turno():
    new_id = svc.crear_turno(_parse_turno(_body()))
    return ok("Turno creado correctamente.", 201, id_turno=new_id)


@handle_errors
def actualizar_turno(id_turno):
    svc.actualizar_turno(id_turno, _parse_turno(_body()))
    return ok("Turno actualizado correctamente.")


@handle_errors
def eliminar_turno(id_turno):
    svc.eliminar_turno(id_turno)
    return ok("Turno eliminado correctamente.")
