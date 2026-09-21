// Crea una sesión de Stripe Checkout para una o varias filas de "reservas"
// que ya existen en estado 'pendiente_pago' (un pedido con varias piezas
// es varias filas que van a compartir esta misma sesión). La llama el
// navegador, autenticado.
//
// Por qué el precio se relee aquí y no se confía en el que ya guardó el
// navegador en "precio_pagado": esta función es la última barrera antes de
// cobrar. Si alguien manipulase el JavaScript del formulario, el precio
// que Stripe termina cobrando sale de PRECIOS (Tarea 3), no de la fila.
//
// Todas las filas del mismo pedido se validan y actualizan como grupo: si
// una sola no es del usuario que llama, o ya no está pendiente de pago, o
// es un producto desconocido, se rechaza el pedido ENTERO — no se cobra
// una parte sí y otra no.

import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";
import { PRODUCTOS_VALIDOS, precioDe, mercadoValido, importeStripe } from "../_shared/precios.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SITE_URL = "https://cozumeljewelry.es";

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

// La web y esta función viven en dominios distintos (cozumeljewelry.es y
// supabase.co), así que el navegador exige CORS: manda primero una
// petición OPTIONS de permiso y, si no la contesta bien, bloquea el POST
// sin llegar a enviarlo. Sin esto el pago fallaba siempre con "no se pudo
// conectar", sin más pista, porque el navegador cortaba antes de salir.
//
// El control de acceso de verdad lo hace el token de sesión (más abajo),
// no esta lista: aquí solo se declara desde qué webs se puede llamar.
const ORIGENES_PERMITIDOS = [
  "https://cozumeljewelry.es",
  "https://www.cozumeljewelry.es",
];

function cabecerasCors(origen: string | null): Record<string, string> {
  const esLocal = origen !== null && /^http:\/\/localhost:\d+$/.test(origen);
  const permitido = origen !== null && (ORIGENES_PERMITIDOS.includes(origen) || esLocal);
  return {
    "Access-Control-Allow-Origin": permitido ? origen : ORIGENES_PERMITIDOS[0],
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    // El navegador debe cachear por origen, no servir a uno la respuesta del otro.
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const cors = cabecerasCors(req.headers.get("Origin"));
  const jsonHeaders = { "Content-Type": "application/json", ...cors };

  // Petición de permiso previa del navegador: se contesta y ya está.
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  // Todo lo de aquí abajo puede fallar de formas que no se controlan una
  // a una (Stripe caído, clave mal puesta, timeout de red...). Sin este
  // try/catch, una excepción no capturada hace que Deno devuelva su
  // propio error genérico SIN las cabeceras CORS de arriba — y entonces
  // el navegador lo reporta como "bloqueado por CORS", escondiendo cuál
  // era el fallo de verdad. Pasó de verdad: el pago fallaba en Vercel/
  // producción con ese mensaje engañoso.
  try {
    return await manejarPago(req, jsonHeaders);
  } catch (err) {
    console.error("Error no controlado en crear-sesion-pago:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error inesperado" }),
      { status: 500, headers: jsonHeaders },
    );
  }
});

