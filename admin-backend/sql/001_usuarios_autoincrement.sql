-- Ejecutar UNA sola vez en PostgreSQL (pgAdmin / psql, base db_servicios).
-- Tu tabla usuarios no tiene valor por defecto en id_usuario; esto lo vuelve autoincremental.
CREATE SEQUENCE IF NOT EXISTS public.usuarios_id_usuario_seq OWNED BY public.usuarios.id_usuario;

SELECT setval(
    'public.usuarios_id_usuario_seq',
    COALESCE((SELECT MAX(id_usuario) FROM public.usuarios), 0) + 1,
    false
);

ALTER TABLE public.usuarios
    ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_usuario_seq');
