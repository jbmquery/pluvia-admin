# src/hooks/auth_hook.py
# Decorador para proteger rutas: úsalo en cualquier endpoint futuro que requiera sesión.
from functools import wraps

from flask import g, request

import config
from src.services import login_service
from src.utils.response_utils import fail
from src.utils.security_utils import decode_token


def login_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        token = request.cookies.get(config.COOKIE_NAME)
        payload = decode_token(token) if token else None
        if not payload:
            return fail("Sesión no válida o expirada.", 401)

        try:
            user = login_service.buscar_por_id(int(payload["sub"]))
        except (KeyError, ValueError):
            return fail("Sesión no válida o expirada.", 401)

        # Se revalida contra la BD: si desactivan al usuario, la sesión cae de inmediato
        if not user or not user["estado"] or user["tipo_usuario"] <= config.MIN_TIPO_USUARIO:
            return fail("Sesión no válida o expirada.", 401)

        g.user = user
        return view(*args, **kwargs)

    return wrapper
