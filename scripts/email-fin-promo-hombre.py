"""Email "Último día del −15 %" de la colección de hombre (8/11/2026),
en español y en inglés. Reutiliza el diseño de email-lanzamiento-hombre.py
(cabecera del chile) sin el bloque del sorteo.

    emails/hombre-fin-promo.html     (español)
    emails/hombre-fin-promo-en.html  (inglés)

Uso (desde la raíz):  python scripts/email-fin-promo-hombre.py
"""
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fuente = open(os.path.join(RAIZ, 'scripts', 'email-lanzamiento-hombre.py'), encoding='utf-8').read()
exec(fuente[:fuente.index('for t in TEXTOS.values():')])

TEXTOS = {
    'es': {
        'lang': 'es', 'archivo': 'emails/hombre-fin-promo.html',
        'titulo': 'Último día · −15 % Men’s collection',
        'previa': 'Hoy es el último día del 15 % de descuento en la colección de hombre. Termina a las 21:00 (hora de México).',
        'eyebrow': 'Último día', 'h1': 'Hoy se acaba el −15 %.',
        'intro': 'La semana de lanzamiento de nuestra <strong style="color:#14454A;" class="t-verde">primera colección para hombre</strong> termina hoy. Después, las piezas vuelven a su precio de siempre.',
        'promo': '<strong>−15 % en todas las piezas</strong><br>hasta hoy a las 21:00 (hora de México)',
        'regalo': 'En los collares, <strong style="color:#14454A;" class="t-verde">el colgante sigue siendo un regalo</strong>: cruces, circonitas, símbolos o tu inicial. Y el envío es gratis.',
        'cta': 'Ver la colección',
        'favoritas': 'Nuestras favoritas',
        'piezas': [('Mezcal', 'Collar con cruz · oro'), ('Copal', 'Cadena · plata'), ('Cacao', 'Collar con cruz de perlas · oro'), ('Ocaso', 'Anillo sello · oro')],
        'ver': 'Ver',
        'sorteo': '',
        'gracias': 'Gracias por estar desde el principio.',
        'pie': 'Recibes este correo porque te apuntaste a la lista de Cozumel Jewelry.',
        'baja': 'Darme de baja',
    },
    'en': {
        'lang': 'en', 'archivo': 'emails/hombre-fin-promo-en.html',
        'titulo': 'Last day · 15% off Men’s collection',
        'previa': 'Today is the last day of 15% off our men’s collection. It ends at 9 pm Mexico City time.',
        'eyebrow': 'Last day', 'h1': 'The 15% off ends today.',
        'intro': 'Launch week for our <strong style="color:#14454A;" class="t-verde">first men’s collection</strong> ends today. After that, every piece goes back to its regular price.',
        'promo': '<strong>−15% on every piece</strong><br>until 9 pm today (Mexico City time)',
        'regalo': 'With our necklaces, <strong style="color:#14454A;" class="t-verde">the pendant is still on us</strong>: crosses, zirconias, symbols or your initial. And shipping is free.',
        'cta': 'Shop the collection',
        'favoritas': 'Our favourites',
        'piezas': [('Mezcal', 'Cross necklace · gold'), ('Copal', 'Chain · silver'), ('Cacao', 'Pearl cross necklace · gold'), ('Ocaso', 'Signet ring · gold')],
        'ver': 'View',
        'sorteo': '',
        'gracias': 'Thank you for being here from the very start.',
        'pie': 'You’re receiving this email because you joined the Cozumel Jewelry list.',
        'baja': 'Unsubscribe',
    },
}

_utm_original = utm
def utm(t, contenido):  # noqa: F811  (campaña propia de este email)
    return _utm_original(t, contenido).replace('hombre_lanzamiento_', 'hombre_fin_promo_')

for t in TEXTOS.values():
    html = email(t)
    ini = html.index('    <!-- Sorteo -->')
    html = html[:ini] + html[html.index('    <!-- Firma -->'):]
    open(t['archivo'], 'w', encoding='utf-8').write(html)
    vista = t['archivo'].replace('.html', '-VISTA-PREVIA.html')
    open(vista, 'w', encoding='utf-8').write(html.replace(WEB + 'img/', '../img/'))
    print(t['archivo'])
