# src/controllers/login_controller.py
import math
import re

from flask import g, request

from src.services import login_service
from src.services.login_service import AuthError
from src.utils.rate_limit_utils import register_failure, reset_attempts, seconds_blocked
from src.utils.response_utils import fail, ok
from src.utils.security_utils import (
    clear_auth_cookie,
    create_token,
    public_user,
    set_auth_cookie,
    validate_password_policy,
)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _key(correo):
    return f"{request.remote_addr}|{correo}"


def _blocked_response(key):
    wait = seconds_blocked(key)
    if wait:
        minutos = math.ceil(wait / 60)
        return fail(f"Demasiados intentos fallidos. Intenta de nuevo en {minutos} minuto(s).", 429)
    return None


def login():
    data = request.get_json(silent=True) or {}
    correo = str(data.get("correo", "")).strip().lower()
    password = str(data.get("password", ""))

    if not correo or not password:
        return fail("Ingresa tu correo y contraseña.", 400)
    if len(correo) > 100 or not EMAIL_RE.match(correo):
        return fail("Ingresa un correo válido.", 400)

    key = _key(correo)
    blocked = _blocked_response(key)
    if blocked:
        return blocked

    try:
        user = login_service.autenticar(correo, password)
    except AuthError as e:
        if e.status == 401:
            register_failure(key)
        return fail(e.message, e.status)

    reset_attempts(key)
    response = ok("Inicio de sesión exitoso.", user=public_user(user))
    set_auth_cookie(response, create_token(user))
    return response


def logout():
    response = ok("Sesión cerrada.")
    clear_auth_cookie(response)
    return response


def me():
    # g.user lo carga el decorador login_required (hooks/auth_hook.py)
    return ok("Sesión activa.", user=public_user(g.user))


def restaurar_password():
    data = request.get_json(silent=True) or {}
    correo = str(data.get("correo", "")).strip().lower()
    actual = str(data.get("password_actual", ""))
    nueva = str(data.get("password_nueva", ""))
    confirmacion = str(data.get("password_confirmacion", ""))

    if not correo or not actual or not nueva or not confirmacion:
        return fail("Completa todos los campos.", 400)
    if len(correo) > 100 or not EMAIL_RE.match(correo):
        return fail("Ingresa un correo válido.", 400)
    if nueva != confirmacion:
        return fail("La nueva contraseña y su confirmación no coinciden.", 400)

    errores = validate_password_policy(nueva, actual, correo)
    if errores:
        return fail(" ".join(errores), 400, errores=errores)

    key = _key(correo)
    blocked = _blocked_response(key)
    if blocked:
        return blocked

    try:
        login_service.cambiar_password(correo, actual, nueva)
    except AuthError as e:
        if e.status == 401:
            register_failure(key)
        return fail(e.message, e.status)

    reset_attempts(key)
    response = ok("Contraseña actualizada correctamente.")
    clear_auth_cookie(response)  # fuerza a iniciar sesión de nuevo
    return response
