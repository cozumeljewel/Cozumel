-- ============================================================
-- REENVIAR LOS EMAILS DE PRUEBA, DE UNA EN UNA
--
-- Dos cosas que hay que tener claras, porque explican todo lo raro:
--
-- 1) El correo solo sale cuando una fila PASA a 'pagado'. Si ya estaba
--    en 'pagado', volver a marcarla como pagada no cambia nada y no
--    dispara ningún email (así está hecho el disparador: solo salta si el
--    estado anterior era distinto). Por eso cada pieza lleva aquí sus DOS
--    líneas: primero baja a 'pendiente_pago' y luego sube a 'pagado'.
--
-- 2) Resend, en plan gratuito, admite ~2 envíos por segundo, y cada pieza
--    manda 2 correos (cliente y negocio). Si se lanzan varias piezas
--    juntas, devuelve 429 y esos correos se pierden. Por eso va de una en
--    una, con unos segundos entre medias.
--
-- CÓMO SE USA: selecciona con el ratón el PAR de líneas de una pieza,
-- pulsa Run (Ctrl+Enter), cuenta hasta tres, y pasa a la siguiente.
-- Son 14 pares. Cada par = 2 correos.
-- ============================================================


-- 01 · Collar Esencia, oro, sin grabado → CDNN067-2
update public.reservas set estado='pendiente_pago' where stripe_session_id='TEST-SKU-01-esencia-oro-sin-grabado';
update public.reservas set estado='pagado'         where stripe_session_id='TEST-SKU-01-esencia-oro-sin-grabado';

-- 02 · Collar Esencia, plata, con grabado → CDNN067-1 + diaoke
update public.reservas set estado='pendiente_pago' where stripe_session_id='TEST-SKU-02-esencia-plata-grabado';
update public.reservas set estado='pagado'         where stripe_session_id='TEST-SKU-02-esencia-plata-grabado';

-- 03 · Pulsera Dos Almas, oro → YS14924D0W0
update public.reservas set estado='pendiente_pago' where stripe_session_id='TEST-SKU-03-dos-almas-oro';
update public.reservas set estado='pagado'         where stripe_session_id='TEST-SKU-03-dos-almas-oro';

-- 04 · Pulsera Dos Almas, plata → YS14924A0W0
update public.reservas set estado='pendiente_pago' where stripe_session_id='TEST-SKU-04-dos-almas-plata';
update public.reservas set estado='pagado'         where stripe_session_id='TEST-SKU-04-dos-almas-plata';

-- 05 · Pulsera Mi Cielo, oro, grabada → YS15777D0W0-KZ
update public.reservas set estado='pendiente_pago' where stripe_session_id='TEST-SKU-05-mi-cielo-oro-grabado';
update public.reservas set estado='pagado'         where stripe_session_id='TEST-SKU-05-mi-cielo-oro-grabado';

-- 06 · Pulsera Mi Cielo, plata, sin grabar → YS15777A0W0-KZ
update public.reservas set estado='pendiente_pago' where stripe_session_id='TEST-SKU-06-mi-cielo-plata-sin-grabar';
update public.reservas set estado='pagado'         where stripe_session_id='TEST-SKU-06-mi-cielo-plata-sin-grabar';

-- 07 · Brazalete Eterno, oro, grabado → FZ28329D0W0-KZ
update public.reservas set estado='pendiente_pago' where stripe_session_id='TEST-SKU-07-brazalete-oro-grabado';
update public.reservas set estado='pagado'         where stripe_session_id='TEST-SKU-07-brazalete-oro-grabado';

-- 08 · Brazalete Eterno, plata, grabado → FZ28329A0W0-KZ
update public.reservas set estado='pendiente_pago' where stripe_session_id='TEST-SKU-08-brazalete-plata-grabado';
update public.reservas set estado='pagado'         where stripe_session_id='TEST-SKU-08-brazalete-plata-grabado';

-- 09 · Collar Destino, oro, enero → XX49472D0W1
update public.reservas set estado='pendiente_pago' where stripe_session_id='TEST-SKU-09-destino-oro-enero';
update public.reservas set estado='pagado'         where stripe_session_id='TEST-SKU-09-destino-oro-enero';

-- 10 · Collar Destino, plata, diciembre → XX49472A0W12
update public.reservas set estado='pendiente_pago' where stripe_session_id='TEST-SKU-10-destino-plata-diciembre';
update public.reservas set estado='pagado'         where stripe_session_id='TEST-SKU-10-destino-plata-diciembre';

-- 11 · Kit Pedacito, todo oro, con grabado → CDNN067-2 + YS14924D0W0 + diaoke
update public.reservas set estado='pendiente_pago' where stripe_session_id='TEST-SKU-11-kit-pedacito-oro-grabado';
update public.reservas set estado='pagado'         where stripe_session_id='TEST-SKU-11-kit-pedacito-oro-grabado';

-- 12 · Kit Pedacito MIXTO: collar oro + pulsera plata → CDNN067-2 + YS14924A0W0
update public.reservas set estado='pendiente_pago' where stripe_session_id='TEST-SKU-12-kit-pedacito-mixto';
update public.reservas set estado='pagado'         where stripe_session_id='TEST-SKU-12-kit-pedacito-mixto';

-- 13 · Kit Mi Consentida, todo plata, septiembre → XX49472A0W9 + YS15777A0W0-KZ
update public.reservas set estado='pendiente_pago' where stripe_session_id='TEST-SKU-13-kit-consentida-plata-sept';
update public.reservas set estado='pagado'         where stripe_session_id='TEST-SKU-13-kit-consentida-plata-sept';

-- 14 · Kit Mi Consentida MIXTO: collar plata + pulsera oro, junio → XX49472A0W6 + YS15777D0W0-KZ
update public.reservas set estado='pendiente_pago' where stripe_session_id='TEST-SKU-14-kit-consentida-mixto-junio';
update public.reservas set estado='pagado'         where stripe_session_id='TEST-SKU-14-kit-consentida-mixto-junio';


-- ===== COMPROBAR CÓMO FUE =====
-- 200 = enviado. 429 = rechazado por ir demasiado rápido (relanza ese par).
select status_code, count(*)
from net._http_response
where created > now() - interval '30 minutes'
group by status_code
order by 2 desc;


-- ===== LIMPIEZA, cuando termines la revisión =====
-- delete from public.reservas where stripe_session_id like 'TEST-SKU-%';
-- drop procedure if exists public.reenviar_pruebas_despacio(numeric);
