-- v39 (2026-11-02) · Pedidos aparte de las reservas.
-- Al pagarse, cada fila de "reservas" se copia a "pedidos" (con la pieza,
-- el SKU y el detalle ya escritos) y, media hora después, se borra de
-- "reservas", que se queda solo con los intentos sin pagar. La media hora
-- es para que la página de "pago confirmado" (que consulta reservas justo
-- al volver de Stripe) y el webhook terminen antes de borrar.
-- El contador del sorteo, la lista para el proveedor y la colección
-- completa leen ahora de "pedidos".

create table if not exists public.pedidos (like public.reservas including defaults);
alter table public.pedidos add primary key (id);
alter table public.pedidos add column if not exists pieza text;
alter table public.pedidos add column if not exists sku text;
alter table public.pedidos add column if not exists detalle text;
alter table public.pedidos enable row level security;
revoke all on public.pedidos from anon, authenticated;

-- Copia al pagarse (fila a fila; corre antes que los avisos por email)
create or replace function public.copiar_a_pedidos()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.estado = 'pagado' and old.estado is distinct from 'pagado' then
    insert into public.pedidos
    select (new).*, public.nombre_de_pieza(new.producto),
           public.sku_de_pedido(new.producto, new.personalizacion),
           public.detalle_pieza_email(new.producto, new.personalizacion)
    on conflict (id) do nothing;
  end if;
  return null;
end $$;
drop trigger if exists copiar_a_pedidos on public.reservas;
create trigger copiar_a_pedidos after update of estado on public.reservas
  for each row execute function public.copiar_a_pedidos();

-- Limpieza: en cada reserva nueva se borran de "reservas" las pagadas hace
-- más de 30 minutos que ya están en "pedidos"
create or replace function public.limpiar_reservas_pagadas()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  delete from public.reservas r
  where r.estado = 'pagado'
    and r.pagado_en < now() - interval '30 minutes'
    and exists (select 1 from public.pedidos p where p.id = r.id);
  return null;
end $$;
drop trigger if exists limpiar_reservas_pagadas on public.reservas;
create trigger limpiar_reservas_pagadas after insert on public.reservas
  for each statement execute function public.limpiar_reservas_pagadas();

-- Los ya pagados, a pedidos
insert into public.pedidos
select r.*, public.nombre_de_pieza(r.producto), public.sku_de_pedido(r.producto, r.personalizacion),
       public.detalle_pieza_email(r.producto, r.personalizacion)
from public.reservas r where r.estado = 'pagado'
on conflict (id) do nothing;

-- Vistas: de "pedidos"
create or replace view public.pedidos_proveedor as
  SELECT created_at AS fecha,
    stripe_session_id AS pedido,
    nombre_de_pieza(producto) AS pieza,
    sku_de_pedido(producto, personalizacion) AS sku_a_pedir,
    COALESCE((personalizacion ->> 'acabado__collar_esencial'::text), (personalizacion ->> 'acabado__collar_flor_natal'::text), (personalizacion ->> 'acabado'::text)) AS acabado_collar,
    COALESCE((personalizacion ->> 'acabado__pulsera_vinculo'::text), (personalizacion ->> 'acabado__pulsera_nombre'::text), (personalizacion ->> 'acabado'::text)) AS acabado_pulsera,
    (personalizacion ->> 'mes'::text) AS mes,
    grabado_legible(personalizacion) AS grabado,
    precio_pagado AS importe,
    COALESCE(moneda, 'EUR'::text) AS moneda,
    COALESCE(mercado, 'ES'::text) AS mercado,
    nombre, apellidos, email, whatsapp, direccion_envio, pais,
    personalizacion AS personalizacion_completa,
    id AS fila_id
   FROM pedidos r
  WHERE (estado = 'pagado'::text)
  ORDER BY created_at DESC;

create or replace view public.primeras_100_compras as
  SELECT row_number() OVER (ORDER BY (min(pagado_en))) AS numero,
    min(pagado_en) AS pagado_en,
    ((max(nombre) || ' '::text) || COALESCE(max(apellidos), ''::text)) AS nombre,
    max(email) AS email, max(whatsapp) AS whatsapp, max(pais) AS pais,
    count(*) AS piezas, sum(precio_pagado) AS total, max(moneda) AS moneda
   FROM pedidos r
  WHERE ((estado = 'pagado'::text) AND (pagado_en IS NOT NULL) AND (pagado_en >= '2026-10-03 03:00:00+00'::timestamp with time zone))
  GROUP BY COALESCE(stripe_session_id, (id)::text)
  ORDER BY (min(pagado_en))
 LIMIT 100;

-- La colección completa (regalo de las 5 piezas) cuenta lo pagado en "pedidos"
CREATE OR REPLACE FUNCTION public.revisar_coleccion_completa()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  resend_key text;
  cli record;
