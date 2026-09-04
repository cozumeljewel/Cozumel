-- ============================================================
-- MIGRACIÓN v10 · carrito de varias piezas + acabado por pieza en kits
--
-- Pega esto en el SQL Editor de Supabase (proyecto "ADRI",
-- ddcrkglgdbasbxanbjkc) y pulsa Run.
--
-- NO hace falta tocar tablas ni políticas RLS: un pedido con varias
-- piezas sigue siendo varias filas de "reservas" (una por pieza), solo
-- que ahora pueden compartir un mismo stripe_session_id — el disparador
-- de abajo se ejecuta "for each row", así que sigue disparando un email
-- por fila (uno por pieza), cada una con su propio SKU resuelto. Un
-- pedido de 2 piezas manda 2 emails, no 1 con las 2 piezas juntas — es
-- una limitación conocida de esta versión, no un error.
--
-- Lo único que cambia de verdad es cómo se resuelve el SKU de los DOS
-- KITS: antes leían una sola clave "acabado" para el kit entero; ahora
-- cada pieza del kit tiene su propio selector en la ficha y su propia
-- clave en "personalizacion":
--   kit_pedacito_nosotros -> acabado__collar_esencial, acabado__pulsera_vinculo
--   kit_mi_consentida     -> acabado__collar_flor_natal, acabado__pulsera_nombre
-- Si faltan (pedidos de prueba de antes de este cambio), cae a la clave
-- "acabado" antigua compartida, y si tampoco existe, a "oro" — nunca se
-- rompe por un pedido viejo.
-- ============================================================

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
  grabado_texto text;
  fila_grabado record;
  acabado text;
  acabado_pieza1 text;
  acabado_pieza2 text;
  mes_valor text;
  mes_num int;
  tiene_grabado boolean;
  sku_pedido text;
