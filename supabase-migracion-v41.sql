-- v41 (2026-11-03) · Email automático de carrito abandonado.
-- Quien rellena sus datos y llega a Stripe pero no paga (o el banco le
-- rechaza la tarjeta) recibe, pasada 1 hora, un email con sus piezas y un
-- botón que le devuelve a comprar.html con el carrito ya lleno
-- (?carrito=…, el mismo formato que "Copiar enlace"; ver script.js).
-- Un solo email por persona cada 7 días, nunca si ya compró, y solo con
-- su consentimiento. Lo lanza pg_cron cada 15 minutos (al final).

alter table public.reservas add column if not exists recordatorio_enviado_en timestamptz;

-- Lo que ya estaba pendiente antes de hoy se da por avisado (a esos se
-- les escribió a mano por WhatsApp).
update public.reservas set recordatorio_enviado_en = now()
where estado in ('pendiente_pago', 'pago_fallido') and recordatorio_enviado_en is null;

-- El email de un intento (ref = stripe_session_id, o session_id/id si no
-- llegó a Stripe): asunto y HTML. Aparte para poder verlo sin enviarlo.
create or replace function public.email_recordatorio_carrito(ref text, out asunto text, out html text)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  filas text;
  total_texto text;
  enlace text;
  nombre text;
  en boolean;
begin
  select
    max(r.mercado) = 'US',
    max(r.nombre),
    string_agg(
      '<tr><td style="padding:12px 0; border-bottom:1px solid #E3EEEE;">' ||
      '<div style="font-family:Georgia,''Times New Roman'',serif; font-size:17px; color:#14454A;">' ||
        esc_html(coalesce(nombre_de_pieza(r.producto), r.producto)) || '</div>' ||
      coalesce('<div style="font-family:Helvetica,Arial,sans-serif; font-size:13px; color:#4A6B6E; padding-top:4px;">' ||
        esc_html(nullif(case when r.personalizacion ? 'pieza_1'
          -- Kit: los nombres de sus piezas (y el mes de la flor, si lo hay)
          then (select string_agg(coalesce(nombre_de_pieza(v), v), ' + ' order by k)
                from jsonb_each_text(r.personalizacion) as x(k, v) where k ~ '^pieza_\d+$') ||
               coalesce(' · ' || (select string_agg(v, ', ') from jsonb_each_text(r.personalizacion) as x(k, v)
                                  where k ~ '__mes$'), '')
          else detalle_pieza_email(r.producto, r.personalizacion) end, '')) || '</div>', '') ||
      '</td></tr>', '' order by r.created_at, r.id),
    case max(r.moneda)
      when 'EUR' then replace(to_char(sum(r.precio_pagado::numeric), 'FM999990.00'), '.', ',') || ' €'
      when 'MXN' then '$' || to_char(sum(r.precio_pagado::numeric), 'FM999,990') || ' MXN'
      else '$' || to_char(sum(r.precio_pagado::numeric), 'FM999,990.00') || ' ' || coalesce(max(r.moneda), 'USD')
    end,
    'https://cozumeljewelry.es/comprar.html?carrito=' ||
      replace(replace(replace(encode(convert_to(
        jsonb_agg(jsonb_build_object(
          'producto', r.producto, 'cantidad', 1, 'mercado', r.mercado, 'moneda', r.moneda,
          'precio', r.precio_pagado::numeric, 'personalizacion', coalesce(r.personalizacion, '{}'::jsonb))
        order by r.created_at, r.id)::text, 'UTF8'), 'base64'), chr(10), ''), '+', '%2B'), '=', '%3D')
  into en, nombre, filas, total_texto, enlace
  from reservas r
  where coalesce(r.stripe_session_id, r.session_id::text, r.id::text) = ref;

  if filas is null then return; end if;

  asunto := case when en then 'Your piece is waiting for you · Cozumel Jewelry'
                 else 'Tu pieza te está esperando · Cozumel Jewelry' end;
  html :=
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F2F8F8; margin:0; padding:0;">' ||
    '<tr><td align="center" style="padding:32px 16px;">' ||
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background-color:#FFFFFF;">' ||
    '<tr><td align="center" style="background-color:#0B2E33; padding:28px 24px;">' ||
    '<img src="https://cozumeljewelry.es/img/email-logo.png" width="150" alt="Cozumel Jewelry" style="display:block; max-width:150px; width:150px; height:auto; border:0;">' ||
    '</td></tr>' ||
    '<tr><td style="padding:40px 32px 8px; font-family:Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#14454A;">' ||
    '<p style="margin:0 0 16px; font-family:Georgia,''Times New Roman'',serif; font-size:24px; text-align:center;">' ||
      case when en then 'Hi ' else 'Hola ' end || esc_html(coalesce(trim(nombre), '')) || '</p>' ||
    '<p style="margin:0 0 16px; text-align:center;">' ||
      case when en then 'Your order wasn''t completed, but we''ve saved your pieces for you. If your bank declined the card, this sometimes happens with international payments: try again with another card or PayPal.'
           else 'Tu pedido no llegó a completarse, pero te hemos guardado tus piezas. Si tu banco rechazó la tarjeta, a veces pasa con pagos internacionales: prueba otra vez con otra tarjeta o con PayPal.' end ||
    '</p>' ||
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' || filas ||
    '<tr><td style="padding:14px 0 0; text-align:right; font-size:15px;"><strong>Total: ' || total_texto || '</strong>' ||
      case when en then ' · shipping included' else ' · envío incluido' end || '</td></tr></table>' ||
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:28px 0 8px;">' ||
    '<a href="' || enlace || '" style="display:inline-block; background-color:#0B2E33; color:#FFFFFF; text-decoration:none; font-size:15px; padding:16px 32px; border-radius:5px;">' ||
      case when en then 'Complete my order' else 'Terminar mi compra' end || '</a>' ||
    '</td></tr></table>' ||
    '<p style="margin:16px 0 32px; text-align:center; font-size:13px; color:#4A6B6E;">' ||
      case when en then 'Any questions? Message us on <a href="https://wa.me/34604094868" style="color:#14454A;">WhatsApp</a> and we''ll help you.'
           else '¿Alguna duda? Escríbenos por <a href="https://wa.me/34604094868" style="color:#14454A;">WhatsApp</a> y te ayudamos.' end ||
    '</p>' ||
    '</td></tr></table></td></tr></table>';
