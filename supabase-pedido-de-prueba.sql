-- ============================================================
-- PEDIDOS DE PRUEBA · 14 variantes, con emails reales
--
-- Para revisar el proceso entero sin pasar por Stripe: crea 14 filas en
-- "reservas" (una por variante representativa) y las pasa a 'pagado',
-- que es EXACTAMENTE lo que hace el webhook de Stripe al cobrar. Eso
-- dispara el disparador "notificar_pedido_pagado" y salen los dos emails
-- de siempre por cada pieza: uno al cliente y otro al negocio.
--
-- ⚠️ ANTES: ejecutar supabase-migracion-v12.sql. Si no, el SKU del email
--    sigue calculándose con la copia vieja y la vista no existe.
--
-- ⚠️ 14 piezas = 28 emails. Por eso el paso 2 va en tres tandas: Resend
--    limita los envíos por segundo y de golpe podría descartar alguno.
--
-- ⚠️ Las filas llevan nombre "TEST" y stripe_session_id 'TEST-SKU-...',
--    así que se borran fácil con el paso 5. NO son pedidos reales y el
--    importe (39,90 €) es inventado.
--
-- A dónde llegan los emails:
--   · el del negocio, siempre a cozumeljewel@gmail.com (fijo en la función)
--   · el del cliente, a la dirección del paso 1 — cámbiala ahí si quieres
--     recibirlo en otro buzón.
--
-- Se pega ENTERO en el SQL Editor de Supabase, pero se ejecuta por
-- pasos: selecciona un paso con el ratón y pulsa Run. Así controlas
-- cuándo salen los correos.
-- ============================================================


-- ===== PASO 1 · crear las 14 filas (todavía sin email) =====
-- Estado 'pendiente_pago': aquí no se envía nada todavía.
with cliente as (
  select
    'cozumeljewel@gmail.com'::text as email,   -- ← cambia aquí el buzón del cliente
    'TEST'::text                   as nombre,
    'BORRAR'::text                 as apellidos,
    '+34 600 000 000'::text        as whatsapp,
    'España'::text                 as pais,
    'Calle de Prueba 1, 3ºB, 15001 A Coruña'::text as direccion_envio
)
insert into public.reservas
  (nombre, apellidos, email, whatsapp, pais, direccion_envio,
   producto, personalizacion, precio_pagado, estado, consentimiento,
   fuente, session_id, stripe_session_id)
select
  c.nombre, c.apellidos, c.email, c.whatsapp, c.pais, c.direccion_envio,
  v.producto, v.personalizacion::jsonb, 39.90, 'pendiente_pago', true,
  'adri_story', gen_random_uuid(), 'TEST-SKU-' || v.etiqueta
from cliente c
cross join (values
  -- Piezas sueltas
  ('01-esencia-oro-sin-grabado',   'collar_esencial',       '{"nombre":"","fecha":"","mensaje":"","acabado":"oro"}'),
  ('02-esencia-plata-grabado',     'collar_esencial',       '{"nombre":"Ana","fecha":"14.02.2024","mensaje":"te quiero","acabado":"plata"}'),
  ('03-dos-almas-oro',             'pulsera_vinculo',       '{"acabado":"oro"}'),
  ('04-dos-almas-plata',           'pulsera_vinculo',       '{"acabado":"plata"}'),
  ('05-mi-cielo-oro-grabado',      'pulsera_nombre',        '{"grabado":"Aqui y ahora","acabado":"oro"}'),
  ('06-mi-cielo-plata-sin-grabar', 'pulsera_nombre',        '{"grabado":"","acabado":"plata"}'),
  ('07-brazalete-oro-grabado',     'brazalete_mensaje',     '{"grabado":"te adoro","acabado":"oro"}'),
  ('08-brazalete-plata-grabado',   'brazalete_mensaje',     '{"grabado":"26.05.24","acabado":"plata"}'),
  ('09-destino-oro-enero',         'collar_flor_natal',     '{"mes":"enero","acabado":"oro"}'),
  ('10-destino-plata-diciembre',   'collar_flor_natal',     '{"mes":"diciembre","acabado":"plata"}'),
  -- Kits: acabado por pieza, incluidos los mixtos (collar y pulsera en
  -- acabados distintos), que es lo que más fácil se rompe
  ('11-kit-pedacito-oro-grabado',  'kit_pedacito_nosotros', '{"nombre":"Ana","fecha":"","mensaje":"","acabado__collar_esencial":"oro","acabado__pulsera_vinculo":"oro"}'),
  ('12-kit-pedacito-mixto',        'kit_pedacito_nosotros', '{"nombre":"","fecha":"","mensaje":"","acabado__collar_esencial":"oro","acabado__pulsera_vinculo":"plata"}'),
  ('13-kit-consentida-plata-sept', 'kit_mi_consentida',     '{"mes":"septiembre","grabado":"Siempre juntas","acabado__collar_flor_natal":"plata","acabado__pulsera_nombre":"plata"}'),
  ('14-kit-consentida-mixto-junio','kit_mi_consentida',     '{"mes":"junio","grabado":"26.05.24","acabado__collar_flor_natal":"plata","acabado__pulsera_nombre":"oro"}')
) as v(etiqueta, producto, personalizacion);


