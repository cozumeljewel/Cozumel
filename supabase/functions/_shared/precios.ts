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
//
// ⚠️ ESTOS NO SON LOS PRECIOS REALES ⚠️
// Todo a 1 € a propósito, para probar el flujo de compra con el modo de
// prueba de Stripe (tarjeta 4242 4242 4242 4242, dinero falso). El valor
// es obviamente falso para que nadie lo confunda con un precio definitivo.
// ANTES DE LANZAR: poner los precios reales aquí Y en productos.js, y
// cambiar los secretos de Supabase a las claves live de Stripe.

export const PRECIOS: Record<string, number | null> = {
  collar_esencial: 1,
  pulsera_vinculo: 1,
  pulsera_nombre: 1,
  brazalete_mensaje: 1,
  collar_flor_natal: 1,
  kit_pedacito_nosotros: 1,
  kit_mi_consentida: 1,
};

export const PRODUCTOS_VALIDOS = Object.keys(PRECIOS);
