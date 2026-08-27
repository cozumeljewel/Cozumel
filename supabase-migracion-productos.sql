-- ============================================================
-- MIGRACIÓN · pasar de 1 producto a los 6 de la colección
--
-- Pega esto entero en el SQL Editor de Supabase y pulsa Run.
-- Hasta que no lo ejecutes, la base de datos RECHAZARÁ cualquier
-- reserva que no sea el collar original: la política actual tiene
-- producto = 'collar_personalizado' fijado a fuego.
-- ============================================================

-- 1) Guardar en qué producto ocurrió cada paso del embudo.
--    Es opcional (los "view" no tienen producto todavía).
alter table public.eventos
  add column if not exists producto text;

-- 2) Permitir los seis productos de la colección.
--    Los ids tienen que coincidir EXACTAMENTE con los de productos.js.
drop policy if exists "anon inserta reservas" on public.reservas;

create policy "anon inserta reservas"
  on public.reservas for insert
  to anon
  with check (
    producto in (
      'collar_nombre',
      'pulsera_nombre',
      'collar_coordenadas',
      'anillo_grabado',
      'colgante_inicial',
      'colgante_corazon'
    )
    and fuente = 'adri_story'
    and estado = 'reserva'
    and consentimiento = true
  );

-- ============================================================
-- CONSULTAS ÚTILES PARA LA VALIDACIÓN
-- ============================================================

-- Embudo global (la métrica que manda: reservas ÷ visitas)
--
--   select evento, count(distinct session_id) as personas
--   from eventos
--   group by evento
--   order by case evento
--     when 'view' then 1
--     when 'personalizacion_iniciada' then 2
--     when 'reserva_iniciada' then 3
--     when 'reserva_completada' then 4 end;

-- Qué pieza gusta más (ojo: con pocas reservas esto es ruido,
-- hacen falta bastantes por producto para sacar conclusiones)
--
--   select producto, count(*) as reservas
--   from reservas
--   group by producto
--   order by reservas desc;

-- Dónde abandona la gente en cada pieza
--
--   select producto, evento, count(distinct session_id) as personas
--   from eventos
--   where producto is not null
--   group by producto, evento
--   order by producto, personas desc;
