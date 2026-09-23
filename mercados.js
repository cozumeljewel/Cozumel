/* =========================================================
   COZUMEL · MERCADOS Y PRECIOS INTERNACIONALES
   Fuente ÚNICA de verdad de qué precio se enseña y en qué moneda.
   Todo lo que pinte un precio (tarjetas, ficha, kit, carrito, checkout)
   pasa por aquí: así no puede pasar que una tarjeta diga MXN y el
   carrito USD.

   Cómo funciona, en corto:
     1. El precio maestro de cada pieza está en productos.js, en
        "precios: { MX: 449 }". Es el precio de la pieza SIN envío.
     2. Si el producto tiene precio manual para un país (p.ej.
        "US: 24.99"), se usa ese tal cual (tiene que incluir el envío).
     3. Si no lo tiene, se convierte desde MXN con la tasa de TASAS, se
        suma el envío de ENVIO_USD y se redondea con la regla comercial
        de esa moneda (.99, ,90, .990...).
     4. El resultado se calcula UNA vez y se guarda en caché, no en cada
        pintado.

   Para poner precios manuales de un país más adelante, no hay que tocar
   nada de esto: basta añadir el número en productos.js. Ver el comentario
   de "precios" en ese archivo.
   ========================================================= */

/* ---------- Mercados soportados ----------
   "pais" es como se enseña en el selector. Si un país no está en
   PAIS_A_MERCADO, cae en US (dólares), como acordado. */
const MERCADOS = {
  MX: { pais: 'México',          moneda: 'MXN', locale: 'es-MX', simbolo: '$',  maestro: true },
  US: { pais: 'Estados Unidos',  moneda: 'USD', locale: 'en-US', simbolo: '$'  },
  ES: { pais: 'España',          moneda: 'EUR', locale: 'es-ES', simbolo: '€'  },
  CL: { pais: 'Chile',           moneda: 'CLP', locale: 'es-CL', simbolo: '$'  },
  PE: { pais: 'Perú',            moneda: 'PEN', locale: 'es-PE', simbolo: 'S/' },
  /* Colombia (COP) y Argentina (ARS) están fuera a propósito: la cuenta
     de Stripe NO admite cobrar en esas monedas (comprobado el 2026-09-23
     intentando crear la sesión de pago). Quien entre desde allí verá
     dólares, que sí se cobran. Si algún día Stripe los habilita, se
     vuelven a añadir aquí, en PAIS_A_MERCADO, en TASAS y en el
     precios.ts del servidor: el redondeo de sus monedas sigue escrito
     más abajo. */
};

const MERCADO_POR_DEFECTO = 'MX';   // mercado maestro
const MERCADO_FALLBACK = 'US';      // país conocido pero sin mercado propio

/* Países → mercado. La eurozona entera va al mercado ES (euros). */
const EUROZONA = ['ES','DE','FR','IT','PT','NL','BE','AT','IE','FI','GR','SK','SI','LT','LV','EE','LU','MT','CY','HR'];
const PAIS_A_MERCADO = Object.fromEntries([
  ['MX','MX'], ['US','US'], ['CL','CL'], ['PE','PE'],
  // Colombia y Argentina no están: caen en el fallback (dólares).
  ...EUROZONA.map(p => [p, 'ES']),
]);

/* ---------- Tasas de cambio desde MXN ----------
   SON FIJAS A PROPÓSITO: no se consulta ningún servicio de divisas en
   vivo, porque el precio que ve el cliente tiene que ser estable (y
   porque el redondeo comercial de abajo absorbe la variación del día).
   Revisarlas de vez en cuando; si una moneda se mueve mucho, se cambia
   el número aquí o se fija un precio manual en productos.js.
   Última revisión: 2026-09-21. */
const TASAS = {
  MXN: 1,
  USD: 0.055,
  EUR: 0.051,
  COP: 215,
  CLP: 52,
  PEN: 0.20,
  ARS: 55,
};

