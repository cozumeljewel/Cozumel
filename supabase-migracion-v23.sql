-- =============================================================
-- MIGRACIÓN v23 · el grabado deja de ser obligatorio
--
-- Desde el 2026-09-29 se puede comprar cualquier pieza sin grabar nada.
-- En el Excel de EMANCO, "-KZ" es un sufijo que añade el grabado (y su
-- coste) al SKU normal. Hasta ahora Mi Cielo, el Brazalete y la pulsera
-- del Kit Mi Consentida se pedían SIEMPRE con -KZ; ahora solo si el
-- pedido lleva grabado. El Collar Esencia ya añadía "diaoke" solo con
-- grabado. El resto de la función es idéntico al que había.
-- =============================================================

CREATE OR REPLACE FUNCTION public.sku_de_pedido(producto text, personalizacion jsonb)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
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
      (case when acabado = 'plata' then 'YS15777A0W0' else 'YS15777D0W0' end) ||
      (case when tiene_grabado then '-KZ' else '' end)

    when 'brazalete_mensaje' then
      (case when acabado = 'plata' then 'FZ28329A0W0' else 'FZ28329D0W0' end) ||
      (case when tiene_grabado then '-KZ' else '' end)

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
        (case when acabado_pieza2 = 'plata' then 'YS15777A0W0' else 'YS15777D0W0' end) ||
        (case when tiene_grabado then '-KZ' else '' end)
      end

    else '⚠️ Sin SKU asignado para "' || producto || '" — revisar a mano'
  end;
end;
$function$;
