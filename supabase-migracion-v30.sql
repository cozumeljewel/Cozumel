-- v30 (2026-10-02) · Aviso de colección completa: "regalo sorpresa de Adri"
-- en vez de "vídeo personal" (coincide con la promo del email de compra);
-- email al cliente en modo claro.
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
                    '<p style="font-size:22px; margin:0 0 16px;">Tienes las cinco piezas de <em>Un Pedacito de ti</em></p>' ||
                    '<p style="font-family:Arial,sans-serif; font-size:15px; line-height:1.6; color:#2E5357;">' ||
                    'Gracias por hacer tuya la colección entera. Como agradecimiento, Adri te enviará un regalo sorpresa. ' ||
                    'Te escribiremos para coordinar el envío.</p>' ||
                    '<p style="font-style:italic; font-size:16px; color:#A8873F; margin-top:24px;">Un pedacito de mí, para ti</p></div></body></html>'
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
