# src/utils/request_utils.py
from flask import request

from src.utils.errors import AppError


def int_list(name, label, minimo, maximo, max_items):
    """Lee ?name=1,2,3 como lista de enteros únicos y ordenados."""
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


def periodos_de_la_peticion():
    """?meses=11,12&anios=2026 -> [(2026, 11), (2026, 12)]"""
    meses = int_list("meses", "Los meses", 1, 12, 12)
    anios = int_list("anios", "Los años", 2000, 2100, 30)
    if not meses or not anios:
        raise AppError("Selecciona al menos un mes y un año.")
    return [(a, m) for a in anios for m in meses]
