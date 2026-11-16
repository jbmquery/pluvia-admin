# src/services/usuarios_service.py
# Consultas SQL y reglas de negocio de la página Usuarios (usuarios, empleados, niveles).
import config
from database import run_query
from src.utils.errors import AppError
from src.utils.security_utils import hash_password

NOMBRE_COMPLETO_SQL = "u.nombres || ' ' || u.ape_paterno || ' ' || u.ape_materno"


# =====================================================================
# SELECT de la carga inicial (se ejecutan UNA vez al abrir la página)
# =====================================================================
def listar_usuarios():
    return run_query(f"""
        SELECT u.id_usuario, u.nombres, u.ape_paterno, u.ape_materno,
               {NOMBRE_COMPLETO_SQL} AS nombres_completos,
               u.apodo, u.correo, u.tipo_usuario, n.nombre AS nivel_nombre,
               u.estado, u.fecha_creacion, u.celular, u.fecha_nacimiento, u.fecha_contratacion
        FROM public.usuarios u
        LEFT JOIN public.niveles_usuarios n ON n.id_tipo_usuario = u.tipo_usuario
        ORDER BY u.id_usuario
    """)


def listar_empleados():
    return run_query(f"""
        SELECT e.id_empleado, e.id_usuario,
               {NOMBRE_COMPLETO_SQL} AS nombres_completos,
               e.id_sede, s.nombre_sede, e.sueldo, e.tipo_contrato,
               e.fecha_inicio, e.fecha_fin, e.estado,
               e.tipo_usuario, n.nombre AS nivel_nombre,
               e.observacion, e.turno_referencia
        FROM public.empleados e
        INNER JOIN public.usuarios u ON u.id_usuario = e.id_usuario
        LEFT JOIN public.sedes s ON s.id_sede = e.id_sede
        LEFT JOIN public.niveles_usuarios n ON n.id_tipo_usuario = e.tipo_usuario
        ORDER BY e.id_empleado
    """)


def listar_niveles():
    return run_query("""
        SELECT id_tipo_usuario, nombre, descripcion
        FROM public.niveles_usuarios
        ORDER BY id_tipo_usuario
    """)


def listar_sedes():
    return run_query("""
        SELECT id_sede, nombre_sede, estado
        FROM public.sedes
        ORDER BY nombre_sede
    """)


# =====================================================================
# Helpers y permisos
# =====================================================================
def _uno(sql, params):
    return run_query(sql, params, fetch="one")


def _get_usuario(id_usuario):
    u = _uno("SELECT id_usuario, tipo_usuario, estado FROM public.usuarios WHERE id_usuario = %s", (id_usuario,))
    if not u:
        raise AppError("El usuario no existe.", 404)
    return u


def _check_nivel_existe(id_nivel):
    if not _uno("SELECT 1 AS ok FROM public.niveles_usuarios WHERE id_tipo_usuario = %s", (id_nivel,)):
        raise AppError("El nivel seleccionado no existe.")


def _check_sede_existe(id_sede):
    if not _uno("SELECT 1 AS ok FROM public.sedes WHERE id_sede = %s", (id_sede,)):
        raise AppError("La sede seleccionada no existe.")


def _check_nivel_permitido(actor, id_nivel):
    if id_nivel > actor["tipo_usuario"]:
        raise AppError("No puedes asignar un nivel superior al tuyo.", 403)


def _check_puede_gestionar(actor, usuario):
    if usuario["tipo_usuario"] > actor["tipo_usuario"]:
        raise AppError("No puedes gestionar a un usuario de nivel superior al tuyo.", 403)


def _check_correo_libre(correo, excluir_id=None):
    if _uno(
        "SELECT id_usuario FROM public.usuarios WHERE LOWER(correo) = LOWER(%s) AND id_usuario IS DISTINCT FROM %s",
        (correo, excluir_id),
    ):
        raise AppError("Ya existe un usuario con ese correo.", 409)


