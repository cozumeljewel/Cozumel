-- v43 (7/11/2026): eventos de visitas que llegan desde el anuncio de Meta.
-- La web apunta con fuente 'anuncio_meta' las visitas que llegaron con
-- ?utm_source=meta o ?fbclid (durante 7 días en ese navegador), y un
-- evento 'llegada_anuncio' al entrar. Es un dato anónimo, sin cookies: el
-- mismo tipo de registro que ya se hacía con 'adri_story'. Así se sabe
-- cuántos clics del anuncio llegan de verdad a la web aunque no acepten
-- las cookies (el píxel de Meta solo ve a quien las acepta).

drop policy if exists "anon inserta eventos" on public.eventos;

create policy "anon inserta eventos" on public.eventos
  for insert to anon, authenticated
  with check (
    fuente in ('adri_story', 'anuncio_meta')
    or (fuente = 'email' and evento = 'voto_email')
    or (fuente = 'instagram' and evento = 'voto_historia')
  );

-- El nombre del evento de llegada tiene que estar en la lista permitida.
alter table public.eventos drop constraint eventos_evento_check;
alter table public.eventos add constraint eventos_evento_check check (evento = any (array[
  'view', 'coleccion_vista', 'producto_visto', 'personalizacion_iniciada',
  'reserva_iniciada', 'reserva_completada', 'compra_iniciada', 'compra_completada',
  'voto_email', 'voto_historia', 'llegada_anuncio'
]));
