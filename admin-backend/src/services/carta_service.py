# src/services/carta_service.py
# Consultas SQL y reglas de negocio de la página Carta (carta, categorías, subcategorías).
from database import run_query
from src.utils.errors import AppError


# =====================================================================
# SELECT de la carga inicial (se ejecutan UNA vez al abrir la página)
# =====================================================================
def listar_carta():
    return run_query("""
        SELECT c.id_carta, c.categoria, cat.nombre_cat AS nombre_categoria,
               c.sub_categoria, sc.nombre_subcat AS nombre_subcategoria,
               c.nombre, c.grupo, c.abreviado, c.precio, c.puntos_canje,
               c.estado, c.disponible, c.porcion, c.unidad_medida, c.observacion, c.url_imagen
        FROM public.carta c
        INNER JOIN public.categorias     cat ON cat.id_categoria = c.categoria
        INNER JOIN public.sub_categorias sc  ON sc.id_subcat     = c.sub_categoria
        ORDER BY c.id_carta
    """)


def listar_categorias():
    return run_query("""
        SELECT c.id_categoria, c.nombre_cat, c.descripcion,
               (SELECT COUNT(*) FROM public.sub_categorias s WHERE s.categoria = c.id_categoria) AS n_subcategorias,
               (SELECT COUNT(*) FROM public.carta x         WHERE x.categoria  = c.id_categoria) AS n_platos
        FROM public.categorias c
        ORDER BY c.id_categoria
    """)


def listar_subcategorias():
    return run_query("""
        SELECT s.id_subcat, s.nombre_subcat, s.descripcion, s.categoria,
               cat.nombre_cat AS nombre_categoria,
               (SELECT COUNT(*) FROM public.carta x WHERE x.sub_categoria = s.id_subcat) AS n_platos
        FROM public.sub_categorias s
        LEFT JOIN public.categorias cat ON cat.id_categoria = s.categoria
        ORDER BY s.id_subcat
    """)


# =====================================================================
# Helpers
# =====================================================================
def _uno(sql, params):
    return run_query(sql, params, fetch="one")


def _lista(partes):
    return partes[0] if len(partes) == 1 else ", ".join(partes[:-1]) + " y " + partes[-1]


def _check_categoria_existe(id_categoria):
    if not _uno("SELECT 1 AS ok FROM public.categorias WHERE id_categoria = %s", (id_categoria,)):
        raise AppError("La categoría no existe.", 404)


def _get_subcategoria(id_subcat):
    s = _uno("SELECT id_subcat, categoria FROM public.sub_categorias WHERE id_subcat = %s", (id_subcat,))
    if not s:
        raise AppError("La subcategoría no existe.", 404)
    return s


# =====================================================================
# CARTA (platos)
# =====================================================================
_PLATO_COLS = ("categoria", "sub_categoria", "nombre", "grupo", "abreviado", "precio", "puntos_canje",
               "estado", "disponible", "porcion", "unidad_medida", "observacion", "url_imagen")


def _validar_plato(d):
    _check_categoria_existe(d["categoria"])
    sub = _get_subcategoria(d["sub_categoria"])
    if sub["categoria"] is not None and sub["categoria"] != d["categoria"]:
        raise AppError("La subcategoría seleccionada no pertenece a la categoría elegida.")


def crear_plato(d):
    _validar_plato(d)
    row = run_query(
        """
        INSERT INTO public.carta
            (categoria, sub_categoria, nombre, grupo, abreviado, precio, puntos_canje,
             estado, disponible, porcion, unidad_medida, observacion, url_imagen)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id_carta
        """,
        tuple(d[c] for c in _PLATO_COLS),
        fetch="one",
    )
    return row["id_carta"]


def actualizar_plato(id_carta, d):
    if not _uno("SELECT 1 AS ok FROM public.carta WHERE id_carta = %s", (id_carta,)):
        raise AppError("El plato no existe.", 404)
    _validar_plato(d)
    run_query(
        """
        UPDATE public.carta
        SET categoria = %s, sub_categoria = %s, nombre = %s, grupo = %s, abreviado = %s, precio = %s,
            puntos_canje = %s, estado = %s, disponible = %s, porcion = %s, unidad_medida = %s,
            observacion = %s, url_imagen = %s
        WHERE id_carta = %s
        """,
        tuple(d[c] for c in _PLATO_COLS) + (id_carta,),
        fetch=None,
    )


def eliminar_plato(id_carta):
    if not _uno("SELECT 1 AS ok FROM public.carta WHERE id_carta = %s", (id_carta,)):
        raise AppError("El plato no existe.", 404)
    # Si otra tabla referencia al plato, el error de clave foránea se informa en el toast
    run_query("DELETE FROM public.carta WHERE id_carta = %s", (id_carta,), fetch=None)


# =====================================================================
# CATEGORÍAS
# =====================================================================
def _check_nombre_categoria_libre(nombre, excluir_id=None):
    if _uno(
        "SELECT id_categoria FROM public.categorias WHERE LOWER(nombre_cat) = LOWER(%s) "
        "AND id_categoria IS DISTINCT FROM %s LIMIT 1",
        (nombre, excluir_id),
    ):
        raise AppError("Ya existe una categoría con ese nombre.", 409)


