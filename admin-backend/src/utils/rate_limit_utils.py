# src/utils/rate_limit_utils.py
# Límite simple en memoria de intentos fallidos (por IP + correo).
# En producción con varios procesos, usa Redis u otro almacén compartido.
import threading
import time
from collections import defaultdict

import config

_fails = defaultdict(list)
_lock = threading.Lock()


def _recent(key, now):
    _fails[key] = [t for t in _fails[key] if now - t < config.LOGIN_LOCK_SECONDS]
    return _fails[key]


def seconds_blocked(key: str) -> int:
    """Segundos restantes de bloqueo (0 si no está bloqueado)."""
    now = time.time()
    with _lock:
        recent = _recent(key, now)
        if len(recent) >= config.MAX_LOGIN_ATTEMPTS:
            return int(config.LOGIN_LOCK_SECONDS - (now - recent[0])) + 1
    return 0


def register_failure(key: str):
    with _lock:
        _recent(key, time.time()).append(time.time())


def reset_attempts(key: str):
    with _lock:
        _fails.pop(key, None)
