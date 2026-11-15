# src/utils/security_utils.py
import re
from datetime import date, datetime, timedelta, timezone

import bcrypt
import jwt

import config

# Hash falso para igualar el tiempo de respuesta cuando el correo no existe
_DUMMY_HASH = bcrypt.hashpw(b"dummy-password", bcrypt.gensalt(rounds=12))


# ---------- Contraseñas ----------
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, AttributeError):
        return False


def fake_verify():
    bcrypt.checkpw(b"otra-clave", _DUMMY_HASH)


def validate_password_policy(nueva: str, actual: str, correo: str):
    """Devuelve la lista de requisitos que NO se cumplen (vacía si todo está bien)."""
    errores = []
    if len(nueva) < 8:
        errores.append("La nueva contraseña debe tener al menos 8 caracteres.")
    if len(nueva.encode("utf-8")) > 72:
        errores.append("La nueva contraseña es demasiado larga (máximo 72 bytes).")
    if not re.search(r"[A-Z]", nueva):
        errores.append("Debe incluir una letra mayúscula.")
    if not re.search(r"[a-z]", nueva):
        errores.append("Debe incluir una letra minúscula.")
    if not re.search(r"\d", nueva):
        errores.append("Debe incluir un número.")
    if not re.search(r"[^A-Za-z0-9]", nueva):
        errores.append("Debe incluir un símbolo.")
    if nueva == actual:
        errores.append("La nueva contraseña debe ser distinta a la anterior.")
    usuario = correo.split("@")[0].lower()
    if len(usuario) >= 3 and usuario in nueva.lower():
        errores.append("La contraseña no debe contener tu correo.")
    return errores


# ---------- JWT + cookie ----------
def create_token(user: dict) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user["id_usuario"]),
        "tipo": user["tipo_usuario"],
        "iat": now,
        "exp": now + timedelta(hours=config.JWT_EXPIRES_HOURS),
    }
    return jwt.encode(payload, config.SECRET_KEY, algorithm=config.JWT_ALGORITHM)


def decode_token(token: str):
    try:
        return jwt.decode(token, config.SECRET_KEY, algorithms=[config.JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


def set_auth_cookie(response, token: str):
    response.set_cookie(
        config.COOKIE_NAME,
        token,
        max_age=config.JWT_EXPIRES_HOURS * 3600,
        httponly=True,  # JavaScript no puede leerla (protege contra XSS)
        secure=config.COOKIE_SECURE,
        samesite=config.COOKIE_SAMESITE,
        path="/",
    )


def clear_auth_cookie(response):
    response.delete_cookie(
        config.COOKIE_NAME,
        path="/",
        httponly=True,
        secure=config.COOKIE_SECURE,
        samesite=config.COOKIE_SAMESITE,
    )


# ---------- Usuario público (nunca devuelve pass_encrip) ----------
def public_user(row: dict) -> dict:
    user = {k: v for k, v in row.items() if k != "pass_encrip"}
    for key, value in user.items():
        if isinstance(value, (date, datetime)):
            user[key] = value.isoformat()
    user["nombre_completo"] = " ".join(
        p for p in (row["nombres"], row["ape_paterno"], row["ape_materno"]) if p
    )
    return user
