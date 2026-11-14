-- v45 (2026-11-14) · Email de confirmación: la pieza gratis del Black Friday
-- 3x2 (precio_pagado = 0) sale como "Gratis · 3x2" en vez de "0 MXN", también
-- en el aviso al negocio. Resto de la función igual que en producción.
CREATE OR REPLACE FUNCTION public.notificar_pedidos_pagados()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

declare

  resend_key text;

  ped record;

  moneda_ped text;

  filas_cliente text;

  filas_negocio text;

  asunto_negocio text;

  total_texto text;

begin

  select decrypted_secret into resend_key

  from vault.decrypted_secrets

  where name = 'resend_api_key'

  limit 1;



  if resend_key is null or resend_key = '' then

    raise warning 'notificar_pedidos_pagados: el secreto "resend_api_key" no está en Vault, no se envían emails';

    return null;

  end if;



  -- Un ciclo por pedido. "nuevas" y "viejas" son las filas que acaba de

  -- tocar el UPDATE (tablas de transición, declaradas en el trigger).

  for ped in

    select

      coalesce(n.stripe_session_id, n.id::text) as ref,

      max(n.nombre)          as nombre,

      max(n.apellidos)       as apellidos,

      max(n.email)           as email,

      max(n.whatsapp)        as whatsapp,

      max(n.pais)            as pais,
      max(n.mercado)         as mercado,

      max(n.direccion_envio) as direccion_envio,

      max(coalesce(n.moneda, 'EUR')) as moneda,

      sum(n.precio_pagado)   as total,

      count(*)               as piezas

    from nuevas n

    join viejas v on v.id = n.id

    where n.estado = 'pagado'

      and v.estado is distinct from 'pagado'

    group by coalesce(n.stripe_session_id, n.id::text)

  loop

    moneda_ped := coalesce(ped.moneda, 'EUR');

    -- Las monedas sin decimales (COP, CLP, ARS) se escriben en redondo.

    total_texto := case when moneda_ped in ('COP','CLP','ARS')

      then trim(to_char(ped.total, '999G999G999')) || ' ' || moneda_ped

      else trim(to_char(ped.total, '999999999D99')) || ' ' || moneda_ped

    end;



    -- Filas de la tabla del email al CLIENTE: pieza y, si lo hay, grabado.

    select string_agg(

      '<tr><td style="padding:12px 0; border-top:1px solid #F2F8F8;">' ||

      '<div style="font-family:Georgia,''Times New Roman'',serif; font-size:17px; color:#14454A;">' ||

        public.nombre_de_pieza(n.producto) || '</div>' ||

      coalesce('<div style="font-family:Georgia,''Times New Roman'',serif; font-style:italic; font-size:13.5px; color:#4A6B6E; padding-top:4px;">' ||

        public.grabado_legible(n.personalizacion) || '</div>', '') ||

      '</td></tr>', '' order by public.nombre_de_pieza(n.producto))

    into filas_cliente

    from nuevas n

    where coalesce(n.stripe_session_id, n.id::text) = ped.ref

      and n.estado = 'pagado';



    -- Filas del email al NEGOCIO: SKU en grande + acabados y grabado.

    select string_agg(

      '<tr><td style="padding:12px 0; border-top:1px solid #D8E8EA;">' ||

      '<div style="font-size:16px; font-weight:bold; color:#14454A;">' ||

        public.sku_de_pedido(n.producto, n.personalizacion) || '</div>' ||

      '<div style="font-size:13px; color:#4A6B6E; padding-top:3px;">' ||

        public.nombre_de_pieza(n.producto) ||

        coalesce(' · ' || public.grabado_legible(n.personalizacion), '') ||

      '</div></td>' ||

      '<td align="right" style="padding:12px 0; border-top:1px solid #D8E8EA; font-size:13.5px; color:#12333A; vertical-align:top;">' ||

        case when n.precio_pagado = 0 then 'Gratis (3x2)'
          else trim(to_char(n.precio_pagado, '999999999D99')) || ' ' || moneda_ped end || '</td></tr>', ''

      order by public.nombre_de_pieza(n.producto))

    into filas_negocio

    from nuevas n

    where coalesce(n.stripe_session_id, n.id::text) = ped.ref

      and n.estado = 'pagado';



    asunto_negocio := case

      when ped.piezas = 1 then

        'Pedido pagado: ' || (

          select public.nombre_de_pieza(n.producto) || ' (' ||

                 public.sku_de_pedido(n.producto, n.personalizacion) || ')'

          from nuevas n

          where coalesce(n.stripe_session_id, n.id::text) = ped.ref

            and n.estado = 'pagado'

          limit 1)

      else 'Pedido pagado: ' || ped.piezas || ' piezas · ' || total_texto

    end;



    -- ================= Email al CLIENTE (v38, 31/10/2026) =================
    -- Diseño de los emails de la colección de hombre. Plantilla con marcas
    -- {{...}}; los datos del cliente van escapados (esc_html).
    select string_agg(
      replace(replace(replace($tpl$        <tr><td colspan="2" style="padding:12px 0; border-top:1px solid #F1ECE3;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="top" style="font-family:Georgia, 'Times New Roman', serif; font-size:18px; color:#14454A;" class="t-verde">{{PIEZA}}<div style="padding-top:4px; font-family:Helvetica, Arial, sans-serif; font-size:13px; color:#7A8586;" class="t-gris">{{DETALLE}}</div></td>
            <td align="right" valign="top" style="font-family:Helvetica, Arial, sans-serif; font-size:14px; color:#2B3B3C; white-space:nowrap;" class="t-texto">{{PRECIO}}</td>
          </tr></table>
        </td></tr>$tpl$,
        '{{PIEZA}}', public.esc_html(public.nombre_de_pieza(n.producto))),
        '{{DETALLE}}', coalesce(public.esc_html(public.detalle_pieza_email(n.producto, n.personalizacion)), '')),
        '{{PRECIO}}', case when n.precio_pagado = 0 then 'Gratis · 3x2'
          when moneda_ped in ('COP','CLP','ARS')
          then trim(to_char(n.precio_pagado, '999G999G999')) || ' ' || moneda_ped
          else trim(to_char(n.precio_pagado, '999999999D99')) || ' ' || moneda_ped end),
      E'\n' order by public.nombre_de_pieza(n.producto))
    into filas_cliente
    from nuevas n
    where coalesce(n.stripe_session_id, n.id::text) = ped.ref
      and n.estado = 'pagado';

    perform net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || resend_key,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'from', 'Cozumel Jewelry <pedidos@cozumeljewelry.es>',
        'to', array[ped.email],
        'subject', 'Pedido confirmado · Cozumel Jewelry',
        'html',
        replace(replace(replace(replace(replace(replace(replace($tpl$<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<style>
  :root { color-scheme: light only; supported-color-schemes: light only; }
  [data-ogsb] .f-beige { background-color:#EFE9DF !important; }
  [data-ogsb] .f-blanco { background-color:#FFFFFF !important; }
  [data-ogsb] .f-crema { background-color:#F8F3E9 !important; }
  [data-ogsb] .f-oro { background-color:#B08A45 !important; }
  [data-ogsc] .t-verde { color:#14454A !important; }
  [data-ogsc] .t-texto { color:#2B3B3C !important; }
  [data-ogsc] .t-oro { color:#B08A45 !important; }
  [data-ogsc] .t-gris { color:#7A8586 !important; }
  [data-ogsc] .t-blanco { color:#FFFFFF !important; }
</style>
<title>Pedido confirmado · Cozumel Jewelry</title>
</head>
<body class="body" style="margin:0; padding:0; background:#EFE9DF;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">Hemos recibido tu pago. Ya estamos preparando tu pedido.&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="f-beige" style="background:#EFE9DF;">
<tr><td align="center" style="padding:28px 12px;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="f-blanco" style="max-width:560px; background:#FFFFFF; border-radius:4px; overflow:hidden;">

    <tr><td style="padding:0; line-height:0; font-size:0;">
      <a href="https://cozumeljewelry.es/" style="text-decoration:none;"><img src="https://cozumeljewelry.es/img/email-cabecera.jpg" width="560" alt="Cozumel Jewelry" style="display:block; width:100%; max-width:560px; height:auto; border:0;"></a>
    </td></tr>

    <tr><td style="padding:36px 36px 8px; font-family:Georgia, 'Times New Roman', serif; color:#14454A; text-align:center;">
      <p style="margin:0 0 6px; font-family:Helvetica, Arial, sans-serif; font-size:12px; letter-spacing:3px; text-transform:uppercase; color:#B08A45;" class="t-oro">Pedido confirmado</p>
      <h1 style="margin:0; font-weight:normal; font-size:34px; line-height:1.2; color:#14454A;" class="t-verde">Gracias, {{NOMBRE}}.</h1>
    </td></tr>

    <tr><td style="padding:18px 40px 0; font-family:Helvetica, Arial, sans-serif; font-size:16px; line-height:1.65; color:#2B3B3C; text-align:center;">
      <p style="margin:0; color:#2B3B3C;" class="t-texto">Hemos recibido tu pago y ya estamos preparando tu pedido. Te escribiremos en cuanto salga hacia ti.</p>
    </td></tr>

    <!-- Tu pedido -->
    <tr><td style="padding:30px 36px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #E6E0D5;">
        <tr><td colspan="2" style="padding:18px 0 6px; font-family:Helvetica, Arial, sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#7A8586;" class="t-gris">{{TITULO_PEDIDO}}</td></tr>
{{FILAS}}
        <tr>
          <td style="padding:14px 0; border-top:1px solid #E6E0D5; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; color:#14454A; white-space:nowrap;" class="t-verde">Total pagado</td>
          <td align="right" style="padding:14px 0; border-top:1px solid #E6E0D5; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; color:#14454A;" class="t-verde">{{TOTAL}}</td>
        </tr>
        <tr>
          <td valign="top" style="padding:12px 0; border-top:1px solid #E6E0D5; font-family:Helvetica, Arial, sans-serif; font-size:13.5px; color:#7A8586;" class="t-gris">Enviamos a</td>
          <td align="right" style="padding:12px 0; border-top:1px solid #E6E0D5; font-family:Helvetica, Arial, sans-serif; font-size:13.5px; color:#2B3B3C;" class="t-texto">{{DIRECCION}}</td>
        </tr>
        <tr>
          <td valign="top" style="padding:12px 0 16px; border-top:1px solid #E6E0D5; border-bottom:1px solid #E6E0D5; font-family:Helvetica, Arial, sans-serif; font-size:13.5px; color:#7A8586;" class="t-gris">Entrega</td>
          <td align="right" style="padding:12px 0 16px; border-top:1px solid #E6E0D5; border-bottom:1px solid #E6E0D5; font-family:Helvetica, Arial, sans-serif; font-size:13.5px; color:#2B3B3C;" class="t-texto">{{PLAZO}}</td>
        </tr>
      </table>
    </td></tr>

    <!-- Sorteo -->
    <tr><td align="center" style="padding:26px 40px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td class="f-crema" style="background:#F8F3E9; border:1px solid #C6A664; border-radius:4px; padding:16px 18px; font-family:Helvetica, Arial, sans-serif; font-size:15px; line-height:1.55; color:#7A5F2A; text-align:center;">✦ Con tu compra ya estás en el sorteo de <strong>5 videollamadas conmigo</strong> ✦</td></tr>
      </table>
    </td></tr>

    <!-- Botón -->
    <tr><td align="center" style="padding:26px 32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:440px;">
        <tr><td align="center" bgcolor="#B08A45" class="f-oro" style="border-radius:3px; background:#B08A45;">
          <a href="https://cozumeljewelry.es/productos.html?c=men" style="display:block; padding:18px 24px; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; letter-spacing:2px; text-transform:uppercase; color:#FFFFFF; text-decoration:none;" class="t-blanco">Ver la colección</a>
        </td></tr>
      </table>
    </td></tr>

    <!-- Firma -->
    <tr><td style="padding:30px 40px 36px; font-family:Georgia, 'Times New Roman', serif; text-align:center; color:#14454A;">
      <p style="margin:0 0 14px; font-size:17px; font-style:italic; color:#14454A;" class="t-verde">Gracias por estar desde el principio.</p>
      <p style="margin:0; font-size:20px; color:#14454A;" class="t-verde">Adri 🤍</p>
      <p style="margin:4px 0 0; font-family:Helvetica, Arial, sans-serif; font-size:11px; letter-spacing:4px; color:#B08A45;" class="t-oro">COZUMEL</p>
    </td></tr>

  </table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td style="padding:18px 20px 0; font-family:Helvetica, Arial, sans-serif; font-size:12px; line-height:1.5; color:#7A8586; text-align:center;" class="t-gris">
      ¿Alguna duda con tu pedido? <a href="https://cozumeljewelry.es/contacto.html" style="color:#7A8586;">Escríbenos</a>
    </td></tr>
  </table>

</td></tr>
</table>
</body>
</html>
$tpl$,
          '{{NOMBRE}}', coalesce(public.esc_html(split_part(trim(ped.nombre), ' ', 1)), '')),
          '{{TITULO_PEDIDO}}', case when ped.piezas = 1 then 'Tu pedido' else 'Tu pedido · ' || ped.piezas || ' piezas' end),
          '{{FILAS}}', coalesce(filas_cliente, '')),
          '{{TOTAL}}', total_texto),
          '{{DIRECCION}}', coalesce(public.esc_html(ped.direccion_envio), '—')),
          '{{PLAZO}}', coalesce(public.plazo_envio(ped.pais, ped.mercado) || ' días laborables desde que sale del taller', 'Te enviaremos el seguimiento en cuanto salga del taller')),
          '{{X}}', '')
      )
    );

    -- ================= Email al NEGOCIO =================

    perform net.http_post(

      url := 'https://api.resend.com/emails',

      headers := jsonb_build_object(

        'Authorization', 'Bearer ' || resend_key,

        'Content-Type', 'application/json'

      ),

      body := jsonb_build_object(

        'from', 'Cozumel Jewelry <pedidos@cozumeljewelry.es>',

        'to', array['cozumeljewel@gmail.com'],

        'subject', asunto_negocio,

        'html',

        '<div style="font-family:Arial,sans-serif; max-width:560px; margin:0 auto; color:#14454A;">' ||

        '<h2 style="font-size:18px;">Nuevo pedido pagado · ' || ped.piezas || ' pieza' || case when ped.piezas = 1 then '' else 's' end || '</h2>' ||



        '<div style="background:#F2F8F8; border:1px solid #C6A664; border-radius:4px; padding:14px 16px; margin-bottom:16px;">' ||

        '<div style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#4A6B6E; margin-bottom:6px;">SKU a pedir a EMANCO</div>' ||

        '<table style="width:100%;">' || coalesce(filas_negocio, '') || '</table>' ||

        '</div>' ||



        '<table style="width:100%; font-size:13.5px; line-height:1.9;">' ||

        '<tr><td style="color:#4E9A9B; width:140px;">Total cobrado</td><td>' || total_texto || '</td></tr>' ||

        '<tr><td style="color:#4E9A9B;">Cliente</td><td>' || ped.nombre || ' ' || coalesce(ped.apellidos, '') || '</td></tr>' ||

        '<tr><td style="color:#4E9A9B;">Email</td><td>' || ped.email || '</td></tr>' ||

        '<tr><td style="color:#4E9A9B;">WhatsApp</td><td>' || coalesce(ped.whatsapp, '—') || '</td></tr>' ||

        '<tr><td style="color:#4E9A9B;">País</td><td>' || coalesce(ped.pais, '—') || '</td></tr>' ||

        '<tr><td style="color:#4E9A9B;">Dirección</td><td>' || coalesce(ped.direccion_envio, '—') || '</td></tr>' ||

        '<tr><td style="color:#4E9A9B; vertical-align:top;">Referencia de pago</td><td style="font-size:11px; color:#4A6B6E;">' || ped.ref || '</td></tr>' ||

        '</table>' ||

        '<p style="font-size:11.5px; color:#4A6B6E; margin-top:14px;">Todas las piezas de este email van en el mismo pedido y al mismo envío. La lista completa, lista para exportar, está en la vista "pedidos_proveedor" de Supabase.</p>' ||

        '</div>'

      )

    );

  end loop;



  return null; -- disparador de sentencia: el valor devuelto no se usa

end;

$function$;