# =====================================================================
# USUARIOS
# =====================================================================
def crear_usuario(actor, d):
    _check_nivel_existe(d["tipo_usuario"])
    _check_nivel_permitido(actor, d["tipo_usuario"])
    _check_correo_libre(d["correo"])

    row = run_query(
        """
        INSERT INTO public.usuarios
            (nombres, ape_paterno, ape_materno, apodo, correo, pass_encrip, tipo_usuario,
             estado, fecha_creacion, celular, fecha_nacimiento, fecha_contratacion)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_DATE, %s, %s, %s)
        RETURNING id_usuario
        """,
        (d["nombres"], d["ape_paterno"], d["ape_materno"], d["apodo"], d["correo"],
         hash_password(config.DEFAULT_USER_PASSWORD), d["tipo_usuario"], d["estado"],
         d["celular"], d["fecha_nacimiento"], d["fecha_contratacion"]),
        fetch="one",
        sensitive=(5,),  # oculta solo el hash en la consola
    )
    return row["id_usuario"]


def actualizar_usuario(actor, id_usuario, d):
    actual = _get_usuario(id_usuario)
    _check_puede_gestionar(actor, actual)
    _check_nivel_existe(d["tipo_usuario"])
    _check_nivel_permitido(actor, d["tipo_usuario"])
    if id_usuario == actor["id_usuario"] and (
        d["estado"] != actual["estado"] or d["tipo_usuario"] != actual["tipo_usuario"]
    ):
        raise AppError("No puedes cambiar tu propio estado ni tu propio nivel.", 403)
    _check_correo_libre(d["correo"], excluir_id=id_usuario)

    run_query(
        """
        UPDATE public.usuarios
        SET nombres = %s, ape_paterno = %s, ape_materno = %s, apodo = %s, correo = %s,
            tipo_usuario = %s, estado = %s, celular = %s, fecha_nacimiento = %s, fecha_contratacion = %s
        WHERE id_usuario = %s
        """,
        (d["nombres"], d["ape_paterno"], d["ape_materno"], d["apodo"], d["correo"],
         d["tipo_usuario"], d["estado"], d["celular"], d["fecha_nacimiento"],
         d["fecha_contratacion"], id_usuario),
        fetch=None,
    )


def eliminar_usuario(actor, id_usuario):
    actual = _get_usuario(id_usuario)
    if id_usuario == actor["id_usuario"]:
        raise AppError("No puedes eliminar tu propio usuario.", 403)
    _check_puede_gestionar(actor, actual)

    n = _uno("SELECT COUNT(*) AS n FROM public.empleados WHERE id_usuario = %s", (id_usuario,))["n"]
    if n:
        raise AppError(
            f"No se puede eliminar: el usuario tiene {n} registro(s) de empleado asociado(s). "
            "Elimínalos primero en la pestaña Empleados.", 409)

    n_asis = _uno("SELECT COUNT(*) AS n FROM public.asistencias WHERE id_usuario = %s", (id_usuario,))["n"]
    if n_asis:
        raise AppError(f"No se puede eliminar: el usuario tiene {n_asis} asistencia(s) registrada(s).", 409)

    borrados = run_query(
        """
        DELETE FROM public.usuarios
        WHERE id_usuario = %s
          AND NOT EXISTS (SELECT 1 FROM public.empleados WHERE id_usuario = %s)
          AND NOT EXISTS (SELECT 1 FROM public.asistencias WHERE id_usuario = %s)
        """,
        (id_usuario, id_usuario, id_usuario),
        fetch=None,
    )
    if not borrados:
        raise AppError("No se pudo eliminar: el usuario está relacionado con otros datos.", 409)


def restablecer_password(actor, id_usuario):
    actual = _get_usuario(id_usuario)
    if id_usuario == actor["id_usuario"]:
        raise AppError("Para cambiar tu propia contraseña usa «Restaurar contraseña» en el login.", 403)
    _check_puede_gestionar(actor, actual)

    run_query(
        "UPDATE public.usuarios SET pass_encrip = %s WHERE id_usuario = %s",
        (hash_password(config.DEFAULT_USER_PASSWORD), id_usuario),
        fetch=None,
        sensitive=True,
    )


# =====================================================================
# EMPLEADOS
# =====================================================================
def _validar_empleado(actor, d):
    usuario = _uno("SELECT id_usuario, tipo_usuario FROM public.usuarios WHERE id_usuario = %s", (d["id_usuario"],))
    if not usuario:
        raise AppError("El usuario seleccionado no existe.")
    _check_puede_gestionar(actor, usuario)
    if d["id_sede"] is not None:
        _check_sede_existe(d["id_sede"])
    if d["tipo_usuario"] is not None:
        _check_nivel_existe(d["tipo_usuario"])
        _check_nivel_permitido(actor, d["tipo_usuario"])
    if d["fecha_fin"] and d["fecha_fin"] < d["fecha_inicio"]:
        raise AppError("La fecha fin no puede ser anterior a la fecha de inicio.")


