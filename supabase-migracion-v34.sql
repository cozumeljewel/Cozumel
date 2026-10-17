-- =============================================================
-- v34 · Votación del email "Men's collection · Muy pronto" (17/10/2026)
-- voto.html guarda cada voto en eventos: evento 'voto_email',
-- fuente 'email', producto = id de la pieza (hombre_collar_3...).
-- Recuento:
--   select producto, count(*) from eventos where evento = 'voto_email'
--   group by 1 order by 2 desc;
-- =============================================================
alter table public.eventos drop constraint if exists eventos_evento_check;
alter table public.eventos add constraint eventos_evento_check check (evento = any (array[
  'view', 'coleccion_vista', 'producto_visto', 'personalizacion_iniciada', 'reserva_iniciada',
  'reserva_completada', 'compra_iniciada', 'compra_completada', 'voto_email']));

drop policy if exists "anon inserta eventos" on public.eventos;
create policy "anon inserta eventos"
  on public.eventos for insert
  to anon, authenticated
  with check (fuente = 'adri_story' or (fuente = 'email' and evento = 'voto_email'));
