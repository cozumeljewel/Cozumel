# -*- coding: utf-8 -*-
"""Comprueba que TODAS las variantes que se pueden comprar en la web
resuelven un SKU que existe de verdad en el Excel de EMANCO.

Replica la lógica de supabase-migracion-v10.sql (función
notificar_pedido_pagado) y la cruza con "SKU PRODUCTOS COLECCIÓN 1/
Cozumel SKU.xls". Si algún día cambia una de las dos cosas, este script
lo caza.

    python scripts/verificar-sku.py

Deja además un CSV con la matriz completa (variante → SKU) para
mandárselo al proveedor o revisarlo en Excel.
"""
import sys, csv, io, os
import pandas as pd

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXCEL = os.path.join(RAIZ, 'SKU PRODUCTOS COLECCIÓN 1', 'Cozumel SKU.xls')
SALIDA = os.path.join(RAIZ, 'docs', 'sku-todas-las-variantes.csv')

MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
         'septiembre','octubre','noviembre','diciembre']

def sku_de_pedido(producto, p):
    """Misma lógica que la función de Supabase (v10), en Python."""
    bajo = lambda v: (v or '').lower()
    acabado = bajo(p.get('acabado') or 'oro')
    pieza1 = bajo(p.get('acabado__collar_esencial') or p.get('acabado__collar_flor_natal') or p.get('acabado') or 'oro')
    pieza2 = bajo(p.get('acabado__pulsera_vinculo') or p.get('acabado__pulsera_nombre') or p.get('acabado') or 'oro')
    mes = p.get('mes')
    mes_num = MESES.index(mes) + 1 if mes in MESES else None
    grabado = any((p.get(k) or '').strip() for k in ('nombre','fecha','mensaje','grabado'))
    falta_mes = 'FALTA EL MES'

    if producto == 'collar_esencial':
        return ('CDNN067-1' if acabado == 'plata' else 'CDNN067-2') + (' + diaoke' if grabado else '')
    if producto == 'pulsera_vinculo':
        return 'YS14924A0W0' if acabado == 'plata' else 'YS14924D0W0'
    if producto == 'pulsera_nombre':
        return 'YS15777A0W0-KZ' if acabado == 'plata' else 'YS15777D0W0-KZ'
    if producto == 'brazalete_mensaje':
        return 'FZ28329A0W0-KZ' if acabado == 'plata' else 'FZ28329D0W0-KZ'
    if producto == 'collar_flor_natal':
        if mes_num is None: return falta_mes
        return ('XX49472A0W' if acabado == 'plata' else 'XX49472D0W') + str(mes_num)
    if producto == 'kit_pedacito_nosotros':
        return (('CDNN067-1' if pieza1 == 'plata' else 'CDNN067-2') + ' + ' +
                ('YS14924A0W0' if pieza2 == 'plata' else 'YS14924D0W0') +
                (' + diaoke' if grabado else ''))
    if producto == 'kit_mi_consentida':
        if mes_num is None: return falta_mes
        return (('XX49472A0W' if pieza1 == 'plata' else 'XX49472D0W') + str(mes_num) + ' + ' +
                ('YS15777A0W0-KZ' if pieza2 == 'plata' else 'YS15777D0W0-KZ'))
    return 'SIN SKU'

