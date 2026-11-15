# database.py
import time
import psycopg2
from psycopg2.extras import RealDictCursor
from config import SHOW_SQL

DB_CONFIG = {
    "host": "localhost",
    "user": "postgres",
    "password": "123",
    "database": "db_servicios"
}


def get_connection():
    try:
        connection = psycopg2.connect(**DB_CONFIG)
        return connection
    except Exception as ex:
        raise Exception(f"Error al conectar a la base de datos: {ex}")


def _log_sql(sql, ms=None, extra=""):
    if not SHOW_SQL:
        return
    one_line = " ".join(sql.split())
    tail = f"  -- {ms:.1f} ms{extra}" if ms is not None else f"  --{extra}"
    print(f"[SQL] {one_line}{tail}", flush=True)


def run_query(sql, params=None, fetch="all", sensitive=False):
    """
    Ejecuta una consulta y la imprime en consola con sus valores reales,
    por ejemplo: [SQL] SELECT * FROM usuarios WHERE correo = 'a@b.com'  -- 1.2 ms | 1 fila(s)

    fetch: "all" -> lista de dicts | "one" -> dict o None | None -> filas afectadas
    sensitive=True oculta los parámetros en el log (contraseñas, hashes).
    Siempre usa parámetros (%s): nunca concatenes valores dentro del SQL.
    """
    conn = get_connection()
    try:
        with conn:  # commit automático si todo sale bien, rollback si falla
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if params is None:
                    shown = sql
                elif sensitive:
                    shown = f"{sql}  [parámetros ocultos]"
                else:
                    shown = cur.mogrify(sql, params).decode("utf-8")

                start = time.perf_counter()
                try:
                    cur.execute(sql, params)
                except Exception as ex:
                    _log_sql(shown, extra=f" ERROR: {ex}")
                    raise

                if fetch == "all":
                    result = cur.fetchall()
                    rows = len(result)
                elif fetch == "one":
                    result = cur.fetchone()
                    rows = 1 if result else 0
                else:
                    result = cur.rowcount
                    rows = result

                _log_sql(shown, (time.perf_counter() - start) * 1000, f" | {rows} fila(s)")
                return result
    finally:
        conn.close()
