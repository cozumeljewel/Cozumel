// Copia del lado del servidor de los precios y los mercados de
// mercados.js + productos.js.
//
// Por qué existe esta copia y no se comparte el archivo: mercados.js es
// JS de navegador (sin módulos, cargado por <script>) y esto corre en
// Deno; importar uno desde el otro añadiría una complicación de build que
// no compensa para siete piezas y siete mercados. El precio que se cobra
// SIEMPRE sale de aquí, nunca de lo que mande el navegador.
//
// IMPORTANTE: si cambias un precio, una tasa o una regla de redondeo en
// mercados.js / productos.js, cámbialo también aquí. Las dos copias tienen
// que dar exactamente el mismo número, o el cliente vería un precio y
// Stripe cobraría otro. scripts/verificar-precios.py compara las dos.

// ---- Precio maestro: precio FINAL en México, envío incluido ----
export const PRECIOS_MXN: Record<string, number | null> = {
  collar_esencial: 649,       // Colgante placa grabable
  pulsera_vinculo: 649,       // Pulsera Dos Almas
  pulsera_nombre: 549,        // Pulsera grabable
  brazalete_mensaje: 599,     // Brazalete grabable
  collar_flor_natal: 699,     // Colgante de los meses
  kit_pedacito_nosotros: 999, // Kit de 2 piezas (precio propio, no la suma)
  kit_mi_consentida: 999,
  kit_personalizado: 999,      // Kit a tu gusto: mismo precio que los cerrados
};

// ---- Precios manuales por mercado ----
// Si un producto tiene precio fijado a mano para un país, manda sobre la
// conversión. Mismo criterio que "precios: { US: 24.99 }" en productos.js.
export const PRECIOS_MANUALES: Record<string, Record<string, number>> = {
  // collar_esencial: { US: 29.99, ES: 27.90 },
};

// Colombia (COP) y Argentina (ARS) fuera: la cuenta de Stripe no admite
// cobrar en esas monedas (comprobado el 2026-09-23). Quien entre desde
// allí paga en dólares. Mismo criterio que en mercados.js.
export const MERCADOS: Record<string, { moneda: string }> = {
  MX: { moneda: "MXN" },
  US: { moneda: "USD" },
  ES: { moneda: "EUR" },
  CL: { moneda: "CLP" },
  PE: { moneda: "PEN" },
};

export const MERCADO_FALLBACK = "US";

// ---- Tasas desde MXN (fijas a propósito, ver mercados.js) ----
export const TASAS: Record<string, number> = {
  MXN: 1,
  USD: 0.055,
  EUR: 0.051,
  COP: 215,
  CLP: 52,
  PEN: 0.20,
  ARS: 55,
};

// ---- Envío incluido en el precio, en dólares (igual que ENVIO_USD de
// mercados.js; cotización del taller del 2026-09-23) ----
export const ENVIO_USD: Record<string, number> = {
  MX: 6.50,
  US: 8.50,
  ES: 11.00,
  CL: 9.50,
  PE: 7.00,
};

// ---- Mercados con el MISMO precio que México (igual que COMO_MEXICO de
// mercados.js): el envío de más y el IVA salen de nuestro margen ----
export const COMO_MEXICO = ["ES"];

function envioEnMoneda(mercado: string, moneda: string): number {
  return (ENVIO_USD[mercado] ?? 0) * (TASAS[moneda] ?? 1) / TASAS.USD;
}

// ---- Redondeo comercial, igual que en mercados.js ----
const REDONDEO: Record<string, (v: number) => number> = {
  USD: (v) => Math.max(Math.ceil(v), 1) - 0.01,
  EUR: (v) => Math.max(Math.ceil(v), 1) - 0.10,
  COP: (v) => Math.ceil(v / 1000) * 1000 - 100,
  CLP: (v) => Math.ceil(v / 1000) * 1000 - 10,
  PEN: (v) => {
    const n = Math.ceil(v);
    const r = n % 10;
    return n + (r === 9 ? 0 : 9 - r);
  },
  ARS: (v) => Math.ceil(v / 1000) * 1000 - 1,
  MXN: (v) => v,
};

// Monedas que Stripe cobra sin decimales (y que tampoco se enseñan con
// céntimos). Para estas, unit_amount va en unidades, no en céntimos.
export const SIN_DECIMALES = ["COP", "CLP", "ARS"];

export const PRODUCTOS_VALIDOS = Object.keys(PRECIOS_MXN);

export function mercadoValido(mercado: string | null | undefined): string {
  return mercado && MERCADOS[mercado] ? mercado : MERCADO_FALLBACK;
}

/** Precio de una pieza en un mercado: manual si lo hay, si no conversión
 *  desde México (sin su envío) + envío del país + redondeo comercial.
 *  Devuelve null si la pieza no tiene
 *  precio maestro. */
export function precioDe(
  producto: string,
  mercado: string,
): { importe: number; moneda: string; mercado: string } | null {
  const m = mercadoValido(mercado);
  const moneda = MERCADOS[m].moneda;

  const manual = PRECIOS_MANUALES[producto]?.[m];
  if (typeof manual === "number") {
    return { importe: redondearSalida(manual, moneda), moneda, mercado: m };
  }

  const base = PRECIOS_MXN[producto];
  if (base === null || base === undefined) return null;

  // México: el precio maestro tal cual, ya lleva su envío.
  if (moneda === "MXN") return { importe: base, moneda, mercado: m };

  // Resto: precio de México sin su envío, convertido, más el de este país.
  // Los de COMO_MEXICO, el precio de México convertido sin más.
  const tasa = TASAS[moneda] ?? 1;
  const convertido = COMO_MEXICO.includes(m)
    ? base * tasa
    : (base - envioEnMoneda("MX", "MXN")) * tasa + envioEnMoneda(m, moneda);
  const redondear = REDONDEO[moneda] ?? ((v: number) => v);
  return { importe: redondearSalida(redondear(convertido), moneda), moneda, mercado: m };
}

function redondearSalida(valor: number, moneda: string): number {
  return SIN_DECIMALES.includes(moneda) ? Math.round(valor) : Math.round(valor * 100) / 100;
}

/** Lo que hay que mandarle a Stripe: entero en la unidad mínima. */
export function importeStripe(importe: number, moneda: string): number {
  return SIN_DECIMALES.includes(moneda) ? Math.round(importe) : Math.round(importe * 100);
}
