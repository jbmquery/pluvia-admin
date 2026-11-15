-- =====================================================================
-- 001 · Volver autoincremental usuarios.id_usuario   (ejecutar UNA vez)
-- Base de datos: db_servicios  (la misma que usa database.py)
-- Herramienta:   pgAdmin -> clic derecho en db_servicios -> Query Tool -> pegar -> F5
-- =====================================================================

-- 1) Crear la secuencia, ligada a la columna
CREATE SEQUENCE IF NOT EXISTS public.usuarios_id_usuario_seq
    OWNED BY public.usuarios.id_usuario;

-- 2) Ubicarla en MAX(id_usuario) + 1 para no chocar con los usuarios existentes
SELECT setval(
    'public.usuarios_id_usuario_seq',
    COALESCE((SELECT MAX(id_usuario) FROM public.usuarios), 0) + 1,
    false
);

-- 3) Usarla como valor por defecto de la columna
ALTER TABLE public.usuarios
    ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_usuario_seq');

-- 4) VERIFICACIÓN: debe devolver  nextval('usuarios_id_usuario_seq'::regclass)
SELECT column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'id_usuario';
