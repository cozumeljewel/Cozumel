-- ============================================================
-- MIGRACIÓN v14 · precios internacionales (mercado y moneda)
--
-- Pega esto en el SQL Editor de Supabase y pulsa Run.
--
-- Qué cambia:
--   1) "reservas" gana dos columnas: mercado ('MX','ES','US'...) y moneda
--      ('MXN','EUR','USD'...). Las rellena crear-sesion-pago al cobrar,
--      con el precio que ella misma recalcula (el navegador nunca decide
--      el importe).
--   2) La vista pedidos_proveedor enseña esas dos columnas, para que al
--      exportar se vea en qué moneda se cobró cada pedido.
--   3) El email de pedido pagado deja de escribir "€" a secas y usa la
--      moneda real del pedido.
--
-- Los pedidos anteriores no tienen estas columnas rellenas: se muestran
-- como EUR, que es lo que se cobraba entonces.
-- ============================================================

alter table public.reservas
  add column if not exists mercado text,
  add column if not exists moneda text;

comment on column public.reservas.mercado is 'Mercado del pedido: MX, US, ES, CO, CL, PE, AR. Lo fija crear-sesion-pago.';
comment on column public.reservas.moneda is 'Moneda cobrada: MXN, USD, EUR, COP, CLP, PEN, ARS.';


-- ---- Vista de exportación, con mercado y moneda ----
drop view if exists public.pedidos_proveedor;

create view public.pedidos_proveedor as
select
  r.created_at                                        as fecha,
  r.stripe_session_id                                 as pedido,
  public.nombre_de_pieza(r.producto)                  as pieza,
  public.sku_de_pedido(r.producto, r.personalizacion) as sku_a_pedir,
  coalesce(r.personalizacion->>'acabado__collar_esencial',
           r.personalizacion->>'acabado__collar_flor_natal',
           r.personalizacion->>'acabado')             as acabado_collar,
  coalesce(r.personalizacion->>'acabado__pulsera_vinculo',
           r.personalizacion->>'acabado__pulsera_nombre',
           r.personalizacion->>'acabado')             as acabado_pulsera,
  r.personalizacion->>'mes'                           as mes,
  public.grabado_legible(r.personalizacion)           as grabado,
  r.precio_pagado                                     as importe,
  coalesce(r.moneda, 'EUR')                           as moneda,
  coalesce(r.mercado, 'ES')                           as mercado,
  r.nombre,
  r.apellidos,
  r.email,
  r.whatsapp,
  r.direccion_envio,
  r.pais,
  r.personalizacion                                   as personalizacion_completa,
  r.id                                                as fila_id
from public.reservas r
where r.estado = 'pagado'
order by r.created_at desc;

comment on view public.pedidos_proveedor is
  'Pedidos pagados listos para exportar a CSV y pedir a EMANCO. Una fila por pieza; sku_a_pedir ya viene resuelto con acabado, mes y grabado, e importe/moneda son los realmente cobrados.';

grant select on public.pedidos_proveedor to authenticated;


-- ---- El email, con la moneda del pedido ----
-- ---- El disparador, ahora por PEDIDO ----
create or replace function public.notificar_pedidos_pagados()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
        trim(to_char(n.precio_pagado, '999999999D99')) || ' ' || moneda_ped || '</td></tr>', ''
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

    -- ================= Email al CLIENTE =================
    perform net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || resend_key,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'from', 'Cozumel Jewelry <pedidos@cozumeljewelry.es>',
        'to', array[ped.email],
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
        '<tr><td align="center" style="font-family:Helvetica,Arial,sans-serif; font-size:15px; line-height:1.7; color:#12333A; padding-bottom:4px;">Hola, ' || ped.nombre || ':</td></tr>' ||
        '<tr><td align="center" style="font-family:Helvetica,Arial,sans-serif; font-size:15px; line-height:1.7; color:#12333A; padding:8px 0 28px;">¡Gracias por confiar en Cozumel! Ya recibimos tu pago y estamos preparando tu pedido con mucho cariño. En cuanto esté listo, te lo enviamos a la dirección que nos diste.</td></tr>' ||
        '</table>' ||
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;"><tr>' ||
        '<td style="border-left:2px solid #C6A664; padding:2px 0 2px 18px;">' ||
        '<span style="font-family:Georgia,''Times New Roman'',serif; font-style:italic; font-size:17px; line-height:1.5; color:#2E6D70;">Porque no estás regalando solo una joya.<br>Estás regalando un pedacito de ti.</span>' ||
        '</td></tr></table>' ||
        '</td></tr>' ||

        -- Resumen: TODAS las piezas del pedido
        '<tr><td style="padding:0 32px;">' ||
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #D8E8EA; border-bottom:1px solid #D8E8EA;">' ||
        '<tr><td style="padding:20px 0 4px; font-family:Helvetica,Arial,sans-serif; font-size:10.5px; letter-spacing:1.5px; text-transform:uppercase; color:#4A6B6E;">' ||
          case when ped.piezas = 1 then 'Tu pedido' else 'Tu pedido · ' || ped.piezas || ' piezas' end ||
        '</td></tr>' ||
        coalesce(filas_cliente, '') ||
        '<tr><td style="padding:12px 0; border-top:1px solid #F2F8F8;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' ||
        '<td style="font-family:Helvetica,Arial,sans-serif; font-size:13.5px; color:#4A6B6E;">Total pagado</td>' ||
        '<td align="right" style="font-family:Helvetica,Arial,sans-serif; font-size:13.5px; font-weight:bold; color:#14454A;">' || total_texto || '</td>' ||
        '</tr></table></td></tr>' ||
        '<tr><td style="padding:12px 0 18px; border-top:1px solid #F2F8F8;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' ||
        '<td style="font-family:Helvetica,Arial,sans-serif; font-size:13.5px; color:#4A6B6E; vertical-align:top;">Enviamos a</td>' ||
        '<td align="right" style="font-family:Helvetica,Arial,sans-serif; font-size:13.5px; color:#12333A;">' || coalesce(ped.direccion_envio, '—') || '</td>' ||
        '</tr></table></td></tr>' ||
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
        '<tr><td align="center" style="font-family:Georgia,''Times New Roman'',serif; font-style:italic; font-size:13px; color:#4A6B6E;">Un pedacito de lo que regalamos.</td></tr>' ||
        '</table>' ||
        '</td></tr>' ||

        '</table></td></tr></table>'
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
$$;


-- ---- Cambio de disparador: de "por fila" a "por sentencia" ----
-- "referencing new table / old table" es lo que deja ver todas las filas
-- que acaba de tocar el UPDATE, que es lo que permite agruparlas por
-- pedido. Se quita el antiguo para que no envíe también su copia.
drop trigger if exists notificar_pedido_pagado on public.reservas;
drop trigger if exists notificar_pedidos_pagados on public.reservas;

-- Sin "of estado": Postgres no admite tablas de transición en un
-- disparador limitado a una columna ("transition tables cannot be
-- specified for triggers with column lists"). No cambia nada en la
-- práctica: salta en cualquier UPDATE, pero la función solo manda email
-- por las filas que ACABAN de pasar a 'pagado' (el join con "viejas"),
-- así que un update de dirección o de cualquier otro campo no envía nada.
create trigger notificar_pedidos_pagados
  after update on public.reservas
  referencing new table as nuevas old table as viejas
  for each statement
  execute function public.notificar_pedidos_pagados();

-- La función antigua (por fila) se queda sin usar; se puede borrar:
-- drop function if exists public.notificar_pedido_pagado();
