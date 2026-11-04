-- v41 (2026-11-03) · Email automático de carrito abandonado.
-- Quien rellena sus datos y llega a Stripe pero no paga (o el banco le
-- rechaza la tarjeta) recibe, pasada 1 hora, un email con sus piezas y un
-- botón que le devuelve a comprar.html con el carrito ya lleno
-- (?carrito=…, el mismo formato que "Copiar enlace"; ver script.js).
-- Un solo email por persona cada 7 días, nunca si ya compró, y solo con
-- su consentimiento. Lo lanza pg_cron cada 15 minutos (al final).

alter table public.reservas add column if not exists recordatorio_enviado_en timestamptz;

-- Lo pendiente de antes del 3/11 por la tarde se da por avisado (a esos
-- se les escribió a mano por WhatsApp).
update public.reservas set recordatorio_enviado_en = now()
where estado in ('pendiente_pago', 'pago_fallido') and recordatorio_enviado_en is null
  and created_at < '2026-11-03 20:00+00';

-- El email de un intento (ref = stripe_session_id, o session_id/id si no
-- llegó a Stripe): asunto y HTML, con el diseño del email de confirmación
-- de compra (cabecera del chile con el logo). Aparte para poder verlo sin
-- enviarlo. Inglés para el mercado US.
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
  mon text;
