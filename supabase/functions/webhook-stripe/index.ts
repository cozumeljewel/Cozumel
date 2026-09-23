// Recibe los avisos de Stripe cuando una sesión de Checkout se completa,
// expira o, en los pagos que tardan en confirmarse (PayPal), cuando el
// pago termina de confirmarse o de fallar. Nunca la llama el navegador: solo Stripe, con una firma que se
// verifica antes de tocar nada. Si la firma no verifica, se rechaza sin
// más, para que nadie pueda simular un aviso de pago falso.
//
// Usa la clave service_role porque tiene que escribir en una fila que no
// es "suya": la política de UPDATE normal exige sesión de usuario, y aquí
// no la hay, es Stripe quien llama.

import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Método no permitido", { status: 405 });
  }

  const firma = req.headers.get("stripe-signature");
  const cuerpoCrudo = await req.text();

  if (!firma) {
    return new Response("Falta la firma", { status: 400 });
  }

  let evento: Stripe.Event;
  try {
    evento = await stripe.webhooks.constructEventAsync(
      cuerpoCrudo,
      firma,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Firma de webhook inválida:", err);
    return new Response("Firma inválida", { status: 400 });
  }

  // Pago confirmado. Llega por dos caminos:
  //  · checkout.session.completed con payment_status "paid": la tarjeta,
  //    que se sabe al instante.
  //  · checkout.session.async_payment_succeeded: métodos que tardan en
  //    confirmarse (PayPal, a veces). En ese caso el "completed" llegó
  //    antes con payment_status "unpaid" y aquí no se hizo nada; este
  //    segundo aviso es el que de verdad dice que el dinero ha entrado.
  //    Sin él, el pedido se quedaría en "pendiente de pago" para siempre.
  const sesion = evento.data.object as Stripe.Checkout.Session;
  const pagado =
    (evento.type === "checkout.session.completed" && sesion.payment_status === "paid") ||
    evento.type === "checkout.session.async_payment_succeeded";

  // Sin pagar: la sesión caducó, o el pago en proceso terminó fallando.
  const fallido =
    evento.type === "checkout.session.expired" ||
    evento.type === "checkout.session.async_payment_failed";

  if (pagado || fallido) {
    // Un pedido con varias piezas es varias filas que comparten este mismo
    // stripe_session_id (ver crear-sesion-pago): este UPDATE con .eq() ya
    // marca TODAS las que coincidan, no solo una.
    const { data, error } = await sb
      .from("reservas")
      .update({ estado: pagado ? "pagado" : "pago_fallido" })
      .eq("stripe_session_id", sesion.id)
      .select("id");

    if (error || !data || data.length === 0) {
      console.error(
        pagado ? "No se pudo marcar como pagado:" : "No se pudo marcar como fallido:",
        error ?? "0 filas afectadas",
      );
      return new Response("Error al actualizar", { status: 500 });
    }
  }

  return new Response(JSON.stringify({ recibido: true }), { status: 200 });
});