async function manejarPago(req: Request, jsonHeaders: Record<string, string>): Promise<Response> {
  const authHeader = req.headers.get("Authorization") ?? "";

  // Cliente "en nombre del usuario que llama": las políticas RLS de la
  // Tarea 1 deciden qué puede leer, no hace falta comprobarlo a mano aquí.
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Sesión inválida" }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  let body: { reserva_ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Cuerpo inválido" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const idsPedidos = Array.isArray(body.reserva_ids)
    ? [...new Set(body.reserva_ids.filter((id) => typeof id === "string" && id))]
    : [];

  if (idsPedidos.length === 0) {
    return new Response(JSON.stringify({ error: "Falta reserva_ids" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const { data: filas, error: filasError } = await sb
    .from("reservas")
    .select("id, producto, estado, mercado, moneda")
    .in("id", idsPedidos);

  if (filasError) {
    return new Response(JSON.stringify({ error: "No se pudo leer el pedido" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  // RLS ya filtra a "solo mis filas": si falta alguna, o no es del usuario
  // que llama, o no existe. Cualquiera de los dos casos es un pedido
  // incompleto — se rechaza entero en vez de cobrar solo una parte.
  if (!filas || filas.length !== idsPedidos.length) {
    return new Response(JSON.stringify({ error: "Pedido no encontrado" }), {
      status: 404,
      headers: jsonHeaders,
    });
  }

  const filaNoPendiente = filas.find((f) => f.estado !== "pendiente_pago");
  if (filaNoPendiente) {
    return new Response(
      JSON.stringify({ error: "Alguna pieza de este pedido ya no está pendiente de pago" }),
      { status: 409, headers: jsonHeaders },
    );
  }

  const filaProductoInvalido = filas.find((f) => !PRODUCTOS_VALIDOS.includes(f.producto));
  if (filaProductoInvalido) {
    return new Response(JSON.stringify({ error: "Producto desconocido" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  // Mercado del pedido. Todas las piezas de una misma compra tienen que
  // ir en el mismo mercado: si no, Stripe no podría cobrarlas juntas
  // (una sesión = una moneda). Si llegan mezcladas, se rechaza.
  const mercados = [...new Set(filas.map((f) => mercadoValido(f.mercado)))];
  if (mercados.length > 1) {
    return new Response(
      JSON.stringify({ error: "El pedido mezcla varios países: vacía el carrito y vuelve a añadirlo" }),
      { status: 400, headers: jsonHeaders },
    );
  }
  const mercado = mercados[0];

  // Precio real de cada pieza, SIEMPRE recalculado aquí a partir del
  // producto y el mercado — nunca del precio que mandó el navegador. Si
  // alguien edita el precio desde DevTools, esto lo ignora.
  const lineas = filas.map((f) => ({
    id: f.id,
    producto: f.producto,
    precio: precioDe(f.producto, mercado),
  }));

  const lineaSinPrecio = lineas.find((l) => !l.precio);
  if (lineaSinPrecio) {
    return new Response(
      JSON.stringify({ error: "Alguna pieza de este pedido todavía no tiene precio" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  // Una sesión de Stripe = una moneda; aquí ya está garantizado que todas
  // las líneas comparten mercado, así que basta con la de la primera.
  const moneda = lineas[0].precio!.moneda;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineas.map((l) => ({
      price_data: {
        currency: moneda.toLowerCase(),
        // Las monedas sin decimales (COP, CLP, ARS) van en unidades, no
        // en céntimos: si no, Stripe cobraría cien veces de más.
        unit_amount: importeStripe(l.precio!.importe, moneda),
        product_data: { name: nombreProducto(l.producto) },
      },
      quantity: 1,
    })),
    success_url: `${SITE_URL}/comprar.html?pago=exito&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/comprar.html?pago=cancelado`,
  });

  // Una fila puede tener un precio distinto de otra (piezas distintas), así
  // que no vale un único UPDATE con un precio compartido: se actualiza una
  // a una, cada una con el suyo. Mismo número de filas que de piezas
  // (2-3 piezas en un pedido normal), así que el coste real es mínimo.
  for (const l of lineas) {
    const { error: updateError } = await sb
      .from("reservas")
      .update({
        stripe_session_id: session.id,
        precio_pagado: l.precio!.importe,
        mercado: l.precio!.mercado,
        moneda: l.precio!.moneda,
      })
      .eq("id", l.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "No se pudo preparar el pago" }),
        { status: 500, headers: jsonHeaders },
      );
    }
  }

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: jsonHeaders,
  });
}

function nombreProducto(id: string): string {
  const nombres: Record<string, string> = {
    collar_esencial: "Collar Esencia",
    pulsera_vinculo: "Pulsera Dos Almas",
    pulsera_nombre: "Pulsera Mi Cielo",
    brazalete_mensaje: "Brazalete Eterno",
    collar_flor_natal: "Collar Destino",
    kit_pedacito_nosotros: "Kit Pedacito de Nosotros",
    kit_mi_consentida: "Kit Mi Consentida",
  };
  return nombres[id] ?? id;
}
