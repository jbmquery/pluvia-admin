# src/utils/errors.py
import traceback
from functools import wraps

import psycopg2.errors as pg_errors

from src.utils.response_utils import fail


# restricción de clave primaria -> (tabla, script SQL que sincroniza su secuencia)
SECUENCIAS = {
    "usuarios_pkey": ("usuarios", "002_sincronizar_secuencias.sql"),
    "empleados_pkey": ("empleados", "002_sincronizar_secuencias.sql"),
    "sedes_pkey": ("sedes", "003_sincronizar_secuencias_sedes_turnos.sql"),
    "turnos_pkey": ("turnos", "003_sincronizar_secuencias_sedes_turnos.sql"),
}


class AppError(Exception):
    """Error controlado: el mensaje se muestra tal cual al usuario (toast)."""

    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


def handle_errors(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        try:
            return view(*args, **kwargs)
        except AppError as e:
            return fail(e.message, e.status)
        except pg_errors.ForeignKeyViolation:
            return fail("No se pudo completar la operación: el registro está relacionado con otros datos.", 409)
        except pg_errors.UniqueViolation as ex:
            name = getattr(ex.diag, "constraint_name", None)
            print(f"[DB] UniqueViolation en la restricción: {name} -> {ex.diag.message_detail}", flush=True)
            if name in SECUENCIAS:
                tabla, script = SECUENCIAS[name]
                msg = (f"No se pudo generar el ID automático en {tabla}: la secuencia está desfasada respecto a "
                       f"los datos existentes. Ejecuta sql/{script} una vez.")
            elif name == "niveles_usuarios_pkey":
                msg = "Ya existe un nivel con ese ID."
            else:
                msg = f"Ya existe un registro con esos datos (restricción: {name})."
            return fail(msg, 409)
        except pg_errors.NotNullViolation as ex:
            col = getattr(ex.diag, "column_name", None)
            if col == "id_usuario":
                msg = ("id_usuario no es autoincremental en tu base de datos. "
                       "Ejecuta el script sql/001_usuarios_autoincrement.sql una vez.")
            else:
                msg = f"Falta un dato obligatorio ({col})."
            return fail(msg, 400)
        except Exception:
            traceback.print_exc()  # el detalle queda en la consola del servidor
            return fail("Ocurrió un error interno. Revisa la consola del servidor.", 500)

    return wrapper