begin
  select decrypted_secret into resend_key
  from vault.decrypted_secrets
  where name = 'resend_api_key'
  limit 1;

  if resend_key is null or resend_key = '' then
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

  grabado_texto := null;
  if new.personalizacion is not null and jsonb_typeof(new.personalizacion) = 'object' then
    for fila_grabado in
      select key, value from jsonb_each_text(new.personalizacion)
      where value is not null and trim(value) <> ''
    loop
      grabado_texto := coalesce(grabado_texto || '  ·  ', '') ||
        initcap(fila_grabado.key) || ': ' || fila_grabado.value;
    end loop;
  end if;

  -- ---------------------------------------------------------
  -- Resolución del SKU real de EMANCO para este pedido.
  -- Fuente: "SKU PRODUCTOS COLECCIÓN 1" (Yiwu Lantiao Jewelry Co.)
  -- ---------------------------------------------------------

  -- Pedidos de antes de que existiera el selector de acabado no traen
  -- esta clave: se asume oro (era el único que se enseñaba entonces).
  acabado := lower(coalesce(new.personalizacion->>'acabado', 'oro'));

  -- Acabado por pieza de los kits (nuevo en v10): si la ficha ya mandó
  -- las claves separadas, se usan; si no (pedido de prueba anterior a
  -- este cambio), cae al acabado único de entonces.
  acabado_pieza1 := lower(coalesce(
    new.personalizacion->>'acabado__collar_esencial',
    new.personalizacion->>'acabado__collar_flor_natal',
    new.personalizacion->>'acabado',
    'oro'
  ));
  acabado_pieza2 := lower(coalesce(
    new.personalizacion->>'acabado__pulsera_vinculo',
    new.personalizacion->>'acabado__pulsera_nombre',
    new.personalizacion->>'acabado',
    'oro'
  ));

  mes_valor := new.personalizacion->>'mes';
  mes_num := case mes_valor
    when 'enero'      then 1  when 'febrero'    then 2  when 'marzo'  then 3
    when 'abril'      then 4  when 'mayo'       then 5  when 'junio'  then 6
    when 'julio'      then 7  when 'agosto'     then 8  when 'septiembre' then 9
    when 'octubre'    then 10 when 'noviembre'  then 11 when 'diciembre'  then 12
    else null
  end;

  tiene_grabado :=
    coalesce(trim(new.personalizacion->>'nombre'), '')   <> '' or
    coalesce(trim(new.personalizacion->>'fecha'), '')    <> '' or
    coalesce(trim(new.personalizacion->>'mensaje'), '')  <> '' or
    coalesce(trim(new.personalizacion->>'grabado'), '')  <> '';

  sku_pedido := case new.producto

    when 'collar_esencial' then
      -- Se pide con el SKU combinado (no con los dos sub-SKU sueltos);
      -- el grabado va como línea aparte: "diaoke".
      (case when acabado = 'plata' then 'CDNN067-1' else 'CDNN067-2' end) ||
      (case when tiene_grabado then ' + diaoke' else '' end)

    when 'pulsera_vinculo' then
      case when acabado = 'plata' then 'YS14924A0W0' else 'YS14924D0W0' end

    when 'pulsera_nombre' then
      -- El sufijo -KZ ya lleva el grabado incluido: no añadir diaoke.
      case when acabado = 'plata' then 'YS15777A0W0-KZ' else 'YS15777D0W0-KZ' end

    when 'brazalete_mensaje' then
      -- El sufijo -KZ ya lleva el grabado incluido: no añadir diaoke.
      case when acabado = 'plata' then 'FZ28329A0W0-KZ' else 'FZ28329D0W0-KZ' end

    when 'collar_flor_natal' then
      case when mes_num is null then
        '⚠️ Falta el mes en el pedido — revisar a mano'
      else
        (case when acabado = 'plata' then 'XX49472A0W' else 'XX49472D0W' end) || mes_num::text
      end

    when 'kit_pedacito_nosotros' then
      -- Collar Esencia (acabado_pieza1) + Pulsera Dos Almas (acabado_pieza2).
      -- Pueden ir en acabados distintos: el collar en oro y la pulsera en
      -- plata a la vez, por ejemplo.
      (case when acabado_pieza1 = 'plata' then 'CDNN067-1' else 'CDNN067-2' end) ||
      ' + ' ||
      (case when acabado_pieza2 = 'plata' then 'YS14924A0W0' else 'YS14924D0W0' end) ||
      (case when tiene_grabado then ' + diaoke' else '' end)

    when 'kit_mi_consentida' then
      -- Collar Destino (acabado_pieza1 + mes) + Pulsera Mi Cielo
      -- (acabado_pieza2, el -KZ ya lleva grabado incluido).
      case when mes_num is null then
        '⚠️ Falta el mes en el pedido — revisar a mano'
      else
        (case when acabado_pieza1 = 'plata' then 'XX49472A0W' else 'XX49472D0W' end) || mes_num::text ||
        ' + ' ||
        (case when acabado_pieza2 = 'plata' then 'YS15777A0W0-KZ' else 'YS15777D0W0-KZ' end)
      end

    else '⚠️ Sin SKU asignado para "' || new.producto || '" — revisar a mano'
  end;

  -- ---- Email al cliente (sin cambios respecto a v9) ----
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Cozumel Jewelry <pedidos@cozumeljewelry.es>',
      'to', array[new.email],
      'subject', 'Hemos recibido tu pedido · Cozumel Jewelry',
      'html',
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F2F8F8; margin:0; padding:0;">' ||
      '<tr><td align="center" style="padding:32px 16px;">' ||
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background-color:#FFFFFF;">' ||

      -- Cabecera
      '<tr><td align="center" style="background-color:#0B2E33; padding:28px 24px;">' ||
      '<img src="https://cozumeljewelry.es/img/email-logo.png" width="150" alt="Cozumel Jewelry" style="display:block; max-width:150px; width:150px; height:auto; border:0;">' ||
      '</td></tr>' ||

      -- Contenido
      '<tr><td style="padding:40px 32px 8px;">' ||
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' ||
      '<td align="center" style="font-family:Helvetica,Arial,sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#2E6D70; padding-bottom:10px;">Pedido confirmado</td>' ||
      '</tr></table>' ||
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' ||
      '<td align="center" style="font-family:Georgia,''Times New Roman'',serif; font-weight:700; font-size:26px; line-height:1.25; color:#14454A; padding-bottom:20px;">Tu pedido está confirmado</td>' ||
      '</tr></table>' ||
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' ||
      '<tr><td align="center" style="font-family:Helvetica,Arial,sans-serif; font-size:15px; line-height:1.7; color:#12333A; padding-bottom:4px;">Hola, ' || new.nombre || ':</td></tr>' ||
      '<tr><td align="center" style="font-family:Helvetica,Arial,sans-serif; font-size:15px; line-height:1.7; color:#12333A; padding:8px 0 28px;">¡Gracias por confiar en Cozumel! Ya recibimos tu pago y estamos preparando tu pedido con mucho cariño. En cuanto esté listo, te lo enviamos a la dirección que nos diste.</td></tr>' ||
      '</table>' ||
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;"><tr>' ||
      '<td style="border-left:2px solid #C6A664; padding:2px 0 2px 18px;">' ||
      '<span style="font-family:Georgia,''Times New Roman'',serif; font-style:italic; font-size:17px; line-height:1.5; color:#2E6D70;">Porque no estás regalando solo una joya.<br>Estás regalando un pedacito de ti.</span>' ||
      '</td></tr></table>' ||
      '</td></tr>' ||

      -- Resumen del pedido
      '<tr><td style="padding:0 32px;">' ||
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #D8E8EA; border-bottom:1px solid #D8E8EA;">' ||
      '<tr><td style="padding:20px 0 8px; font-family:Helvetica,Arial,sans-serif; font-size:10.5px; letter-spacing:1.5px; text-transform:uppercase; color:#4A6B6E;">Tu pedido</td></tr>' ||
      '<tr><td style="padding:0 0 18px; font-family:Georgia,''Times New Roman'',serif; font-size:19px; color:#14454A;">' || nombre_producto || '</td></tr>' ||
      '<tr><td style="padding:10px 0; border-top:1px solid #F2F8F8;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' ||
      '<td style="font-family:Helvetica,Arial,sans-serif; font-size:13.5px; color:#4A6B6E;">Cantidad</td>' ||
      '<td align="right" style="font-family:Helvetica,Arial,sans-serif; font-size:13.5px; color:#12333A;">1 unidad</td>' ||
      '</tr></table></td></tr>' ||
      '<tr><td style="padding:10px 0; border-top:1px solid #F2F8F8;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' ||
      '<td style="font-family:Helvetica,Arial,sans-serif; font-size:13.5px; color:#4A6B6E;">Total pagado</td>' ||
      '<td align="right" style="font-family:Helvetica,Arial,sans-serif; font-size:13.5px; font-weight:bold; color:#14454A;">' || importe_texto || '</td>' ||
      '</tr></table></td></tr>' ||
      '<tr><td style="padding:10px 0 18px; border-top:1px solid #F2F8F8;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' ||
      '<td style="font-family:Helvetica,Arial,sans-serif; font-size:13.5px; color:#4A6B6E; vertical-align:top;">Enviamos a</td>' ||
      '<td align="right" style="font-family:Helvetica,Arial,sans-serif; font-size:13.5px; color:#12333A;">' || new.direccion_envio || '</td>' ||
      '</tr></table></td></tr>' ||
      case when grabado_texto is not null then
        '<tr><td style="padding:10px 0 18px; border-top:1px solid #F2F8F8;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' ||
        '<td style="font-family:Helvetica,Arial,sans-serif; font-size:13.5px; color:#4A6B6E; vertical-align:top;">Tu grabado</td>' ||
        '<td align="right" style="font-family:Georgia,''Times New Roman'',serif; font-style:italic; font-size:14px; color:#14454A;">' || grabado_texto || '</td>' ||
        '</tr></table></td></tr>'
      else '' end ||
      '</table>' ||
      '</td></tr>' ||

      -- Bloque emocional
      '<tr><td style="padding:32px 32px 8px;">' ||
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' ||
      '<tr><td align="center" style="font-family:Helvetica,Arial,sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#2E6D70; padding-bottom:10px;">Hecho especialmente para ti</td></tr>' ||
      '<tr><td align="center" style="font-family:Helvetica,Arial,sans-serif; font-size:14.5px; line-height:1.7; color:#4A6B6E; padding-bottom:6px;">Cada pieza de Cozumel lleva algo especial: una historia, un nombre, una fecha o unas palabras que solo significan algo para ustedes dos.</td></tr>' ||
      '<tr><td align="center" style="font-family:Helvetica,Arial,sans-serif; font-size:14.5px; line-height:1.7; color:#4A6B6E;">La tuya pronto estará lista. Te avisaremos en cuanto salga de nuestro taller.</td></tr>' ||
      '</table>' ||
      '</td></tr>' ||

      -- Footer
      '<tr><td align="center" style="padding:36px 32px 32px;">' ||
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' ||
      '<tr><td align="center" style="border-top:1px solid #D8E8EA; padding-top:24px; font-family:Georgia,''Times New Roman'',serif; font-weight:700; font-size:14px; letter-spacing:2px; text-transform:uppercase; color:#14454A; padding-bottom:8px;">Cozumel Jewelry</td></tr>' ||
      '<tr><td align="center" style="font-family:Georgia,''Times New Roman'',serif; font-style:italic; font-size:13px; color:#4A6B6E;">Somos un pedacito de lo que regalamos.</td></tr>' ||
      '</table>' ||
      '</td></tr>' ||

      '</table></td></tr></table>'
    )
  );

  -- ---- Email al negocio: con el SKU resuelto, en negrita ----
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Cozumel Jewelry <pedidos@cozumeljewelry.es>',
      'to', array['cozumeljewel@gmail.com'],
      'subject', 'Pedido pagado: ' || nombre_producto || ' (' || sku_pedido || ')',
      'html',
      '<div style="font-family:Arial,sans-serif; max-width:520px; margin:0 auto; color:#14454A;">' ||
      '<h2 style="font-size:18px;">Nuevo pedido pagado</h2>' ||
      '<div style="background:#F2F8F8; border:1px solid #C6A664; border-radius:4px; padding:14px 16px; margin-bottom:16px;">' ||
      '<div style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#4A6B6E; margin-bottom:4px;">SKU a pedir a EMANCO</div>' ||
      '<div style="font-size:16px; font-weight:bold; color:#14454A;">' || sku_pedido || '</div>' ||
      '</div>' ||
      '<table style="width:100%; font-size:13.5px; line-height:1.9;">' ||
      '<tr><td style="color:#4E9A9B; width:140px;">Pieza</td><td>' || nombre_producto || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Importe cobrado</td><td>' || importe_texto || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Cliente</td><td>' || new.nombre || ' ' || new.apellidos || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Email</td><td>' || new.email || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">WhatsApp</td><td>' || new.whatsapp || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">País</td><td>' || new.pais || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Dirección</td><td>' || new.direccion_envio || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Personalización</td><td>' || coalesce(grabado_texto, 'ninguna') || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B; vertical-align:top;">Referencia de pago</td><td style="font-size:11px; color:#4A6B6E;">' || coalesce(new.stripe_session_id, '—') || '</td></tr>' ||
      '</table>' ||
      '<p style="font-size:11.5px; color:#4A6B6E; margin-top:14px;">Si este pedido tenía más de una pieza, cada una llega en un email aparte con la "Referencia de pago" de arriba repetida — así se sabe que van juntas.</p>' ||
      '</div>'
    )
  );

  return new;
end;
$$;
