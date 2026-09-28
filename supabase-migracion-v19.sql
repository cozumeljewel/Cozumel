-- =============================================================
-- MIGRACIÓN v19 · seguridad de la vista del proveedor + regalo de la
-- colección completa + lista de las 100 primeras compras (sorteo)
-- =============================================================


-- ---- 1. SEGURIDAD: pedidos_proveedor era legible por cualquiera ----
-- Una vista se ejecuta con los permisos de su dueño y se salta el RLS de
-- reservas. Con el GRANT por defecto de Supabase, cualquiera con la clave
-- pública (incluso sin iniciar sesión) podía leer TODOS los pedidos
-- pagados: nombre, dirección, email, WhatsApp. Visto el 2026-09-28, sin
-- pedidos reales todavía. Ahora solo se lee desde el panel de Supabase.
alter view public.pedidos_proveedor set (security_invoker = true);
revoke all on public.pedidos_proveedor from anon, authenticated;


-- ---- 2. Cuándo se pagó cada pieza ----
-- Hasta ahora solo había created_at (cuándo se empezó el pedido). Para
-- ordenar "las 100 primeras compras" hace falta el momento del pago.
alter table public.reservas add column if not exists pagado_en timestamptz;

create or replace function public.marcar_pagado_en()
returns trigger
language plpgsql
as $$
begin
  if new.estado = 'pagado' and old.estado is distinct from 'pagado' and new.pagado_en is null then
    new.pagado_en := now();
  end if;
  return new;
end;
$$;

drop trigger if exists marcar_pagado_en on public.reservas;
create trigger marcar_pagado_en
  before update of estado on public.reservas
  for each row execute function public.marcar_pagado_en();


-- ---- 3. Regalo por la colección completa (vídeo de Adri) ----
-- Quien reúne las 5 piezas (en uno o varios pedidos, sueltas o dentro de
-- un kit) lo desbloquea. Se detecta solo al pagar y se avisa por email al
-- negocio y al cliente. El vídeo lo graba Adri y se manda a mano.

-- Piezas sueltas que lleva una fila de reservas.
create or replace function public.piezas_de_fila(producto text, personalizacion jsonb)
returns text[]
language sql
immutable
as $$
  select case producto
    when 'kit_pedacito_nosotros' then array['collar_esencial', 'pulsera_vinculo']
    when 'kit_mi_consentida'     then array['collar_flor_natal', 'pulsera_nombre']
    when 'kit_personalizado'     then array_remove(array[personalizacion->>'pieza_1', personalizacion->>'pieza_2'], null)
    else array[producto]
  end;
$$;

create table if not exists public.coleccion_completa (
  user_id uuid primary key,
  completada_en timestamptz not null default now(),
  nombre text,
  email text,
  whatsapp text,
  pais text,
  video_enviado boolean not null default false
);
-- Sin políticas: solo se consulta desde el panel de Supabase.
alter table public.coleccion_completa enable row level security;
revoke all on public.coleccion_completa from anon, authenticated;

create or replace function public.revisar_coleccion_completa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resend_key text;
  cli record;
begin
  -- Nada de lo de aquí puede impedir que un pedido quede como pagado:
  -- cualquier fallo se queda en un aviso del registro.
  begin
    for cli in
      select distinct n.user_id
      from nuevas n
      join viejas v on v.id = n.id
      where n.estado = 'pagado'
        and v.estado is distinct from 'pagado'
        and n.user_id is not null
        and not exists (select 1 from public.coleccion_completa c where c.user_id = n.user_id)
    loop
      -- ¿Tiene ya las 5 piezas entre todo lo que ha pagado?
      if (
        select count(distinct pieza)
        from public.reservas r,
             unnest(public.piezas_de_fila(r.producto, r.personalizacion)) as pieza
        where r.user_id = cli.user_id
          and r.estado = 'pagado'
          and pieza in ('collar_esencial', 'pulsera_vinculo', 'pulsera_nombre', 'brazalete_mensaje', 'collar_flor_natal')
      ) = 5 then
        insert into public.coleccion_completa (user_id, nombre, email, whatsapp, pais)
        select r.user_id, r.nombre || ' ' || coalesce(r.apellidos, ''), r.email, r.whatsapp, r.pais
        from public.reservas r
        where r.user_id = cli.user_id and r.estado = 'pagado'
        order by r.pagado_en desc nulls last
        limit 1
        on conflict (user_id) do nothing;

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
                  'subject', '🎁 ' || c.nombre || ' ha completado la colección: toca el vídeo de Adri',
                  'html',
                    '<div style="font-family:Arial,sans-serif; color:#14454A; font-size:15px; line-height:1.6;">' ||
                    '<p><strong>' || c.nombre || '</strong> ya tiene las 5 piezas de la colección.</p>' ||
                    '<p>Email: ' || coalesce(c.email, '—') || '<br>WhatsApp: ' || coalesce(c.whatsapp, '—') ||
                    '<br>País: ' || coalesce(c.pais, '—') || '</p>' ||
                    '<p>Cuando Adri grabe y se envíe el vídeo, marca <em>video_enviado</em> en la tabla ' ||
                    '<strong>coleccion_completa</strong> de Supabase.</p></div>'
                )
                from public.coleccion_completa c where c.user_id = cli.user_id
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
                    '<div style="max-width:520px; margin:0 auto; padding:32px 24px; background:#F7F4EE; font-family:Georgia,''Times New Roman'',serif; color:#14454A; text-align:center;">' ||
                    '<img src="https://cozumeljewelry.es/img/email-logo.png" width="150" alt="Cozumel Jewelry" style="display:block; margin:0 auto 24px; width:150px; height:auto; border:0;">' ||
                    '<p style="font-size:22px; margin:0 0 16px;">Tienes las cinco piezas de <em>Un Pedacito de ti</em></p>' ||
                    '<p style="font-family:Arial,sans-serif; font-size:15px; line-height:1.6; color:#2E5357;">' ||
                    'Gracias por hacer tuya la colección entera. Como regalo, Adri va a grabarte un vídeo personal. ' ||
                    'Te lo enviaremos a este email en los próximos días.</p>' ||
                    '<p style="font-style:italic; font-size:16px; color:#A8873F; margin-top:24px;">Un pedacito de mí, para ti</p></div>'
                )
                from public.coleccion_completa c where c.user_id = cli.user_id
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
$$;

drop trigger if exists revisar_coleccion_completa on public.reservas;
create trigger revisar_coleccion_completa
  after update on public.reservas
  referencing new table as nuevas old table as viejas
  for each statement execute function public.revisar_coleccion_completa();


-- ---- 4. Las 100 primeras compras, para elegir a mano los 5 ganadores ----
-- Una fila por COMPRA (pedido), no por pieza, en orden de pago. Se abre
-- desde el panel: Table Editor → primeras_100_compras → Export CSV.
create or replace view public.primeras_100_compras
with (security_invoker = true) as
select
  row_number() over (order by min(r.pagado_en)) as numero,
  min(r.pagado_en)                              as pagado_en,
  max(r.nombre) || ' ' || coalesce(max(r.apellidos), '') as nombre,
  max(r.email)     as email,
  max(r.whatsapp)  as whatsapp,
  max(r.pais)      as pais,
  count(*)         as piezas,
  sum(r.precio_pagado) as total,
  max(r.moneda)    as moneda
from public.reservas r
where r.estado = 'pagado' and r.pagado_en is not null
group by coalesce(r.stripe_session_id, r.id::text)
order by min(r.pagado_en)
limit 100;

revoke all on public.primeras_100_compras from anon, authenticated;
