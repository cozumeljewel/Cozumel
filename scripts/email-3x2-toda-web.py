"""Email "Black Friday 3x2 en toda la web" (15/11/2026) para el resto de la
lista (la del lanzamiento de mujer del 2/10, la cuenta atrás, la votación…),
los que no recibieron el del 14/11 (scripts/email-3x2-hombre.py). El 3x2 vale
desde el 14/11 por la tarde en mujer y en hombre: piezas de los dos.

    emails/toda-web-3x2.html        español, Broadcast (baja de Resend)
    emails/toda-web-3x2-mail.html   español, envío uno a uno (baja por mailto)
    emails/toda-web-3x2-en.html     inglés, uno a uno (baja por mailto)

Uso (desde la raíz):  python scripts/email-3x2-toda-web.py
"""
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fuente = open(os.path.join(RAIZ, 'scripts', 'email-lanzamiento-hombre.py'), encoding='utf-8').read()
exec(fuente[:fuente.index('for t in TEXTOS.values():')])

VERDE = 'style="color:#14454A;" class="t-verde"'
BAJA_RESEND = '{{{RESEND_UNSUBSCRIBE_URL}}}'
TEXTOS = {
    'es': {
        'lang': 'es', 'archivo': 'emails/toda-web-3x2.html',
        'asunto': 'Black Friday · Llévate 3, paga 2 en toda la web',
        'titulo': 'Black Friday · 3x2 en toda la web',
        'previa': 'Este Black Friday, la tercera pieza te sale gratis. En mujer y en hombre, hasta el 30 de noviembre.',
        'eyebrow': 'Black Friday', 'h1': 'Llévate 3, paga 2.',
        'intro': f'Este Black Friday, en <strong {VERDE}>toda la web</strong>, colección de mujer y de hombre: añade 3 piezas al carrito y <strong {VERDE}>la tercera te sale gratis</strong>.',
        'promo': '<strong>3x2 en todas las piezas</strong><br>hasta el 30 de noviembre · sin códigos',
        'regalo': f'Una para ti y dos para regalar esta Navidad. Muchas se pueden <strong {VERDE}>grabar con un nombre, una fecha o una frase</strong>. Y el envío es gratis.',
        'cta': 'Ver la colección para ella',
        'cta2': 'o ver la colección para él →',
        'favoritas': 'Para ella y para él',
        'piezas': [('Mi Cielo', 'Pulsera grabada · dorado'), ('Esencia', 'Collar con placa grabada · dorado'),
                   ('Copal', 'Cadena · oro blanco'), ('Mezcal', 'Collar con cruz · oro')],
        'ver': 'Ver',
        'sorteo': '',
        'gracias': 'Gracias por estar con nosotros.',
        'pie': 'Recibes este correo porque te apuntaste a la lista de Cozumel Jewelry.',
        'baja': 'Darme de baja',
        'baja_url': BAJA_RESEND,
    },
    'en': {
        'lang': 'en', 'archivo': 'emails/toda-web-3x2-en.html',
        'asunto': 'Black Friday · Get 3, pay for 2 on everything',
        'titulo': 'Black Friday · 3 for 2 on everything',
        'previa': 'This Black Friday, the third piece is free. Women’s and men’s, until November 30.',
        'eyebrow': 'Black Friday', 'h1': 'Get 3, pay for 2.',
        'intro': f'This Black Friday, across <strong {VERDE}>the whole store</strong>, women’s and men’s collections: add 3 pieces to your cart and <strong {VERDE}>the third one is free</strong>.',
        'promo': '<strong>3 for 2 on every piece</strong><br>until November 30 · no code needed',
        'regalo': f'One for you, two to gift this Christmas. Many pieces can be <strong {VERDE}>engraved with a name, a date or a phrase</strong>. And shipping is free.',
        'cta': 'Shop for her',
        'cta2': 'or shop for him →',
        'favoritas': 'For her and for him',
        'piezas': [('Mi Cielo', 'Engraved bracelet · gold-tone'), ('Esencia', 'Engraved tag necklace · gold-tone'),
                   ('Copal', 'Chain · white gold'), ('Mezcal', 'Cross necklace · gold')],
        'ver': 'View',
        'sorteo': '',
        'gracias': 'Thank you for being with us.',
        'pie': 'You’re receiving this email because you joined the Cozumel Jewelry list.',
        'baja': 'Unsubscribe',
        'baja_url': 'mailto:cozumeljewel@gmail.com?subject=Unsubscribe%20Cozumel',
    },
}

