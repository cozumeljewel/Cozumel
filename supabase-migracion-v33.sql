-- =============================================================
-- v33 (2026-10-16) · Fuera "un pedacito de ti" de los emails
-- La marca deja de usar ese lema: en los emails de pedido pagado y de
-- colección completa se quitan las frases, sin tocar nada más de cada
-- función (se reescribe su propia definición con los textos cambiados).
-- Los nombres de producto ("Kit Pedacito de Nosotros") se quedan.
-- =============================================================
do $$
declare
  f record;
  def text;
begin
  for f in
    select p.oid, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('notificar_pedido_pagado', 'notificar_pedidos_pagados', 'revisar_coleccion_completa')
  loop
    def := pg_get_functiondef(f.oid);
    def := replace(def, '<br>Estás regalando un pedacito de ti.', '');
    def := replace(def, 'Somos un pedacito de lo que regalamos.', 'Cozumel Jewelry');
    def := replace(def, 'Un pedacito de lo que regalamos.', 'Cozumel Jewelry');
    def := replace(def, 'Tienes las cinco piezas de <em>Un Pedacito de ti</em>', 'Tienes las cinco piezas de la colección');
    def := replace(def, 'Un pedacito de mí, para ti', 'De Adri, para ti');
    execute def;
  end loop;
end $$;