-- ===== PASO 2 · comprobar los SKU ANTES de mandar nada =====
-- Aquí se ve lo que va a decir cada email. Si algo no cuadra, se para y
-- se corrige sin haber enviado un solo correo.
select
  replace(stripe_session_id, 'TEST-SKU-', '')          as variante,
  producto,
  public.sku_de_pedido(producto, personalizacion)      as sku_a_pedir,
  personalizacion
from public.reservas
where stripe_session_id like 'TEST-SKU-%'
  and estado = 'pendiente_pago'
order by stripe_session_id;

-- Lo que tiene que salir, variante a variante:
--   01 → CDNN067-2                              02 → CDNN067-1 + diaoke
--   03 → YS14924D0W0                            04 → YS14924A0W0
--   05 → YS15777D0W0-KZ                         06 → YS15777A0W0-KZ
--   07 → FZ28329D0W0-KZ                         08 → FZ28329A0W0-KZ
--   09 → XX49472D0W1                            10 → XX49472A0W12
--   11 → CDNN067-2 + YS14924D0W0 + diaoke       12 → CDNN067-2 + YS14924A0W0
--   13 → XX49472A0W9 + YS15777A0W0-KZ           14 → XX49472A0W6 + YS15777D0W0-KZ


-- ===== PASO 3 · disparar los emails, en tres tandas =====
-- Cada tanda son 5 piezas como mucho = 10 emails. Ejecuta una, mira el
-- correo, y sigue con la siguiente.

-- Tanda 1 (variantes 01 a 05)
update public.reservas set estado = 'pagado'
where id in (
  select id from public.reservas
  where stripe_session_id like 'TEST-SKU-%' and estado = 'pendiente_pago'
  order by stripe_session_id limit 5
);

-- Tanda 2 (06 a 10)
update public.reservas set estado = 'pagado'
where id in (
  select id from public.reservas
  where stripe_session_id like 'TEST-SKU-%' and estado = 'pendiente_pago'
  order by stripe_session_id limit 5
);

-- Tanda 3 (11 a 14)
update public.reservas set estado = 'pagado'
where id in (
  select id from public.reservas
  where stripe_session_id like 'TEST-SKU-%' and estado = 'pendiente_pago'
  order by stripe_session_id limit 5
);


-- ===== PASO 4 · la exportación, tal y como la verás en Excel =====
-- Es la misma vista que se exporta con Table Editor → pedidos_proveedor
-- → Export to CSV, filtrada a las pruebas.
select fecha, pedido, pieza, sku_a_pedir, acabado_collar, acabado_pulsera,
       mes, grabado, importe, nombre, apellidos, email, whatsapp,
       direccion_envio, pais
from public.pedidos_proveedor
where pedido like 'TEST-SKU-%'
order by pedido;


-- ===== PASO 5 · limpiar cuando termines =====
-- Borra SOLO las filas de esta prueba. Revisa antes con el select.
-- select count(*) from public.reservas where stripe_session_id like 'TEST-SKU-%';

-- delete from public.reservas where stripe_session_id like 'TEST-SKU-%';