/* ---------- Envío incluido en el precio ----------
   Coste por paquete (hasta 100 g, con impuestos DDP) según la cotización
   del taller, en DÓLARES. Se suma a cada pieza antes del redondeo, así el
   precio que se enseña ya lleva el envío y la web puede decir "envío
   incluido" sin mentir. Colombia (7 $) y el resto de países que caen en
   el fallback pagan el precio de US, que ya lo cubre.
   Un pedido de varias piezas va en un solo paquete: las piezas de más
   llevan un envío que no se gasta (margen extra, a propósito, por
   sencillez). Cotización del 2026-09-23. */
const ENVIO_USD = {
  MX: 6.50,
  US: 8.50,
  ES: 11.00,  // 6 envío + 3,5 aranceles + 1,5 IVA (UE)
  CL: 9.50,   // 7 envío + 2,5 impuestos
  PE: 7.00,
};

/* Envío de un mercado pasado a su moneda con las mismas tasas fijas. */
function envioEnMoneda(mercado, moneda) {
  const usd = ENVIO_USD[mercado] || 0;
  return usd * (TASAS[moneda] ?? 1) / TASAS.USD;
}

/* ---------- Redondeo comercial ----------
   Nadie enseña 27,43 €. Cada moneda tiene su forma de rematar el precio.
   Estas funciones reciben el importe ya convertido y lo llevan al precio
   "de escaparate" más cercano por arriba. */
const REDONDEO = {
  // 24.99, 27.99, 34.99...
  USD: v => Math.max(Math.ceil(v), 1) - 0.01,
  // 24,90 · 27,90 · 34,90...
  EUR: v => Math.max(Math.ceil(v), 1) - 0.10,
  // 84.900 · 119.900...
  COP: v => Math.ceil(v / 1000) * 1000 - 100,
  // 21.990 · 29.990...
  CLP: v => Math.ceil(v / 1000) * 1000 - 10,
  // S/69 · S/79 · S/99...
  PEN: v => { const n = Math.ceil(v); const r = n % 10; return n + (r === 9 ? 0 : (9 - r + (r > 9 ? 10 : 0))); },
  // 24.999 · 39.999... (inflación alta: se remata en 999)
  ARS: v => Math.ceil(v / 1000) * 1000 - 1,
  // $569 · $669... (México no se convierte, pero sí suma el envío)
  MXN: v => { const n = Math.ceil(v); const r = n % 10; return n + (r === 9 ? 0 : 9 - r); },
};

/* Monedas sin decimales: ni se enseñan ni se cobran con céntimos. */
const SIN_DECIMALES = ['COP', 'CLP', 'ARS'];

/* ---------- Estado del mercado activo ----------
   Dos claves distintas a propósito:
     · cozumel_mercado_manual → lo eligió la persona. Manda siempre y la
       detección por IP no lo pisa nunca.
     · cozumel_mercado_geo    → lo dedujo la IP. Se guarda con fecha para
       no volver a preguntar en cada página (se refresca a los 30 días). */
const CLAVE_MANUAL = 'cozumel_mercado_manual';
const CLAVE_GEO = 'cozumel_mercado_geo';
const GEO_VALIDEZ_MS = 30 * 24 * 60 * 60 * 1000;

let mercadoActual = null;
const oyentes = [];

/* Primera visita: todavía no se sabe el país, así que los importes se
   ocultan (solo ellos, no el resto de la página) hasta resolverlo. Evita
   el salto feo de "$549 MXN → 27,90 €". A partir de la segunda visita el
   mercado ya está guardado y no hay espera. */
function marcarMercadoPendiente() {
  try { document.documentElement.classList.add('mercado-pendiente'); } catch (_) {}
}
function marcarMercadoResuelto() {
  try { document.documentElement.classList.remove('mercado-pendiente'); } catch (_) {}
}

function leerLocal(clave) {
  try { return JSON.parse(localStorage.getItem(clave)); } catch (_) { return null; }
}
function guardarLocal(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (_) {}
}

function esMercadoValido(codigo) {
  return typeof codigo === 'string' && Object.prototype.hasOwnProperty.call(MERCADOS, codigo);
}

