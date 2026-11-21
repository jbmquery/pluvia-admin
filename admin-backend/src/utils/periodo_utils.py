# src/utils/periodo_utils.py
from datetime import date

from src.utils.errors import AppError

MAX_PERIODOS = 60


def rango_mes(anio, mes):
    """(primer día del mes, primer día del mes siguiente)."""
    ini = date(anio, mes, 1)
    fin = date(anio + 1, 1, 1) if mes == 12 else date(anio, mes + 1, 1)
    return ini, fin


def where_periodos(campo, periodos):
    """Condición SQL (solo con parámetros) para una lista de (anio, mes) sobre una columna de fecha."""
    if not periodos:
        raise AppError("Selecciona al menos un mes y un año.")
    if len(periodos) > MAX_PERIODOS:
        raise AppError(f"Demasiados períodos seleccionados (máximo {MAX_PERIODOS} combinaciones de mes y año).")
    cond, params = [], []
    for anio, mes in periodos:
        ini, fin = rango_mes(anio, mes)
        cond.append(f"({campo} >= %s AND {campo} < %s)")
        params += [ini, fin]
    return "(" + " OR ".join(cond) + ")", params
