-- =====================================================================
-- 004 · Sincronizar las secuencias de carta, categorías y subcategorías
-- Úsalo cuando al guardar salga:  "la secuencia está desfasada..."
-- (ocurre si alguna vez se insertaron filas con un ID escrito a mano)
-- Base de datos: db_servicios
-- =====================================================================

-- DIAGNÓSTICO (opcional): si "secuencia" es MENOR que "max_id", habrá choque
SELECT
    (SELECT last_value FROM public.carta_id_carta_seq)                 AS secuencia_carta,
    (SELECT MAX(id_carta) FROM public.carta)                           AS max_id_carta,
    (SELECT last_value FROM public.categorias_id_categoria_seq)        AS secuencia_categorias,
    (SELECT MAX(id_categoria) FROM public.categorias)                  AS max_id_categoria,
    (SELECT last_value FROM public.sub_categorias_id_subcat_seq)       AS secuencia_subcat,
    (SELECT MAX(id_subcat) FROM public.sub_categorias)                 AS max_id_subcat;

-- CORRECCIÓN: el próximo ID será MAX + 1
SELECT setval('public.carta_id_carta_seq',
              COALESCE((SELECT MAX(id_carta) FROM public.carta), 0) + 1, false);

SELECT setval('public.categorias_id_categoria_seq',
              COALESCE((SELECT MAX(id_categoria) FROM public.categorias), 0) + 1, false);

SELECT setval('public.sub_categorias_id_subcat_seq',
              COALESCE((SELECT MAX(id_subcat) FROM public.sub_categorias), 0) + 1, false);