def crear_categoria(d):
    _check_nombre_categoria_libre(d["nombre_cat"])
    row = run_query(
        "INSERT INTO public.categorias (nombre_cat, descripcion) VALUES (%s, %s) RETURNING id_categoria",
        (d["nombre_cat"], d["descripcion"]),
        fetch="one",
    )
    return row["id_categoria"]


def actualizar_categoria(id_categoria, d):
    _check_categoria_existe(id_categoria)
    _check_nombre_categoria_libre(d["nombre_cat"], excluir_id=id_categoria)
    run_query(
        "UPDATE public.categorias SET nombre_cat = %s, descripcion = %s WHERE id_categoria = %s",
        (d["nombre_cat"], d["descripcion"], id_categoria),
        fetch=None,
    )


def eliminar_categoria(id_categoria):
    _check_categoria_existe(id_categoria)
    c = _uno(
        """
        SELECT (SELECT COUNT(*) FROM public.sub_categorias WHERE categoria = %s) AS subcategorias,
               (SELECT COUNT(*) FROM public.carta          WHERE categoria = %s) AS platos
        """,
        (id_categoria, id_categoria),
    )
    partes = []
    if c["subcategorias"]:
        partes.append(f"{c['subcategorias']} subcategoría(s)")
    if c["platos"]:
        partes.append(f"{c['platos']} plato(s)")
    if partes:
        raise AppError(
            f"No se puede eliminar: la categoría tiene {_lista(partes)} asociado(s). "
            "Elimínalos o reasígnalos primero.", 409)

    # La BD borraría las subcategorías en cascada: este DELETE solo procede si no hay ninguna
    borrados = run_query(
        """
        DELETE FROM public.categorias
        WHERE id_categoria = %s
          AND NOT EXISTS (SELECT 1 FROM public.sub_categorias WHERE categoria = %s)
          AND NOT EXISTS (SELECT 1 FROM public.carta          WHERE categoria = %s)
        """,
        (id_categoria, id_categoria, id_categoria),
        fetch=None,
    )
    if not borrados:
        raise AppError("No se pudo eliminar: la categoría está relacionada con otros datos.", 409)


# =====================================================================
# SUBCATEGORÍAS
# =====================================================================
def _check_nombre_subcat_libre(id_categoria, nombre, excluir_id=None):
    if _uno(
        "SELECT id_subcat FROM public.sub_categorias WHERE categoria = %s AND LOWER(nombre_subcat) = LOWER(%s) "
        "AND id_subcat IS DISTINCT FROM %s LIMIT 1",
        (id_categoria, nombre, excluir_id),
    ):
        raise AppError("Ya existe una subcategoría con ese nombre en la categoría seleccionada.", 409)


def crear_subcategoria(d):
    _check_categoria_existe(d["categoria"])
    _check_nombre_subcat_libre(d["categoria"], d["nombre_subcat"])
    row = run_query(
        "INSERT INTO public.sub_categorias (nombre_subcat, descripcion, categoria) VALUES (%s, %s, %s) RETURNING id_subcat",
        (d["nombre_subcat"], d["descripcion"], d["categoria"]),
        fetch="one",
    )
    return row["id_subcat"]


def actualizar_subcategoria(id_subcat, d):
    actual = _get_subcategoria(id_subcat)
    _check_categoria_existe(d["categoria"])
    _check_nombre_subcat_libre(d["categoria"], d["nombre_subcat"], excluir_id=id_subcat)
    if d["categoria"] != actual["categoria"]:
        n = _uno("SELECT COUNT(*) AS n FROM public.carta WHERE sub_categoria = %s", (id_subcat,))["n"]
        if n:
            raise AppError(
                f"No se puede cambiar la categoría: la subcategoría tiene {n} plato(s) asociado(s).", 409)
    run_query(
        "UPDATE public.sub_categorias SET nombre_subcat = %s, descripcion = %s, categoria = %s WHERE id_subcat = %s",
        (d["nombre_subcat"], d["descripcion"], d["categoria"], id_subcat),
        fetch=None,
    )


def eliminar_subcategoria(id_subcat):
    _get_subcategoria(id_subcat)
    n = _uno("SELECT COUNT(*) AS n FROM public.carta WHERE sub_categoria = %s", (id_subcat,))["n"]
    if n:
        raise AppError(f"No se puede eliminar: la subcategoría tiene {n} plato(s) asociado(s).", 409)
    borrados = run_query(
        """
        DELETE FROM public.sub_categorias
        WHERE id_subcat = %s AND NOT EXISTS (SELECT 1 FROM public.carta WHERE sub_categoria = %s)
        """,
        (id_subcat, id_subcat),
        fetch=None,
    )
    if not borrados:
        raise AppError("No se pudo eliminar: la subcategoría está relacionada con otros datos.", 409)
