-- =============================================================
-- MIGRACIÓN v24 · países a los que se envía (activables sin publicar)
--
-- El campo "País" de comprar.html pasa a ser un desplegable con los países
-- ACTIVOS de esta tabla, y crear-sesion-pago rechaza cobrar un pedido a un
-- país que no esté activo. Para pausar o abrir un país: Supabase → Table
-- Editor → paises_envio → casilla "activo". No hace falta publicar nada.
--
-- 2026-09-30: el taller acepta Ecuador, Guatemala, El Salvador y Costa
-- Rica, pero con rutas poco probadas: la idea es aceptar los primeros
-- pedidos, pausarlos y reabrirlos cuando lleguen bien. Venezuela y Bolivia
-- no tienen envío; Argentina exige demasiado (número fiscal, registro DFE,
-- sin devoluciones): quedan desactivados.
-- =============================================================

create table if not exists public.paises_envio (
  codigo text primary key check (codigo ~ '^[A-Z]{2}$'),
  nombre text not null unique,
  activo boolean not null default true,
  orden int not null default 100
);

alter table public.paises_envio enable row level security;

-- La web necesita leer la lista (solo lectura). Nadie puede cambiarla
-- desde la web: solo desde el panel de Supabase.
drop policy if exists "cualquiera lee los paises de envio" on public.paises_envio;
create policy "cualquiera lee los paises de envio"
  on public.paises_envio for select
  to anon, authenticated
  using (true);
revoke all on public.paises_envio from anon, authenticated;
grant select on public.paises_envio to anon, authenticated;

insert into public.paises_envio (codigo, nombre, activo, orden) values
  -- Los principales, arriba
  ('MX', 'México', true, 1),
  ('ES', 'España', true, 2),
  ('US', 'Estados Unidos', true, 3),
  ('CO', 'Colombia', true, 4),
  ('CL', 'Chile', true, 5),
  ('PE', 'Perú', true, 6),
  -- Rutas nuevas (2026-09-30): abiertas para probar
  ('EC', 'Ecuador', true, 10),
  ('GT', 'Guatemala', true, 10),
  ('SV', 'El Salvador', true, 10),
  ('CR', 'Costa Rica', true, 10),
  -- Resto de la Unión Europea (tarifa "EU Countries" del taller)
  ('DE', 'Alemania', true, 20), ('AT', 'Austria', true, 20), ('BE', 'Bélgica', true, 20),
  ('BG', 'Bulgaria', true, 20), ('CY', 'Chipre', true, 20), ('HR', 'Croacia', true, 20),
  ('DK', 'Dinamarca', true, 20), ('SK', 'Eslovaquia', true, 20), ('SI', 'Eslovenia', true, 20),
  ('EE', 'Estonia', true, 20), ('FI', 'Finlandia', true, 20), ('FR', 'Francia', true, 20),
  ('GR', 'Grecia', true, 20), ('HU', 'Hungría', true, 20), ('IE', 'Irlanda', true, 20),
  ('IT', 'Italia', true, 20), ('LV', 'Letonia', true, 20), ('LT', 'Lituania', true, 20),
  ('LU', 'Luxemburgo', true, 20), ('MT', 'Malta', true, 20), ('NL', 'Países Bajos', true, 20),
  ('PL', 'Polonia', true, 20), ('PT', 'Portugal', true, 20), ('CZ', 'República Checa', true, 20),
  ('RO', 'Rumanía', true, 20), ('SE', 'Suecia', true, 20),
  -- Desactivados
  ('AR', 'Argentina', false, 90),
  ('VE', 'Venezuela', false, 90),
  ('BO', 'Bolivia', false, 90)
on conflict (codigo) do nothing;
