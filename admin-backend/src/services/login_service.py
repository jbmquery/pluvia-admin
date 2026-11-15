# src/services/login_service.py
# Lógica de negocio + consultas SQL del login.
import config
from database import run_query
from src.utils.security_utils import fake_verify, hash_password, verify_password

USER_COLUMNS = """id_usuario, nombres, ape_paterno, ape_materno, apodo, correo, pass_encrip,
    tipo_usuario, estado, fecha_creacion, celular, fecha_nacimiento, fecha_contratacion"""


class AuthError(Exception):
    def __init__(self, message, status=401):
        super().__init__(message)
        self.message = message
        self.status = status


def buscar_por_correo(correo):
    return run_query(
        f"SELECT {USER_COLUMNS} FROM public.usuarios WHERE LOWER(correo) = LOWER(%s) LIMIT 1",
        (correo,),
        fetch="one",
    )


def buscar_por_id(id_usuario):
    return run_query(
        f"SELECT {USER_COLUMNS} FROM public.usuarios WHERE id_usuario = %s",
        (id_usuario,),
        fetch="one",
    )


def _validar_acceso(user):
    """Reglas de acceso al panel. Solo se evalúan con credenciales ya verificadas."""
    if not user["estado"]:
        raise AuthError("Tu usuario está inactivo. Contacta al administrador.", 403)
    if user["tipo_usuario"] <= config.MIN_TIPO_USUARIO:
        raise AuthError("Tu nivel de usuario no tiene permiso para ingresar a este panel.", 403)


def autenticar(correo, password):
    user = buscar_por_correo(correo)
    if not user:
        fake_verify()
        raise AuthError("Correo o contraseña incorrectos.")
    if not verify_password(password, user["pass_encrip"]):
        raise AuthError("Correo o contraseña incorrectos.")
    _validar_acceso(user)
    return user


def cambiar_password(correo, password_actual, password_nueva):
    user = buscar_por_correo(correo)
    if not user:
        fake_verify()
        raise AuthError("Correo o contraseña anterior incorrectos.")
    if not verify_password(password_actual, user["pass_encrip"]):
        raise AuthError("Correo o contraseña anterior incorrectos.")
    _validar_acceso(user)

    run_query(
        "UPDATE public.usuarios SET pass_encrip = %s WHERE id_usuario = %s",
        (hash_password(password_nueva), user["id_usuario"]),
        fetch=None,
        sensitive=True,  # no imprime el hash en consola
    )
