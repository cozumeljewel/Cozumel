-- v44 (13/11/2026): eventos de visitas que llegan desde TikTok.
-- La web apunta con fuente 'tiktok' las visitas que llegaron con
-- ?utm_source=tiktok (durante 7 días en ese navegador, analitica.js).
-- Mismo tipo de dato anónimo, sin cookies, que 'adri_story' y
-- 'anuncio_meta'. Solo se amplía la lista de fuentes permitidas.

drop policy if exists "anon inserta eventos" on public.eventos;

create policy "anon inserta eventos" on public.eventos
  for insert to anon, authenticated
  with check (
    fuente in ('adri_story', 'anuncio_meta', 'tiktok')
    or (fuente = 'email' and evento = 'voto_email')
    or (fuente = 'instagram' and evento = 'voto_historia')
  );
