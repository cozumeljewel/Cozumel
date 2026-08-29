-- ============================================================
-- MIGRACIÓN v7 · cobro real con Stripe
--
-- Pega esto en el SQL Editor de Supabase y pulsa Run.
-- A partir de aquí:
--   - Insertar en "reservas" desde el navegador exige estado = 'pendiente_pago'
--     (antes exigía estado = 'reserva').
--   - Cada persona puede LEER sus propias filas (antes no había SELECT).
--   - El email de "pedido recibido" ya no se dispara al crear la fila, se
--     dispara cuando estado pasa a 'pagado' (lo escribe la función
--     webhook-stripe con la clave service_role, nunca el navegador).
-- ============================================================

-- ---- Extensión necesaria para enviar los emails ----
-- El disparador de más abajo llama a net.http_post (Resend), y esa función
-- la aporta pg_net. Esta línea faltaba en la primera versión de esta
-- migración: sin la extensión, el disparador falla, y como se ejecuta
-- dentro del UPDATE que marca el pedido como pagado, tumbaba TODO el
-- UPDATE. Efecto real en producción: Stripe cobraba, el webhook recibía
-- un error 500 y el pedido se quedaba para siempre en 'pendiente_pago'.
create extension if not exists pg_net;

-- ---- Columnas nuevas ----
alter table public.reservas
  add column if not exists precio_pagado numeric,
  add column if not exists stripe_session_id text;

-- ---- Política de INSERT (sustituye a la de v6) ----
drop policy if exists "usuarios autenticados insertan sus reservas" on public.reservas;

create policy "usuarios autenticados insertan sus reservas"
  on public.reservas for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and producto in (
      'collar_esencial', 'pulsera_vinculo', 'pulsera_nombre',
      'brazalete_mensaje', 'collar_flor_natal',
      'kit_pedacito_nosotros', 'kit_mi_consentida'
    )
    and fuente = 'adri_story'
    and estado = 'pendiente_pago'
    and consentimiento = true
  );

-- ---- Política de SELECT (nueva) ----
-- La necesita comprar.html para sondear si su fila ya pasó a 'pagado'.
drop policy if exists "usuarios autenticados leen sus reservas" on public.reservas;

create policy "usuarios autenticados leen sus reservas"
  on public.reservas for select
  to authenticated
  using (user_id = auth.uid());

-- ---- Política de UPDATE (nueva) ----
-- La necesita crear-sesion-pago para escribir stripe_session_id en la fila
-- del propio usuario. Acotada a filas que siguen pendientes de pago, para
-- que nadie pueda tocar una ya pagada desde el navegador.
drop policy if exists "usuarios autenticados actualizan sus reservas" on public.reservas;

create policy "usuarios autenticados actualizan sus reservas"
  on public.reservas for update
  to authenticated
  using (user_id = auth.uid() and estado = 'pendiente_pago')
  with check (user_id = auth.uid() and estado = 'pendiente_pago');

-- ---- Función que envía los dos emails, vía Resend con pg_net ----
-- Se ejecuta con los privilegios del propietario de la función (definer),
-- así puede leer el secreto de Vault aunque quien dispara el trigger sea
-- la política de UPDATE de la clave service_role.
--
-- La clave de Resend se guarda en Supabase Vault (Project Settings →
-- Vault → New secret, nombre "resend_api_key"), no con
-- "alter database ... set": Supabase no permite esa sentencia desde el SQL
-- Editor normal, hace falta privilegio de superusuario que ni el
-- propietario del proyecto tiene ahí.
create or replace function public.notificar_pedido_pagado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resend_key text;
  nombre_producto text;
  importe_texto text;
