-- ============================================================
-- MIGRACIÓN v3 · añadir el Kit "El Pedacito de Nosotros"
--
-- Pega esto en el SQL Editor de Supabase y pulsa Run.
-- Hasta que no lo ejecutes, la base de datos RECHAZARÁ las reservas
-- del kit (los otros 5 productos seguirán funcionando).
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
      'kit_pedacito_nosotros'    -- nuevo en v3
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
