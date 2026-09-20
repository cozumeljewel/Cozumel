-- ============================================================
-- REENVIAR LOS EMAILS DE PRUEBA, ESPACIADOS
--
-- Por qué: los 14 pedidos de prueba dispararon 28 emails casi a la vez y
-- Resend devolvió 429 (demasiados por segundo) en 18 de ellos. El plan
-- gratuito admite ~2 envíos por segundo y cada pieza manda 2 correos.
--
-- Esto vuelve a marcar cada pedido como pagado DE UNO EN UNO, con una
-- pausa entre medias, así que el disparador manda 2 correos cada vez y
-- Resend ya no los rechaza.
--
-- ⚠️ Cada vuelta reenvía los DOS correos de esa pieza (cliente y
--    negocio), también de las que sí llegaron: acabarás con algún
--    duplicado de esas. Es lo normal en una prueba.
-- ============================================================


-- ===== OPCIÓN A · automática (recomendada) =====
-- Un procedimiento que va pieza por pieza, confirma cada cambio y espera
-- 3 segundos antes del siguiente. Tarda ~45 segundos en total: si el
-- editor se queja de tiempo de espera, usa la opción B.
create or replace procedure public.reenviar_pruebas_despacio(pausa numeric default 3)
language plpgsql
as $$
declare
  fila record;
begin
  for fila in
    select stripe_session_id
    from public.reservas
    where stripe_session_id like 'TEST-SKU-%'
    order by stripe_session_id
  loop
    -- Ida y vuelta: el disparador salta al pasar de otro estado a 'pagado'.
    update public.reservas set estado = 'pendiente_pago'
    where stripe_session_id = fila.stripe_session_id;
    commit;

    update public.reservas set estado = 'pagado'
    where stripe_session_id = fila.stripe_session_id;
    commit;

    perform pg_sleep(pausa);
  end loop;
end;
$$;

call public.reenviar_pruebas_despacio(3);

-- Cuando termine la prueba, se puede quitar:
-- drop procedure if exists public.reenviar_pruebas_despacio(numeric);


-- ===== OPCIÓN B · a mano, si la A falla =====
-- Ejecuta estas dos líneas, espera unos segundos, cambia la etiqueta del
-- final por la siguiente y repite. Las 14 etiquetas están abajo.
--
-- update public.reservas set estado = 'pendiente_pago' where stripe_session_id = 'TEST-SKU-01-esencia-oro-sin-grabado';
-- update public.reservas set estado = 'pagado'         where stripe_session_id = 'TEST-SKU-01-esencia-oro-sin-grabado';
--
--   01-esencia-oro-sin-grabado     02-esencia-plata-grabado
--   03-dos-almas-oro               04-dos-almas-plata
--   05-mi-cielo-oro-grabado        06-mi-cielo-plata-sin-grabar
--   07-brazalete-oro-grabado       08-brazalete-plata-grabado
--   09-destino-oro-enero           10-destino-plata-diciembre
--   11-kit-pedacito-oro-grabado    12-kit-pedacito-mixto
--   13-kit-consentida-plata-sept   14-kit-consentida-mixto-junio


-- ===== COMPROBAR CÓMO FUE =====
-- Los envíos de los últimos 10 minutos, por código. 200 = enviado,
-- 429 = rechazado por ir demasiado rápido.
select status_code, count(*)
from net._http_response
where created > now() - interval '10 minutes'
group by status_code
order by 2 desc;

-- Y el detalle, por si algún 429 se coló otra vez:
-- select created, status_code, left(content, 200) as respuesta
-- from net._http_response
-- where created > now() - interval '10 minutes'
-- order by created desc;
