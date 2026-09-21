-- ============================================================
-- MIGRACIÓN v15 · el "Kit a tu gusto" (kit que arma el cliente)
--
-- Pega esto en el SQL Editor de Supabase y pulsa Run. No toca tablas ni
-- políticas: solo actualiza dos funciones.
--
-- Qué es: en "Arma tu kit" (productos.html) el cliente elige UNA pulsera
-- y UN colgante, con su acabado y su grabado, y paga. Cuesta lo mismo
-- que los kits cerrados (949 MXN), lleve las piezas que lleve, así que
-- viaja como un producto propio: kit_personalizado.
--
-- Cómo llega la información, dentro de "personalizacion":
--   pieza_1 / pieza_2              → ids de las dos piezas
--   acabado__pieza_1 / __pieza_2   → 'oro' o 'plata', una por pieza
--   p1__grabado, p2__mes, ...      → el grabado de cada pieza, con
--                                    prefijo para no mezclarlas
--
-- El SKU se resuelve pidiendo a EMANCO la referencia de CADA pieza, con
-- su propio acabado y su propio grabado: la función de abajo deshace los
-- prefijos y se llama a sí misma una vez por pieza.
-- ============================================================

-- ---- Nombre legible, ahora también para el kit a tu gusto ----
create or replace function public.nombre_de_pieza(producto text)
returns text language sql immutable as $$
  select case producto
    when 'collar_esencial'        then 'Collar Esencia'
    when 'pulsera_vinculo'        then 'Pulsera Dos Almas'
    when 'pulsera_nombre'         then 'Pulsera Mi Cielo'
    when 'brazalete_mensaje'      then 'Brazalete Eterno'
    when 'collar_flor_natal'      then 'Collar Destino'
    when 'kit_pedacito_nosotros'  then 'Kit El Pedacito de Nosotros'
    when 'kit_mi_consentida'      then 'Kit Mi Consentida'
    when 'kit_personalizado'      then 'Kit a tu gusto'
    else producto
  end;
$$;


-- ---- SKU: igual que en v12, más el caso del kit a tu gusto ----
create or replace function public.sku_de_pedido(producto text, personalizacion jsonb)
returns text
language plpgsql
immutable
as $$
declare
  acabado text;
  acabado_pieza1 text;
  acabado_pieza2 text;
  mes_valor text;
  mes_num int;
  tiene_grabado boolean;
  sub_pieza1 jsonb;
  sub_pieza2 jsonb;
