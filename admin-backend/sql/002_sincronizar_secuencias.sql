-- =====================================================================
-- 002 · Sincronizar las secuencias con los datos existentes
-- Úsalo cuando al guardar salga:  "la secuencia está desfasada..."
-- (ocurre si alguna vez se insertaron filas con un ID escrito a mano)
-- =====================================================================

-- DIAGNÓSTICO (opcional): si last_value es MENOR que max_id, la secuencia choca
SELECT
    (SELECT last_value FROM public.empleado_id_empleado_seq) AS ultimo_valor_secuencia,
    (SELECT MAX(id_empleado) FROM public.empleados)          AS max_id_empleado;

-- CORRECCIÓN empleados: el próximo ID será MAX(id_empleado) + 1
SELECT setval(
    'public.empleado_id_empleado_seq',
    COALESCE((SELECT MAX(id_empleado) FROM public.empleados), 0) + 1,
    false
);

-- CORRECCIÓN usuarios (solo si ya ejecutaste 001_usuarios_autoincrement.sql)
SELECT setval(
    'public.usuarios_id_usuario_seq',
    COALESCE((SELECT MAX(id_usuario) FROM public.usuarios), 0) + 1,
    false
);
