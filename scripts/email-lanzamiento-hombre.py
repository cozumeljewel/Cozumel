"""Genera el email del lanzamiento de la colección de hombre (1/11/2026),
en español y en inglés, a partir de una sola plantilla:

    emails/hombre-lanzamiento.html     (español)
    emails/hombre-lanzamiento-en.html  (inglés: países de habla inglesa)

Mismo diseño que emails/hombre-muy-pronto.html (cabecera del chile, solo
modo claro). Las fotos van con URL absoluta de la web (img/email-*.jpg).
Uso (desde la raíz):  python scripts/email-lanzamiento-hombre.py
"""
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)
WEB = 'https://cozumeljewelry.es/'

TEXTOS = {
    'es': {
        'lang': 'es', 'archivo': 'emails/hombre-lanzamiento.html',
        'titulo': 'Ya está aquí · Men’s collection',
        'previa': 'Nuestra primera colección para hombre ya está disponible, con un 15 % de descuento hasta el 8 de noviembre.',
        'eyebrow': 'Men’s collection', 'h1': 'Ya está aquí.',
        'intro': 'Gracias por esperar. Nuestra <strong style="color:#14454A;" class="t-verde">primera colección para hombre</strong> ya está disponible: collares, cadenas, pulseras y anillos en oro 18K y oro blanco 18K, hechos para llevarse todos los días.',
        'promo': '<strong>−15 % de lanzamiento</strong> en todas las piezas<br>hasta el 8 de noviembre',
        'regalo': 'Y en los collares, <strong style="color:#14454A;" class="t-verde">el colgante te lo regalamos</strong>: cruces, circonitas, símbolos o tu inicial.',
        'cta': 'Ver la colección',
        'favoritas': 'Nuestras favoritas',
        'piezas': [('Mezcal', 'Collar con cruz · oro'), ('Copal', 'Cadena · plata'), ('Cacao', 'Collar con cruz de perlas · oro'), ('Ocaso', 'Anillo sello · oro')],
        'ver': 'Ver',
        'sorteo': 'Con tu primera compra entras en el sorteo de <strong>5 videollamadas conmigo</strong>.',
        'gracias': 'Gracias por estar desde el principio.',
        'pie': 'Recibes este correo porque te apuntaste a la lista de Cozumel Jewelry.',
        'baja': 'Darme de baja',
    },
    'en': {
        'lang': 'en', 'archivo': 'emails/hombre-lanzamiento-en.html',
        'titulo': 'It’s here · Men’s collection',
        'previa': 'Our first men’s collection is now available, with 15% off until November 8.',
        'eyebrow': 'Men’s collection', 'h1': 'It’s here.',
        'intro': 'Thank you for waiting. Our <strong style="color:#14454A;" class="t-verde">first men’s collection</strong> is now available: necklaces, chains, bracelets and rings in 18K gold and 18K white gold, made to be worn every day.',
        'promo': '<strong>−15% launch offer</strong> on every piece<br>until November 8',
        'regalo': 'And with our necklaces, <strong style="color:#14454A;" class="t-verde">the pendant is on us</strong>: crosses, zirconias, symbols or your initial.',
        'cta': 'Shop the collection',
        'favoritas': 'Our favourites',
        'piezas': [('Mezcal', 'Cross necklace · gold'), ('Copal', 'Chain · silver'), ('Cacao', 'Pearl cross necklace · gold'), ('Ocaso', 'Signet ring · gold')],
        'ver': 'View',
        'sorteo': 'Your first purchase enters you in the draw for <strong>5 video calls with me</strong>.',
        'gracias': 'Thank you for being here from the very start.',
        'pie': 'You’re receiving this email because you joined the Cozumel Jewelry list.',
        'baja': 'Unsubscribe',
    },
}
# Ficha de cada pieza de la rejilla (id, acabado) y su foto cuadrada
FICHAS = [('hombre_collar_3', 'oro', 'mezcal'), ('hombre_collar_7', 'oro_blanco', 'copal'),
          ('hombre_collar_6', 'oro', 'cacao'), ('hombre_anillo_1', 'oro', 'ocaso')]


def utm(t, contenido):
    return f'utm_source=resend&amp;utm_medium=email&amp;utm_campaign=hombre_lanzamiento_{t["lang"]}&amp;utm_content={contenido}'


def celda(t, i):
    pid, acabado, foto = FICHAS[i]
    nombre, desc = t['piezas'][i]
    url = f'{WEB}hombre.html?id={pid}&amp;a={acabado}&amp;{utm(t, foto)}'
    return f'''<td width="50%" valign="top" style="padding:6px;">
            <a href="{url}" style="text-decoration:none; display:block;">
              <img src="{WEB}img/email-voto-{foto}.jpg" width="234" alt="{nombre} · {desc}" style="display:block; width:100%; height:auto; border:0; border-radius:3px;">
              <p style="margin:10px 0 2px; font-family:Georgia, 'Times New Roman', serif; font-size:18px; color:#14454A;" class="t-verde">{nombre}</p>
              <p style="margin:0 0 6px; font-family:Helvetica, Arial, sans-serif; font-size:12px; color:#7A8586;" class="t-gris">{desc}</p>
            </a>
          </td>'''


