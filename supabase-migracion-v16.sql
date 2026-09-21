-- ============================================================
-- MIGRACIÓN v16 · el kit pasa a llamarse "Kit Pedacito de Nosotros"
--
-- Pega esto en el SQL Editor de Supabase y pulsa Run.
--
-- Solo cambia el nombre que se enseña (se cae el "El"): el id del
-- producto sigue siendo kit_pedacito_nosotros, así que no afecta a
-- pedidos antiguos, ni a precios, ni a SKU.
--
-- Este nombre aparece en el email de pedido pagado y en la columna
-- "pieza" de la vista pedidos_proveedor, que lo leen de aquí.
-- ============================================================

create or replace function public.nombre_de_pieza(producto text)
returns text language sql immutable as $$
  select case producto
    when 'collar_esencial'        then 'Collar Esencia'
    when 'pulsera_vinculo'        then 'Pulsera Dos Almas'
    when 'pulsera_nombre'         then 'Pulsera Mi Cielo'
    when 'brazalete_mensaje'      then 'Brazalete Eterno'
    when 'collar_flor_natal'      then 'Collar Destino'
    when 'kit_pedacito_nosotros'  then 'Kit Pedacito de Nosotros'
    when 'kit_mi_consentida'      then 'Kit Mi Consentida'
    when 'kit_personalizado'      then 'Kit a tu gusto'
    else producto
  end;
$$;

-- Comprobación: tiene que devolver "Kit Pedacito de Nosotros".
select public.nombre_de_pieza('kit_pedacito_nosotros') as nombre;
