-- =============================================================
-- MIGRACIÓN v21 · país real en la lista de espera
--
-- "mercado" guarda el grupo de precios (MX, US, ES, CL, PE), no el país:
-- Colombia, Argentina y el resto caían todos en "US" (pagan en dólares),
-- y quien se apuntaba en su primera visita llegaba sin nada porque la
-- detección todavía no había terminado. Desde ahora cuenta-atras.js
-- espera a saber el país (función /api/geo de Netlify) y lo guarda aquí
-- como código ISO de dos letras (CO, AR, ES...). Los 382 primeros
-- registros (28-29/09) no lo tienen: no se puede recuperar.
-- =============================================================
alter table public.lista_espera add column if not exists pais text
  check (pais is null or pais ~ '^[A-Z]{2}$');
