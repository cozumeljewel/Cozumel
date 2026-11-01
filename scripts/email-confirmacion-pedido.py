"""Email de confirmación de compra (31/10/2026), con el diseño de los emails
de la colección de hombre (cabecera del chile, fondo beige, tarjeta blanca).

Genera:
    supabase-migracion-v38.sql            la función notificar_pedidos_pagados
                                          con el email nuevo al cliente (el del
                                          negocio no cambia) y detalle_pieza_email
    emails/confirmacion-pedido-VISTA-PREVIA.html   cómo se ve, con datos de ejemplo

La plantilla lleva marcas {{...}} que la función de Supabase sustituye con
replace() por los datos del pedido (escapados).
Uso (desde la raíz):  python scripts/email-confirmacion-pedido.py
"""
import os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)
WEB = 'https://cozumeljewelry.es/'

PLANTILLA = '''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<style>
  :root { color-scheme: light only; supported-color-schemes: light only; }
  [data-ogsb] .f-beige { background-color:#EFE9DF !important; }
  [data-ogsb] .f-blanco { background-color:#FFFFFF !important; }
  [data-ogsb] .f-crema { background-color:#F8F3E9 !important; }
  [data-ogsb] .f-oro { background-color:#B08A45 !important; }
  [data-ogsc] .t-verde { color:#14454A !important; }
  [data-ogsc] .t-texto { color:#2B3B3C !important; }
  [data-ogsc] .t-oro { color:#B08A45 !important; }
  [data-ogsc] .t-gris { color:#7A8586 !important; }
  [data-ogsc] .t-blanco { color:#FFFFFF !important; }
</style>
<title>Pedido confirmado · Cozumel Jewelry</title>
</head>
<body class="body" style="margin:0; padding:0; background:#EFE9DF;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">Hemos recibido tu pago. Ya estamos preparando tu pedido.&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="f-beige" style="background:#EFE9DF;">
<tr><td align="center" style="padding:28px 12px;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="f-blanco" style="max-width:560px; background:#FFFFFF; border-radius:4px; overflow:hidden;">

    <tr><td style="padding:0; line-height:0; font-size:0;">
      <a href="WEB" style="text-decoration:none;"><img src="WEBimg/email-cabecera.jpg" width="560" alt="Cozumel Jewelry" style="display:block; width:100%; max-width:560px; height:auto; border:0;"></a>
    </td></tr>

    <tr><td style="padding:36px 36px 8px; font-family:Georgia, 'Times New Roman', serif; color:#14454A; text-align:center;">
      <p style="margin:0 0 6px; font-family:Helvetica, Arial, sans-serif; font-size:12px; letter-spacing:3px; text-transform:uppercase; color:#B08A45;" class="t-oro">Pedido confirmado</p>
      <h1 style="margin:0; font-weight:normal; font-size:34px; line-height:1.2; color:#14454A;" class="t-verde">Gracias, {{NOMBRE}}.</h1>
    </td></tr>

    <tr><td style="padding:18px 40px 0; font-family:Helvetica, Arial, sans-serif; font-size:16px; line-height:1.65; color:#2B3B3C; text-align:center;">
      <p style="margin:0; color:#2B3B3C;" class="t-texto">Hemos recibido tu pago y ya estamos preparando tu pedido. Te escribiremos en cuanto salga hacia ti.</p>
    </td></tr>

    <!-- Tu pedido -->
    <tr><td style="padding:30px 36px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #E6E0D5;">
        <tr><td colspan="2" style="padding:18px 0 6px; font-family:Helvetica, Arial, sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#7A8586;" class="t-gris">{{TITULO_PEDIDO}}</td></tr>
{{FILAS}}
        <tr>
          <td style="padding:14px 0; border-top:1px solid #E6E0D5; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; color:#14454A; white-space:nowrap;" class="t-verde">Total pagado</td>
          <td align="right" style="padding:14px 0; border-top:1px solid #E6E0D5; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; color:#14454A;" class="t-verde">{{TOTAL}}</td>
        </tr>
        <tr>
          <td valign="top" style="padding:12px 0; border-top:1px solid #E6E0D5; font-family:Helvetica, Arial, sans-serif; font-size:13.5px; color:#7A8586;" class="t-gris">Enviamos a</td>
          <td align="right" style="padding:12px 0; border-top:1px solid #E6E0D5; font-family:Helvetica, Arial, sans-serif; font-size:13.5px; color:#2B3B3C;" class="t-texto">{{DIRECCION}}</td>
        </tr>
        <tr>
          <td valign="top" style="padding:12px 0 16px; border-top:1px solid #E6E0D5; border-bottom:1px solid #E6E0D5; font-family:Helvetica, Arial, sans-serif; font-size:13.5px; color:#7A8586;" class="t-gris">Entrega</td>
          <td align="right" style="padding:12px 0 16px; border-top:1px solid #E6E0D5; border-bottom:1px solid #E6E0D5; font-family:Helvetica, Arial, sans-serif; font-size:13.5px; color:#2B3B3C;" class="t-texto">{{PLAZO}}</td>
        </tr>
      </table>
    </td></tr>

    <!-- Sorteo -->
    <tr><td align="center" style="padding:26px 40px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td class="f-crema" style="background:#F8F3E9; border:1px solid #C6A664; border-radius:4px; padding:16px 18px; font-family:Helvetica, Arial, sans-serif; font-size:15px; line-height:1.55; color:#7A5F2A; text-align:center;">✦ Con tu compra ya estás en el sorteo de <strong>5 videollamadas conmigo</strong> ✦</td></tr>
      </table>
    </td></tr>

    <!-- Botón -->
    <tr><td align="center" style="padding:26px 32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:440px;">
        <tr><td align="center" bgcolor="#B08A45" class="f-oro" style="border-radius:3px; background:#B08A45;">
          <a href="WEBproductos.html?c=men" style="display:block; padding:18px 24px; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; letter-spacing:2px; text-transform:uppercase; color:#FFFFFF; text-decoration:none;" class="t-blanco">Ver la colección</a>
        </td></tr>
      </table>
    </td></tr>

    <!-- Firma -->
    <tr><td style="padding:30px 40px 36px; font-family:Georgia, 'Times New Roman', serif; text-align:center; color:#14454A;">
      <p style="margin:0 0 14px; font-size:17px; font-style:italic; color:#14454A;" class="t-verde">Gracias por estar desde el principio.</p>
      <p style="margin:0; font-size:20px; color:#14454A;" class="t-verde">Adri 🤍</p>
      <p style="margin:4px 0 0; font-family:Helvetica, Arial, sans-serif; font-size:11px; letter-spacing:4px; color:#B08A45;" class="t-oro">COZUMEL</p>
    </td></tr>

  </table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td style="padding:18px 20px 0; font-family:Helvetica, Arial, sans-serif; font-size:12px; line-height:1.5; color:#7A8586; text-align:center;" class="t-gris">
      ¿Alguna duda con tu pedido? <a href="WEBcontacto.html" style="color:#7A8586;">Escríbenos</a>
    </td></tr>
  </table>

</td></tr>
</table>
</body>
</html>
'''.replace('WEB', WEB)