def _get_empleado(actor, id_empleado):
    e = _uno(
        """
        SELECT e.id_empleado, u.tipo_usuario
        FROM public.empleados e
        INNER JOIN public.usuarios u ON u.id_usuario = e.id_usuario
        WHERE e.id_empleado = %s
        """,
        (id_empleado,),
    )
    if not e:
        raise AppError("El empleado no existe.", 404)
    _check_puede_gestionar(actor, e)
    return e


_EMP_COLS = ("id_usuario", "id_sede", "sueldo", "tipo_contrato", "fecha_inicio",
             "fecha_fin", "estado", "tipo_usuario", "observacion", "turno_referencia")


def crear_empleado(actor, d):
    _validar_empleado(actor, d)
    row = run_query(
        """
        INSERT INTO public.empleados
            (id_usuario, id_sede, sueldo, tipo_contrato, fecha_inicio, fecha_fin,
             estado, tipo_usuario, observacion, turno_referencia)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id_empleado
        """,
        tuple(d[c] for c in _EMP_COLS),
        fetch="one",
    )
    return row["id_empleado"]


def actualizar_empleado(actor, id_empleado, d):
    _get_empleado(actor, id_empleado)
    _validar_empleado(actor, d)
    run_query(
        """
        UPDATE public.empleados
        SET id_usuario = %s, id_sede = %s, sueldo = %s, tipo_contrato = %s, fecha_inicio = %s,
            fecha_fin = %s, estado = %s, tipo_usuario = %s, observacion = %s, turno_referencia = %s
        WHERE id_empleado = %s
        """,
        tuple(d[c] for c in _EMP_COLS) + (id_empleado,),
        fetch=None,
    )


def eliminar_empleado(actor, id_empleado):
    _get_empleado(actor, id_empleado)
    run_query("DELETE FROM public.empleados WHERE id_empleado = %s", (id_empleado,), fetch=None)


# =====================================================================
# NIVELES
# =====================================================================
def _check_nivel_gestionable(actor, id_nivel, accion):
    if id_nivel > actor["tipo_usuario"]:
        raise AppError(f"No puedes {accion} un nivel superior al tuyo.", 403)


def crear_nivel(actor, d):
    _check_nivel_gestionable(actor, d["id_tipo_usuario"], "crear")
    if _uno("SELECT 1 AS ok FROM public.niveles_usuarios WHERE id_tipo_usuario = %s", (d["id_tipo_usuario"],)):
        raise AppError(f"Ya existe un nivel con el ID {d['id_tipo_usuario']}.", 409)
    run_query(
        "INSERT INTO public.niveles_usuarios (id_tipo_usuario, nombre, descripcion) VALUES (%s, %s, %s)",
        (d["id_tipo_usuario"], d["nombre"], d["descripcion"]),
        fetch=None,
    )


def actualizar_nivel(actor, id_nivel, d):
    _check_nivel_existe(id_nivel)
    _check_nivel_gestionable(actor, id_nivel, "editar")
    run_query(
        "UPDATE public.niveles_usuarios SET nombre = %s, descripcion = %s WHERE id_tipo_usuario = %s",
        (d["nombre"], d["descripcion"], id_nivel),
        fetch=None,
    )


def eliminar_nivel(actor, id_nivel):
    _check_nivel_existe(id_nivel)
    _check_nivel_gestionable(actor, id_nivel, "eliminar")

    n_usu = _uno("SELECT COUNT(*) AS n FROM public.usuarios WHERE tipo_usuario = %s", (id_nivel,))["n"]
    n_emp = _uno("SELECT COUNT(*) AS n FROM public.empleados WHERE tipo_usuario = %s", (id_nivel,))["n"]
    motivos = []
    if n_usu:
        motivos.append(f"{n_usu} usuario(s)")
    if n_emp:
        motivos.append(f"{n_emp} empleado(s)")
    if motivos:
        raise AppError(f"No se puede eliminar: el nivel está asignado a {' y '.join(motivos)}.", 409)

    run_query("DELETE FROM public.niveles_usuarios WHERE id_tipo_usuario = %s", (id_nivel,), fetch=None)