begin
  select decrypted_secret into resend_key
  from vault.decrypted_secrets
  where name = 'resend_api_key'
  limit 1;

  if resend_key is null or resend_key = '' then
    -- Sin el secreto configurado en Vault (antes de completar la guía de
    -- configuración manual) no se intenta llamar a Resend: se deja
    -- constancia en los logs de Postgres y se sigue, para no bloquear el
    -- UPDATE que sí importa (marcar el pedido como pagado).
    raise warning 'notificar_pedido_pagado: el secreto "resend_api_key" no está en Vault, no se envían emails';
    return new;
  end if;

  nombre_producto := case new.producto
    when 'collar_esencial'        then 'Collar Esencia'
    when 'pulsera_vinculo'        then 'Pulsera Dos Almas'
    when 'pulsera_nombre'         then 'Pulsera Mi Cielo'
    when 'brazalete_mensaje'      then 'Brazalete Eterno'
    when 'collar_flor_natal'      then 'Collar Destino'
    when 'kit_pedacito_nosotros'  then 'Kit El Pedacito de Nosotros'
    when 'kit_mi_consentida'      then 'Kit Mi Consentida'
    else new.producto
  end;

  importe_texto := trim(to_char(new.precio_pagado, '999999999D99')) || ' €';

  -- ---- Email al cliente ----
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Cozumel Jewelry <pedidos@cozumeljewelry.es>',
      'to', array[new.email],
      'subject', 'Hemos recibido tu pago · Cozumel Jewelry',
      'html',
      '<div style="font-family:Arial,sans-serif; max-width:480px; margin:0 auto; color:#14454A;">' ||
      '<div style="background:#0B2E33; padding:24px; text-align:center;">' ||
      '<img src="https://cozumeljewelry.es/img/email-logo.png" alt="Cozumel Jewelry" width="220" style="max-width:70%;">' ||
      '</div>' ||
      '<div style="padding:28px 24px;">' ||
      '<h1 style="font-size:20px; color:#14454A; margin:0 0 12px;">Hemos recibido tu pago</h1>' ||
      '<p style="font-size:14px; line-height:1.6; margin:0 0 16px;">Hola ' || new.nombre || ', tu pedido ya está confirmado. En cuanto lo tengamos listo, te lo enviamos a la dirección que nos diste.</p>' ||
      '<table style="width:100%; font-size:13.5px; line-height:1.8; border-top:1px solid #E3EFF1; border-bottom:1px solid #E3EFF1; margin:16px 0; padding:8px 0;">' ||
      '<tr><td style="color:#4E9A9B;">Pieza</td><td style="text-align:right;">' || nombre_producto || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Importe pagado</td><td style="text-align:right;">' || importe_texto || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Envío a</td><td style="text-align:right;">' || new.direccion_envio || '</td></tr>' ||
      '</table>' ||
      '<p style="font-size:12.5px; line-height:1.6; color:#4E9A9B; margin:0;">Cozumel, somos un pedacito de lo que regalamos</p>' ||
      '</div></div>'
    )
  );

  -- ---- Email al negocio ----
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Cozumel Jewelry <pedidos@cozumeljewelry.es>',
      'to', array['cozumeljewel@gmail.com'],
      'subject', 'Pedido pagado: ' || nombre_producto,
      'html',
      '<div style="font-family:Arial,sans-serif; max-width:520px; margin:0 auto; color:#14454A;">' ||
      '<h2 style="font-size:18px;">Nuevo pedido pagado</h2>' ||
      '<table style="width:100%; font-size:13.5px; line-height:1.9;">' ||
      '<tr><td style="color:#4E9A9B; width:140px;">Pieza</td><td>' || nombre_producto || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Importe cobrado</td><td>' || importe_texto || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Cliente</td><td>' || new.nombre || ' ' || new.apellidos || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Email</td><td>' || new.email || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">WhatsApp</td><td>' || new.whatsapp || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">País</td><td>' || new.pais || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Dirección</td><td>' || new.direccion_envio || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Personalización</td><td>' || coalesce(new.personalizacion::text, 'ninguna') || '</td></tr>' ||
      '</table></div>'
    )
  );

  return new;
end;
$$;

drop trigger if exists notificar_pedido_pagado on public.reservas;

create trigger notificar_pedido_pagado
  after update of estado on public.reservas
  for each row
  when (new.estado = 'pagado' and old.estado is distinct from 'pagado')
  execute function public.notificar_pedido_pagado();

-- ============================================================
-- Nota: la clave de Resend se guarda en Project Settings → Vault → New
-- secret, con el nombre exacto "resend_api_key". Paso manual, documentado
-- en configurar-stripe.md. Sin ese secreto, los pedidos se siguen marcando
-- 'pagado' correctamente, solo que sin email.
-- ============================================================
