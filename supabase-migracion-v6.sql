-- ============================================================
-- MIGRACIÓN v6 · login obligatorio con Google para reservar
--
-- Pega esto en el SQL Editor de Supabase y pulsa Run.
-- A partir de aquí, la clave anon YA NO puede insertar en "reservas":
-- hace falta sesión iniciada. Sin ejecutar esto, el formulario de
-- reservar.html (una vez tenga el login) fallará al enviar SIEMPRE,
-- no solo para un producto concreto.
-- ============================================================

alter table public.reservas
  add column if not exists user_id uuid references auth.users(id);

drop policy if exists "anon inserta reservas" on public.reservas;

create policy "usuarios autenticados insertan sus reservas"
  on public.reservas for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and producto in (
      'collar_esencial',
      'pulsera_vinculo',
      'pulsera_nombre',
      'brazalete_mensaje',
      'collar_flor_natal',
      'kit_pedacito_nosotros',
      'kit_mi_consentida'
    )
    and fuente = 'adri_story'
    and estado = 'reserva'
    and consentimiento = true
  );

-- ============================================================
-- Las filas ya guardadas con la política anterior (anon) se quedan con
-- user_id en null. No pasa nada: siguen ahí, solo que sin dueño asignado.
-- ============================================================