begin
  -- ===== Kit que arma el cliente =====
  -- Se resuelve pieza por pieza: a cada una se le arma su propio JSON
  -- (su acabado + su grabado sin el prefijo) y se le pide su SKU.
  if producto = 'kit_personalizado' then
    if personalizacion->>'pieza_1' is null or personalizacion->>'pieza_2' is null then
      return '⚠️ Kit sin piezas en el pedido — revisar a mano';
    end if;

    select coalesce(jsonb_object_agg(replace(key, 'p1__', ''), value), '{}'::jsonb)
      into sub_pieza1
      from jsonb_each_text(personalizacion)
     where key like 'p1\_\_%';

    select coalesce(jsonb_object_agg(replace(key, 'p2__', ''), value), '{}'::jsonb)
      into sub_pieza2
      from jsonb_each_text(personalizacion)
     where key like 'p2\_\_%';

    sub_pieza1 := sub_pieza1 || jsonb_build_object('acabado', coalesce(personalizacion->>'acabado__pieza_1', 'oro'));
    sub_pieza2 := sub_pieza2 || jsonb_build_object('acabado', coalesce(personalizacion->>'acabado__pieza_2', 'oro'));

    return public.sku_de_pedido(personalizacion->>'pieza_1', sub_pieza1) || ' + ' ||
           public.sku_de_pedido(personalizacion->>'pieza_2', sub_pieza2);
  end if;

  -- ===== Piezas sueltas y kits cerrados (igual que en v12) =====
  acabado := lower(coalesce(personalizacion->>'acabado', 'oro'));

  acabado_pieza1 := lower(coalesce(
    personalizacion->>'acabado__collar_esencial',
    personalizacion->>'acabado__collar_flor_natal',
    personalizacion->>'acabado',
    'oro'
  ));
  acabado_pieza2 := lower(coalesce(
    personalizacion->>'acabado__pulsera_vinculo',
    personalizacion->>'acabado__pulsera_nombre',
    personalizacion->>'acabado',
    'oro'
  ));

  mes_valor := personalizacion->>'mes';
  mes_num := case mes_valor
    when 'enero'      then 1  when 'febrero'    then 2  when 'marzo'  then 3
    when 'abril'      then 4  when 'mayo'       then 5  when 'junio'  then 6
    when 'julio'      then 7  when 'agosto'     then 8  when 'septiembre' then 9
    when 'octubre'    then 10 when 'noviembre'  then 11 when 'diciembre'  then 12
    else null
  end;

  tiene_grabado :=
    coalesce(trim(personalizacion->>'nombre'), '')   <> '' or
    coalesce(trim(personalizacion->>'fecha'), '')    <> '' or
    coalesce(trim(personalizacion->>'mensaje'), '')  <> '' or
    coalesce(trim(personalizacion->>'grabado'), '')  <> '';

  return case producto

    when 'collar_esencial' then
      (case when acabado = 'plata' then 'CDNN067-1' else 'CDNN067-2' end) ||
      (case when tiene_grabado then ' + diaoke' else '' end)

    when 'pulsera_vinculo' then
      case when acabado = 'plata' then 'YS14924A0W0' else 'YS14924D0W0' end

    when 'pulsera_nombre' then
      case when acabado = 'plata' then 'YS15777A0W0-KZ' else 'YS15777D0W0-KZ' end

    when 'brazalete_mensaje' then
      case when acabado = 'plata' then 'FZ28329A0W0-KZ' else 'FZ28329D0W0-KZ' end

    when 'collar_flor_natal' then
      case when mes_num is null then '⚠️ Falta el mes en el pedido — revisar a mano'
      else (case when acabado = 'plata' then 'XX49472A0W' else 'XX49472D0W' end) || mes_num::text
      end

    when 'kit_pedacito_nosotros' then
      (case when acabado_pieza1 = 'plata' then 'CDNN067-1' else 'CDNN067-2' end) || ' + ' ||
      (case when acabado_pieza2 = 'plata' then 'YS14924A0W0' else 'YS14924D0W0' end) ||
      (case when tiene_grabado then ' + diaoke' else '' end)

    when 'kit_mi_consentida' then
      case when mes_num is null then '⚠️ Falta el mes en el pedido — revisar a mano'
      else
        (case when acabado_pieza1 = 'plata' then 'XX49472A0W' else 'XX49472D0W' end) || mes_num::text ||
        ' + ' ||
        (case when acabado_pieza2 = 'plata' then 'YS15777A0W0-KZ' else 'YS15777D0W0-KZ' end)
      end

    else '⚠️ Sin SKU asignado para "' || producto || '" — revisar a mano'
  end;
end;
$$;


-- ---- Comprobación rápida (no cambia nada) ----
-- Un kit a tu gusto con Pulsera Mi Cielo grabada en oro + Collar Destino
-- de junio en plata tiene que dar: YS15777D0W0-KZ + XX49472A0W6
select public.sku_de_pedido('kit_personalizado', jsonb_build_object(
  'pieza_1', 'pulsera_nombre',
  'pieza_2', 'collar_flor_natal',
  'acabado__pieza_1', 'oro',
  'acabado__pieza_2', 'plata',
  'p1__grabado', 'Aqui y ahora',
  'p2__mes', 'junio'
)) as sku_esperado_YS15777D0W0_KZ_mas_XX49472A0W6;