function mercadoDePais(codigoPais) {
  if (typeof codigoPais !== 'string') return MERCADO_FALLBACK;
  const cc = codigoPais.toUpperCase();
  return PAIS_A_MERCADO[cc] || MERCADO_FALLBACK;
}

/* Mercado activo. Nunca devuelve null: si todavía no se resolvió la IP,
   usa el último conocido o el maestro, para que no haya un hueco sin
   precio mientras llega la respuesta. */
function getMercado() {
  if (mercadoActual) return mercadoActual;

  const manual = leerLocal(CLAVE_MANUAL);
  if (esMercadoValido(manual)) { mercadoActual = manual; return mercadoActual; }

  const geo = leerLocal(CLAVE_GEO);
  if (geo && esMercadoValido(geo.mercado) && (Date.now() - geo.fecha) < GEO_VALIDEZ_MS) {
    mercadoActual = geo.mercado;
    return mercadoActual;
  }

  // Guardado pero ya no válido (p.ej. Colombia, retirada al no admitirla
  // Stripe): dólares, no el mercado maestro — a un colombiano enseñarle
  // pesos mexicanos sería peor.
  if (manual || (geo && geo.mercado)) {
    mercadoActual = MERCADO_FALLBACK;
    return mercadoActual;
  }

  mercadoActual = MERCADO_POR_DEFECTO;
  return mercadoActual;
}

function getMoneda() {
  return MERCADOS[getMercado()].moneda;
}

/* Cambio MANUAL: se recuerda para siempre y la IP ya no lo toca. */
function setMercado(codigo, opciones) {
  if (!esMercadoValido(codigo)) return;
  const manual = !(opciones && opciones.automatico);
  if (mercadoActual === codigo) {
    if (manual) guardarLocal(CLAVE_MANUAL, codigo);
    return;
  }
  mercadoActual = codigo;
  if (manual) guardarLocal(CLAVE_MANUAL, codigo);
  cachePrecios.clear();
  oyentes.forEach(fn => { try { fn(codigo); } catch (e) { console.error(e); } });
}

function alCambiarMercado(fn) {
  if (typeof fn === 'function') oyentes.push(fn);
}

/* ---------- Detección por IP ----------
   Se pregunta UNA vez y se guarda 30 días; no hay llamada por página.
   El país lo da la propia infraestructura (función de Netlify en
   /api/geo, que lee la IP en el borde). No se pide GPS ni permiso de
   ubicación: solo el país aproximado de la conexión.
   Si falla (o en local, sin Netlify), se cae a la zona horaria del
   navegador, que no requiere permiso, y en último caso al mercado
   maestro. */
const TZ_A_PAIS = {
  'America/Mexico_City': 'MX', 'America/Monterrey': 'MX', 'America/Cancun': 'MX',
  'America/Tijuana': 'MX', 'America/Merida': 'MX', 'America/Hermosillo': 'MX',
  'America/Bogota': 'CO', 'America/Santiago': 'CL', 'America/Lima': 'PE',
  'America/Argentina/Buenos_Aires': 'AR', 'America/Buenos_Aires': 'AR',
  'Europe/Madrid': 'ES', 'Atlantic/Canary': 'ES', 'Europe/Lisbon': 'PT',
  'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Rome': 'IT',
};

function paisPorZonaHoraria() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TZ_A_PAIS[tz]) return TZ_A_PAIS[tz];
    if (typeof tz === 'string' && tz.startsWith('America/')) return null; // no adivinar de más
  } catch (_) {}
  return null;
}

async function resolverMercadoAutomatico() {
  // Elección manual: no se toca jamás.
  if (esMercadoValido(leerLocal(CLAVE_MANUAL))) { marcarMercadoResuelto(); return getMercado(); }

  const geo = leerLocal(CLAVE_GEO);
  if (geo && esMercadoValido(geo.mercado) && (Date.now() - geo.fecha) < GEO_VALIDEZ_MS) {
    setMercado(geo.mercado, { automatico: true });
    marcarMercadoResuelto();
    return geo.mercado;
  }

  // A partir de aquí sí hay que preguntar: se esconden los importes.
  marcarMercadoPendiente();

  let pais = null;
  try {
    const resp = await fetch('/api/geo', { headers: { Accept: 'application/json' } });
    if (resp.ok) {
      const datos = await resp.json();
      if (datos && typeof datos.country === 'string') pais = datos.country;
    }
  } catch (_) { /* sin red o sin función de borde: se sigue abajo */ }

  if (!pais) pais = paisPorZonaHoraria();

  const mercado = pais ? mercadoDePais(pais) : MERCADO_POR_DEFECTO;
  guardarLocal(CLAVE_GEO, { mercado, pais: pais || null, fecha: Date.now() });
  setMercado(mercado, { automatico: true });
  marcarMercadoResuelto();
  return mercado;
}

