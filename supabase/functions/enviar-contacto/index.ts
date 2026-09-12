// Recibe el formulario de contacto de la web y lo reenvía por email a
// Cozumel (Resend). Antes de esto el formulario no enviaba nada: abría el
// cliente de correo del visitante, que en móviles sin correo configurado
// simplemente no hacía nada.
//
// Esta función la llama un visitante ANÓNIMO (nadie inicia sesión para
// escribir un mensaje), así que va con verify_jwt = false en config.toml.
// Eso significa que es públicamente invocable, y por eso todas las
// defensas están aquí dentro:
//
//   1. CORS: solo se puede llamar desde la web de Cozumel (frena al
//      navegador, no a curl — es la primera capa, no la única).
//   2. Honeypot: el formulario lleva un campo invisible ("web"). Una
//      persona nunca lo rellena; un bot que rellena todo, sí. Si viene
//      con algo, se descarta en silencio (devolviendo ok, para no
//      enseñarle al bot cómo evitarlo).
//   3. Validación estricta de longitudes y formato de email.
//   4. Límite por IP: 3 mensajes cada 10 minutos.
//
// El contenido lo escribe un desconocido, así que NUNCA se mete tal cual
// en el HTML del email: se escapa siempre (escaparHtml más abajo).

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const DESTINO = "cozumeljewel@gmail.com";
const REMITENTE = "Cozumel Jewelry <pedidos@cozumeljewelry.es>";

const ORIGENES_PERMITIDOS = [
  "https://cozumeljewelry.es",
  "https://www.cozumeljewelry.es",
];

function cabecerasCors(origen: string | null): Record<string, string> {
  const esLocal = origen !== null && /^http:\/\/localhost:\d+$/.test(origen);
  const permitido = origen !== null && (ORIGENES_PERMITIDOS.includes(origen) || esLocal);
  return {
    "Access-Control-Allow-Origin": permitido ? origen : ORIGENES_PERMITIDOS[0],
    "Access-Control-Allow-Headers": "authorization, content-type, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// Límite por IP. La memoria de una Edge Function no es eterna (el proceso
// se recicla), así que esto no es una muralla: es un freno barato contra
// el envío repetido, que es el caso real que molesta.
const VENTANA_MS = 10 * 60 * 1000;
const MAX_POR_VENTANA = 3;
const envios = new Map<string, number[]>();

function superaLimite(ip: string): boolean {
  const ahora = Date.now();
  const previos = (envios.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (previos.length >= MAX_POR_VENTANA) {
    envios.set(ip, previos);
    return true;
  }
  previos.push(ahora);
  envios.set(ip, previos);
  return false;
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  const cors = cabecerasCors(req.headers.get("Origin"));
  const jsonHeaders = { "Content-Type": "application/json", ...cors };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  if (!RESEND_API_KEY) {
    console.error("enviar-contacto: falta el secreto RESEND_API_KEY");
    return new Response(JSON.stringify({ error: "Configuración incompleta" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Petición no válida" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  // Honeypot: si viene relleno es un bot. Se contesta "ok" a propósito.
  if (typeof cuerpo.web === "string" && cuerpo.web.trim() !== "") {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders });
  }

  const nombre = typeof cuerpo.nombre === "string" ? cuerpo.nombre.trim() : "";
  const email = typeof cuerpo.email === "string" ? cuerpo.email.trim() : "";
  const mensaje = typeof cuerpo.mensaje === "string" ? cuerpo.mensaje.trim() : "";

  if (!nombre || nombre.length > 80) {
    return new Response(JSON.stringify({ error: "Nombre no válido" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }
  if (!email || email.length > 120 || !EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ error: "Email no válido" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }
  if (!mensaje || mensaje.length > 2000) {
    return new Response(JSON.stringify({ error: "Mensaje no válido" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "desconocida";
  if (superaLimite(ip)) {
    return new Response(
      JSON.stringify({ error: "Has enviado varios mensajes seguidos. Prueba de nuevo en unos minutos" }),
      { status: 429, headers: jsonHeaders },
    );
  }

  const html =
    '<div style="font-family:Arial,sans-serif; max-width:520px; margin:0 auto; color:#14454A;">' +
    '<h2 style="font-size:18px;">Mensaje desde el formulario de contacto</h2>' +
    '<table style="width:100%; font-size:13.5px; line-height:1.9;">' +
    '<tr><td style="color:#4E9A9B; width:90px; vertical-align:top;">Nombre</td><td>' + escaparHtml(nombre) + "</td></tr>" +
    '<tr><td style="color:#4E9A9B; vertical-align:top;">Email</td><td>' + escaparHtml(email) + "</td></tr>" +
    "</table>" +
    '<div style="margin-top:16px; padding:14px 16px; background:#F2F8F8; border-left:2px solid #C6A664; white-space:pre-wrap; font-size:14px; line-height:1.7;">' +
    escaparHtml(mensaje) +
    "</div>" +
    '<p style="margin-top:18px; font-size:12px; color:#4A6B6E;">Responde a este email y le llegará directamente a quien escribió.</p>' +
    "</div>";

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: REMITENTE,
        to: [DESTINO],
        // Así, al pulsar "Responder" en Gmail, la respuesta va al visitante
        // y no a la dirección de envío de la web.
        reply_to: email,
        subject: `Contacto web · ${nombre}`,
        html,
      }),
    });

    if (!resp.ok) {
      console.error("enviar-contacto: Resend respondió", resp.status, await resp.text());
      return new Response(JSON.stringify({ error: "No se pudo enviar el mensaje" }), {
        status: 502,
        headers: jsonHeaders,
      });
    }
  } catch (err) {
    console.error("enviar-contacto:", err);
    return new Response(JSON.stringify({ error: "No se pudo enviar el mensaje" }), {
      status: 502,
      headers: jsonHeaders,
    });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders });
});
