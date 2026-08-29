// Copia del lado del servidor de los precios de productos.js.
//
// Por qué existe esta copia y no se comparte el archivo: productos.js es
// JS de navegador (sin módulos, cargado por <script>) y esta función corre
// en Deno; importar uno desde el otro añadiría una complicación de build
// que no compensa para siete números. El precio real que se cobra SIEMPRE
// sale de aquí, nunca de lo que mande el navegador (evita manipulación).
//
// IMPORTANTE: si cambias un precio en productos.js, cámbialo también aquí,
// y viceversa. Si algún día esto se sale de sincronía a menudo, vale la
// pena automatizarlo; con un catálogo de 7 piezas fijas, no por ahora.

export const PRECIOS: Record<string, number | null> = {
  collar_esencial: 1, // TEMPORAL: precio orientativo de prueba (1€), pendiente de precio real
  pulsera_vinculo: null,
  pulsera_nombre: null,
  brazalete_mensaje: null,
  collar_flor_natal: null,
  kit_pedacito_nosotros: null,
  kit_mi_consentida: null,
};

export const PRODUCTOS_VALIDOS = Object.keys(PRECIOS);
