-- v46 (17/11/2026): contacto del carrito en cuanto se escribe.
-- Email o WhatsApp de quien está en la página de pago, aunque no llegue a
-- pulsar "Continuar al pago", para poder escribirle si se va sin comprar.
-- Una fila por sesión anónima de Supabase (la misma de las reservas).
-- RLS: cada sesión solo ve y toca su fila; anon, nada.

create table if not exists public.contactos_carrito (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  session_id uuid,
  email text check (email is null or length(email) <= 254),
  whatsapp text check (whatsapp is null or length(whatsapp) <= 40),
  pais text check (pais is null or length(pais) <= 60),
  carrito jsonb check (carrito is null or pg_column_size(carrito) <= 8000),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table public.contactos_carrito enable row level security;
revoke all on public.contactos_carrito from anon, authenticated;
grant select, insert, update on public.contactos_carrito to authenticated;

drop policy if exists "cada sesion inserta su contacto" on public.contactos_carrito;
create policy "cada sesion inserta su contacto" on public.contactos_carrito
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "cada sesion actualiza su contacto" on public.contactos_carrito;
create policy "cada sesion actualiza su contacto" on public.contactos_carrito
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "cada sesion lee su contacto" on public.contactos_carrito;
create policy "cada sesion lee su contacto" on public.contactos_carrito
  for select to authenticated using (user_id = auth.uid());
