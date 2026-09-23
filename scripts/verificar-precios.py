# -*- coding: utf-8 -*-
"""Comprueba que las DOS copias de los precios dicen lo mismo.

Hay dos a propósito (ver el comentario de precios.ts):
  · navegador: productos.js (precio maestro) + mercados.js (tasas y redondeo)
  · servidor:  supabase/functions/_shared/precios.ts

Si se tocan sin querer por separado, el cliente vería un precio y Stripe
cobraría otro. Este script las compara y además imprime la tabla de
precios de cada mercado.

    python scripts/verificar-precios.py
"""
import os, re, sys, math

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def leer(ruta):
    return open(os.path.join(RAIZ, ruta), encoding='utf-8').read()

# ---------- Lado navegador ----------
productos_js = leer('productos.js')
mercados_js = leer('mercados.js')

precios_cliente = {}
for m in re.finditer(r"id:\s*'([a-z_]+)'.*?precios:\s*\{([^}]*)\}", productos_js, re.S):
    pid, cuerpo = m.group(1), m.group(2)
    precios_cliente[pid] = {k: float(v) for k, v in re.findall(r'(\w+):\s*([\d.]+)', cuerpo)}

tasas_cliente = {k: float(v) for k, v in re.findall(
    r'(\w{3}):\s*([\d.]+),', mercados_js.split('const TASAS')[1].split('};')[0])}

# ---------- Lado servidor ----------
precios_ts = leer('supabase/functions/_shared/precios.ts')
base_servidor = {k: float(v) for k, v in re.findall(
    r'(\w+):\s*([\d.]+),', precios_ts.split('PRECIOS_MXN')[1].split('};')[0])}
tasas_servidor = {k: float(v) for k, v in re.findall(
    r'(\w{3}):\s*([\d.]+),', precios_ts.split('export const TASAS')[1].split('};')[0])}

# Envío incluido en el precio, en dólares, por mercado.
patron_envio = r'([A-Z]{2}):\s*([\d.]+),'
envio_cliente = {k: float(v) for k, v in re.findall(
    patron_envio, mercados_js.split('const ENVIO_USD')[1].split('};')[0])}
envio_servidor = {k: float(v) for k, v in re.findall(
    patron_envio, precios_ts.split('export const ENVIO_USD')[1].split('};')[0])}

# ---------- Redondeo (misma regla que las dos copias) ----------
SIN_DECIMALES = ['COP', 'CLP', 'ARS']
def redondear(v, moneda):
    if moneda == 'USD': return max(math.ceil(v), 1) - 0.01
    if moneda == 'EUR': return max(math.ceil(v), 1) - 0.10
    if moneda == 'COP': return math.ceil(v / 1000) * 1000 - 100
    if moneda == 'CLP': return math.ceil(v / 1000) * 1000 - 10
    if moneda == 'PEN':
        n = math.ceil(v); r = n % 10
        return n + (0 if r == 9 else 9 - r)
    if moneda == 'ARS': return math.ceil(v / 1000) * 1000 - 1
    return v

# Los mercados vivos se leen de mercados.js, para que esta comprobación
# no se quede atrás si se añade o se quita un país (Colombia y Argentina
# se retiraron al no admitir Stripe sus monedas).
MONEDAS = dict(re.findall(r"^\s*([A-Z]{2}): \{ pais:.*?moneda: '([A-Z]{3})'", mercados_js, re.M))

def precio(pid, mercado, base, tasas):
    moneda = MONEDAS[mercado]
    manual = precios_cliente.get(pid, {}).get(mercado)
    if manual is not None and mercado != 'MX':
        v = manual
    elif moneda == 'MXN':
        v = base[pid]
    else:
        envio = lambda mk, mon: envio_servidor.get(mk, 0) * tasas[mon] / tasas['USD']
        sin_envio = base[pid] - envio('MX', 'MXN')
        v = redondear(sin_envio * tasas[moneda] + envio(mercado, moneda), moneda)
    return round(v) if moneda in SIN_DECIMALES else round(v, 2)

def main():
    fallos = []

    for pid, precios in precios_cliente.items():
        if pid not in base_servidor:
            fallos.append(f'{pid}: está en productos.js pero no en precios.ts')
        elif precios.get('MX') != base_servidor[pid]:
            fallos.append(f'{pid}: navegador {precios.get("MX")} MXN vs servidor {base_servidor[pid]} MXN')
    for pid in base_servidor:
        if pid not in precios_cliente:
            fallos.append(f'{pid}: está en precios.ts pero no en productos.js')

    for moneda, tasa in tasas_cliente.items():
        if tasas_servidor.get(moneda) != tasa:
            fallos.append(f'tasa {moneda}: navegador {tasa} vs servidor {tasas_servidor.get(moneda)}')

    if envio_cliente != envio_servidor:
        fallos.append(f'envío: navegador {envio_cliente} vs servidor {envio_servidor}')

    anchos = 'Pieza'.ljust(28) + ''.join(m.rjust(12) for m in MONEDAS)
    print(anchos)
    print('-' * len(anchos))
    for pid in precios_cliente:
        if pid not in base_servidor: continue
        fila = pid.ljust(28)
        for mercado in MONEDAS:
            fila += f'{precio(pid, mercado, base_servidor, tasas_servidor):>12,.2f}'
        print(fila)

    # Lo que recibiría Stripe: entero en la unidad mínima. En las monedas
    # sin decimales va en unidades; si se mandara en céntimos, cobraría
    # cien veces de más.
    print()
    print('Importe que se manda a Stripe (unit_amount), pieza de ejemplo:')
    pid = 'collar_flor_natal'
    for mercado, moneda in MONEDAS.items():
        v = precio(pid, mercado, base_servidor, tasas_servidor)
        unit = round(v) if moneda in SIN_DECIMALES else round(v * 100)
        print(f'  {mercado} · {moneda}: se enseña {v:,.2f} → unit_amount {unit:,}')

    print()
    if fallos:
        print(f'{len(fallos)} DESAJUSTES entre navegador y servidor:')
        for f in fallos: print('  -', f)
        return 1
    print('Navegador y servidor dicen exactamente lo mismo.')
    return 0

if __name__ == '__main__':
    sys.exit(main())
