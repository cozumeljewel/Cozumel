-- =============================================================
-- v35 · Votación desde la historia de Instagram (18/10/2026)
-- votar.html guarda el voto en eventos (evento 'voto_historia',
-- fuente 'instagram') y el email en lista_espera (fuente 'votacion').
-- Recuento:
--   select producto, count(*) from eventos where evento = 'voto_historia'
--   group by 1 order by 2 desc;
-- =============================================================
alter table public.eventos drop constraint if exists eventos_evento_check;
alter table public.eventos add constraint eventos_evento_check check (evento = any (array[
  'view', 'coleccion_vista', 'producto_visto', 'personalizacion_iniciada', 'reserva_iniciada',
  'reserva_completada', 'compra_iniciada', 'compra_completada', 'voto_email', 'voto_historia']));

drop policy if exists "anon inserta eventos" on public.eventos;
create policy "anon inserta eventos"
  on public.eventos for insert
  to anon, authenticated
  with check (fuente = 'adri_story'
    or (fuente = 'email' and evento = 'voto_email')
    or (fuente = 'instagram' and evento = 'voto_historia'));

drop policy if exists "cualquiera se apunta a la lista de espera" on public.lista_espera;
create policy "cualquiera se apunta a la lista de espera"
  on public.lista_espera for insert
  to anon, authenticated
  with check (consentimiento = true and fuente in ('cuenta_atras', 'newsletter', 'votacion'));
