-- v31 (2026-10-03) · Embudo más fino: además de "view" (portada), se
-- registra la llegada a la colección y a la ficha de cada pieza (o a
-- "Arma tu kit"), para saber en qué paso se va la gente.
alter table public.eventos drop constraint eventos_evento_check;
alter table public.eventos add constraint eventos_evento_check check (evento = any (array[
  'view', 'coleccion_vista', 'producto_visto',
  'personalizacion_iniciada', 'reserva_iniciada', 'reserva_completada',
  'compra_iniciada', 'compra_completada'
]));