def variantes():
    """Todas las combinaciones comprables, tal y como las manda la web."""
    for ac in ('oro','plata'):
        for g in (False, True):
            yield ('Collar Esencia', 'collar_esencial',
                   {'acabado': ac, **({'nombre':'Ana','fecha':'14.02.2024','mensaje':'te quiero'} if g else {'nombre':'','fecha':'','mensaje':''})})
        yield ('Pulsera Dos Almas', 'pulsera_vinculo', {'acabado': ac})
        for g in (False, True):
            yield ('Pulsera Mi Cielo', 'pulsera_nombre', {'acabado': ac, 'grabado': 'Aquí y ahora' if g else ''})
            yield ('Brazalete Eterno', 'brazalete_mensaje', {'acabado': ac, 'grabado': 'te adoro' if g else ''})
        for mes in MESES:
            yield ('Collar Destino', 'collar_flor_natal', {'acabado': ac, 'mes': mes})
    for a1 in ('oro','plata'):
        for a2 in ('oro','plata'):
            for g in (False, True):
                yield ('Kit El Pedacito de Nosotros', 'kit_pedacito_nosotros',
                       {'acabado__collar_esencial': a1, 'acabado__pulsera_vinculo': a2,
                        **({'nombre':'Ana','fecha':'','mensaje':''} if g else {'nombre':'','fecha':'','mensaje':''})})
            for mes in MESES:
                yield ('Kit Mi Consentida', 'kit_mi_consentida',
                       {'acabado__collar_flor_natal': a1, 'acabado__pulsera_nombre': a2, 'mes': mes, 'grabado': 'Siempre'})

def main():
    excel = pd.read_excel(EXCEL)
    catalogo = set(str(s).strip() for s in excel['SKU'].dropna())

    # Mes de cada referencia del Collar Destino, anotado por el cliente en
    # el Excel del proveedor (columna suelta, sin encabezado). Confirma el
    # orden W1=enero ... W12=diciembre que usa la función de Supabase.
    col_mes = [c for c in excel.columns if str(c).startswith('Unnamed')]
    meses_excel = {}
    for col in col_mes:
        for sku, val in zip(excel['SKU'], excel[col]):
            texto = str(val).strip().lower()
            if texto in MESES:
                meses_excel[str(sku).strip()] = texto
    # El Excel lista los sub-SKU del collar de dos cadenas, pero EMANCO
    # pide el combinado: se añaden a mano desde la columna ITEM.
    catalogo |= set(str(s).strip() for s in excel['ITEM'].dropna() if str(s).startswith('CDNN'))

    filas, fallos = [], []
    for nombre, producto, pers in variantes():
        sku = sku_de_pedido(producto, pers)
        piezas = [t.strip() for t in sku.split('+')]
        desconocidas = [t for t in piezas if t not in catalogo]
        if desconocidas:
            fallos.append((nombre, pers, sku, desconocidas))

        # Si la pieza lleva mes, la referencia dorada tiene que ser la que
        # el Excel marca con ESE mes (el plateado comparte número).
        if pers.get('mes'):
            for t in piezas:
                dorado = t.replace('A0W', 'D0W')
                if dorado in meses_excel and meses_excel[dorado] != pers['mes']:
                    fallos.append((nombre, pers, sku,
                                   [f"{t} es de {meses_excel[dorado]}, no de {pers['mes']}"]))
        filas.append({
            'Pieza': nombre,
            'Acabado': pers.get('acabado') or f"collar {pers.get('acabado__collar_esencial') or pers.get('acabado__collar_flor_natal')} / pulsera {pers.get('acabado__pulsera_vinculo') or pers.get('acabado__pulsera_nombre')}",
            'Mes': pers.get('mes',''),
            'Grabado': 'sí' if any((pers.get(k) or '').strip() for k in ('nombre','fecha','mensaje','grabado')) else 'no',
            'SKU a pedir': sku,
            'En el Excel de EMANCO': 'NO' if desconocidas else 'sí',
        })

    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    with open(SALIDA, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(filas[0].keys()), delimiter=';')
        w.writeheader(); w.writerows(filas)

    print(f'{len(filas)} variantes comprobadas contra {len(catalogo)} referencias del Excel')
    print(f'{len(meses_excel)} referencias del Collar Destino con mes anotado en el Excel')
    print(f'CSV: {os.path.relpath(SALIDA, RAIZ)}')
    if fallos:
        print(f'\n{len(fallos)} VARIANTES CON SKU QUE NO ESTÁ EN EL EXCEL:')
        for nombre, pers, sku, desc in fallos:
            print(f'  - {nombre} {pers} -> {sku}  (no existe: {", ".join(desc)})')
        return 1
    print('Todas las variantes resuelven un SKU que existe en el Excel.')
    return 0

if __name__ == '__main__':
    sys.exit(main())
