-- =============================================================
-- v36 · Resultados en vivo de la votación de la historia (18/10/2026)
-- votar.html enseña el % de cada pieza después de votar. La tabla
-- eventos no se puede leer desde la web, así que esta función devuelve
-- SOLO el recuento por pieza (nada de sesiones ni fechas).
-- =============================================================
create or replace function public.resultados_votacion()
returns table (producto text, votos bigint)
language sql
stable
security definer
set search_path = public
as $$
  select producto, count(*) as votos
  from public.eventos
  where evento = 'voto_historia' and producto is not null
  group by producto;
$$;

revoke all on function public.resultados_votacion() from public;
grant execute on function public.resultados_votacion() to anon, authenticated;
