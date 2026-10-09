-- =============================================================
-- v32 · Newsletter de la portada (rediseño marca hombre, 10/2026)
-- La política de lista_espera solo admitía altas con fuente
-- 'cuenta_atras'. El nuevo formulario de la portada envía
-- fuente 'newsletter'. Aplicar al publicar el rediseño.
-- =============================================================
drop policy if exists "cualquiera se apunta a la lista de espera" on public.lista_espera;
create policy "cualquiera se apunta a la lista de espera"
  on public.lista_espera for insert
  to anon, authenticated
  with check (consentimiento = true and fuente in ('cuenta_atras', 'newsletter'));
