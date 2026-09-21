-- ============================================================
-- LAS 94 VARIANTES, RESUELTAS EN PANTALLA
--
-- Pega esto en el SQL Editor de Supabase y pulsa Run. NO crea pedidos ni
-- envía emails: solo pasa cada combinación comprable por la función
-- public.sku_de_pedido y enseña la referencia que se pediría a EMANCO.
--
-- Son las 94 combinaciones que se pueden comprar en la web: 7 piezas ×
-- oro y plata × 12 meses del Collar Destino × con y sin grabado, e
-- incluidos los kits con cada pieza en un acabado distinto.
--
-- Comprobado el 2026-09-21 contra esta misma base de datos: las 94
-- devuelven una referencia que existe en el Excel del proveedor.
-- Para exportarlo: botón Export → CSV, arriba a la derecha del resultado.
-- ============================================================

with variantes(pieza, producto, personalizacion) as (values
  ('Collar Esencia', 'collar_esencial', '{"acabado": "oro"}'),
  ('Collar Esencia', 'collar_esencial', '{"acabado": "oro", "nombre": "Ana", "fecha": "14.02.2024", "mensaje": "te quiero"}'),
  ('Pulsera Dos Almas', 'pulsera_vinculo', '{"acabado": "oro"}'),
  ('Pulsera Mi Cielo', 'pulsera_nombre', '{"acabado": "oro"}'),
  ('Brazalete Eterno', 'brazalete_mensaje', '{"acabado": "oro"}'),
  ('Pulsera Mi Cielo', 'pulsera_nombre', '{"acabado": "oro", "grabado": "Aquí y ahora"}'),
  ('Brazalete Eterno', 'brazalete_mensaje', '{"acabado": "oro", "grabado": "te adoro"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "oro", "mes": "enero"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "oro", "mes": "febrero"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "oro", "mes": "marzo"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "oro", "mes": "abril"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "oro", "mes": "mayo"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "oro", "mes": "junio"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "oro", "mes": "julio"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "oro", "mes": "agosto"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "oro", "mes": "septiembre"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "oro", "mes": "octubre"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "oro", "mes": "noviembre"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "oro", "mes": "diciembre"}'),
  ('Collar Esencia', 'collar_esencial', '{"acabado": "plata"}'),
  ('Collar Esencia', 'collar_esencial', '{"acabado": "plata", "nombre": "Ana", "fecha": "14.02.2024", "mensaje": "te quiero"}'),
  ('Pulsera Dos Almas', 'pulsera_vinculo', '{"acabado": "plata"}'),
  ('Pulsera Mi Cielo', 'pulsera_nombre', '{"acabado": "plata"}'),
  ('Brazalete Eterno', 'brazalete_mensaje', '{"acabado": "plata"}'),
  ('Pulsera Mi Cielo', 'pulsera_nombre', '{"acabado": "plata", "grabado": "Aquí y ahora"}'),
  ('Brazalete Eterno', 'brazalete_mensaje', '{"acabado": "plata", "grabado": "te adoro"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "plata", "mes": "enero"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "plata", "mes": "febrero"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "plata", "mes": "marzo"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "plata", "mes": "abril"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "plata", "mes": "mayo"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "plata", "mes": "junio"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "plata", "mes": "julio"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "plata", "mes": "agosto"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "plata", "mes": "septiembre"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "plata", "mes": "octubre"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "plata", "mes": "noviembre"}'),
  ('Collar Destino', 'collar_flor_natal', '{"acabado": "plata", "mes": "diciembre"}'),
  ('Kit El Pedacito de Nosotros', 'kit_pedacito_nosotros', '{"acabado__collar_esencial": "oro", "acabado__pulsera_vinculo": "oro"}'),
  ('Kit El Pedacito de Nosotros', 'kit_pedacito_nosotros', '{"acabado__collar_esencial": "oro", "acabado__pulsera_vinculo": "oro", "nombre": "Ana"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "oro", "mes": "enero", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "oro", "mes": "febrero", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "oro", "mes": "marzo", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "oro", "mes": "abril", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "oro", "mes": "mayo", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "oro", "mes": "junio", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "oro", "mes": "julio", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "oro", "mes": "agosto", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "oro", "mes": "septiembre", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "oro", "mes": "octubre", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "oro", "mes": "noviembre", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "oro", "mes": "diciembre", "grabado": "Siempre"}'),
  ('Kit El Pedacito de Nosotros', 'kit_pedacito_nosotros', '{"acabado__collar_esencial": "oro", "acabado__pulsera_vinculo": "plata"}'),
  ('Kit El Pedacito de Nosotros', 'kit_pedacito_nosotros', '{"acabado__collar_esencial": "oro", "acabado__pulsera_vinculo": "plata", "nombre": "Ana"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "plata", "mes": "enero", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "plata", "mes": "febrero", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "plata", "mes": "marzo", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "plata", "mes": "abril", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "plata", "mes": "mayo", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "plata", "mes": "junio", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "plata", "mes": "julio", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "plata", "mes": "agosto", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "plata", "mes": "septiembre", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "plata", "mes": "octubre", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "plata", "mes": "noviembre", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "oro", "acabado__pulsera_nombre": "plata", "mes": "diciembre", "grabado": "Siempre"}'),
  ('Kit El Pedacito de Nosotros', 'kit_pedacito_nosotros', '{"acabado__collar_esencial": "plata", "acabado__pulsera_vinculo": "oro"}'),
  ('Kit El Pedacito de Nosotros', 'kit_pedacito_nosotros', '{"acabado__collar_esencial": "plata", "acabado__pulsera_vinculo": "oro", "nombre": "Ana"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "oro", "mes": "enero", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "oro", "mes": "febrero", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "oro", "mes": "marzo", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "oro", "mes": "abril", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "oro", "mes": "mayo", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "oro", "mes": "junio", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "oro", "mes": "julio", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "oro", "mes": "agosto", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "oro", "mes": "septiembre", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "oro", "mes": "octubre", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "oro", "mes": "noviembre", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "oro", "mes": "diciembre", "grabado": "Siempre"}'),
  ('Kit El Pedacito de Nosotros', 'kit_pedacito_nosotros', '{"acabado__collar_esencial": "plata", "acabado__pulsera_vinculo": "plata"}'),
  ('Kit El Pedacito de Nosotros', 'kit_pedacito_nosotros', '{"acabado__collar_esencial": "plata", "acabado__pulsera_vinculo": "plata", "nombre": "Ana"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "plata", "mes": "enero", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "plata", "mes": "febrero", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "plata", "mes": "marzo", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "plata", "mes": "abril", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "plata", "mes": "mayo", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "plata", "mes": "junio", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "plata", "mes": "julio", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "plata", "mes": "agosto", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "plata", "mes": "septiembre", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "plata", "mes": "octubre", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "plata", "mes": "noviembre", "grabado": "Siempre"}'),
  ('Kit Mi Consentida', 'kit_mi_consentida', '{"acabado__collar_flor_natal": "plata", "acabado__pulsera_nombre": "plata", "mes": "diciembre", "grabado": "Siempre"}')
)
select
  v.pieza,
  coalesce(v.personalizacion::jsonb->>'acabado',
           'collar ' || coalesce(v.personalizacion::jsonb->>'acabado__collar_esencial',
                                 v.personalizacion::jsonb->>'acabado__collar_flor_natal', '?') ||
           ' / pulsera ' || coalesce(v.personalizacion::jsonb->>'acabado__pulsera_vinculo',
                                     v.personalizacion::jsonb->>'acabado__pulsera_nombre', '?')
  )                                                          as acabado,
  v.personalizacion::jsonb->>'mes'                           as mes,
  coalesce(public.grabado_legible(v.personalizacion::jsonb), '(sin grabado)') as grabado,
  public.sku_de_pedido(v.producto, v.personalizacion::jsonb) as sku_a_pedir
from variantes v
order by v.pieza, acabado, mes;
