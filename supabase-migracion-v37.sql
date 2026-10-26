-- =============================================================
-- v37 · Compra de la colección de hombre (26/10/2026)
-- · Las piezas de hombre (producto 'hombre_...') se pueden pedir.
-- · El SKU de cada pedido de hombre lo monta la web con las referencias
--   del catálogo del proveedor (skuHombre en hombre.js) y viaja en
--   personalizacion.sku y personalizacion.sku_colgante. El precio NO: lo
--   recalcula siempre crear-sesion-pago.
-- · nombre_de_pieza conoce las piezas de hombre (generado de hombre.js).
-- · grabado_legible no enseña las claves internas (sku, charm).
-- =============================================================
drop policy if exists "usuarios autenticados insertan sus reservas" on public.reservas;
create policy "usuarios autenticados insertan sus reservas"
  on public.reservas for insert
  to authenticated
  with check ((user_id = auth.uid())
    and (producto = any (array['collar_esencial','pulsera_vinculo','pulsera_nombre','brazalete_mensaje','collar_flor_natal','kit_pedacito_nosotros','kit_mi_consentida','kit_personalizado'])
         or producto ~ '^hombre_[a-z]+_[0-9]+$')
    and (fuente = 'adri_story') and (estado = 'pendiente_pago') and (consentimiento = true)
    and (stripe_session_id is null) and (pagado_en is null));

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
    when 'hombre_collar_3' then 'Mezcal'
    when 'hombre_collar_4' then 'Guajillo'
    when 'hombre_collar_6' then 'Cacao'
    when 'hombre_collar_8' then 'Obsidiana'
    when 'hombre_collar_1' then 'Holbox'
    when 'hombre_collar_2' then 'Pulque'
    when 'hombre_collar_7' then 'Copal'
    when 'hombre_colgante_1' then 'Alma Caribeña'
    when 'hombre_colgante_2' then 'Pacífico'
    when 'hombre_colgante_3' then 'Mazunte'
    when 'hombre_pulsera_1' then 'Maya'
    when 'hombre_pulsera_2' then 'Coyote'
    when 'hombre_pulsera_3' then 'Tulum'
    when 'hombre_pulsera_4' then 'Quetzal'
    when 'hombre_pulsera_5' then 'Palenque'
    when 'hombre_brazalete_1' then 'Jaguar'
    when 'hombre_brazalete_2' then 'Agave'
    when 'hombre_brazalete_3' then 'Bacalar'
    when 'hombre_brazalete_4' then 'Ajolote'
    when 'hombre_anillo_1' then 'Ocaso'
    when 'hombre_anillo_2' then 'Marea'
    when 'hombre_anillo_3' then 'Cenote'
    when 'hombre_pulsera_6' then 'Sayulita'
    when 'hombre_anillo_4' then 'Xcaret'
    when 'hombre_anillo_5' then 'Calakmul'
    when 'hombre_anillo_6' then 'Baja'
    when 'hombre_anillo_7' then 'Frida'
    when 'hombre_anillo_8' then 'Guadalupe'
    when 'hombre_anillo_9' then 'Luchador'
    when 'hombre_anillo_10' then 'Misión'
    when 'hombre_anillo_11' then 'Charro'
    when 'hombre_anillo_12' then 'Catedral'
    when 'hombre_anillo_13' then 'Nahual'
    else producto
  end;
$$;

create or replace function public.grabado_legible(personalizacion jsonb)
 returns text language sql immutable as $$
  select nullif(string_agg(initcap(key) || ': ' || value, '  ·  '), '')
  from jsonb_each_text(coalesce(personalizacion, '{}'::jsonb))
  where value is not null
    and trim(value) <> ''
    and key not like 'acabado%'
    and key not in ('sku', 'sku_colgante', 'charm');
$$;

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

  -- ===== Hombre (v37): el SKU lo monta la web (skuHombre en hombre.js) =====
  if producto like 'hombre\_%' then
    return coalesce(nullif(trim(personalizacion->>'sku'), ''), '⚠️ Pieza de hombre sin SKU — revisar a mano') ||
           coalesce(' + colgante ' || nullif(trim(personalizacion->>'sku_colgante'), ''), '');
  end if;

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
