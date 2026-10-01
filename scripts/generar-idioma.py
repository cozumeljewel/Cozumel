"""Genera deploy/idioma-en.js (y su copia en la raíz) a partir de
traduccion/en.txt (pares es:/en:) y traduccion/patrones-en.js.

Uso: python scripts/generar-idioma.py
"""
import json
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
TXT = RAIZ / 'traduccion' / 'en.txt'
PATRONES = RAIZ / 'traduccion' / 'patrones-en.js'

textos = {}
es = None
errores = []
for n, linea in enumerate(TXT.read_text(encoding='utf-8').splitlines(), 1):
    linea = linea.strip()
    if not linea or linea.startswith('#'):
        continue
    if linea.startswith('es:'):
        if es is not None:
            errores.append(f'línea {n}: "es:" sin su "en:" anterior')
        es = linea[3:].strip()
    elif linea.startswith('en:'):
        if es is None:
            errores.append(f'línea {n}: "en:" sin "es:"')
            continue
        if es in textos and textos[es] != linea[3:].strip():
            errores.append(f'línea {n}: "{es[:40]}" está dos veces con traducciones distintas')
        textos[es] = linea[3:].strip()
        es = None
    else:
        errores.append(f'línea {n}: no empieza por "es:", "en:" ni "#"')

if errores:
    print('\n'.join(errores))
    sys.exit(1)

patrones = '\n'.join(l for l in PATRONES.read_text(encoding='utf-8').splitlines()
                     if not l.startswith('//'))
salida = ('/* Generado por scripts/generar-idioma.py desde traduccion/en.txt.\n'
          '   No editar a mano: se sobrescribe. */\n'
          'COZUMEL_EN_CARGADO({\n'
          '  textos: ' + json.dumps(textos, ensure_ascii=False, indent=1) + ',\n'
          '  patrones: ' + patrones.strip() + ',\n'
          '});\n')
for destino in (RAIZ / 'deploy' / 'idioma-en.js', RAIZ / 'idioma-en.js'):
    destino.write_text(salida, encoding='utf-8', newline='\n')
print(f'{len(textos)} textos -> deploy/idioma-en.js ({len(salida.encode()) // 1024} KB)')
