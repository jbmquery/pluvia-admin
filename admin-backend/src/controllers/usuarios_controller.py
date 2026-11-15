# src/controllers/usuarios_controller.py
import re
from datetime import date

from flask import g, request

import config
from src.services import usuarios_service as svc
from src.utils.errors import AppError, handle_errors
from src.utils.response_utils import ok
from src.utils.serialize_utils import serialize_rows
from src.utils.validation_utils import get_bool, get_date, get_decimal, get_int, get_str

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^[0-9+()\-\s]{6,20}$")


def _body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise AppError("Datos inválidos.")
    return data


# ---------------- parsers ----------------
def _parse_usuario(data):
    correo = get_str(data, "correo", "El correo", 100).lower()
    if not EMAIL_RE.match(correo):
        raise AppError("Ingresa un correo válido.")
    celular = get_str(data, "celular", "El celular", 20, required=False)
    if celular and not PHONE_RE.match(celular):
        raise AppError("El celular solo puede tener números, espacios y los símbolos + ( ) -.")
    nacimiento = get_date(data, "fecha_nacimiento", "La fecha de nacimiento")
    if nacimiento and nacimiento > date.today():
        raise AppError("La fecha de nacimiento no puede ser futura.")
    return {
        "nombres": get_str(data, "nombres", "Los nombres", 50),
        "ape_paterno": get_str(data, "ape_paterno", "El apellido paterno", 30),
        "ape_materno": get_str(data, "ape_materno", "El apellido materno", 30),
        "apodo": get_str(data, "apodo", "El apodo", 30),
        "correo": correo,
        "tipo_usuario": get_int(data, "tipo_usuario", "El nivel", minimum=0),
        "estado": get_bool(data, "estado", "El estado"),
        "celular": celular,
        "fecha_nacimiento": nacimiento,
        "fecha_contratacion": get_date(data, "fecha_contratacion", "La fecha de contratación"),
    }


def _parse_empleado(data):
    return {
        "id_usuario": get_int(data, "id_usuario", "El usuario", minimum=0),
        "id_sede": get_int(data, "id_sede", "La sede", required=False, minimum=0),
        "sueldo": get_decimal(data, "sueldo", "El sueldo"),
        "tipo_contrato": get_str(data, "tipo_contrato", "El tipo de contrato", 30, required=False),
        "fecha_inicio": get_date(data, "fecha_inicio", "La fecha de inicio", required=True),
        "fecha_fin": get_date(data, "fecha_fin", "La fecha fin"),
        "estado": get_bool(data, "estado", "El estado"),
        "tipo_usuario": get_int(data, "tipo_usuario", "El nivel", required=False, minimum=0),
        "observacion": get_str(data, "observacion", "La observación", 1000, required=False),
        "turno_referencia": get_str(data, "turno_referencia", "El turno de referencia", 40, required=False),
    }


def _parse_nivel(data, with_id):
    d = {
        "nombre": get_str(data, "nombre", "El nombre", 30),
        "descripcion": get_str(data, "descripcion", "La descripción", 100),
    }
    if with_id:
        d["id_tipo_usuario"] = get_int(data, "id_tipo_usuario", "El ID del nivel", minimum=0)
    return d


# ---------------- carga inicial ----------------
@handle_errors
def init_data():
    return ok(
        "Datos cargados.",
        usuarios=serialize_rows(svc.listar_usuarios()),
        empleados=serialize_rows(svc.listar_empleados()),
        niveles=serialize_rows(svc.listar_niveles()),
        sedes=serialize_rows(svc.listar_sedes()),
    )


# ---------------- usuarios ----------------
@handle_errors
def crear_usuario():
    new_id = svc.crear_usuario(g.user, _parse_usuario(_body()))
    return ok(f"Usuario creado. Su contraseña inicial es {config.DEFAULT_USER_PASSWORD}.", 201, id_usuario=new_id)


@handle_errors
def actualizar_usuario(id_usuario):
    svc.actualizar_usuario(g.user, id_usuario, _parse_usuario(_body()))
    return ok("Usuario actualizado correctamente.")


@handle_errors
def eliminar_usuario(id_usuario):
    svc.eliminar_usuario(g.user, id_usuario)
    return ok("Usuario eliminado correctamente.")


@handle_errors
def reset_password_usuario(id_usuario):
    svc.restablecer_password(g.user, id_usuario)
    return ok(f"Contraseña restablecida a {config.DEFAULT_USER_PASSWORD}.")


# ---------------- empleados ----------------
@handle_errors
def crear_empleado():
    new_id = svc.crear_empleado(g.user, _parse_empleado(_body()))
    return ok("Empleado creado correctamente.", 201, id_empleado=new_id)


@handle_errors
def actualizar_empleado(id_empleado):
    svc.actualizar_empleado(g.user, id_empleado, _parse_empleado(_body()))
    return ok("Empleado actualizado correctamente.")


@handle_errors
def eliminar_empleado(id_empleado):
    svc.eliminar_empleado(g.user, id_empleado)
    return ok("Empleado eliminado correctamente.")


# ---------------- niveles ----------------
@handle_errors
def crear_nivel():
    svc.crear_nivel(g.user, _parse_nivel(_body(), with_id=True))
    return ok("Nivel creado correctamente.", 201)


@handle_errors
def actualizar_nivel(id_nivel):
    svc.actualizar_nivel(g.user, id_nivel, _parse_nivel(_body(), with_id=False))
    return ok("Nivel actualizado correctamente.")


@handle_errors
def eliminar_nivel(id_nivel):
    svc.eliminar_nivel(g.user, id_nivel)
    return ok("Nivel eliminado correctamente.")
