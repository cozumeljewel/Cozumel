import fs from 'node:fs';
// Comprueba que la web y el servidor de pago cobran lo mismo en hombre
// (33 piezas × 6 mercados, con la promoción). Uso, desde la raíz:
//   node --experimental-strip-types --no-warnings scripts/verificar-precios-hombre.mjs
import path from 'node:path';
import url from 'node:url';
const raiz = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
process.chdir(raiz);
const srv = await import(url.pathToFileURL(path.join(raiz, 'supabase/functions/_shared/precios.ts')).href);
globalThis.window = globalThis;
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.document = { documentElement: {}, addEventListener() {}, querySelectorAll: () => [] };
const ev = (f) => (0, eval)(fs.readFileSync(f, 'utf8').replace(/^const /gm, 'var ').replace(/^let /gm, 'var ').replace(/^function (\w+)/gm, 'var $1 = function'));
ev('mercados.js'); ev('hombre.js');
// Promo como la web (pintarPrecioPromo de script.js)
const web = (prod, m) => {
  const p = precioDe(prod, m); if (!p) return null;
  const pr = PROMO_HOMBRE; let imp = p.importe;
  if (pr && pr.descuento && (!pr.hasta || Date.now() <= Date.parse(pr.hasta))) {
    imp = p.importe * (1 - pr.descuento / 100);
    imp = (SIN_DECIMALES.includes(p.moneda) || p.moneda === 'MXN') ? Math.round(imp) : Math.round(imp * 100) / 100;
  }
  return { importe: imp, moneda: p.moneda };
};
let ok = 0, mal = [];
for (const prod of COLECCION_HOMBRE) for (const m of ['MX','ES','US','CL','PE','AR']) {
  const a = web(prod, m), b = srv.precioDe(prod.id, m);
  if (a && b && a.importe === b.importe && a.moneda === b.moneda) ok++; else mal.push(`${prod.id} ${m} web=${JSON.stringify(a)} srv=${JSON.stringify(b)}`);
}
console.log('coinciden', ok, 'distintos', mal.length); mal.slice(0,10).forEach(x => console.log(' ', x));
console.log('ejemplo Mezcal:', ['MX','ES','US'].map(m => m + ' ' + JSON.stringify(srv.precioDe('hombre_collar_3', m))).join(' | '));
console.log('mujer sigue igual:', JSON.stringify(srv.precioDe('pulsera_nombre','ES')), srv.PRODUCTOS_VALIDOS.length, 'productos válidos');
