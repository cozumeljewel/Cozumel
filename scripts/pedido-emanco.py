"""Pedido para Emanco con su plantilla (Purchasing Service Order Form), a
partir de la tabla "pedidos" de Supabase. Una fila por pieza y otra por
cada colgante de regalo (con su grabado en Properties). Dirección por
partes: calle, piso, código postal, ciudad, estado y su código.

Uso (desde la raíz):
    python scripts/pedido-emanco.py                 todos los pedidos
    python scripts/pedido-emanco.py 2026-11-02      pagados desde ese día
Deja el Excel en el escritorio: "Pedido Emanco <fecha>.xlsx".
"""
import datetime, json, os, re, shutil, subprocess, sys
import openpyxl

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)
PLANTILLA = 'SKU PRODUCTOS COLECCIÓN 1/Purchasing Service Order Form Template.xlsx'
CATALOGOS = ['SKU PRODUCTOS COLECCIÓN 1/Emanco Men Jewelry Catalog (3).xlsx', 'SKU PRODUCTOS COLECCIÓN 1/Emanco Charms Catalog.xlsx']
PAISES = {'Estados Unidos': 'US', 'México': 'MX', 'España': 'ES', 'Guatemala': 'GT', 'Chile': 'CL', 'Perú': 'PE',
          'Argentina': 'AR', 'Colombia': 'CO', 'Costa Rica': 'CR', 'Ecuador': 'EC', 'El Salvador': 'SV'}
ESTADOS_US = {'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA', 'colorado': 'CO',
  'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL',
  'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO', 'montana': 'MT',
  'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA',
  'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'district of columbia': 'DC', 'puerto rico': 'PR'}


def precios():
    d = {}
    for f in CATALOGOS:
        for ws in openpyxl.load_workbook(f, data_only=True).worksheets:
            isku = ip = None
            for row in ws.iter_rows(values_only=True):
                if ip is None:
                    if row and any(isinstance(c, str) and 'price' in c.lower() for c in row if c):
                        ip = [i for i, c in enumerate(row) if isinstance(c, str) and 'price' in c.lower()][0]
                        cand = [i for i, c in enumerate(row) if isinstance(c, str) and ('sku' in c.lower() or 'item' in c.lower() or 'code' in c.lower())]
                        isku = cand[0] if cand else 2
                    continue
                s = row[isku] if len(row) > isku else None
                p = row[ip] if len(row) > ip else None
                if isinstance(s, str) and isinstance(p, (int, float)):
                    d[s.strip()] = p
    return d


def coste(tabla, sku):
    if sku in tabla:
        return round(tabla[sku], 2)
    code = sku.split('-')[0]
    for k, v in tabla.items():
        if k.startswith(code):
            return round(v, 2)
    return None


def codigo_estado(pais, prov):
    p = (prov or '').strip()
    if PAISES.get(pais) == 'US':
        return p.upper() if len(p) == 2 else ESTADOS_US.get(p.lower())
    return None


def nombre_estado(pais, prov):
    # EE. UU.: el nombre entero del estado aunque se escribiera "NE"
    p = (prov or '').strip()
    if PAISES.get(pais) == 'US' and len(p) == 2:
        for nombre, cod in ESTADOS_US.items():
            if cod == p.upper():
                return nombre.title()
    return p or None


desde = sys.argv[1] if len(sys.argv) > 1 else '2000-01-01'
sql = ("select coalesce(stripe_session_id, id::text) ref, pagado_en, pieza, sku, personalizacion, nombre, apellidos, whatsapp, "
       "direccion_envio, pais, dir_calle, dir_piso, dir_cp, dir_ciudad, dir_provincia from pedidos "
       f"where pagado_en >= '{desde}' order by pagado_en")
out = subprocess.run([shutil.which('supabase') or 'supabase', 'db', 'query', '--linked', sql], capture_output=True)
filas = json.loads(out.stdout.decode('utf-8'))['rows']
tabla = precios()

hoy = datetime.date.today().isoformat()
dst = os.path.join(os.path.expanduser('~'), 'Desktop', f'Pedido Emanco {hoy}.xlsx')
shutil.copy(PLANTILLA, dst)
wb = openpyxl.load_workbook(dst)
ws = wb['Orders']
for row in ws.iter_rows(min_row=2, max_row=ws.max_row):
    for c in row:
        c.value = None
refs, n, total, sin = [], 2, 0, []
for r in filas:
    if r['ref'] not in refs:
        refs.append(r['ref'])
    num = 'CZ-%d' % (1000 + refs.index(r['ref']) + 1)
    p = r['personalizacion'] if isinstance(r['personalizacion'], dict) else json.loads(r['personalizacion'] or '{}')
    calle = r['dir_calle'] or r['direccion_envio']
    base = [num, None, (r['nombre'] or '').strip(), (r['apellidos'] or '').strip(), r['whatsapp'], calle, r['dir_piso'],
            r['dir_cp'], r['dir_ciudad'], nombre_estado(r['pais'], r['dir_provincia']), codigo_estado(r['pais'], r['dir_provincia']),
            r['pais'], PAISES.get(r['pais'], '')]
    props = [k.capitalize() + ': ' + p[k] for k in ('grosor', 'largo', 'talla', 'ancho') if p.get(k)]
    lineas = [(p.get('sku'), ' · '.join(props) or None)]
    if p.get('sku_colgante'):
        lineas.append((p['sku_colgante'], 'Colgante de regalo para ' + (r['pieza'] or '') +
                       (' · Engraving: ' + p['grabado'] if p.get('grabado') else '')))
    for sku, prop in lineas:
        c = coste(tabla, sku) if sku else None
        if c is None:
            sin.append(sku)
        for i, v in enumerate(base + [1, prop, sku, c, None, None]):
            ws.cell(row=n, column=i + 1, value=v)
        total += c or 0
        n += 1
wb.save(dst)
print(f'{dst}\n{len(refs)} pedidos, {n - 2} filas, coste {total:.2f} $' + (f' · sin coste: {sin}' if sin else ''))
