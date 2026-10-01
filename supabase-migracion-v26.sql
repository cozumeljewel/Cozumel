-- v26 (2026-10-01) · Seguridad del enlace pedido ↔ pago.
--
-- El webhook de Stripe marca como pagadas TODAS las filas de "reservas" que
-- tengan el stripe_session_id del pago. Hasta ahora el navegador (con su
-- sesión anónima) podía:
--   1. insertar filas con el stripe_session_id de un pago suyo, o ponérselo
--      a filas suyas con un UPDATE → se marcaban pagadas sin pagarlas;
--   2. cambiar el producto o el país de una fila ya enviada a Stripe (seguía
--      "pendiente_pago") → pagaba una pieza barata y le llegaba otra;
--   3. escribir pagado_en en su fila pendiente → el trigger
--      marcar_pagado_en la respeta y la compra se colaba la primera en el
--      sorteo (primeras_100_compras ordena por pagado_en).
--
-- Desde ahora el navegador NO puede escribir stripe_session_id ni pagado_en,
-- ni tocar una fila que ya se mandó a Stripe. stripe_session_id lo pone solo
-- crear-sesion-pago con la clave de servicio (desplegada ANTES que esto).
-- El resto de las condiciones de las políticas no cambia.

alter policy "usuarios autenticados insertan sus reservas" on public.reservas
  with check (
    user_id = auth.uid()
    and producto = any (array[
      'collar_esencial', 'pulsera_vinculo', 'pulsera_nombre', 'brazalete_mensaje',
      'collar_flor_natal', 'kit_pedacito_nosotros', 'kit_mi_consentida', 'kit_personalizado'
    ])
    and fuente = 'adri_story'
    and estado = 'pendiente_pago'
    and consentimiento = true
    and stripe_session_id is null
    and pagado_en is null
  );

alter policy "usuarios autenticados actualizan sus reservas" on public.reservas
  using (
    user_id = auth.uid()
    and estado = 'pendiente_pago'
    and stripe_session_id is null
  )
  with check (
    user_id = auth.uid()
    and estado = 'pendiente_pago'
    and stripe_session_id is null
    and pagado_en is null
  );
