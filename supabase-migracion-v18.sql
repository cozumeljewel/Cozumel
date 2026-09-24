-- =============================================================
-- MIGRACIÓN v18 · lista de espera del lanzamiento (2 de octubre, 21:00)
--
-- La cuenta atrás de la web (cuenta-atras.js) guarda aquí el email de
-- quien quiere reservar una de las unidades limitadas. Cualquiera puede
-- apuntarse (anon o con sesión), pero NADIE puede leer la lista desde la
-- web: no hay política de SELECT. Se consulta y exporta desde el Table
-- Editor de Supabase (lista_espera → Export CSV).
--
-- Un email solo entra una vez (índice único sin distinguir mayúsculas):
-- si alguien se apunta dos veces, la web lo da por bueno igualmente.
-- =============================================================

create table if not exists public.lista_espera (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null check (
    length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  mercado text,
  consentimiento boolean not null check (consentimiento = true),
  fuente text not null default 'cuenta_atras'
);

create unique index if not exists lista_espera_email_unico
  on public.lista_espera (lower(email));

alter table public.lista_espera enable row level security;

drop policy if exists "cualquiera se apunta a la lista de espera" on public.lista_espera;
create policy "cualquiera se apunta a la lista de espera"
  on public.lista_espera for insert
  to anon, authenticated
  with check (consentimiento = true and fuente = 'cuenta_atras');

grant insert on public.lista_espera to anon, authenticated;