FILA = '''        <tr><td colspan="2" style="padding:12px 0; border-top:1px solid #F1ECE3;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="top" style="font-family:Georgia, 'Times New Roman', serif; font-size:18px; color:#14454A;" class="t-verde">{{PIEZA}}<div style="padding-top:4px; font-family:Helvetica, Arial, sans-serif; font-size:13px; color:#7A8586;" class="t-gris">{{DETALLE}}</div></td>
            <td align="right" valign="top" style="font-family:Helvetica, Arial, sans-serif; font-size:14px; color:#2B3B3C; white-space:nowrap;" class="t-texto">{{PRECIO}}</td>
          </tr></table>
        </td></tr>'''

# ---------- Vista previa con datos de ejemplo ----------
ejemplo = PLANTILLA.replace('{{NOMBRE}}', 'Eduardo').replace('{{TITULO_PEDIDO}}', 'Tu pedido') \
    .replace('{{FILAS}}', FILA.replace('{{PIEZA}}', 'Guajillo').replace('{{DETALLE}}', 'Oro 18K · Colgante de regalo: Cruz grande').replace('{{PRECIO}}', '33,92 EUR')) \
    .replace('{{TOTAL}}', '33,92 EUR').replace('{{DIRECCION}}', 'Manuel Pereira N 2 1A, Madrid') \
    .replace('{{PLAZO}}', '6 a 10 días laborables desde que sale del taller')
open('emails/confirmacion-pedido-VISTA-PREVIA.html', 'w', encoding='utf-8').write(ejemplo.replace(WEB + 'img/', '../img/'))


