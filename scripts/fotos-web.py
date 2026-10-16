"""Versiones web de las fotos (16/10/2026).

Las fotos originales (PNG/JPG de 1-3 MB) no se tocan nunca. Este script
crea, al lado, en img/w/, las versiones que usa la web para ir rápida:

  img/w/300/<ruta>.webp   miniaturas de la ficha y círculos de charms
  img/w/600/<ruta>.webp   tarjetas en el móvil
  img/w/900/<ruta>.webp   tarjetas en el ordenador, círculos de color, stories
  img/w/full/<ruta>.webp  fotos grandes (portada, galería, lupa, visores):
                          MISMO tamaño en píxeles que el original, WebP
                          calidad 95 (a tamaño real no se distingue).
                          Solo de los PNG: los JPG ya vienen comprimidos y
                          su WebP pesaría más, así que se usan tal cual
                          (script.js sigue la misma regla).

<ruta> es la ruta del original sin "img/" y con su extensión, p. ej.
img/hombre/collar-3-oro-producto.png -> img/w/900/hombre/collar-3-oro-producto.png.webp
(así script.js sabe volver al original si una versión no existe).

Qué fotos: todas las que nombran los HTML, JS y CSS de la raíz.
Solo rehace las que han cambiado (original más nuevo que su versión) y
borra las versiones de fotos que ya no se usan.

Uso (desde la raíz):  python scripts/fotos-web.py
Después, copiar img/w a deploy/ (lo hace el paso de publicar).
"""
import glob
import os
import re
import sys
from concurrent.futures import ProcessPoolExecutor

from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)
SALIDA = 'img/w'
MINIS = {'300': (300, 88), '600': (600, 88), '900': (900, 88)}
COMPLETA = 95  # calidad de la versión a tamaño completo
PATRON = re.compile(r"img/[^'\"\)\s>,|`]+?\.(?:png|jpe?g|webp)(?:\.webp)?", re.I)


def fuentes():
    usadas = set()
    for f in glob.glob('*.html') + glob.glob('*.js') + glob.glob('*.css'):
        texto = open(f, encoding='utf-8', errors='ignore').read()
        usadas.update(PATRON.findall(texto))
    # Una versión web nombrada directamente (la portada, en index.html)
    # cuenta como uso de su original: img/w/full/x.png.webp -> img/x.png
    for u in list(usadas):
        m = re.match(SALIDA + r'/[^/]+/(.+)\.webp$', u)
        if m:
            usadas.add('img/' + m.group(1))
    return sorted(u for u in usadas if not u.startswith(SALIDA + '/') and os.path.isfile(u))


def destino(src, tam):
    return f'{SALIDA}/{tam}/{src[4:]}.webp'


def al_dia(src, dst):
    return os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src)


def tamanos(src):
    return list(MINIS) + (['full'] if src.lower().endswith('.png') else [])


def procesar(src):
    pendientes = [t for t in tamanos(src) if not al_dia(src, destino(src, t))]
    if not pendientes:
        return src, 0
    im = Image.open(src)
    im.load()
    # Transparencia: se respeta (WebP la admite); el resto, a RGB.
    modo = 'RGBA' if (im.mode in ('RGBA', 'LA') or 'transparency' in im.info) else 'RGB'
    im = im.convert(modo)
    hechas = 0
    for t in pendientes:
        dst = destino(src, t)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        if t == 'full':
            im.save(dst, 'WEBP', quality=COMPLETA, method=4)
        else:
            ancho, calidad = MINIS[t]
            copia = im
            if im.width > ancho:
                copia = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
            copia.save(dst, 'WEBP', quality=calidad, method=4)
        hechas += 1
    return src, hechas


def main():
    lista = fuentes()
    print(len(lista), 'fotos usadas en la web')
    hechas = 0
    with ProcessPoolExecutor() as ex:
        for i, (src, n) in enumerate(ex.map(procesar, lista, chunksize=4), 1):
            hechas += n
            if n and hechas % 200 < 4:
                print(f'  {i}/{len(lista)}…', flush=True)
    # Limpieza: versiones de fotos que ya no se usan
    validas = {destino(s, t) for s in lista for t in tamanos(s)}
    borradas = 0
    for f in glob.glob(SALIDA + '/**/*.webp', recursive=True):
        if f.replace('\\', '/') not in validas:
            os.remove(f)
            borradas += 1
    total = sum(os.path.getsize(f) for f in glob.glob(SALIDA + '/**/*.webp', recursive=True))
    print(f'{hechas} versiones nuevas, {borradas} borradas · img/w ocupa {total / 1e6:.0f} MB')


if __name__ == '__main__':
    sys.exit(main())
