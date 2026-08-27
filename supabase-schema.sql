-- ============================================================
-- Esquema Supabase · MVP joyería personalizada
-- Pega esto entero en el SQL Editor de tu proyecto Supabase
-- (Project → SQL Editor → New query → pegar → Run)
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- RESERVAS ----------
create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null check (char_length(nombre) between 1 and 80),
  email text not null check (char_length(email) between 3 and 120),
  whatsapp text not null check (char_length(whatsapp) between 3 and 30),
  pais text not null check (char_length(pais) between 1 and 60),
  personalizacion jsonb not null,
  producto text not null default 'collar_personalizado',
  fuente text not null default 'adri_story',
  estado text not null default 'reserva',
  consentimiento boolean not null default false,
  session_id uuid
);

alter table public.reservas enable row level security;

-- Solo INSERT desde el navegador (clave anon). Sin política de
-- SELECT/UPDATE/DELETE, nadie puede leer ni tocar filas desde fuera.
-- El with check obliga a que los valores "fijos" sean correctos y a
-- que haya consentimiento, aunque alguien manipule el JS del cliente.
create policy "anon inserta reservas"
  on public.reservas for insert
  to anon
  with check (
    producto = 'collar_personalizado'
    and fuente = 'adri_story'
    and estado = 'reserva'
    and consentimiento = true
  );

-- ---------- EVENTOS (embudo de validación) ----------
create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  evento text not null check (
    evento in ('view','personalizacion_iniciada','reserva_iniciada','reserva_completada')
  ),
  session_id uuid not null,
  fuente text not null default 'adri_story'
);

alter table public.eventos enable row level security;

create policy "anon inserta eventos"
  on public.eventos for insert
  to anon
  with check (fuente = 'adri_story');

-- ============================================================
-- Cómo leer el embudo (Table Editor > SQL Editor, ya autenticado
-- como tú, así que RLS no te afecta a ti):
--
--   select evento, count(distinct session_id) as personas
--   from eventos
--   group by evento
--   order by
--     case evento
--       when 'view' then 1
--       when 'personalizacion_iniciada' then 2
--       when 'reserva_iniciada' then 3
--       when 'reserva_completada' then 4
--     end;
--
-- La clave service_role (Settings > API) NUNCA va en el frontend.
-- Solo la clave "anon public" va en supabase-config.js.
-- ============================================================
