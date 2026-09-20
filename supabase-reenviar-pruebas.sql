-- ============================================================
-- REENVIAR LOS EMAILS DE PRUEBA, ESPACIADOS
--
-- Por qué: los 14 pedidos de prueba dispararon 28 emails casi a la vez y
-- Resend devolvió 429 (demasiados por segundo) en 18 de ellos. El plan
-- gratuito admite ~2 envíos por segundo y cada pieza manda 2 correos.
--
-- Por qué NO se puede automatizar con una pausa: el SQL Editor de
-- Supabase ejecuta todo dentro de una misma transacción, y pg_net no
-- manda nada hasta que esa transacción termina. Da igual dónde pongas la
-- espera: los correos salen todos de golpe al final. (Un procedimiento
-- con COMMIT tampoco vale: el editor lo rechaza con "invalid transaction
-- termination".) Por eso se hace a mano, un Run por pieza.
--
-- ⚠️ Reenvía los DOS correos de cada pieza, también de las que sí
--    llegaron: tendrás algún duplicado de esas. En una prueba da igual.
-- ============================================================


-- ===== PASO 1 · devolver las 14 a pendiente (no envía nada) =====
-- Selecciona SOLO esta línea y pulsa Run.
update public.reservas set estado = 'pendiente_pago'
where stripe_session_id like 'TEST-SKU-%';


-- ===== PASO 2 · disparar los correos, uno por Run =====
-- Selecciona UNA línea, Run, cuenta hasta tres, y pasa a la siguiente.
-- Cada línea manda 2 correos (cliente y negocio) de esa pieza.

update public.reservas set estado='pagado' where stripe_session_id='TEST-SKU-01-esencia-oro-sin-grabado';
update public.reservas set estado='pagado' where stripe_session_id='TEST-SKU-02-esencia-plata-grabado';
update public.reservas set estado='pagado' where stripe_session_id='TEST-SKU-03-dos-almas-oro';
update public.reservas set estado='pagado' where stripe_session_id='TEST-SKU-04-dos-almas-plata';
update public.reservas set estado='pagado' where stripe_session_id='TEST-SKU-05-mi-cielo-oro-grabado';
update public.reservas set estado='pagado' where stripe_session_id='TEST-SKU-06-mi-cielo-plata-sin-grabar';
update public.reservas set estado='pagado' where stripe_session_id='TEST-SKU-07-brazalete-oro-grabado';
update public.reservas set estado='pagado' where stripe_session_id='TEST-SKU-08-brazalete-plata-grabado';
update public.reservas set estado='pagado' where stripe_session_id='TEST-SKU-09-destino-oro-enero';
update public.reservas set estado='pagado' where stripe_session_id='TEST-SKU-10-destino-plata-diciembre';
update public.reservas set estado='pagado' where stripe_session_id='TEST-SKU-11-kit-pedacito-oro-grabado';
update public.reservas set estado='pagado' where stripe_session_id='TEST-SKU-12-kit-pedacito-mixto';
update public.reservas set estado='pagado' where stripe_session_id='TEST-SKU-13-kit-consentida-plata-sept';
update public.reservas set estado='pagado' where stripe_session_id='TEST-SKU-14-kit-consentida-mixto-junio';


-- ===== SI PREFIERES NO IR UNA A UNA =====
-- Con 4 piezas por Run (8 correos) también suele colarse algún 429, pero
-- se tarda menos. Selecciona un bloque de 4 líneas del paso 2, Run,
-- espera ~5 segundos y sigue con el siguiente bloque. Luego comprueba
-- abajo y relanza solo las que fallen.


-- ===== COMPROBAR CÓMO FUE =====
-- 200 = enviado. 429 = rechazado por ir demasiado rápido.
select status_code, count(*)
from net._http_response
where created > now() - interval '15 minutes'
group by status_code
order by 2 desc;


-- ===== LIMPIEZA =====
-- El procedimiento de la versión anterior de este archivo, si llegó a
-- crearse, ya no sirve para nada:
-- drop procedure if exists public.reenviar_pruebas_despacio(numeric);
--
-- Y para borrar las filas de prueba cuando termines la revisión:
-- delete from public.reservas where stripe_session_id like 'TEST-SKU-%';