end;
$function$;

create or replace function public.enviar_recordatorios_carrito()
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  resend_key text;
  g record;
  e record;
  n integer := 0;
begin
  select decrypted_secret into resend_key
  from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  if resend_key is null or resend_key = '' then
    raise warning 'enviar_recordatorios_carrito: falta "resend_api_key" en Vault';
    return 0;
  end if;

  -- El intento más reciente de cada email que cumpla las condiciones
  for g in
    select distinct on (lower(r.email))
      lower(r.email) as email,
      coalesce(r.stripe_session_id, r.session_id::text, r.id::text) as ref
    from reservas r
    where r.estado in ('pendiente_pago', 'pago_fallido')
      and r.consentimiento
      and r.email like '%@%'
      and r.recordatorio_enviado_en is null
      and r.created_at < now() - interval '1 hour'
      and r.created_at > now() - interval '48 hours'
      and not exists (select 1 from pedidos p
                      where lower(p.email) = lower(r.email)
                        and p.pagado_en > r.created_at - interval '1 hour')
      and not exists (select 1 from reservas r2
                      where lower(r2.email) = lower(r.email)
                        and r2.recordatorio_enviado_en > now() - interval '7 days')
    order by lower(r.email), r.created_at desc
  loop
    select * into e from email_recordatorio_carrito(g.ref);
    if e.html is not null then
      perform net.http_post(
        url := 'https://api.resend.com/emails',
        headers := jsonb_build_object('Authorization', 'Bearer ' || resend_key, 'Content-Type', 'application/json'),
        body := jsonb_build_object(
          'from', 'Cozumel Jewelry <pedidos@cozumeljewelry.es>',
          'to', array[g.email],
          'subject', e.asunto,
          'html', e.html));
      n := n + 1;
    end if;
    update reservas set recordatorio_enviado_en = now()
    where lower(email) = g.email
      and estado in ('pendiente_pago', 'pago_fallido')
      and recordatorio_enviado_en is null;
  end loop;
  return n;
end;
$function$;

revoke all on function public.email_recordatorio_carrito(text) from public, anon, authenticated;
revoke all on function public.enviar_recordatorios_carrito() from public, anon, authenticated;

-- Programación (se aplica aparte, al subir)
-- create extension if not exists pg_cron with schema pg_catalog;
-- select cron.schedule('recordatorio-carrito', '*/15 * * * *', 'select public.enviar_recordatorios_carrito()');
