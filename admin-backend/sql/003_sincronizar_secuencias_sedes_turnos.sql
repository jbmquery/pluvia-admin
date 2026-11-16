-- =====================================================================
-- 003 · Sincronizar las secuencias de sedes y turnos con sus datos
-- Úsalo cuando al guardar salga:  "la secuencia está desfasada..."
-- (ocurre si alguna vez se insertaron filas con un ID escrito a mano)
-- Base de datos: db_servicios
-- =====================================================================

-- DIAGNÓSTICO (opcional): si "secuencia" es MENOR que "max_id", habrá choque
SELECT
    (SELECT last_value FROM public.sede_id_sede_seq)  AS secuencia_sedes,
    (SELECT MAX(id_sede) FROM public.sedes)           AS max_id_sede,
    (SELECT last_value FROM public.turno_id_turno_seq) AS secuencia_turnos,
    (SELECT MAX(id_turno) FROM public.turnos)         AS max_id_turno;

-- CORRECCIÓN: el próximo ID será MAX + 1
SELECT setval('public.sede_id_sede_seq',
              COALESCE((SELECT MAX(id_sede) FROM public.sedes), 0) + 1, false);

SELECT setval('public.turno_id_turno_seq',
              COALESCE((SELECT MAX(id_turno) FROM public.turnos), 0) + 1, false);
