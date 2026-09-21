-- ============================================================
-- VACIAR PEDIDOS EN SUPABASE Y EMPEZAR DE CERO
--
-- Ojo: borra filas de verdad y no se puede deshacer. El paso 1 solo
-- MIRA lo que hay; el paso 2 es el que borra.
--
-- Es seguro hacerlo ahora porque todavía no se ha vendido nada real:
-- Stripe sigue en modo prueba. En cuanto haya ventas reales, este
-- archivo deja de valer tal cual — ahí solo se borran las filas 'TEST'.
-- ============================================================


-- ===== PASO 1 · mirar qué hay antes de borrar =====
select
  coalesce(stripe_session_id, '(sin referencia de pago)') as referencia,
  estado,
  count(*)        as filas,
  min(created_at) as primera,
  max(nombre)     as nombre
from public.reservas
group by 1, 2
order by primera desc;


-- ===== PASO 2 · de cero: vaciar pedidos y analítica =====
delete from public.reservas;
delete from public.eventos;


-- ===== PASO 3 · comprobar que quedó vacío =====
select
  (select count(*) from public.reservas)           as filas_reservas,
  (select count(*) from public.pedidos_proveedor)  as pedidos_pagados,
  (select count(*) from public.eventos)            as eventos;


-- ===== SOLO LAS PRUEBAS (para más adelante) =====
-- Cuando ya haya pedidos reales y solo quieras limpiar los de prueba:
-- delete from public.reservas
-- where stripe_session_id like 'TEST-%' or nombre ilike 'TEST%';
