-- v27 (2026-10-02) · Plazo de entrega en el email de confirmación para
-- Ecuador, Costa Rica, Guatemala y El Salvador: 15 a 25 días laborables
-- (EMS, según el proveedor). Solo cambia el email; la web no se toca.
create or replace function public.plazo_envio(pais text, mercado text)
 returns text
 language sql
 immutable
as $function$
  select case
    when p ~ 'colombia'  then '19 a 21'
    when p ~ 'chile'     then '19 a 21'
    when p ~ 'per[uú]'   then '15 a 23'
    when p ~ 'm[eé]xic'  then '8 a 12'
    when p ~ '(ecuador|costa rica|guatemala|salvador)' then '15 a 25'
    when p ~ '(estados unidos|ee\.? ?uu|\musa\M|united states|\mus\M)' then '6 a 12'
    when p ~ '(españa|espana|spain|alemania|francia|italia|portugal|holanda|países bajos|paises bajos|bélgica|belgica|austria|irlanda|finlandia|grecia|eslovaquia|eslovenia|lituania|letonia|estonia|luxemburgo|malta|chipre|croacia)' then '6 a 10'
    when mercado = 'MX' then '8 a 12'
    when mercado = 'ES' then '6 a 10'
    when mercado = 'CL' then '19 a 21'
    when mercado = 'PE' then '15 a 23'
    when mercado = 'US' and p = '' then '6 a 12'
    else null
  end
  from (select lower(coalesce(pais, '')) as p) x;
$function$;
