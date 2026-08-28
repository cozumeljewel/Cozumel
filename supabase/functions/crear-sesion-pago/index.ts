// Crea una sesión de Stripe Checkout para una fila de "reservas" que ya
// existe en estado 'pendiente_pago'. La llama el navegador, autenticado.
//
// Por qué el precio se relee aquí y no se confía en el que ya guardó el
// navegador en "precio_pagado": esta función es la última barrera antes de
// cobrar. Si alguien manipulase el JavaScript del formulario, el precio
// que Stripe termina cobrando sale de PRECIOS (Tarea 3), no de la fila.

import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";
import { PRECIOS, PRODUCTOS_VALIDOS } from "../_shared/precios.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SITE_URL = "https://cozumeljewelry.es";

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

const jsonHeaders = { "Content-Type": "application/json" };

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

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

  let body: { reserva_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Cuerpo inválido" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  if (!body.reserva_id) {
    return new Response(JSON.stringify({ error: "Falta reserva_id" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const { data: fila, error: filaError } = await sb
    .from("reservas")
    .select("id, producto, estado")
    .eq("id", body.reserva_id)
    .single();

  if (filaError || !fila) {
    return new Response(JSON.stringify({ error: "Pedido no encontrado" }), {
      status: 404,
      headers: jsonHeaders,
    });
  }

  if (fila.estado !== "pendiente_pago") {
    return new Response(
      JSON.stringify({ error: "Este pedido ya no está pendiente de pago" }),
      { status: 409, headers: jsonHeaders },
    );
  }

  if (!PRODUCTOS_VALIDOS.includes(fila.producto)) {
    return new Response(JSON.stringify({ error: "Producto desconocido" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const precio = PRECIOS[fila.producto];
  if (precio === null || precio === undefined) {
    return new Response(
      JSON.stringify({ error: "Esta pieza todavía no tiene precio" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: Math.round(precio * 100),
          product_data: { name: nombreProducto(fila.producto) },
        },
        quantity: 1,
      },
    ],
    success_url: `${SITE_URL}/comprar.html?pago=exito&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/comprar.html?pago=cancelado`,
  });

  const { error: updateError } = await sb
    .from("reservas")
    .update({ stripe_session_id: session.id, precio_pagado: precio })
    .eq("id", fila.id);

  if (updateError) {
    return new Response(
      JSON.stringify({ error: "No se pudo preparar el pago" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: jsonHeaders,
  });
});

function nombreProducto(id: string): string {
  const nombres: Record<string, string> = {
    collar_esencial: "Collar Esencia",
    pulsera_vinculo: "Pulsera Dos Almas",
    pulsera_nombre: "Pulsera Mi Cielo",
    brazalete_mensaje: "Brazalete Eterno",
    collar_flor_natal: "Collar Destino",
    kit_pedacito_nosotros: "Kit El Pedacito de Nosotros",
    kit_mi_consentida: "Kit Mi Consentida",
  };
  return nombres[id] ?? id;
}
