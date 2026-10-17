"""Deja deploy/ al día con la raíz antes de publicar (16/10/2026).

1. Copia a deploy/ los archivos de la raíz que ya están en deploy/
   (HTML, JS, CSS...) y los nuevos de la lista NUEVOS, si han cambiado.
2. Copia las fotos que nombran los HTML/JS/CSS de deploy/ (originales).
3. Copia img/w/ entero (versiones web de scripts/fotos-web.py) y borra de
   deploy/img/w las que ya no existen en la raíz.

Uso (desde la raíz):
    python scripts/fotos-web.py        # primero, si han cambiado fotos
    python scripts/preparar-deploy.py
    python scripts/comprobar-deploy.py
"""
import filecmp
import glob
import os
import re
import shutil

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)
D = 'deploy'
NUEVOS = ['hombre.html', 'hombre.js', 'hombre-focos.js', 'cierre.js', 'analitica.js']
NO_TOCAR = {'README.md', 'netlify.toml', '_headers', 'robots.txt', 'sitemap.xml'}
PATRON = re.compile(r"img/[^'\"\)\s>,|`]+\.(?:png|jpe?g|webp|avif|svg|gif)", re.I)


def copiar(src, dst, lista):
    if not os.path.exists(dst) or not filecmp.cmp(src, dst, shallow=False):
        os.makedirs(os.path.dirname(dst) or '.', exist_ok=True)
        shutil.copy2(src, dst)
        lista.append(src)


def main():
    cambiados = []
    for f in sorted(set(os.listdir(D)) | set(NUEVOS)):
        if f in NO_TOCAR or not os.path.isfile(f):
            continue
        copiar(f, os.path.join(D, f), cambiados)
    refs = set()
    for f in glob.glob(D + '/*.html') + glob.glob(D + '/*.js') + glob.glob(D + '/*.css'):
        refs |= set(PATRON.findall(open(f, encoding='utf-8', errors='ignore').read()))
    # Las versiones web nombradas directamente necesitan su original al
    # lado (es el plan B si la versión fallase)
    for r in list(refs):
        m = re.match(r'img/w/[^/]+/(.+)\.webp$', r)
        if m:
            refs.add('img/' + m.group(1))
    fotos = 0
    for r in sorted(refs):
        if '{' in r or '$' in r or not os.path.isfile(r):
            continue
        antes = len(cambiados)
        copiar(r, os.path.join(D, r), cambiados)
        fotos += len(cambiados) - antes
    web = 0
    for f in glob.glob('img/w/**/*.webp', recursive=True):
        antes = len(cambiados)
        copiar(f, os.path.join(D, f), cambiados)
        web += len(cambiados) - antes
    sobran = 0
    for f in glob.glob(D + '/img/w/**/*.webp', recursive=True):
        if not os.path.exists(f[len(D) + 1:]):
            os.remove(f)
            sobran += 1
    otros = [c for c in cambiados if not c.startswith('img/')]
    print(f'{len(otros)} archivos de la web, {fotos} fotos, {web} versiones web copiadas; {sobran} versiones viejas borradas')
    if otros:
        print('  ' + ', '.join(otros))


if __name__ == '__main__':
    main()
