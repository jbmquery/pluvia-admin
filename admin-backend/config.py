# config.py
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "clave-solo-para-desarrollo-cambiala")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_HOURS = int(os.getenv("JWT_EXPIRES_HOURS", "8"))

COOKIE_NAME = "pluvia_token"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "Lax")

FRONTEND_ORIGINS = [o.strip() for o in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")]

# Regla de acceso: estado = true y tipo_usuario > MIN_TIPO_USUARIO
MIN_TIPO_USUARIO = 50

# Protección contra fuerza bruta
MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCK_SECONDS = 15 * 60

SHOW_SQL = os.getenv("SHOW_SQL", "true").lower() == "true"
