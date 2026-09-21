/* Devuelve el país de quien visita, deducido de su IP por Netlify en el
   borde (context.geo). No pide permiso de ubicación ni usa GPS: es el
   país aproximado de la conexión, lo mismo que sabe cualquier servidor
   al recibir una petición.
 *
 * La web lo llama UNA vez y guarda el resultado 30 días en el navegador
 * (ver mercados.js), así que esto no se ejecuta en cada página.
 *
 * Respuesta: { "country": "ES", "region": "GA", "city": "A Coruña" }
 * Si Netlify no sabe el país, devuelve country: null y la web cae a la
 * zona horaria del navegador. */
export default async (request, context) => {
  const geo = context.geo || {};
  return new Response(
    JSON.stringify({
      country: geo.country?.code || null,
      region: geo.subdivision?.code || null,
      city: geo.city || null,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        // Se cachea en el navegador un día; el guardado de 30 días lo
        // hace la propia web. "private" porque depende de quién pregunta.
        'Cache-Control': 'private, max-age=86400',
      },
    },
  );
};

export const config = { path: '/api/geo' };
