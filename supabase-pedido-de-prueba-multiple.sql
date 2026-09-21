-- ============================================================
-- PEDIDO DE PRUEBA CON VARIAS PIEZAS (para la v13)
--
-- Un solo pedido con 3 piezas: es el caso que antes mandaba 6 emails y
-- ahora tiene que mandar 2, uno al cliente con las 3 piezas y otro al
-- negocio con los 3 SKU en lista.
--
-- ⚠️ Antes: ejecutar supabase-migracion-v13.sql.
--
-- Las 3 piezas comparten stripe_session_id ('TEST-MULTI-1'), que es lo
-- que hace Stripe con un carrito de varias piezas.
-- ============================================================


-- ===== PASO 1 · crear el pedido (no envía nada) =====
with cliente as (
  select
    'cozumeljewel@gmail.com'::text as email,   -- ← buzón del cliente
    'TEST MULTI'::text             as nombre,
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
  v.producto, v.personalizacion::jsonb, v.precio, 'pendiente_pago', true,
  'adri_story', gen_random_uuid(), 'TEST-MULTI-1'
from cliente c
cross join (values
  ('collar_flor_natal',     '{"mes":"marzo","acabado":"oro"}', 39.90),
  ('pulsera_vinculo',       '{"acabado":"plata"}', 29.90),
  ('kit_mi_consentida',     '{"mes":"junio","grabado":"26.05.24","acabado__collar_flor_natal":"plata","acabado__pulsera_nombre":"oro"}', 69.90)
) as v(producto, personalizacion, precio);


-- ===== PASO 2 · ver qué SKU va a decir el email =====
select public.nombre_de_pieza(producto)                as pieza,
       public.sku_de_pedido(producto, personalizacion) as sku_a_pedir,
       public.grabado_legible(personalizacion)         as grabado,
       precio_pagado
from public.reservas
where stripe_session_id = 'TEST-MULTI-1';

-- Esperado:
--   Collar Destino      → XX49472D0W3                      (marzo, oro)
--   Pulsera Dos Almas   → YS14924A0W0                      (plata)
--   Kit Mi Consentida   → XX49472A0W6 + YS15777D0W0-KZ     (junio, collar plata + pulsera oro)
--   Total: 139,70 €


-- ===== PASO 3 · cobrar el pedido entero (un solo UPDATE) =====
-- Esto es lo que hace el webhook de Stripe. Con la v13 salen 2 emails,
-- no 6: uno al cliente con las 3 piezas y otro al negocio con los 3 SKU.
update public.reservas set estado = 'pagado'
where stripe_session_id = 'TEST-MULTI-1';


-- ===== PASO 4 · comprobar que salieron los DOS =====
-- Tienen que ser 2 respuestas con 200 y ningún 429.
select status_code, count(*)
from net._http_response
where created > now() - interval '5 minutes'
group by status_code;


-- ===== PASO 5 · cómo se ve el pedido para exportar =====
select pedido, pieza, sku_a_pedir, grabado, importe, nombre, direccion_envio
from public.pedidos_proveedor
where pedido = 'TEST-MULTI-1';


-- ===== LIMPIEZA =====
-- delete from public.reservas where stripe_session_id = 'TEST-MULTI-1';
-- delete from public.reservas where stripe_session_id like 'TEST-SKU-%';