begin
  select max(r.mercado) = 'US', max(r.nombre), max(r.moneda)
  into en, nombre, mon
  from reservas r where coalesce(r.stripe_session_id, r.session_id::text, r.id::text) = ref;
  if mon is null then return; end if;

  select
    string_agg(
      replace(replace(replace($tpl$        <tr><td colspan="2" style="padding:12px 0; border-top:1px solid #F1ECE3;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="top" style="font-family:Georgia, 'Times New Roman', serif; font-size:18px; color:#14454A;" class="t-verde">{{PIEZA}}<div style="padding-top:4px; font-family:Helvetica, Arial, sans-serif; font-size:13px; color:#7A8586;" class="t-gris">{{DETALLE}}</div></td>
            <td align="right" valign="top" style="font-family:Helvetica, Arial, sans-serif; font-size:14px; color:#2B3B3C; white-space:nowrap;" class="t-texto">{{PRECIO}}</td>
          </tr></table>
        </td></tr>$tpl$,
        '{{PIEZA}}', esc_html(coalesce(nombre_de_pieza(r.producto), r.producto))),
        '{{DETALLE}}', coalesce(esc_html(nullif(case when r.personalizacion ? 'pieza_1'
          -- Kit: los nombres de sus piezas (y el mes de la flor, si lo hay)
          then (select string_agg(coalesce(nombre_de_pieza(v), v), ' + ' order by k)
                from jsonb_each_text(r.personalizacion) as x(k, v) where k ~ '^pieza_\d+$') ||
               coalesce(' · ' || (select string_agg(v, ', ') from jsonb_each_text(r.personalizacion) as x(k, v)
                                  where k ~ '__mes$'), '')
          else detalle_pieza_email(r.producto, r.personalizacion) end, '')), '')),
        '{{PRECIO}}', case when mon in ('MXN','COP','CLP','ARS')
          then '$' || to_char(r.precio_pagado::numeric, 'FM999,999,990') else to_char(r.precio_pagado::numeric, 'FM999999990.00') end || ' ' || mon),
      E'\n' order by r.created_at, r.id),
    case when mon in ('MXN','COP','CLP','ARS')
      then '$' || to_char(sum(r.precio_pagado::numeric), 'FM999,999,990') else to_char(sum(r.precio_pagado::numeric), 'FM999999990.00') end || ' ' || mon,
    'https://cozumeljewelry.es/comprar.html?carrito=' ||
      replace(replace(replace(encode(convert_to(
        jsonb_agg(jsonb_build_object(
          'producto', r.producto, 'cantidad', 1, 'mercado', r.mercado, 'moneda', r.moneda,
          'precio', r.precio_pagado::numeric, 'personalizacion', coalesce(r.personalizacion, '{}'::jsonb))
        order by r.created_at, r.id)::text, 'UTF8'), 'base64'), chr(10), ''), '+', '%2B'), '=', '%3D')
  into filas, total_texto, enlace
  from reservas r
  where coalesce(r.stripe_session_id, r.session_id::text, r.id::text) = ref;

  asunto := case when en then 'Your pieces are waiting for you · Cozumel Jewelry'
                 else 'Tus piezas te están esperando · Cozumel Jewelry' end;
  html := replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace($tpl$<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<style>
  :root { color-scheme: light only; supported-color-schemes: light only; }
  [data-ogsb] .f-beige { background-color:#EFE9DF !important; }
  [data-ogsb] .f-blanco { background-color:#FFFFFF !important; }
  [data-ogsb] .f-oro { background-color:#B08A45 !important; }
  [data-ogsc] .t-verde { color:#14454A !important; }
  [data-ogsc] .t-texto { color:#2B3B3C !important; }
  [data-ogsc] .t-oro { color:#B08A45 !important; }
  [data-ogsc] .t-gris { color:#7A8586 !important; }
  [data-ogsc] .t-blanco { color:#FFFFFF !important; }
</style>
</head>
<body class="body" style="margin:0; padding:0; background:#EFE9DF;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">{{PREHEADER}}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="f-beige" style="background:#EFE9DF;">
<tr><td align="center" style="padding:28px 12px;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="f-blanco" style="max-width:560px; background:#FFFFFF; border-radius:4px; overflow:hidden;">

    <tr><td style="padding:0; line-height:0; font-size:0;">
      <a href="https://cozumeljewelry.es/" style="text-decoration:none;"><img src="https://cozumeljewelry.es/img/email-cabecera.jpg" width="560" alt="Cozumel Jewelry" style="display:block; width:100%; max-width:560px; height:auto; border:0;"></a>
    </td></tr>

    <tr><td style="padding:36px 36px 8px; font-family:Georgia, 'Times New Roman', serif; color:#14454A; text-align:center;">
      <p style="margin:0 0 6px; font-family:Helvetica, Arial, sans-serif; font-size:12px; letter-spacing:3px; text-transform:uppercase; color:#B08A45;" class="t-oro">{{ANTETITULO}}</p>
      <h1 style="margin:0; font-weight:normal; font-size:34px; line-height:1.2; color:#14454A;" class="t-verde">{{SALUDO}}</h1>
    </td></tr>

    <tr><td style="padding:18px 40px 0; font-family:Helvetica, Arial, sans-serif; font-size:16px; line-height:1.65; color:#2B3B3C; text-align:center;">
      <p style="margin:0; color:#2B3B3C;" class="t-texto">{{TEXTO}}</p>
    </td></tr>

    <tr><td style="padding:30px 36px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #E6E0D5;">
        <tr><td colspan="2" style="padding:18px 0 6px; font-family:Helvetica, Arial, sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#7A8586;" class="t-gris">{{TITULO_PEDIDO}}</td></tr>
{{FILAS}}
        <tr>
          <td valign="top" style="padding:14px 0 16px; border-top:1px solid #E6E0D5; border-bottom:1px solid #E6E0D5; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; color:#14454A; white-space:nowrap;" class="t-verde">Total</td>
          <td align="right" style="padding:14px 0 16px; border-top:1px solid #E6E0D5; border-bottom:1px solid #E6E0D5; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; color:#14454A;" class="t-verde">{{TOTAL}}<div style="padding-top:2px; font-size:12px; font-weight:normal; color:#7A8586;" class="t-gris">{{ENVIO}}</div></td>
        </tr>
      </table>
    </td></tr>

    <tr><td align="center" style="padding:28px 32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:440px;">
        <tr><td align="center" bgcolor="#B08A45" class="f-oro" style="border-radius:3px; background:#B08A45;">
          <a href="{{ENLACE}}" style="display:block; padding:18px 24px; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; letter-spacing:2px; text-transform:uppercase; color:#FFFFFF; text-decoration:none;" class="t-blanco">{{BOTON}}</a>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:30px 40px 36px; font-family:Georgia, 'Times New Roman', serif; text-align:center; color:#14454A;">
      <p style="margin:0; font-size:20px; color:#14454A;" class="t-verde">Adri</p>
      <p style="margin:4px 0 0; font-family:Helvetica, Arial, sans-serif; font-size:11px; letter-spacing:4px; color:#B08A45;" class="t-oro">COZUMEL</p>
    </td></tr>

  </table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td style="padding:18px 20px 0; font-family:Helvetica, Arial, sans-serif; font-size:12px; line-height:1.5; color:#7A8586; text-align:center;" class="t-gris">
      {{AYUDA}}
    </td></tr>
  </table>

</td></tr>
</table>
</body>
</html>$tpl$,
    '{{PREHEADER}}', case when en then 'We saved your pieces. Complete your order whenever you like.'
                          else 'Te hemos guardado tus piezas. Termina tu compra cuando quieras.' end),
    '{{ANTETITULO}}', case when en then 'Your cart' else 'Tu carrito' end),
    '{{SALUDO}}', case when en then 'Hi' else 'Hola' end || coalesce(', ' || esc_html(split_part(nullif(trim(nombre), '—'), ' ', 1)), '') || '.'),
    '{{TEXTO}}', case when en then 'Your order wasn''t completed, but we''ve saved your pieces for you. If your bank declined the card, this sometimes happens with international payments: try again with another card or with PayPal.'
                      else 'Tu pedido no llegó a completarse, pero te hemos guardado tus piezas. Si tu banco rechazó la tarjeta, a veces pasa con pagos internacionales: prueba otra vez con otra tarjeta o con PayPal.' end),
    '{{TITULO_PEDIDO}}', case when en then 'Your pieces' else 'Tus piezas' end),
    '{{FILAS}}', coalesce(filas, '')),
    '{{TOTAL}}', total_texto),
    '{{ENVIO}}', case when en then 'Shipping included' else 'Envío incluido' end),
    '{{ENLACE}}', enlace),
    '{{BOTON}}', case when en then 'Complete my order' else 'Terminar mi compra' end),
    '{{AYUDA}}', case when en then 'Any questions? <a href="https://wa.me/34604094868" style="color:#7A8586;">Message us on WhatsApp</a>'
                      else '¿Alguna duda? <a href="https://wa.me/34604094868" style="color:#7A8586;">Escríbenos por WhatsApp</a>' end);
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

-- Programación (activada el 3/11 a las 21:10)
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('recordatorio-carrito', '*/15 * * * *', 'select public.enviar_recordatorios_carrito()');