# ---------- SQL ----------
def lit(t):
    return "$tpl$" + t + "$tpl$"


fn = open(os.environ['FN_ACTUAL'], encoding='utf-8').read()
ini = fn.index('    -- ================= Email al CLIENTE =================')
fin = fn.index('    -- ================= Email al NEGOCIO =================')
cliente = '''    -- ================= Email al CLIENTE (v38, 31/10/2026) =================
    -- Diseño de los emails de la colección de hombre. Plantilla con marcas
    -- {{...}}; los datos del cliente van escapados (esc_html).
    select string_agg(
      replace(replace(replace(''' + lit(FILA) + ''',
        '{{PIEZA}}', public.esc_html(public.nombre_de_pieza(n.producto))),
        '{{DETALLE}}', coalesce(public.esc_html(public.detalle_pieza_email(n.producto, n.personalizacion)), '')),
        '{{PRECIO}}', case when moneda_ped in ('COP','CLP','ARS')
          then trim(to_char(n.precio_pagado, '999G999G999')) else trim(to_char(n.precio_pagado, '999999999D99')) end || ' ' || moneda_ped),
      E'\\n' order by public.nombre_de_pieza(n.producto))
    into filas_cliente
    from nuevas n
    where coalesce(n.stripe_session_id, n.id::text) = ped.ref
      and n.estado = 'pagado';

    perform net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || resend_key,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'from', 'Cozumel Jewelry <pedidos@cozumeljewelry.es>',
        'to', array[ped.email],
        'subject', 'Pedido confirmado · Cozumel Jewelry',
        'html',
        replace(replace(replace(replace(replace(replace(replace(''' + lit(PLANTILLA) + ''',
          '{{NOMBRE}}', coalesce(public.esc_html(split_part(trim(ped.nombre), ' ', 1)), '')),
          '{{TITULO_PEDIDO}}', case when ped.piezas = 1 then 'Tu pedido' else 'Tu pedido · ' || ped.piezas || ' piezas' end),
          '{{FILAS}}', coalesce(filas_cliente, '')),
          '{{TOTAL}}', total_texto),
          '{{DIRECCION}}', coalesce(public.esc_html(ped.direccion_envio), '—')),
          '{{PLAZO}}', coalesce(public.plazo_envio(ped.pais, ped.mercado) || ' días laborables desde que sale del taller', 'Te enviaremos el seguimiento en cuanto salga del taller')),
          '{{X}}', '')
      )
    );

'''
fn = fn[:ini] + cliente + fn[fin:]
# El bloque viejo que llenaba filas_cliente (antes del email) ya no hace falta:
# se rellena dentro del bloque nuevo. Se deja tal cual (se sobrescribe).

cabecera = '''-- v38 (2026-10-31) · Email de confirmación de compra con el diseño de los
-- emails de la colección de hombre (generado por scripts/email-confirmacion-pedido.py).

-- Escapa texto para meterlo en el HTML del email.
create or replace function public.esc_html(t text) returns text
language sql immutable as $$
  select replace(replace(replace(replace(t, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;')
$$;

-- Línea de detalle de cada pieza en el email al cliente. Hombre: material
-- (Oro 18K…), medidas y colgante de regalo; mujer: lo de siempre (grabado y
-- acabados legibles).
create or replace function public.detalle_pieza_email(producto text, personalizacion jsonb)
returns text language sql immutable as $$
  select case when producto like 'hombre\\_%' then
    nullif(concat_ws(' · ',
      case personalizacion->>'acabado'
        when 'oro' then 'Oro 18K' when 'oro_blanco' then 'Oro blanco 18K'
        when 'plata' then 'Acero inoxidable' when 'negro' then 'Negro IP' end,
      'Talla ' || nullif(personalizacion->>'talla', ''),
      'Largo ' || nullif(personalizacion->>'largo', ''),
      'Grosor ' || nullif(personalizacion->>'grosor', ''),
      'Ancho ' || nullif(personalizacion->>'ancho', ''),
      'Colgante de regalo: ' || nullif(split_part(personalizacion->>'colgante', ' · ', 1), ''),
      'Grabado: «' || nullif(personalizacion->>'grabado', '') || '»'
    ), '')
  else public.grabado_legible(personalizacion) end
$$;

'''
open('supabase-migracion-v38.sql', 'w', encoding='utf-8').write(cabecera + fn.rstrip() + ';\n')
print('ok')
