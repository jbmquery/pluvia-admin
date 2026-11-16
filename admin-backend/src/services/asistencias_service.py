# src/services/asistencias_service.py
# Consultas SQL y reglas de negocio de la página Asistencias.
from datetime import date

from database import run_query
from src.utils.errors import AppError

ESTADOS = (
    "puntual", "tarde", "falta", "justificado", "vacaciones",
    "licencia con goce", "licencia sin goce",
)

MSG_SALIDA = "Corrección del sistema - no marcó su salida"
MSG_FALTA = "Corrección del sistema - el usuario faltó"

MAX_PERIODOS = 60


# =====================================================================
# Cálculo de minutos (en SQL)
#   diferencia en segundos -> se normaliza a [-12 h, +12 h) para soportar turnos que cruzan
#   la medianoche -> minutos enteros hacia abajo -> nunca negativos
# =====================================================================
def _minutos(diff_segundos_sql):
    return (
        "GREATEST(0, FLOOR((MOD(MOD((" + diff_segundos_sql + ")::numeric + 43200, 86400) + 86400, 86400)"
        " - 43200) / 60))::int"
    )


MINUTOS_TARDANZA = (
    "CASE WHEN a.hora_entrada_real IS NULL THEN NULL ELSE "
    + _minutos("EXTRACT(EPOCH FROM (a.hora_entrada_real - t.hora_inicio)) - COALESCE(t.tolerancia_minutos, 0) * 60")
    + " END AS minutos_tardanza"
)
MINUTOS_EXTRAS = (
    "CASE WHEN a.hora_salida_real IS NULL THEN NULL ELSE "
    + _minutos("EXTRACT(EPOCH FROM (a.hora_salida_real - t.hora_fin))")
    + " END AS minutos_extras"
)

SELECT_ASISTENCIAS = f"""
    SELECT a.id_asistencia, a.id_usuario, u.apodo,
           u.nombres || ' ' || u.ape_paterno || ' ' || u.ape_materno AS nombres_completos,
           u.tipo_usuario AS usuario_tipo,
           a.id_sede, s.nombre_sede, a.id_turno, t.nombre_turno, a.fecha,
           a.hora_entrada_horario, a.hora_salida_horario,
           a.hora_entrada_real, a.hora_salida_real,
           a.estado_asistencia, a.observacion,
           {MINUTOS_TARDANZA},
           {MINUTOS_EXTRAS}
    FROM public.asistencias a
    INNER JOIN public.usuarios u ON u.id_usuario = a.id_usuario
    INNER JOIN public.sedes    s ON s.id_sede    = a.id_sede
    INNER JOIN public.turnos   t ON t.id_turno   = a.id_turno
"""


def _uno(sql, params):
    return run_query(sql, params, fetch="one")


def _rango_mes(anio, mes):
    ini = date(anio, mes, 1)
    fin = date(anio + 1, 1, 1) if mes == 12 else date(anio, mes + 1, 1)
    return ini, fin


# =====================================================================
# Carga de datos
# =====================================================================
def listar_asistencias(periodos):
    """periodos: lista de (anio, mes). Orden: id_usuario DESC, fecha DESC."""
    if not periodos:
        raise AppError("Selecciona al menos un mes y un año.")
    if len(periodos) > MAX_PERIODOS:
        raise AppError(f"Demasiados períodos seleccionados (máximo {MAX_PERIODOS} combinaciones de mes y año).")
    cond, params = [], []
    for anio, mes in periodos:
        ini, fin = _rango_mes(anio, mes)
        cond.append("(a.fecha >= %s AND a.fecha < %s)")
        params += [ini, fin]
    sql = (
        SELECT_ASISTENCIAS
        + " WHERE " + " OR ".join(cond)
        + " ORDER BY a.id_usuario DESC, a.fecha DESC, a.id_turno DESC"
    )
    return run_query(sql, tuple(params))


