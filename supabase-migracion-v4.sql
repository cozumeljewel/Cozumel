-- ============================================================
-- MIGRACIÓN v4 · apellidos + dirección de envío en las reservas
--
-- Pega esto en el SQL Editor de Supabase y pulsa Run.
-- Hasta que no lo ejecutes, el formulario de reservar.html fallará
-- al enviar: intentará guardar "apellidos" y "direccion_envio", y esas
-- columnas todavía no existen en la tabla.
-- ============================================================

alter table public.reservas
  add column if not exists apellidos text,
  add column if not exists direccion_envio text;

-- ============================================================
-- No hace falta tocar la política RLS: solo valida producto, fuente,
-- estado y consentimiento (ver supabase-migracion-v3.sql). Las columnas
-- de texto libre (nombre, email, whatsapp, pais, apellidos,
-- direccion_envio) no llevan check propio, igual que hasta ahora.
-- ============================================================
