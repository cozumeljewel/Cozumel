-- v42 (2026-11-05) · Preparación de la Conversions API de Meta.
-- Si el cliente paga y cierra la ventana antes de volver a la web, el
-- navegador no llega a mandar el Purchase. El webhook de Stripe (que sí se
-- entera siempre) podrá mandarlo desde el servidor con el mismo eventID
-- ("purchase_<sesión de Stripe>") para que Meta no lo cuente dos veces.
--
-- Solo para quien aceptó las cookies en el aviso de la web:
--   · meta_consentimiento: true si las aceptó al hacer el pedido.
--   · meta_fbp / meta_fbc: las cookies _fbp / _fbc de Meta (identificadores
--     de navegador y de clic en anuncio, no datos personales directos).
--   · meta_user_agent / meta_ip: el navegador y la IP, que Meta pide para
--     atribuir eventos web. La IP la guarda crear-sesion-pago (servidor).
-- Sin consentimiento estas columnas quedan vacías y no se manda nada.
-- No se copian a "pedidos" (copiar_a_pedidos usa jsonb_populate_record,
-- que ignora las columnas que pedidos no tiene).

alter table public.reservas
  add column if not exists meta_consentimiento boolean not null default false,
  add column if not exists meta_fbp text,
  add column if not exists meta_fbc text,
  add column if not exists meta_user_agent text,
  add column if not exists meta_ip text;

-- Límites de tamaño: los escribe el navegador
alter table public.reservas drop constraint if exists reservas_meta_largos;
alter table public.reservas add constraint reservas_meta_largos check (
  coalesce(char_length(meta_fbp), 0) <= 200 and
  coalesce(char_length(meta_fbc), 0) <= 500 and
  coalesce(char_length(meta_user_agent), 0) <= 500 and
  coalesce(char_length(meta_ip), 0) <= 64);

-- Sin consentimiento, nada de identificadores de Meta
alter table public.reservas drop constraint if exists reservas_meta_solo_con_consentimiento;
alter table public.reservas add constraint reservas_meta_solo_con_consentimiento check (
  meta_consentimiento or (meta_fbp is null and meta_fbc is null and meta_user_agent is null and meta_ip is null));
