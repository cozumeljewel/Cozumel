// Genera supabase/functions/_shared/precios-hombre.ts a partir de hombre.js
// (26/10/2026): precio por pieza y mercado, nombre de cada pieza y la
// promoción de lanzamiento. Así el servidor cobra EXACTAMENTE lo que enseña
// la web, sin copiar números a mano.
//
// Uso (desde la raíz), cada vez que cambien precios, piezas o la promo:
//   node scripts/precios-hombre.mjs
//   supabase functions deploy crear-sesion-pago
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const raiz = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
process.chdir(raiz);
globalThis.window = globalThis;
// hombre.js es JS de navegador (const globales): se evalúa como script.
const codigo = fs.readFileSync('hombre.js', 'utf8')
  .replace(/^const /gm, 'var ')
  .replace(/^function (\w+)/gm, 'var $1 = function');
(0, eval)(codigo);

const precios = {};
const nombres = {};
for (const p of COLECCION_HOMBRE) {
  if (!p.precios) throw new Error('Pieza sin precio: ' + p.id);
  precios[p.id] = p.precios;
  nombres[p.id] = p.nombre;
}

const ts = `// GENERADO por scripts/precios-hombre.mjs a partir de hombre.js. No editar a mano.
// Precio FINAL por mercado (envío incluido), antes de la promoción.
export const PRECIOS_HOMBRE: Record<string, Record<string, number>> = ${JSON.stringify(precios, null, 1)};

export const NOMBRES_HOMBRE: Record<string, string> = ${JSON.stringify(nombres, null, 1)};

// Promoción de lanzamiento (descuento REAL sobre los precios de arriba).
// null = sin promoción. hasta = fecha en que se apaga sola.
export const PROMO_HOMBRE: { descuento: number; hasta?: string } | null = ${JSON.stringify(PROMO_HOMBRE ? { descuento: PROMO_HOMBRE.descuento, hasta: PROMO_HOMBRE.hasta } : null)};
`;
fs.writeFileSync('supabase/functions/_shared/precios-hombre.ts', ts);
console.log(Object.keys(precios).length, 'piezas de hombre ->', 'supabase/functions/_shared/precios-hombre.ts');
