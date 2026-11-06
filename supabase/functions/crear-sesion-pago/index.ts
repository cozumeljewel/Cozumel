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
//
// Seguridad del enlace fila ↔ pago (2026-10-01, migración v26): el webhook
// marca como pagadas TODAS las filas con el stripe_session_id del pago.
// Antes ese campo lo escribía el propio navegador (esta función usaba su
// sesión), así que alguien con conocimientos podía copiar el id de un pago
// suyo barato a otras filas, o cambiar el producto de una fila ya enviada a
// Stripe, y que se marcasen como pagadas sin pagarlas. Ahora:
//   · el navegador ya no puede poner ni cambiar stripe_session_id ni
//     pagado_en, ni tocar una fila que ya se mandó a Stripe (políticas v26);
//   · el UPDATE final lo hace esta función con la clave de servicio, y solo
//     si la fila sigue siendo del usuario, pendiente, sin pago enlazado y
//     con el mismo producto y país que se acaban de validar y cobrar.

import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";
import { PRODUCTOS_VALIDOS, precioDe, precioSinPromo, mercadoValido, importeStripe, NOMBRES_HOMBRE } from "../_shared/precios.ts";
import { PROMO_HOMBRE } from "../_shared/precios-hombre.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SITE_URL = "https://cozumeljewelry.es";

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
// Solo para enlazar las filas con el pago (ver arriba). Las lecturas y
// comprobaciones de "es tuyo" siguen yendo con la sesión del usuario.
const sbServicio = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

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

  let body: { reserva_ids?: string[]; origen?: string | null };
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
    .select("id, producto, estado, mercado, moneda, pais, email, stripe_session_id, meta_consentimiento")
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

  // Una fila ya enlazada con otro pago no se vuelve a enlazar: la web, al
  // reintentar, crea filas nuevas (no puede reutilizar estas). Se rechaza
  // ANTES de crear la sesión de Stripe para no dejar pagos huérfanos.
  const filaYaEnPago = filas.find((f) => f.stripe_session_id);
  if (filaYaEnPago) {
    return new Response(
      JSON.stringify({ error: "Este pedido ya se envió al pago. Vuelve a intentarlo desde el carrito" }),
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

  // País de envío: tiene que estar ACTIVO en paises_envio (v24). El
  // desplegable de la web ya solo enseña esos, pero aquí se comprueba de
  // verdad: un país pausado desde el panel no puede pagar aunque alguien
  // manipule la página.
  const { data: paisesActivos, error: paisesError } = await sb
    .from("paises_envio")
    .select("nombre, codigo")
    .eq("activo", true);
  if (paisesError || !paisesActivos) {
    return new Response(JSON.stringify({ error: "No se pudo comprobar el país de envío" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
  const nombresActivos = new Set(paisesActivos.map((p) => p.nombre));
  if (filas.some((f) => !nombresActivos.has((f.pais ?? "").trim()))) {
    return new Response(
      JSON.stringify({ error: "Todavía no enviamos a ese país. Elige otro país de envío" }),
      { status: 400, headers: jsonHeaders },
    );
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
  // 1/11/2026: el mercado (precio y moneda) lo decide SIEMPRE el país de
  // envío, no la moneda que la persona tenga elegida en la web: alguien con
  // la web en pesos mexicanos pagaba un envío a EE. UU. a precio de México.
  // Mismo reparto que PAIS_A_MERCADO en mercados.js: MX, US, CL, PE y AR
  // tienen el suyo; la eurozona, el de España; el resto, el de EE. UU.
  const EUROZONA = ["ES","DE","FR","IT","PT","NL","BE","AT","IE","FI","GR","SK","SI","LT","LV","EE","LU","MT","CY","HR"];
  const codigoEnvio = paisesActivos.find((p) => p.nombre === (filas[0].pais ?? "").trim())?.codigo ?? "";
  const mercado = ["MX", "US", "CL", "PE", "AR"].includes(codigoEnvio)
    ? codigoEnvio
    : EUROZONA.includes(codigoEnvio) ? "ES" : mercadoValido("US");

  // Precio real de cada pieza, SIEMPRE recalculado aquí a partir del
  // producto y el mercado — nunca del precio que mandó el navegador. Si
  // alguien edita el precio desde DevTools, esto lo ignora.
  const lineas = filas.map((f) => ({
    id: f.id,
    producto: f.producto,
    pais: f.pais,
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

  // 31/10: en Stripe cada pieza sale a su precio de siempre y la promoción
  // de lanzamiento como descuento aparte (cupón de un solo uso por la
  // diferencia exacta), así se ve el precio normal y lo que se ahorra. Lo
  // cobrado es igual que antes: la suma de los precios rebajados.
  const centimosNormal = lineas.reduce((t, l) => {
    const n = precioSinPromo(l.producto, mercado);
    return t + importeStripe((n ?? l.precio!).importe, moneda);
  }, 0);
  const centimosCobro = lineas.reduce((t, l) => t + importeStripe(l.precio!.importe, moneda), 0);
  const ahorro = centimosNormal - centimosCobro;
  let descuentos: { coupon: string }[] | undefined;
  if (ahorro > 0) {
    const cupon = await stripe.coupons.create({
      amount_off: ahorro,
      currency: moneda.toLowerCase(),
      duration: "once",
      max_redemptions: 1,
      name: `Semana de lanzamiento −${PROMO_HOMBRE?.descuento ?? 15} %`,
    });
    descuentos = [{ coupon: cupon.id }];
  }

  // 4/11/2026: el nombre y la dirección se piden aquí, en Stripe (con
  // Apple Pay / Google Pay llegan ya rellenos), y no en la web. Solo del
  // país de envío elegido, que es el que fija el precio. El webhook los
  // copia al pedido al pagar. Chile, Perú y Argentina: su documento para
  // la aduana, como campo propio.
  // Quien llega desde un anuncio (lo dice la web, ver vieneDeAnuncio en
  // script.js): sin el sorteo con Adri en la página de pago
  const desdeAnuncio = body.origen === "meta";
  const DOCUMENTO: Record<string, string> = { CL: "RUT", PE: "DNI o RUC", AR: "CUIT o CUIL (11 dígitos)" };
  const email = (filas[0] as { email?: string }).email?.trim();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ...(email && email.includes("@") ? { customer_email: email } : {}),
    ...(codigoEnvio ? {
      shipping_address_collection: {
        allowed_countries: [codigoEnvio as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry],
      },
    } : {}),
    ...(DOCUMENTO[codigoEnvio] ? {
      custom_fields: [{
        key: "documento",
        label: { type: "custom" as const, custom: DOCUMENTO[codigoEnvio] },
        type: "text" as const,
        optional: false,
      }],
    } : {}),
    ...(descuentos ? { discounts: descuentos } : {}),
    line_items: lineas.map((l) => ({
      price_data: {
        currency: moneda.toLowerCase(),
        // Las monedas sin decimales (COP, CLP, ARS) van en unidades, no
        // en céntimos: si no, Stripe cobraría cien veces de más.
        unit_amount: importeStripe((precioSinPromo(l.producto, mercado) ?? l.precio!).importe, moneda),
        // 31/10: bajo el nombre, el gancho del sorteo
        product_data: {
          name: nombreProducto(l.producto),
          // 6/11: a quien llega desde un anuncio (no conoce a Adri), sin sorteo
          ...(desdeAnuncio ? {} : { description: "✦ Con esta pieza entras en el sorteo de 5 videollamadas con Adri ✦" }),
        },
      },
      quantity: 1,
    })),
    // Junto al botón de pagar: el sorteo (mismo texto que en comprar.html)
    custom_text: {
      submit: {
        message: desdeAnuncio
          ? "✦ Envío gratis a todo el mundo ✦"
          : "✦ Con esta compra entras en el sorteo de 5 videollamadas con Adri. Solo para las 100 primeras compras ✦",
      },
    },
    success_url: `${SITE_URL}/comprar.html?pago=exito&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/comprar.html?pago=cancelado`,
  });

  // Una fila puede tener un precio distinto de otra (piezas distintas), así
  // que no vale un único UPDATE con un precio compartido: se actualiza una
  // a una, cada una con el suyo. Mismo número de filas que de piezas
  // (2-3 piezas en un pedido normal), así que el coste real es mínimo.
  //
  // Con la clave de servicio (el navegador ya no puede escribir este
  // campo), pero solo si la fila sigue exactamente como se validó: del
  // mismo usuario, pendiente, sin pago enlazado y con el mismo producto y
  // país. Si alguien la cambió mientras se creaba la sesión, no casa, no se
  // enlaza y no se devuelve el enlace de pago.
  // Conversions API de Meta (v42): la IP de quien paga, solo si aceptó
  // las cookies. La da la cabecera del proxy de Supabase.
  const ipCliente = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim().slice(0, 64) || null;
  const conMeta = new Set(filas.filter((f) => (f as { meta_consentimiento?: boolean }).meta_consentimiento).map((f) => f.id));

  for (const l of lineas) {
    const { data: enlazadas, error: updateError } = await sbServicio
      .from("reservas")
      .update({
        stripe_session_id: session.id,
        precio_pagado: l.precio!.importe,
        mercado: l.precio!.mercado,
        moneda: l.precio!.moneda,
        ...(conMeta.has(l.id) && ipCliente ? { meta_ip: ipCliente } : {}),
      })
      .eq("id", l.id)
      .eq("user_id", userData.user.id)
      .eq("estado", "pendiente_pago")
      .is("stripe_session_id", null)
      .eq("producto", l.producto)
      .eq("pais", l.pais)
      .select("id");

    if (updateError || !enlazadas || enlazadas.length !== 1) {
      console.error("No se pudo enlazar la fila con el pago:", l.id, updateError ?? "0 filas");
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
    kit_personalizado: "Kit a tu gusto",
  };
  return nombres[id] ?? NOMBRES_HOMBRE[id] ?? id;
}
