-- ============================================================
-- MIGRACIÓN v11 · amplía el CHECK de "eventos" para admitir
-- compra_iniciada / compra_completada
--
-- Pega esto en el SQL Editor de Supabase (proyecto "ADRI",
-- ddcrkglgdbasbxanbjkc) y pulsa Run.
--
-- Motivo: script.js llama a trackEvent('compra_iniciada', ...) y
-- trackEvent('compra_completada', ...) (ver script.js), pero el CHECK
-- original de "eventos" (supabase-schema.sql) solo admitía
-- 'view', 'personalizacion_iniciada', 'reserva_iniciada' y
-- 'reserva_completada'. Esos dos inserts fallaban siempre —en
-- silencio, no rompían la compra— así que el embudo de analítica nunca
-- tuvo esas dos filas. Esta migración no toca datos existentes, solo
-- amplía la lista de valores permitidos.
-- ============================================================

alter table public.eventos drop constraint eventos_evento_check;

alter table public.eventos add constraint eventos_evento_check
  check (
    evento in (
      'view',
      'personalizacion_iniciada',
      'reserva_iniciada',
      'reserva_completada',
      'compra_iniciada',
      'compra_completada'
    )
  );

-- Para leer el embudo completo (SQL Editor, autenticado como tú, RLS no
-- te afecta a ti):
--
--   select evento, count(distinct session_id) as personas
--   from eventos
--   group by evento
--   order by
--     case evento
--       when 'view' then 1
--       when 'personalizacion_iniciada' then 2
--       when 'reserva_iniciada' then 3
--       when 'compra_iniciada' then 4
--       when 'reserva_completada' then 5
--       when 'compra_completada' then 6
--     end;
