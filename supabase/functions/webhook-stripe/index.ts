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
    // 4/11/2026: el nombre y la dirección se piden en Stripe (ver
    // crear-sesion-pago). Se guardan en el mismo UPDATE que marca el pago,
    // para que la copia a "pedidos" y el email de confirmación ya los
    // lleven. Las sesiones de antes, sin dirección en Stripe, no cambian.
    const cambios: Record<string, string | null> = { estado: pagado ? "pagado" : "pago_fallido" };
    if (pagado) Object.assign(cambios, await datosEnvio(sesion.id));

    const { data, error } = await sb
      .from("reservas")
      .update(cambios)
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

// Estados de México: Stripe da el código y Emanco quiere el nombre.
const ESTADOS_MX: Record<string, string> = {
  AGU: "Aguascalientes", BCN: "Baja California", BCS: "Baja California Sur", CAM: "Campeche",
  CHP: "Chiapas", CHH: "Chihuahua", CMX: "Ciudad de México", DIF: "Ciudad de México", DF: "Ciudad de México",
  COA: "Coahuila", COL: "Colima", DUR: "Durango", GUA: "Guanajuato", GRO: "Guerrero", HID: "Hidalgo",
  JAL: "Jalisco", MEX: "Estado de México", MIC: "Michoacán", MOR: "Morelos", NAY: "Nayarit",
  NLE: "Nuevo León", OAX: "Oaxaca", PUE: "Puebla", QUE: "Querétaro", ROO: "Quintana Roo",
  SLP: "San Luis Potosí", SIN: "Sinaloa", SON: "Sonora", TAB: "Tabasco", TAM: "Tamaulipas",
  TLA: "Tlaxcala", VER: "Veracruz", YUC: "Yucatán", ZAC: "Zacatecas",
};

// Nombre, dirección y documento que la persona escribió en Stripe. Se
// relee la sesión (con la versión de la API de este código) en vez de
// fiarse del evento, que llega con la versión del endpoint.
async function datosEnvio(id: string): Promise<Record<string, string | null>> {
  try {
    const s = await stripe.checkout.sessions.retrieve(id);
    const envio = s.shipping_details;
    const dir = envio?.address;
    if (!dir || !dir.line1) return {};
    const nombreCompleto = (envio?.name || s.customer_details?.name || "").trim();
    const [nombre, ...resto] = nombreCompleto.split(/\s+/);
    const estado = dir.country === "MX" ? (ESTADOS_MX[(dir.state ?? "").toUpperCase()] ?? dir.state) : dir.state;
    const doc = (s.custom_fields ?? []).find((c) => c.key === "documento")?.text?.value?.trim();
    const etiqueta = ({ CL: "RUT", PE: "DNI/RUC", AR: "CUIT/CUIL" } as Record<string, string>)[dir.country ?? ""];
    const direccion = [dir.line1, dir.line2, dir.city, [estado, dir.postal_code].filter(Boolean).join(" ")]
      .filter(Boolean).join(", ");
    return {
      ...(nombre ? { nombre: nombre.slice(0, 80), apellidos: resto.join(" ") || null } : {}),
      direccion_envio: [direccion, doc && etiqueta ? `${etiqueta}: ${doc}` : ""].filter(Boolean).join(" · "),
      dir_calle: dir.line1,
      dir_piso: dir.line2 || null,
      dir_cp: dir.postal_code || null,
      dir_ciudad: dir.city || null,
      dir_provincia: estado || null,
    };
  } catch (err) {
    console.error("No se pudo leer la dirección de Stripe:", err);
    return {};
  }
}