# Cuadrícula: arriba mujer (personalizar.html?p=slug), abajo hombre
FICHAS_TODAS = [('mujer', 'pulsera-nombre', 'mi-cielo'), ('mujer', 'collar-esencial', 'esencia'),
                ('hombre', 'hombre_collar_7&amp;a=oro_blanco', 'copal'), ('hombre', 'hombre_collar_3&amp;a=oro', 'mezcal')]

_utm_original = utm
def utm(t, contenido):  # noqa: F811  (campaña propia de este email)
    u = _utm_original(t, contenido).replace('hombre_lanzamiento_', 'toda_web_3x2_')
    return u + ('&amp;lang=en' if t['lang'] == 'en' else '')


def celda(t, i):  # noqa: F811
    tipo, ref, foto = FICHAS_TODAS[i]
    nombre, desc = t['piezas'][i]
    if tipo == 'mujer':
        url, img = f'{WEB}personalizar.html?p={ref}&amp;{utm(t, foto)}', f'{WEB}img/email-mujer-{foto}.jpg'
    else:
        url, img = f'{WEB}hombre.html?id={ref}&amp;{utm(t, foto)}', f'{WEB}img/email-voto-{foto}.jpg'
    return f'''<td width="50%" valign="top" style="padding:6px;">
            <a href="{url}" style="text-decoration:none; display:block;">
              <img src="{img}" width="234" alt="{nombre} · {desc}" style="display:block; width:100%; height:auto; border:0; border-radius:3px;">
              <p style="margin:10px 0 2px; font-family:Georgia, 'Times New Roman', serif; font-size:18px; color:#14454A;" class="t-verde">{nombre}</p>
              <p style="margin:0 0 6px; font-family:Helvetica, Arial, sans-serif; font-size:12px; color:#7A8586;" class="t-gris">{desc}</p>
            </a>
          </td>'''


FIRMA_ADRI = '<p style="margin:0; font-size:20px; color:#14454A;" class="t-verde">Adri 🤍</p>'


def generar(t):
    html = email(t)
    ini = html.index('    <!-- Sorteo -->')
    html = html[:ini] + html[html.index('    <!-- Firma -->'):]
    firma = 'El equipo de Cozumel 🤍' if t['lang'] == 'es' else 'The Cozumel team 🤍'
    assert FIRMA_ADRI in html and BAJA_RESEND in html
    html = html.replace(FIRMA_ADRI, FIRMA_ADRI.replace('Adri 🤍', firma))
    # El botón y la cabecera llevan a mujer; debajo, un enlace a hombre
    tienda_h = f'{WEB}productos.html?c=men&amp;{utm(t, "cta")}'
    tienda_m = f'{WEB}productos.html?c=woman&amp;{utm(t, "cta")}'
    assert html.count(tienda_h) == 2
    html = html.replace(tienda_h, tienda_m)
    boton_fin = '''        </td></tr>
      </table>
    </td></tr>

    <!-- Las favoritas -->'''
    assert html.count(boton_fin) == 1
    html = html.replace(boton_fin, f'''        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:14px 32px 0; font-family:Helvetica, Arial, sans-serif; font-size:15px;">
      <a href="{tienda_h.replace('utm_content=cta', 'utm_content=cta_hombre')}" style="color:#14454A; text-decoration:underline;" class="t-verde">{t["cta2"]}</a>
    </td></tr>

    <!-- Las favoritas -->''')
    return html.replace(BAJA_RESEND, t['baja_url'])


for clave, t in TEXTOS.items():
    html = generar(t)
    open(t['archivo'], 'w', encoding='utf-8').write(html)
    open(t['archivo'].replace('.html', '-VISTA-PREVIA.html'), 'w', encoding='utf-8').write(html.replace(WEB + 'img/', '../img/'))
    print(t['archivo'], '·', t['asunto'])
    if clave == 'es':  # misma pieza para los que no están en Resend: baja por mailto
        mail = html.replace(BAJA_RESEND, 'mailto:cozumeljewel@gmail.com?subject=Baja%20lista%20Cozumel')
        open('emails/toda-web-3x2-mail.html', 'w', encoding='utf-8').write(mail)
        print('emails/toda-web-3x2-mail.html')