def datos_iniciales():
    hoy = _uno(
        "SELECT CURRENT_DATE AS hoy, EXTRACT(YEAR FROM CURRENT_DATE)::int AS anio, "
        "EXTRACT(MONTH FROM CURRENT_DATE)::int AS mes", None)
    rango = _uno("SELECT MIN(fecha) AS minimo, MAX(fecha) AS maximo FROM public.asistencias", None)

    anio_min = min(rango["minimo"].year, hoy["anio"]) if rango["minimo"] else hoy["anio"]
    anio_max = max(rango["maximo"].year, hoy["anio"]) if rango["maximo"] else hoy["anio"]

    usuarios = run_query("""
        SELECT u.id_usuario, u.apodo,
               u.nombres || ' ' || u.ape_paterno || ' ' || u.ape_materno AS nombres_completos,
               u.tipo_usuario, u.estado
        FROM public.usuarios u
        WHERE EXISTS (SELECT 1 FROM public.asistencias a WHERE a.id_usuario = u.id_usuario)
           OR EXISTS (SELECT 1 FROM public.empleados   e WHERE e.id_usuario = u.id_usuario)
        ORDER BY nombres_completos
    """)
    sedes = run_query("SELECT id_sede, nombre_sede, estado FROM public.sedes ORDER BY nombre_sede")
    turnos = run_query("""
        SELECT t.id_turno, t.id_sede, s.nombre_sede, t.nombre_turno, t.hora_inicio, t.hora_fin, t.estado
        FROM public.turnos t
        INNER JOIN public.sedes s ON s.id_sede = t.id_sede
        ORDER BY s.nombre_sede, t.hora_inicio
    """)
    asistencias = listar_asistencias([(hoy["anio"], hoy["mes"])])
    return {
        "hoy": hoy["hoy"],
        "mes": hoy["mes"],
        "anio": hoy["anio"],
        "anios": list(range(anio_max, anio_min - 1, -1)),
        "usuarios": usuarios,
        "sedes": sedes,
        "turnos": turnos,
        "asistencias": asistencias,
    }


# =====================================================================
# Faltas: días del mes (hasta ayer) en que el usuario no tiene NINGUNA fila
# =====================================================================
def listar_faltas(actor, mes, anio, ids_usuarios):
    if not ids_usuarios:
        raise AppError("Selecciona al menos un usuario.")
    ini, fin_exclusivo = _rango_mes(anio, mes)
    candidatas = run_query(
        """
        SELECT u.id_usuario, u.apodo,
               u.nombres || ' ' || u.ape_paterno || ' ' || u.ape_materno AS nombres_completos,
               d.fecha
        FROM public.usuarios u
        CROSS JOIN LATERAL (
            SELECT (%s::date + g.n) AS fecha
            FROM generate_series(0, GREATEST(LEAST(%s::date - 1, CURRENT_DATE - 1) - %s::date, -1)) AS g(n)
        ) d
        WHERE u.id_usuario = ANY(%s)
          AND u.tipo_usuario <= %s
          AND NOT EXISTS (SELECT 1 FROM public.asistencias a
                          WHERE a.id_usuario = u.id_usuario AND a.fecha = d.fecha)
          AND (
                NOT EXISTS (SELECT 1 FROM public.empleados e WHERE e.id_usuario = u.id_usuario)
                OR EXISTS (SELECT 1 FROM public.empleados e
                           WHERE e.id_usuario = u.id_usuario
                             AND e.fecha_inicio <= d.fecha
                             AND (e.fecha_fin IS NULL OR e.fecha_fin >= d.fecha))
              )
        ORDER BY u.apodo, d.fecha DESC
        """,
        (ini, fin_exclusivo, ini, list(ids_usuarios), actor["tipo_usuario"]),
    )
    if not candidatas:
        return []

    # Sugerencia de sede+turno: el más usado ese día de la semana en los últimos 3 meses
    m0 = mes - 3
    a0 = anio
    while m0 < 1:
        m0 += 12
        a0 -= 1
    hist = run_query(
        """
        SELECT a.id_usuario, EXTRACT(ISODOW FROM a.fecha)::int AS dow, a.id_sede, a.id_turno,
               COUNT(*) AS n, MAX(a.fecha) AS ultima
        FROM public.asistencias a
        WHERE a.id_usuario = ANY(%s) AND a.fecha >= %s AND a.fecha < %s
        GROUP BY a.id_usuario, dow, a.id_sede, a.id_turno
        """,
        (list(ids_usuarios), date(a0, m0, 1), fin_exclusivo),
    )
    por_dia, por_usuario = {}, {}
    for h in hist:
        clave = (h["id_usuario"], h["dow"])
        mejor = por_dia.get(clave)
        if mejor is None or (h["n"], h["ultima"]) > (mejor["n"], mejor["ultima"]):
            por_dia[clave] = h
        total = por_usuario.setdefault(h["id_usuario"], {})
        k = (h["id_sede"], h["id_turno"])
        t = total.setdefault(k, {"n": 0, "ultima": h["ultima"]})
        t["n"] += h["n"]
        t["ultima"] = max(t["ultima"], h["ultima"])

    resultado = []
    for c in candidatas:
        dow = c["fecha"].isoweekday()
        sug = por_dia.get((c["id_usuario"], dow))
        id_sede = id_turno = None
        if sug:
            id_sede, id_turno = sug["id_sede"], sug["id_turno"]
        elif c["id_usuario"] in por_usuario:
            (id_sede, id_turno), _ = max(por_usuario[c["id_usuario"]].items(),
                                         key=lambda kv: (kv[1]["n"], kv[1]["ultima"]))
        resultado.append({**c, "id_sede": id_sede, "id_turno": id_turno})
    return resultado


