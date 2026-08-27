-- ============================================================
-- MIGRACIÓN v5 · añadir el "Kit Mi Consentida"
--
-- Pega esto en el SQL Editor de Supabase y pulsa Run.
-- Hasta que no lo ejecutes, la base de datos RECHAZARÁ las reservas
-- del Kit Mi Consentida (los otros 6 productos seguirán funcionando).
--
-- Sustituye por completo a la política de la v3: la lista de abajo ya
-- incluye los 7 productos, así que NO hace falta ejecutar la v3 antes.
-- ============================================================

drop policy if exists "anon inserta reservas" on public.reservas;

create policy "anon inserta reservas"
  on public.reservas for insert
  to anon
  with check (
    producto in (
      'collar_esencial',
      'pulsera_vinculo',
      'pulsera_nombre',
      'brazalete_mensaje',
      'collar_flor_natal',
      'kit_pedacito_nosotros',
      'kit_mi_consentida'        -- nuevo en v5
    )
    and fuente = 'adri_story'
    and estado = 'reserva'
    and consentimiento = true
  );

-- ============================================================
-- Los ids tienen que coincidir EXACTAMENTE con los de productos.js.
-- Cada vez que se añada o renombre un id ahí, hay que repetir esta
-- migración con la lista actualizada.
-- ============================================================