begin
  -- Nada de lo de aquí puede impedir que un pedido quede como pagado:
  -- cualquier fallo se queda en un aviso del registro.
  begin
    for cli in
      select distinct lower(trim(n.email)) as email
      from nuevas n
      join viejas v on v.id = n.id
      where n.estado = 'pagado'
        and v.estado is distinct from 'pagado'
        and coalesce(trim(n.email), '') <> ''
        and not exists (select 1 from public.coleccion_completa c where c.email = lower(trim(n.email)))
    loop
      -- ¿Tiene ya las 5 piezas entre todo lo que ha pagado?
      if (
        select count(distinct pieza)
        from public.pedidos r,
             unnest(public.piezas_de_fila(r.producto, r.personalizacion)) as pieza
        where lower(trim(r.email)) = cli.email
          and r.estado = 'pagado'
          and pieza in ('collar_esencial', 'pulsera_vinculo', 'pulsera_nombre', 'brazalete_mensaje', 'collar_flor_natal')
      ) = 5 then
        insert into public.coleccion_completa (email, nombre, whatsapp, pais)
        select cli.email, r.nombre || ' ' || coalesce(r.apellidos, ''), r.whatsapp, r.pais
        from public.pedidos r
        where lower(trim(r.email)) = cli.email and r.estado = 'pagado'
        order by r.pagado_en desc nulls last
        limit 1
        on conflict (email) do nothing;

        if found then
          select decrypted_secret into resend_key
          from vault.decrypted_secrets where name = 'resend_api_key' limit 1;

          if resend_key is not null and resend_key <> '' then
            -- Al negocio: toca grabar el vídeo.
            perform net.http_post(
              url := 'https://api.resend.com/emails',
              headers := jsonb_build_object('Authorization', 'Bearer ' || resend_key, 'Content-Type', 'application/json'),
              body := (
                select jsonb_build_object(
                  'from', 'Cozumel Jewelry <pedidos@cozumeljewelry.es>',
                  'to', array['cozumeljewel@gmail.com'],
                  'subject', '🎁 ' || c.nombre || ' ha completado la colección: toca el regalo sorpresa de Adri',
                  'html',
                    '<div style="font-family:Arial,sans-serif; color:#14454A; font-size:15px; line-height:1.6;">' ||
                    '<p><strong>' || c.nombre || '</strong> ya tiene las 5 piezas de la colección.</p>' ||
                    '<p>Email: ' || coalesce(c.email, '—') || '<br>WhatsApp: ' || coalesce(c.whatsapp, '—') ||
                    '<br>País: ' || coalesce(c.pais, '—') || '</p>' ||
                    '<p>Cuando se envíe el regalo sorpresa, marca <em>video_enviado</em> en la tabla ' ||
                    '<strong>coleccion_completa</strong> de Supabase.</p></div>'
                )
                from public.coleccion_completa c where c.email = cli.email
              )
            );

            -- Al cliente: lo ha desbloqueado.
            perform net.http_post(
              url := 'https://api.resend.com/emails',
              headers := jsonb_build_object('Authorization', 'Bearer ' || resend_key, 'Content-Type', 'application/json'),
              body := (
                select jsonb_build_object(
                  'from', 'Cozumel Jewelry <pedidos@cozumeljewelry.es>',
                  'to', array[c.email],
                  'subject', 'Has completado la colección. Adri tiene algo para ti',
                  'html',
                    '<!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><style>:root{color-scheme:light only;}</style></head><body style="margin:0; background:#F7F4EE;">' ||
                    '<div style="max-width:520px; margin:0 auto; padding:32px 24px; background:#F7F4EE; font-family:Georgia,''Times New Roman'',serif; color:#14454A; text-align:center;">' ||
                    '<img src="https://cozumeljewelry.es/img/email-logo.png" width="150" alt="Cozumel Jewelry" style="display:block; margin:0 auto 24px; width:150px; height:auto; border:0;">' ||
                    '<p style="font-size:22px; margin:0 0 16px;">Tienes las cinco piezas de la colección</p>' ||
                    '<p style="font-family:Arial,sans-serif; font-size:15px; line-height:1.6; color:#2E5357;">' ||
                    'Gracias por hacer tuya la colección entera. Como agradecimiento, Adri te enviará un regalo sorpresa. ' ||
                    'Te escribiremos para coordinar el envío.</p>' ||
                    '<p style="font-style:italic; font-size:16px; color:#A8873F; margin-top:24px;">De Adri, para ti</p></div></body></html>'
                )
                from public.coleccion_completa c where c.email = cli.email
              )
            );
          end if;
        end if;
      end if;
    end loop;
  exception when others then
    raise warning 'revisar_coleccion_completa: %', sqlerrm;
  end;
  return null;
end;
$function$;
