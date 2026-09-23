-- =============================================================
-- MIGRACIÓN v17 · "Kit a tu gusto" se puede comprar + eventos con sesión
--
-- 1. La política de INSERT de reservas (v7) solo admitía los 7
--    productos antiguos. kit_personalizado (v15) se quedó fuera, así
--    que al pagar un "Kit a tu gusto" la base de datos devolvía 403 y
--    la web decía "No se pudo guardar tu pedido". Visto el 2026-09-23.
-- 2. Los eventos del embudo solo se aceptaban de visitantes sin sesión
--    (anon). En comprar.html casi todo el mundo ya ha entrado con
--    Google, y sus eventos (reserva_iniciada...) se perdían con 403.
-- =============================================================

drop policy if exists "usuarios autenticados insertan sus reservas" on public.reservas;

create policy "usuarios autenticados insertan sus reservas"
  on public.reservas for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and producto in (
      'collar_esencial', 'pulsera_vinculo', 'pulsera_nombre',
      'brazalete_mensaje', 'collar_flor_natal',
      'kit_pedacito_nosotros', 'kit_mi_consentida', 'kit_personalizado'
    )
    and fuente = 'adri_story'
    and estado = 'pendiente_pago'
    and consentimiento = true
  );

drop policy if exists "anon inserta eventos" on public.eventos;

create policy "anon inserta eventos"
  on public.eventos for insert
  to anon, authenticated
  with check (fuente = 'adri_story');
