"""Email "Black Friday 3x2" de la colección de hombre (14/11/2026) para los
inscritos en la newsletter de la portada (se les prometió un descuento).
Español e inglés. Mismo diseño que email-lanzamiento-hombre.py (cabecera del
chile), sin sorteo y firmado por el equipo. El español va por Broadcast al
segmento "Newsletter web (3x2 14/11)" (baja de Resend); el inglés, 3 personas,
uno a uno por la API, con la baja por mailto (como los envíos del 8/11).

    emails/hombre-3x2.html     (español)
    emails/hombre-3x2-en.html  (inglés)

Uso (desde la raíz):  python scripts/email-3x2-hombre.py
"""
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fuente = open(os.path.join(RAIZ, 'scripts', 'email-lanzamiento-hombre.py'), encoding='utf-8').read()
exec(fuente[:fuente.index('for t in TEXTOS.values():')])

VERDE = 'style="color:#14454A;" class="t-verde"'
TEXTOS = {
    'es': {
        'lang': 'es', 'archivo': 'emails/hombre-3x2.html',
        'asunto': 'Black Friday · Llévate 3, paga 2',
        'titulo': 'Black Friday · 3x2 Men’s collection',
        'previa': 'Te prometimos un descuento por suscribirte. Aquí está: 3x2 en toda la colección de hombre hasta el 30 de noviembre.',
        'eyebrow': 'Black Friday', 'h1': 'Llévate 3, paga 2.',
        'intro': f'Cuando te suscribiste te prometimos un descuento. Este Black Friday te traemos algo mejor: en toda nuestra <strong {VERDE}>colección para hombre</strong>, añade 3 piezas al carrito y <strong {VERDE}>la tercera te sale gratis</strong>.',
        'promo': '<strong>3x2 en todas las piezas de hombre</strong><br>hasta el 30 de noviembre · sin códigos',
        'regalo': f'Una para ti y dos para regalar esta Navidad. En los collares, <strong {VERDE}>el colgante es un regalo</strong>: cruces, circonitas, símbolos o tu inicial. Y el envío es gratis.',
        'cta': 'Ver la colección',
        'favoritas': 'Nuestras favoritas',
        'piezas': [('Mezcal', 'Collar con cruz · oro'), ('Copal', 'Cadena · oro blanco'), ('Cacao', 'Collar con cruz de perlas · oro'), ('Ocaso', 'Anillo sello · oro')],
        'ver': 'Ver',
        'sorteo': '',
        'gracias': 'Gracias por estar con nosotros.',
        'pie': 'Recibes este correo porque te suscribiste en la web de Cozumel Jewelry.',
        'baja': 'Darme de baja',
        'baja_url': '{{{RESEND_UNSUBSCRIBE_URL}}}',  # va por Broadcast (segmento)
    },
    'en': {
        'lang': 'en', 'archivo': 'emails/hombre-3x2-en.html',
        'asunto': 'Black Friday · Get 3, pay for 2',
        'titulo': 'Black Friday · 3 for 2 Men’s collection',
        'previa': 'We promised you a discount for subscribing. Here it is: 3 for 2 across the whole men’s collection until November 30.',
        'eyebrow': 'Black Friday', 'h1': 'Get 3, pay for 2.',
        'intro': f'When you subscribed, we promised you a discount. This Black Friday we have something better: across our whole <strong {VERDE}>men’s collection</strong>, add 3 pieces to your cart and <strong {VERDE}>the third one is free</strong>.',
        'promo': '<strong>3 for 2 on every men’s piece</strong><br>until November 30 · no code needed',
        'regalo': f'One for you, two to gift this Christmas. With our necklaces, <strong {VERDE}>the pendant is on us</strong>: crosses, zirconias, symbols or your initial. And shipping is free.',
        'cta': 'Shop the collection',
        'favoritas': 'Our favourites',
        'piezas': [('Mezcal', 'Cross necklace · gold'), ('Copal', 'Chain · white gold'), ('Cacao', 'Pearl cross necklace · gold'), ('Ocaso', 'Signet ring · gold')],
        'ver': 'View',
        'sorteo': '',
        'gracias': 'Thank you for being with us.',
        'pie': 'You’re receiving this email because you subscribed on the Cozumel Jewelry website.',
        'baja': 'Unsubscribe',
        'baja_url': 'mailto:cozumeljewel@gmail.com?subject=Unsubscribe%20Cozumel',
    },
}

_utm_original = utm
def utm(t, contenido):  # noqa: F811  (campaña propia de este email)
    u = _utm_original(t, contenido).replace('hombre_lanzamiento_', 'black_friday_3x2_')
    return u + ('&amp;lang=en' if t['lang'] == 'en' else '')

FIRMA_ADRI = '<p style="margin:0; font-size:20px; color:#14454A;" class="t-verde">Adri 🤍</p>'
for t in TEXTOS.values():
    html = email(t)
    ini = html.index('    <!-- Sorteo -->')
    html = html[:ini] + html[html.index('    <!-- Firma -->'):]
    firma = 'El equipo de Cozumel 🤍' if t['lang'] == 'es' else 'The Cozumel team 🤍'
    assert FIRMA_ADRI in html and '{{{RESEND_UNSUBSCRIBE_URL}}}' in html
    html = html.replace(FIRMA_ADRI, FIRMA_ADRI.replace('Adri 🤍', firma))
    html = html.replace('{{{RESEND_UNSUBSCRIBE_URL}}}', t['baja_url'])
    open(t['archivo'], 'w', encoding='utf-8').write(html)
    vista = t['archivo'].replace('.html', '-VISTA-PREVIA.html')
    open(vista, 'w', encoding='utf-8').write(html.replace(WEB + 'img/', '../img/'))
    print(t['archivo'], '·', t['asunto'])
