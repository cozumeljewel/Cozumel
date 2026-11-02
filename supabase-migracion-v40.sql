-- v40 (2026-11-02) · Dirección por partes en reservas y pedidos (lo pidió
-- Emanco: ciudad y estado en columnas separadas). La web ya la pide así
-- (calle, piso, código postal, ciudad, estado); direccion_envio sigue con
-- todo junto para los emails.

alter table public.reservas add column if not exists dir_calle text;
alter table public.reservas add column if not exists dir_piso text;
alter table public.reservas add column if not exists dir_cp text;
alter table public.reservas add column if not exists dir_ciudad text;
alter table public.reservas add column if not exists dir_provincia text;

alter table public.pedidos add column if not exists dir_calle text;
alter table public.pedidos add column if not exists dir_piso text;
alter table public.pedidos add column if not exists dir_cp text;
alter table public.pedidos add column if not exists dir_ciudad text;
alter table public.pedidos add column if not exists dir_provincia text;

-- Copia a pedidos por NOMBRE de columna (no por posición): así añadir
-- columnas a una tabla no descuadra la otra.
create or replace function public.copiar_a_pedidos()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.estado = 'pagado' and old.estado is distinct from 'pagado' then
    insert into public.pedidos
    select x.* from jsonb_populate_record(null::public.pedidos,
      to_jsonb(new) || jsonb_build_object(
        'pieza', public.nombre_de_pieza(new.producto),
        'sku', public.sku_de_pedido(new.producto, new.personalizacion),
        'detalle', public.detalle_pieza_email(new.producto, new.personalizacion))) x
    on conflict (id) do nothing;
  end if;
  return null;
end $$;

-- Los 5 pedidos que ya hay (2/11), con la dirección separada a mano
update public.pedidos set dir_calle = '1714 E Street', dir_ciudad = 'Schuyler', dir_provincia = 'NE', dir_cp = '68661'
  where direccion_envio ilike '%Schuyler%';
update public.pedidos set dir_calle = '1123 Greencroft St', dir_ciudad = 'Channelview', dir_provincia = 'TX', dir_cp = '77530'
  where direccion_envio ilike '%Channelview%';
update public.pedidos set dir_calle = '660 Bay St', dir_piso = '(shampoo)', dir_ciudad = 'Staten Island', dir_provincia = 'NY', dir_cp = '10304'
  where direccion_envio ilike '%Staten Island%';
