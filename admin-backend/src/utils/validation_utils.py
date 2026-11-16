# src/utils/validation_utils.py
import math
from datetime import date, time
from decimal import Decimal, InvalidOperation

from src.utils.errors import AppError


def get_str(data, key, label, max_len, required=True):
    value = data.get(key)
    value = "" if value is None else str(value).strip()
    if not value:
        if required:
            raise AppError(f"{label} es obligatorio.")
        return None
    if len(value) > max_len:
        raise AppError(f"{label} no puede superar {max_len} caracteres.")
    return value


def get_int(data, key, label, required=True, minimum=None, maximum=None):
    raw = data.get(key)
    if raw is None or (isinstance(raw, str) and not raw.strip()):
        if required:
            raise AppError(f"{label} es obligatorio.")
        return None
    if isinstance(raw, bool):
        raise AppError(f"{label} debe ser un número entero.")
    try:
        value = int(raw)
    except (TypeError, ValueError):
        raise AppError(f"{label} debe ser un número entero.")
    if minimum is not None and value < minimum:
        raise AppError(f"{label} no puede ser menor que {minimum}.")
    if maximum is not None and value > maximum:
        raise AppError(f"{label} no puede ser mayor que {maximum}.")
    return value


def get_float(data, key, label, minimum, maximum, required=False):
    raw = data.get(key)
    if raw is None or (isinstance(raw, str) and not raw.strip()):
        if required:
            raise AppError(f"{label} es obligatorio.")
        return None
    if isinstance(raw, bool):
        raise AppError(f"{label} debe ser un número.")
    try:
        value = float(raw)
    except (TypeError, ValueError):
        raise AppError(f"{label} debe ser un número.")
    if not math.isfinite(value):
        raise AppError(f"{label} debe ser un número.")
    if value < minimum or value > maximum:
        raise AppError(f"{label} debe estar entre {minimum} y {maximum}.")
    return value


def get_bool(data, key, label):
    value = data.get(key)
    if isinstance(value, bool):
        return value
    raise AppError(f"{label} no es válido.")


def get_date(data, key, label, required=False):
    raw = data.get(key)
    if raw is None or str(raw).strip() == "":
        if required:
            raise AppError(f"{label} es obligatorio.")
        return None
    try:
        return date.fromisoformat(str(raw).strip())
    except ValueError:
        raise AppError(f"{label} no es una fecha válida.")


def get_time(data, key, label, required=True):
    raw = data.get(key)
    if raw is None or str(raw).strip() == "":
        if required:
            raise AppError(f"{label} es obligatoria.")
        return None
    try:
        return time.fromisoformat(str(raw).strip())
    except ValueError:
        raise AppError(f"{label} no es una hora válida (formato HH:MM).")


def get_decimal(data, key, label, required=False, maximum=Decimal("99999999.99")):
    raw = data.get(key)
    if raw is None or str(raw).strip() == "":
        if required:
            raise AppError(f"{label} es obligatorio.")
        return None
    try:
        value = Decimal(str(raw).strip())
    except InvalidOperation:
        raise AppError(f"{label} debe ser un número.")
    if not value.is_finite():
        raise AppError(f"{label} debe ser un número.")
    if value < 0:
        raise AppError(f"{label} no puede ser negativo.")
    if value > maximum:
        raise AppError(f"{label} es demasiado grande.")
    return value.quantize(Decimal("0.01"))
