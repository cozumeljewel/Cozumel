# Fotos de las cadenas con charm puesto -> web.
# Lee img/Joyeria hombre/COLGANTES/<Collar N - Nombre - SKU>/<Acabado>/CON CHARMS/
#   "<Nombre> - <Acabado> - variacion N - charm <CODIGO>.png"
# y .../TODAS LAS VARIACIONES/ ("<Nombre> - <Acabado> - charm <CODIGO>.png"),
# que van detrás de las de CON CHARMS (si un charm está en las dos, gana CON CHARMS)
# copia cada foto, tal cual, a img/hombre/<pieza>-<acabado>-charm-<id del charm>.<ext>
# y reescribe el bloque FOTOS_CHARM_HOMBRE de hombre.js.
# Códigos: 1/2/3 = placa dorada, 1A/2A/3A = placa plateada, CRUZ 4 = cruz 1
# plateada, CRUZ n = cruz n, A-F = símbolos, CIRCONITA <FORMA> = circonita
# (del color de la cadena).
# Uso (desde la raíz): python scripts/charms-hombre.py
import glob, os, re, shutil, hashlib, unicodedata

RAIZ = 'img/Joyeria hombre/COLGANTES'
FIN = {'oro': 'oro', 'oro blanco': 'oro_blanco', 'plata': 'oro_blanco', 'negro': 'negro'}
norm = lambda t: unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode().lower().strip()
md5 = lambda p: hashlib.md5(open(p, 'rb').read()).hexdigest()

js = open('hombre.js', encoding='utf-8').read()
por_nombre = {norm(n): i for i, n in re.findall(r"id: '([^']+)', tipo: '[^']+', nombre: '([^']+)'", js)}


def charm(codigo):
    c = codigo.upper().replace(' ', '')
    if m := re.fullmatch(r'([123])(A?)', c):
        return f'charm_{m[1]}', 'plateado' if m[2] else 'dorado'
    if m := re.fullmatch(r'CRUZ(\d)', c):
        return ('cruz_1', 'plateado') if m[1] == '4' else (f'cruz_{m[1]}', 'dorado')
    if re.fullmatch(r'[A-F]', c):
        return f'simbolo_{c.lower()}', 'dorado'
    # CIRCONITA GOTA, CIRCONITA OVALADA...: el color sigue al de la cadena
    if m := re.fullmatch(r'CIRCONITA\s*([A-ZÁÉÍÓÚ]+)', codigo.upper().strip()):
        return 'circonita_' + norm(m[1]), None
    raise ValueError(codigo)


datos = {}
vistos = set()
fotos = sorted(glob.glob(os.path.join(RAIZ, '*', '*', 'CON CHARMS', '*'))) +     sorted(glob.glob(os.path.join(RAIZ, '*', '*', 'TODAS LAS VARIACIONES', '*')))
for f in fotos:
    if not f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
        continue
    pieza_dir, acabado = f.split(os.sep)[-4], f.split(os.sep)[-3]
    m = re.match(r'(?:collar|colgante)\s*\d*\s*-\s*(.*?)\s*(?:-\s*SKU)?$', pieza_dir, re.I)
    pid = m and por_nombre.get(norm(m[1]))
    fin = FIN.get(acabado.lower().strip())
    mc = re.search(r'(?:variacion\s*(\d+)\s*-\s*)?charm\s*(.+?)\s*\.\w+$', os.path.basename(f), re.I)
    if not (pid and fin and mc):
        print('SE SALTA:', f)
        continue
    cid, color = charm(mc[2])
    if (pid, fin, cid) in vistos:
        continue
    vistos.add((pid, fin, cid))
    if color and (fin == 'oro') != (color == 'dorado'):
        print('OJO, color de charm distinto al de la cadena:', f)
    ext = os.path.splitext(f)[1].lower().replace('jpeg', 'jpg')
    destino = f"img/hombre/{pid.replace('hombre_', '').replace('_', '-')}-{fin.replace('_', '-')}-charm-{cid.replace('_', '-')}{ext}"
    if not (os.path.exists(destino) and md5(destino) == md5(f)):
        shutil.copy2(f, destino)
        print('COPIADA', destino)
    datos.setdefault(pid, {}).setdefault(fin, []).append((int(mc[1] or 99), cid, destino))

lineas = []
for pid, fins in datos.items():
    partes = []
    for fin, lista in fins.items():
        lista.sort()
        partes.append(f"{fin}: [" + ', '.join(f"{{ charm: '{c}', foto: '{d}' }}" for _, c, d in lista) + ']')
    lineas.append(f"  {pid}: {{\n    " + ',\n    '.join(partes) + '\n  },')
bloque = ('// FOTOS_CHARM (generado por scripts/charms-hombre.py)\n'
          '// Cadena con el charm puesto, por acabado y en orden de variación.\n'
          'const FOTOS_CHARM_HOMBRE = {\n' + '\n'.join(lineas) + '\n};\n// FIN_FOTOS_CHARM')
if '// FOTOS_CHARM' in js:
    js = re.sub(r'// FOTOS_CHARM .*?// FIN_FOTOS_CHARM', lambda _: bloque, js, flags=re.S)
else:
    js = js.replace('// Piezas que ya llevan colgante', bloque + '\n\n// Piezas que ya llevan colgante', 1)
open('hombre.js', 'w', encoding='utf-8').write(js)
print(sum(len(l) for f in datos.values() for l in f.values()), 'fotos con charm en', len(datos), 'piezas')
