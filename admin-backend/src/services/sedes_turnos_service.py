# src/services/sedes_turnos_service.py
# Consultas SQL y reglas de negocio de la página Sedes y Turnos.
from database import run_query
from src.utils.errors import AppError


# =====================================================================
# SELECT de la carga inicial (se ejecutan UNA vez al abrir la página)
# =====================================================================
def listar_sedes():
    return run_query("""
        SELECT s.id_sede, s.nombre_sede, s.direccion, s.latitud, s.longitud,
               s.capacidad, s.estado, s.fecha_creacion, s.tipo_sede,
               (SELECT COUNT(*) FROM public.turnos t WHERE t.id_sede = s.id_sede)    AS n_turnos,
               (SELECT COUNT(*) FROM public.empleados e WHERE e.id_sede = s.id_sede) AS n_empleados
        FROM public.sedes s
        ORDER BY s.id_sede
    """)


def listar_turnos():
    return run_query("""
        SELECT t.id_turno, t.id_sede, s.nombre_sede, t.nombre_turno,
               t.hora_inicio, t.hora_fin, t.tolerancia_minutos, t.estado
        FROM public.turnos t
        INNER JOIN public.sedes s ON s.id_sede = t.id_sede
        ORDER BY t.id_turno
    """)


# =====================================================================
# Helpers
# =====================================================================
def _uno(sql, params):
    return run_query(sql, params, fetch="one")


def _check_sede_existe(id_sede):
    if not _uno("SELECT 1 AS ok FROM public.sedes WHERE id_sede = %s", (id_sede,)):
        raise AppError("La sede no existe.", 404)


def _check_nombre_sede_libre(nombre, excluir_id=None):
    if _uno(
        "SELECT id_sede FROM public.sedes WHERE LOWER(nombre_sede) = LOWER(%s) "
        "AND id_sede IS DISTINCT FROM %s LIMIT 1",
        (nombre, excluir_id),
    ):
        raise AppError("Ya existe una sede con ese nombre.", 409)


def _check_turno_existe(id_turno):
    if not _uno("SELECT 1 AS ok FROM public.turnos WHERE id_turno = %s", (id_turno,)):
        raise AppError("El turno no existe.", 404)


def _check_nombre_turno_libre(id_sede, nombre, excluir_id=None):
    if _uno(
        "SELECT id_turno FROM public.turnos WHERE id_sede = %s AND LOWER(nombre_turno) = LOWER(%s) "
        "AND id_turno IS DISTINCT FROM %s LIMIT 1",
        (id_sede, nombre, excluir_id),
    ):
        raise AppError("Ya existe un turno con ese nombre en la sede seleccionada.", 409)


# =====================================================================
# SEDES
# =====================================================================
_SEDE_COLS = ("nombre_sede", "direccion", "latitud", "longitud", "capacidad", "estado", "tipo_sede")


def crear_sede(d):
    _check_nombre_sede_libre(d["nombre_sede"])
    row = run_query(
        """
        INSERT INTO public.sedes
            (nombre_sede, direccion, latitud, longitud, capacidad, estado, fecha_creacion, tipo_sede)
        VALUES (%s, %s, %s, %s, %s, %s, CURRENT_DATE, %s)
        RETURNING id_sede
        """,
        tuple(d[c] for c in _SEDE_COLS),
        fetch="one",
    )
    return row["id_sede"]


def actualizar_sede(id_sede, d):
    _check_sede_existe(id_sede)
    _check_nombre_sede_libre(d["nombre_sede"], excluir_id=id_sede)
    run_query(
        """
        UPDATE public.sedes
        SET nombre_sede = %s, direccion = %s, latitud = %s, longitud = %s,
            capacidad = %s, estado = %s, tipo_sede = %s
        WHERE id_sede = %s
        """,
        tuple(d[c] for c in _SEDE_COLS) + (id_sede,),
        fetch=None,
    )


def eliminar_sede(id_sede):
    _check_sede_existe(id_sede)
    c = _uno(
        """
        SELECT (SELECT COUNT(*) FROM public.turnos    WHERE id_sede = %s) AS turnos,
               (SELECT COUNT(*) FROM public.empleados WHERE id_sede = %s) AS empleados
        """,
        (id_sede, id_sede),
    )
    partes = []
    if c["turnos"]:
        partes.append(f"{c['turnos']} turno(s)")
    if c["empleados"]:
        partes.append(f"{c['empleados']} empleado(s)")
    if partes:
        raise AppError(
            f"No se puede eliminar: la sede tiene {' y '.join(partes)} asociado(s). "
            "Elimínalos o reasígnalos primero.", 409)

    # La BD borraría turnos y empleados en cascada: este DELETE solo procede si no hay ninguno
    borrados = run_query(
        """
        DELETE FROM public.sedes
        WHERE id_sede = %s
          AND NOT EXISTS (SELECT 1 FROM public.turnos    WHERE id_sede = %s)
          AND NOT EXISTS (SELECT 1 FROM public.empleados WHERE id_sede = %s)
        """,
        (id_sede, id_sede, id_sede),
        fetch=None,
    )
    if not borrados:
        raise AppError("No se pudo eliminar: la sede está relacionada con otros datos.", 409)


# =====================================================================
# TURNOS
# =====================================================================
_TURNO_COLS = ("id_sede", "nombre_turno", "hora_inicio", "hora_fin", "tolerancia_minutos", "estado")


def crear_turno(d):
    _check_sede_existe(d["id_sede"])
    _check_nombre_turno_libre(d["id_sede"], d["nombre_turno"])
    row = run_query(
        """
        INSERT INTO public.turnos (id_sede, nombre_turno, hora_inicio, hora_fin, tolerancia_minutos, estado)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id_turno
        """,
        tuple(d[c] for c in _TURNO_COLS),
        fetch="one",
    )
    return row["id_turno"]


def actualizar_turno(id_turno, d):
    _check_turno_existe(id_turno)
    _check_sede_existe(d["id_sede"])
    _check_nombre_turno_libre(d["id_sede"], d["nombre_turno"], excluir_id=id_turno)
    run_query(
        """
        UPDATE public.turnos
        SET id_sede = %s, nombre_turno = %s, hora_inicio = %s, hora_fin = %s,
            tolerancia_minutos = %s, estado = %s
        WHERE id_turno = %s
        """,
        tuple(d[c] for c in _TURNO_COLS) + (id_turno,),
        fetch=None,
    )


def eliminar_turno(id_turno):
    _check_turno_existe(id_turno)
    run_query("DELETE FROM public.turnos WHERE id_turno = %s", (id_turno,), fetch=None)
