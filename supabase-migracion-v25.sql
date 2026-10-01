-- v25 (2026-10-01) · El sorteo cuenta solo las compras pagadas DESDE el
-- lanzamiento, como dicen los términos ("las 100 primeras compras pagadas
-- desde el lanzamiento, 2 de octubre de 2026 a las 21:00 hora de México").
-- 21:00 en Ciudad de México (UTC-6) = 03:00 UTC del 3 de octubre.
-- Así una compra de prueba hecha antes nunca ocupa un puesto, aunque no se
-- haya borrado. Mismas columnas que en la v19: solo cambia el WHERE.

create or replace view public.primeras_100_compras
with (security_invoker = true) as
select
  row_number() over (order by min(r.pagado_en)) as numero,
  min(r.pagado_en)                              as pagado_en,
  max(r.nombre) || ' ' || coalesce(max(r.apellidos), '') as nombre,
  max(r.email)     as email,
  max(r.whatsapp)  as whatsapp,
  max(r.pais)      as pais,
  count(*)         as piezas,
  sum(r.precio_pagado) as total,
  max(r.moneda)    as moneda
from public.reservas r
where r.estado = 'pagado'
  and r.pagado_en is not null
  and r.pagado_en >= timestamptz '2026-10-03 03:00:00+00'
group by coalesce(r.stripe_session_id, r.id::text)
order by min(r.pagado_en)
limit 100;

revoke all on public.primeras_100_compras from anon, authenticated;
