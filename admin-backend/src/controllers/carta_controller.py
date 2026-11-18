# src/controllers/carta_controller.py
from flask import request

from src.services import carta_service as svc
from src.utils.errors import AppError, handle_errors
from src.utils.response_utils import ok
from src.utils.serialize_utils import serialize_rows
from src.utils.validation_utils import get_bool, get_decimal, get_int, get_str


def _body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise AppError("Datos inválidos.")
    return data


# ---------------- parsers ----------------
def _parse_plato(data):
    return {
        "categoria": get_int(data, "categoria", "La categoría", minimum=0),
        "sub_categoria": get_int(data, "sub_categoria", "La subcategoría", minimum=0),
        "nombre": get_str(data, "nombre", "El nombre", 50),
        "grupo": get_str(data, "grupo", "El grupo", 50),
        "abreviado": get_str(data, "abreviado", "El nombre abreviado", 30),
        "precio": get_decimal(data, "precio", "El precio", required=True),
        "puntos_canje": get_int(data, "puntos_canje", "Los puntos de canje", required=False, minimum=0, maximum=1_000_000_000),
        "estado": get_bool(data, "estado", "El estado"),
        "disponible": get_bool(data, "disponible", "La disponibilidad"),
        "porcion": get_str(data, "porcion", "La porción", 15, required=False),
        "unidad_medida": get_str(data, "unidad_medida", "La unidad de medida", 20, required=False),
        "observacion": get_str(data, "observacion", "La observación", 100, required=False),
        "url_imagen": get_str(data, "url_imagen", "La URL de la imagen", 50, required=False),
    }


def _parse_categoria(data):
    return {
        "nombre_cat": get_str(data, "nombre_cat", "El nombre de la categoría", 15),
        "descripcion": get_str(data, "descripcion", "La descripción", 50, required=False),
    }


def _parse_subcategoria(data):
    return {
        "nombre_subcat": get_str(data, "nombre_subcat", "El nombre de la subcategoría", 30),
        "descripcion": get_str(data, "descripcion", "La descripción", 50, required=False),
        "categoria": get_int(data, "categoria", "La categoría", minimum=0),
    }


# ---------------- carga inicial ----------------
@handle_errors
def init_data():
    return ok(
        "Datos cargados.",
        carta=serialize_rows(svc.listar_carta()),
        categorias=serialize_rows(svc.listar_categorias()),
        subcategorias=serialize_rows(svc.listar_subcategorias()),
    )


# ---------------- carta ----------------
@handle_errors
def crear_plato():
    return ok("Plato creado correctamente.", 201, id_carta=svc.crear_plato(_parse_plato(_body())))


@handle_errors
def actualizar_plato(id_carta):
    svc.actualizar_plato(id_carta, _parse_plato(_body()))
    return ok("Plato actualizado correctamente.")


@handle_errors
def eliminar_plato(id_carta):
    svc.eliminar_plato(id_carta)
    return ok("Plato eliminado correctamente.")


# ---------------- categorías ----------------
@handle_errors
def crear_categoria():
    return ok("Categoría creada correctamente.", 201, id_categoria=svc.crear_categoria(_parse_categoria(_body())))


@handle_errors
def actualizar_categoria(id_categoria):
    svc.actualizar_categoria(id_categoria, _parse_categoria(_body()))
    return ok("Categoría actualizada correctamente.")


@handle_errors
def eliminar_categoria(id_categoria):
    svc.eliminar_categoria(id_categoria)
    return ok("Categoría eliminada correctamente.")


# ---------------- subcategorías ----------------
@handle_errors
def crear_subcategoria():
    return ok("Subcategoría creada correctamente.", 201, id_subcat=svc.crear_subcategoria(_parse_subcategoria(_body())))


@handle_errors
def actualizar_subcategoria(id_subcat):
    svc.actualizar_subcategoria(id_subcat, _parse_subcategoria(_body()))
    return ok("Subcategoría actualizada correctamente.")


@handle_errors
def eliminar_subcategoria(id_subcat):
    svc.eliminar_subcategoria(id_subcat)
    return ok("Subcategoría eliminada correctamente.")