/* ---------- Precio de un producto en un mercado ----------
   Orden: precio manual del mercado → conversión desde MXN + redondeo.
   El resultado se cachea por (producto, mercado): no se recalcula en
   cada pintado. */
const cachePrecios = new Map();

function precioDe(prod, codigoMercado) {
  if (!prod) return null;
  const mercado = esMercadoValido(codigoMercado) ? codigoMercado : getMercado();
  const clave = prod.id + '|' + mercado;
  if (cachePrecios.has(clave)) return cachePrecios.get(clave);

  const moneda = MERCADOS[mercado].moneda;
  const precios = prod.precios || {};
  let importe = null;

  // precios.MX es el precio base sin envío, no un precio manual de México.
  const manual = mercado !== 'MX' && typeof precios[mercado] === 'number';

  if (manual) {
    // Precio manual para este país: manda sobre cualquier conversión.
    importe = precios[mercado];
  } else if (typeof precios.MX === 'number') {
    // Conversión desde el precio maestro de México + envío del país +
    // redondeo comercial.
    const convertido = precios.MX * (TASAS[moneda] ?? 1) + envioEnMoneda(mercado, moneda);
    const redondear = REDONDEO[moneda] || (v => v);
    importe = redondear(convertido);
  }

  const resultado = importe === null || importe === undefined ? null : {
    importe: SIN_DECIMALES.includes(moneda) ? Math.round(importe) : Math.round(importe * 100) / 100,
    moneda,
    mercado,
    manual,
  };

  cachePrecios.set(clave, resultado);
  return resultado;
}

/* Texto ya formateado, listo para pintar: "449,00 $" / "24.99 $" / "27,90 €" */
function formatearImporte(importe, moneda) {
  if (importe === null || importe === undefined) return null;
  const mercado = Object.keys(MERCADOS).find(m => MERCADOS[m].moneda === moneda) || getMercado();
  const decimales = SIN_DECIMALES.includes(moneda) ? 0 : 2;
  try {
    return new Intl.NumberFormat(MERCADOS[mercado].locale, {
      style: 'currency', currency: moneda,
      minimumFractionDigits: decimales, maximumFractionDigits: decimales,
    }).format(importe);
  } catch (_) {
    return importe.toFixed(decimales) + ' ' + moneda;
  }
}

/* El atajo que usa el resto de la web: precio del producto en el mercado
   activo, ya formateado. Devuelve null si esa pieza no tiene precio. */
function precioTexto(prod, codigoMercado) {
  const p = precioDe(prod, codigoMercado);
  return p ? formatearImporte(p.importe, p.moneda) : null;
}

/* Ahorro del kit frente a comprar las piezas sueltas. Solo se enseña si
   sale positivo (si un día el kit no ahorra, no se dice nada). */
function ahorroKit(prodKit, idsPiezas, codigoMercado) {
  const kit = precioDe(prodKit, codigoMercado);
  if (!kit) return null;
  let suelto = 0;
  for (const id of idsPiezas) {
    const pieza = (typeof PRODUCTOS !== 'undefined') ? PRODUCTOS.find(p => p.id === id) : null;
    const precio = pieza ? precioDe(pieza, codigoMercado) : null;
    if (!precio) return null;
    suelto += precio.importe;
  }
  const ahorro = suelto - kit.importe;
  if (!(ahorro > 0)) return null;
  return { importe: ahorro, moneda: kit.moneda, texto: formatearImporte(ahorro, kit.moneda) };
}