def email(t):
    cab = open('emails/hombre-muy-pronto.html', encoding='utf-8').read()
    cab = cab[:cab.index('<title>')].replace('<html lang="es">', f'<html lang="{t["lang"]}">')
    tienda = f'{WEB}productos.html?c=men&amp;{utm(t, "cta")}'
    filas = '\n'.join(f'        <tr>\n          {celda(t, i)}\n          {celda(t, i + 1)}\n        </tr>' for i in (0, 2))
    return cab + f'''<title>{t["titulo"]}</title>
</head>
<body class="body" style="margin:0; padding:0; background:#EFE9DF;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">{t["previa"]}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="f-beige" style="background:#EFE9DF;">
<tr><td align="center" style="padding:28px 12px;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="f-blanco" style="max-width:560px; background:#FFFFFF; border-radius:4px; overflow:hidden;">

    <!-- Cabecera: logo sobre la foto del chile (una sola imagen) -->
    <tr><td style="padding:0; line-height:0; font-size:0;">
      <a href="{tienda}" style="text-decoration:none;"><img src="{WEB}img/email-cabecera.jpg" width="560" alt="Cozumel Jewelry" style="display:block; width:100%; max-width:560px; height:auto; border:0;"></a>
    </td></tr>

    <tr><td style="padding:36px 36px 8px; font-family:Georgia, 'Times New Roman', serif; color:#14454A; text-align:center;">
      <p style="margin:0 0 6px; font-family:Helvetica, Arial, sans-serif; font-size:12px; letter-spacing:3px; text-transform:uppercase; color:#B08A45;" class="t-oro">{t["eyebrow"]}</p>
      <h1 style="margin:0; font-weight:normal; font-size:36px; line-height:1.2; color:#14454A;" class="t-verde">{t["h1"]}</h1>
    </td></tr>

    <tr><td style="padding:20px 40px 0; font-family:Helvetica, Arial, sans-serif; font-size:16px; line-height:1.65; color:#2B3B3C; text-align:center;">
      <p style="margin:0; color:#2B3B3C;" class="t-texto">{t["intro"]}</p>
    </td></tr>

    <!-- Promoción -->
    <tr><td align="center" style="padding:24px 40px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td style="background:#14454A; border-radius:3px; padding:16px 18px; font-family:Helvetica, Arial, sans-serif; font-size:15px; line-height:1.5; letter-spacing:1px; color:#FFFFFF; text-align:center;" class="t-blanco">{t["promo"]}</td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:20px 40px 0; font-family:Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6; color:#2B3B3C; text-align:center;" class="t-texto">{t["regalo"]}</td></tr>

    <!-- Botón -->
    <tr><td align="center" style="padding:24px 32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:440px;">
        <tr><td align="center" bgcolor="#B08A45" class="f-oro" style="border-radius:3px; background:#B08A45;">
          <a href="{tienda}" style="display:block; padding:20px 24px; font-family:Helvetica, Arial, sans-serif; font-size:16px; font-weight:bold; letter-spacing:2px; text-transform:uppercase; color:#FFFFFF; text-decoration:none;" class="t-blanco">{t["cta"]}</a>
        </td></tr>
      </table>
    </td></tr>

    <!-- Las favoritas -->
    <tr><td style="padding:34px 30px 0; font-family:Georgia, 'Times New Roman', serif; text-align:center; color:#14454A;">
      <p style="margin:0; font-size:24px; color:#14454A;" class="t-verde">{t["favoritas"]}</p>
    </td></tr>
    <tr><td align="center" style="padding:14px 24px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="text-align:center;">
{filas}
      </table>
    </td></tr>

    <!-- Sorteo -->
    <tr><td align="center" style="padding:24px 40px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td class="f-crema" style="background:#F8F3E9; border:1px solid #C6A664; border-radius:4px; padding:16px 18px; font-family:Helvetica, Arial, sans-serif; font-size:15px; line-height:1.55; color:#7A5F2A; text-align:center;">{t["sorteo"]}</td></tr>
      </table>
    </td></tr>

    <!-- Firma -->
    <tr><td style="padding:30px 40px 36px; font-family:Georgia, 'Times New Roman', serif; text-align:center; color:#14454A;">
      <p style="margin:0 0 14px; font-size:17px; font-style:italic; color:#14454A;" class="t-verde">{t["gracias"]}</p>
      <p style="margin:0; font-size:20px; color:#14454A;" class="t-verde">Adri 🤍</p>
      <p style="margin:4px 0 0; font-family:Helvetica, Arial, sans-serif; font-size:11px; letter-spacing:4px; color:#B08A45;" class="t-oro">COZUMEL</p>
    </td></tr>

  </table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td style="padding:18px 20px 0; font-family:Helvetica, Arial, sans-serif; font-size:12px; line-height:1.5; color:#7A8586; text-align:center;" class="t-gris">
      {t["pie"]}<br>
      <a href="{{{{{{RESEND_UNSUBSCRIBE_URL}}}}}}" style="color:#7A8586;">{t["baja"]}</a>
    </td></tr>
  </table>

</td></tr>
</table>
</body>
</html>
'''


for t in TEXTOS.values():
    html = email(t)
    open(t['archivo'], 'w', encoding='utf-8').write(html)
    # Copia para verlo en local con las fotos del ordenador
    vista = t['archivo'].replace('.html', '-VISTA-PREVIA.html')
    open(vista, 'w', encoding='utf-8').write(html.replace(WEB + 'img/', '../img/'))
    print(t['archivo'])
