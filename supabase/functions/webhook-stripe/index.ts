// Recibe los avisos de Stripe cuando una sesión de Checkout se completa o
// expira. Nunca la llama el navegador: solo Stripe, con una firma que se
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

  if (evento.type === "checkout.session.completed" && (evento.data.object as Stripe.Checkout.Session).payment_status === "paid") {
    const session = evento.data.object as Stripe.Checkout.Session;
    const { data, error } = await sb
      .from("reservas")
      .update({ estado: "pagado" })
      .eq("stripe_session_id", session.id)
      .select("id");

    if (error || !data || data.length === 0) {
      console.error("No se pudo marcar como pagado:", error ?? "0 filas afectadas");
      return new Response("Error al actualizar", { status: 500 });
    }
  }

  if (evento.type === "checkout.session.expired") {
    const session = evento.data.object as Stripe.Checkout.Session;
    const { data, error } = await sb
      .from("reservas")
      .update({ estado: "pago_fallido" })
      .eq("stripe_session_id", session.id)
      .select("id");

    if (error || !data || data.length === 0) {
      console.error("No se pudo marcar como fallido:", error ?? "0 filas afectadas");
      return new Response("Error al actualizar", { status: 500 });
    }
  }

  return new Response(JSON.stringify({ recibido: true }), { status: 200 });
});
