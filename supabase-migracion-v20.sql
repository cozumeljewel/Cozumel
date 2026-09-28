-- =============================================================
-- MIGRACIÓN v20 · el regalo de la colección completa se suma por EMAIL
--
-- Desde hoy se compra sin cuenta de Google (sesión anónima de Supabase:
-- Google bloquea su login dentro de Instagram y TikTok). Cada compra
-- puede venir de una sesión distinta, así que las piezas de la colección
-- se acumulan por el email del pedido, no por user_id.
-- La tabla estaba vacía: se rehace con el email como clave.
-- =============================================================

drop table if exists public.coleccion_completa;
create table public.coleccion_completa (
  email text primary key,          -- en minúsculas
  completada_en timestamptz not null default now(),
  nombre text,
  whatsapp text,
  pais text,
  video_enviado boolean not null default false
);
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
        from public.reservas r,
             unnest(public.piezas_de_fila(r.producto, r.personalizacion)) as pieza
        where lower(trim(r.email)) = cli.email
          and r.estado = 'pagado'
          and pieza in ('collar_esencial', 'pulsera_vinculo', 'pulsera_nombre', 'brazalete_mensaje', 'collar_flor_natal')
      ) = 5 then
        insert into public.coleccion_completa (email, nombre, whatsapp, pais)
        select cli.email, r.nombre || ' ' || coalesce(r.apellidos, ''), r.whatsapp, r.pais
        from public.reservas r
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
                  'subject', '🎁 ' || c.nombre || ' ha completado la colección: toca el vídeo de Adri',
                  'html',
                    '<div style="font-family:Arial,sans-serif; color:#14454A; font-size:15px; line-height:1.6;">' ||
                    '<p><strong>' || c.nombre || '</strong> ya tiene las 5 piezas de la colección.</p>' ||
                    '<p>Email: ' || coalesce(c.email, '—') || '<br>WhatsApp: ' || coalesce(c.whatsapp, '—') ||
                    '<br>País: ' || coalesce(c.pais, '—') || '</p>' ||
                    '<p>Cuando Adri grabe y se envíe el vídeo, marca <em>video_enviado</em> en la tabla ' ||
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
                    '<div style="max-width:520px; margin:0 auto; padding:32px 24px; background:#F7F4EE; font-family:Georgia,''Times New Roman'',serif; color:#14454A; text-align:center;">' ||
                    '<img src="https://cozumeljewelry.es/img/email-logo.png" width="150" alt="Cozumel Jewelry" style="display:block; margin:0 auto 24px; width:150px; height:auto; border:0;">' ||
                    '<p style="font-size:22px; margin:0 0 16px;">Tienes las cinco piezas de <em>Un Pedacito de ti</em></p>' ||
                    '<p style="font-family:Arial,sans-serif; font-size:15px; line-height:1.6; color:#2E5357;">' ||
                    'Gracias por hacer tuya la colección entera. Como regalo, Adri va a grabarte un vídeo personal. ' ||
                    'Te lo enviaremos a este email en los próximos días.</p>' ||
                    '<p style="font-style:italic; font-size:16px; color:#A8873F; margin-top:24px;">Un pedacito de mí, para ti</p></div>'
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
$$;

