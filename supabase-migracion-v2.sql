-- ============================================================
-- MIGRACIÓN v2 · de los 6 productos conceptuales a los 5 reales
-- de la edición de lanzamiento (Cozumel)
--
-- Pega esto en el SQL Editor de Supabase y pulsa Run.
-- Hasta que no lo ejecutes, la base de datos seguirá esperando los
-- ids antiguos (collar_nombre, anillo_grabado, etc.) y RECHAZARÁ
-- todas las reservas de los 5 productos reales.
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
      'collar_flor_natal'
    )
    and fuente = 'adri_story'
    and estado = 'reserva'
    and consentimiento = true
  );

-- ============================================================
-- Los ids tienen que coincidir EXACTAMENTE con los de productos.js.
-- Si cambias el "id" de un producto ahí, hay que volver a ejecutar
-- una migración como esta con el id nuevo.
-- ============================================================
