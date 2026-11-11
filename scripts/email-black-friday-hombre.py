"""Email "Black Friday −10 %" de la colección de hombre (11/11/2026),
en español y en inglés. Mismo diseño que email-lanzamiento-hombre.py
(cabecera del chile), sin sorteo y firmado por el equipo (sin Adri).

    emails/hombre-black-friday.html     (español)
    emails/hombre-black-friday-en.html  (inglés)

Uso (desde la raíz):  python scripts/email-black-friday-hombre.py
"""
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fuente = open(os.path.join(RAIZ, 'scripts', 'email-lanzamiento-hombre.py'), encoding='utf-8').read()
exec(fuente[:fuente.index('for t in TEXTOS.values():')])

TEXTOS = {
    'es': {
        'lang': 'es', 'archivo': 'emails/hombre-black-friday.html',
        'titulo': 'Black Friday · −10 % Men’s collection',
        'previa': 'Black Friday en Cozumel: 10 % de descuento en toda la colección de hombre hasta el 30 de noviembre.',
        'eyebrow': 'Black Friday', 'h1': '−10 % en toda la colección.',
        'intro': 'Collares, cadenas, pulseras y anillos de nuestra <strong style="color:#14454A;" class="t-verde">colección para hombre</strong>, en oro y oro blanco, con un 10 % de descuento.',
        'promo': '<strong>−10 % en todas las piezas de hombre</strong><br>hasta el 30 de noviembre',
        'regalo': 'En los collares, <strong style="color:#14454A;" class="t-verde">el colgante es un regalo</strong>: cruces, circonitas, símbolos o tu inicial. Y el envío es gratis a todo el mundo.',
        'cta': 'Ver la colección',
        'favoritas': 'Nuestras favoritas',
        'piezas': [('Mezcal', 'Collar con cruz · oro'), ('Copal', 'Cadena · oro blanco'), ('Cacao', 'Collar con cruz de perlas · oro'), ('Ocaso', 'Anillo sello · oro')],
        'ver': 'Ver',
        'sorteo': '',
        'gracias': 'Gracias por estar con nosotros.',
        'pie': 'Recibes este correo porque te apuntaste a la lista de Cozumel Jewelry.',
        'baja': 'Darme de baja',
    },
    'en': {
        'lang': 'en', 'archivo': 'emails/hombre-black-friday-en.html',
        'titulo': 'Black Friday · 10% off Men’s collection',
        'previa': 'Black Friday at Cozumel: 10% off our entire men’s collection until November 30.',
        'eyebrow': 'Black Friday', 'h1': '10% off the whole collection.',
        'intro': 'Necklaces, chains, bracelets and rings from our <strong style="color:#14454A;" class="t-verde">men’s collection</strong>, in gold and white gold, now 10% off.',
        'promo': '<strong>−10% on every men’s piece</strong><br>until November 30',
        'regalo': 'With our necklaces, <strong style="color:#14454A;" class="t-verde">the pendant is on us</strong>: crosses, zirconias, symbols or your initial. And shipping is free worldwide.',
        'cta': 'Shop the collection',
        'favoritas': 'Our favourites',
        'piezas': [('Mezcal', 'Cross necklace · gold'), ('Copal', 'Chain · white gold'), ('Cacao', 'Pearl cross necklace · gold'), ('Ocaso', 'Signet ring · gold')],
        'ver': 'View',
        'sorteo': '',
        'gracias': 'Thank you for being with us.',
        'pie': 'You’re receiving this email because you joined the Cozumel Jewelry list.',
        'baja': 'Unsubscribe',
    },
}

_utm_original = utm
def utm(t, contenido):  # noqa: F811  (campaña propia de este email)
    return _utm_original(t, contenido).replace('hombre_lanzamiento_', 'hombre_black_friday_')

FIRMA_ADRI = '<p style="margin:0; font-size:20px; color:#14454A;" class="t-verde">Adri 🤍</p>'
for t in TEXTOS.values():
    html = email(t)
    ini = html.index('    <!-- Sorteo -->')
    html = html[:ini] + html[html.index('    <!-- Firma -->'):]
    firma = 'El equipo de Cozumel 🤍' if t['lang'] == 'es' else 'The Cozumel team 🤍'
    assert FIRMA_ADRI in html
    html = html.replace(FIRMA_ADRI, FIRMA_ADRI.replace('Adri 🤍', firma))
    open(t['archivo'], 'w', encoding='utf-8').write(html)
    vista = t['archivo'].replace('.html', '-VISTA-PREVIA.html')
    open(vista, 'w', encoding='utf-8').write(html.replace(WEB + 'img/', '../img/'))
    print(t['archivo'])
