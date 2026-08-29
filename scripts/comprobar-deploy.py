"""Comprueba que la carpeta deploy/ está completa antes de subirla.

Por qué existe: se subió a producción una página que cargaba
"volver-arriba.js" sin que ese archivo estuviera en deploy/. El HTML se
había sincronizado, el .js no. Resultado: 404 en el sitio real y un error
en la consola de todos los visitantes. Este script caza exactamente eso.

Qué revisa:
  1. Todo lo que referencian los HTML de deploy/ (scripts, hojas de
     estilo, imágenes) existe realmente dentro de deploy/.
  2. Todo lo que referencia el CSS con url(...) también existe.
  3. Los archivos que están en la raíz Y en deploy/ tienen el mismo
     contenido (no hay una versión vieja desplegada).

Uso: python scripts/comprobar-deploy.py
Devuelve código 1 si encuentra algún problema, 0 si todo está bien.
"""
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEPLOY = os.path.join(RAIZ, "deploy")

# Referencias a recursos locales dentro del HTML.
PATRONES_HTML = [
    re.compile(r'<script[^>]+src="([^"]+)"', re.I),
    re.compile(r'<link[^>]+href="([^"]+)"', re.I),
    re.compile(r'<img[^>]+src="([^"]+)"', re.I),
]
PATRON_CSS_URL = re.compile(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", re.I)


def es_local(ref):
    """Descarta enlaces externos, datos incrustados y anclas."""
    ref = ref.strip()
    if not ref:
        return False
    return not ref.startswith(("http://", "https://", "//", "data:", "#", "mailto:", "tel:"))


def revisar_referencias():
    problemas = []
    for nombre in sorted(os.listdir(DEPLOY)):
        if not nombre.endswith(".html"):
            continue
        ruta = os.path.join(DEPLOY, nombre)
        with open(ruta, encoding="utf-8") as f:
            contenido = f.read()
        refs = []
        for patron in PATRONES_HTML:
            refs.extend(patron.findall(contenido))
        for ref in refs:
            if not es_local(ref):
                continue
            destino = os.path.join(DEPLOY, ref.split("?")[0].split("#")[0])
            if not os.path.isfile(destino):
                problemas.append(f"{nombre} carga «{ref}» pero no existe en deploy/")
    return problemas


def revisar_css():
    problemas = []
    css = os.path.join(DEPLOY, "style.css")
    if not os.path.isfile(css):
        return ["falta deploy/style.css"]
    with open(css, encoding="utf-8") as f:
        contenido = f.read()
    for ref in PATRON_CSS_URL.findall(contenido):
        if not es_local(ref):
            continue
        destino = os.path.join(DEPLOY, ref.split("?")[0])
        if not os.path.isfile(destino):
            problemas.append(f"style.css usa «{ref}» pero no existe en deploy/")
    return problemas


def revisar_sincronia():
    """Avisa si un archivo desplegado se quedó atrás respecto a la raíz."""
    problemas = []
    for nombre in sorted(os.listdir(DEPLOY)):
        origen = os.path.join(RAIZ, nombre)
        copia = os.path.join(DEPLOY, nombre)
        if not os.path.isfile(origen) or not os.path.isfile(copia):
            continue
        with open(origen, "rb") as a, open(copia, "rb") as b:
            if a.read() != b.read():
                problemas.append(f"«{nombre}» es distinto en la raíz y en deploy/ (¿falta sincronizar?)")
    return problemas


def main():
    if not os.path.isdir(DEPLOY):
        print("No existe la carpeta deploy/")
        return 1

    grupos = [
        ("Recursos que las páginas cargan", revisar_referencias()),
        ("Recursos que usa el CSS", revisar_css()),
        ("Sincronía entre la raíz y deploy/", revisar_sincronia()),
    ]

    total = sum(len(p) for _, p in grupos)
    for titulo, problemas in grupos:
        estado = "OK" if not problemas else f"{len(problemas)} problema(s)"
        print(f"[{estado}] {titulo}")
        for p in problemas:
            print(f"    - {p}")

    if total:
        print(f"\n{total} problema(s). NO subas deploy/ hasta arreglarlos.")
        return 1
    print("\nTodo correcto: deploy/ está completo y al día.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