# =====================================================================
# Aplicar correcciones (el servidor vuelve a validar todo)
# =====================================================================
def corregir(actor, ids_salidas, faltas):
    nivel = actor["tipo_usuario"]
    salidas_ok = 0
    faltas_ok = 0

    if ids_salidas:
        salidas_ok = run_query(
            """
            UPDATE public.asistencias a
            SET hora_salida_real = t.hora_fin,
                observacion = LEFT(
                    CASE WHEN COALESCE(a.observacion, '') = '' THEN %s
                         ELSE a.observacion || ' | ' || %s END, 255)
            FROM public.turnos t, public.usuarios u
            WHERE t.id_turno = a.id_turno
              AND u.id_usuario = a.id_usuario
              AND u.tipo_usuario <= %s
              AND a.id_asistencia = ANY(%s)
              AND a.hora_entrada_real IS NOT NULL
              AND a.hora_salida_real IS NULL
              AND a.fecha < CURRENT_DATE
            """,
            (MSG_SALIDA, MSG_SALIDA, nivel, list(ids_salidas)),
            fetch=None,
        )

    if faltas:
        faltas_ok = run_query(
            """
            INSERT INTO public.asistencias
                (id_usuario, id_sede, id_turno, fecha, hora_entrada_real, hora_salida_real,
                 estado_asistencia, observacion, hora_entrada_horario, hora_salida_horario)
            SELECT x.id_usuario, t.id_sede, t.id_turno, x.fecha, NULL, NULL,
                   'falta', %s, t.hora_inicio, t.hora_fin
            FROM unnest(%s::bigint[], %s::bigint[], %s::bigint[], %s::date[])
                 AS x(id_usuario, id_sede, id_turno, fecha)
            INNER JOIN public.turnos   t ON t.id_turno = x.id_turno AND t.id_sede = x.id_sede
            INNER JOIN public.usuarios u ON u.id_usuario = x.id_usuario AND u.tipo_usuario <= %s
            WHERE x.fecha < CURRENT_DATE
              AND NOT EXISTS (SELECT 1 FROM public.asistencias a
                              WHERE a.id_usuario = x.id_usuario AND a.fecha = x.fecha)
            """,
            (
                MSG_FALTA,
                [f["id_usuario"] for f in faltas],
                [f["id_sede"] for f in faltas],
                [f["id_turno"] for f in faltas],
                [f["fecha"].isoformat() for f in faltas],
                nivel,
            ),
            fetch=None,
        )

    return {
        "salidas": salidas_ok,
        "faltas": faltas_ok,
        "omitidos": (len(ids_salidas) - salidas_ok) + (len(faltas) - faltas_ok),
    }


# =====================================================================
# Editar una asistencia (id_asistencia e id_usuario no se pueden cambiar)
# =====================================================================
def actualizar_asistencia(actor, id_asistencia, d):
    actual = _uno(
        """
        SELECT a.id_asistencia, u.tipo_usuario
        FROM public.asistencias a
        INNER JOIN public.usuarios u ON u.id_usuario = a.id_usuario
        WHERE a.id_asistencia = %s
        """,
        (id_asistencia,),
    )
    if not actual:
        raise AppError("La asistencia no existe.", 404)
    if actual["tipo_usuario"] > actor["tipo_usuario"]:
        raise AppError("No puedes gestionar la asistencia de un usuario de nivel superior al tuyo.", 403)

    turno = _uno("SELECT id_sede FROM public.turnos WHERE id_turno = %s", (d["id_turno"],))
    if not turno:
        raise AppError("El turno seleccionado no existe.")
    if turno["id_sede"] != d["id_sede"]:
        raise AppError("El turno seleccionado no pertenece a la sede elegida.")

    run_query(
        """
        UPDATE public.asistencias
        SET id_sede = %s, id_turno = %s, fecha = %s,
            hora_entrada_horario = %s, hora_salida_horario = %s,
            hora_entrada_real = %s, hora_salida_real = %s,
            estado_asistencia = %s, observacion = %s
        WHERE id_asistencia = %s
        """,
        (d["id_sede"], d["id_turno"], d["fecha"],
         d["hora_entrada_horario"], d["hora_salida_horario"],
         d["hora_entrada_real"], d["hora_salida_real"],
         d["estado_asistencia"], d["observacion"], id_asistencia),
        fetch=None,
    )
