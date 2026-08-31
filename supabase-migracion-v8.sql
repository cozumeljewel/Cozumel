-- ============================================================
-- MIGRACIÓN v8 · rediseño del email de confirmación de pedido
--
-- Pega esto en el SQL Editor de Supabase y pulsa Run.
--
-- Solo cambia el HTML del email al CLIENTE (el aviso interno al negocio
-- se deja igual: es una tabla de datos para gestionar, no necesita ser
-- bonita). Mismo disparador, mismos datos, ningún cambio de esquema.
--
-- Añade el grabado real al email cuando la pieza lo lleva (antes no
-- aparecía en ningún sitio): "personalizacion" es un jsonb con claves
-- como nombre/fecha/mensaje/mes según la pieza — se listan las que
-- tengan valor, sin inventar ninguna. Si la pieza no lleva grabado,
-- ese bloque no se muestra.
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

  -- Junta las claves con valor real del grabado (nombre, fecha, mensaje,
  -- mes...) en una sola línea legible, en el mismo orden en que vengan.
  -- Si no hay ninguna, se queda en null y ese bloque del email no sale.
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

  -- ---- Email al negocio (sin cambios: tabla de datos para gestionar) ----
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
      '<tr><td style="color:#4E9A9B;">Personalización</td><td>' || coalesce(grabado_texto, 'ninguna') || '</td></tr>' ||
      '</table></div>'
    )
  );

  return new;
end;
$$;
