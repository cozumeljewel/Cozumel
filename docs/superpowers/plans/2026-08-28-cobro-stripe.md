# Cobro real con Stripe — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el sitio deje de reservar gratis y cobre de verdad con Stripe Checkout: `reservar.html` pasa a `comprar.html`, la fila se crea en Supabase como `pendiente_pago`, dos Edge Functions crean la sesión de pago y confirman el cobro por webhook, y el email de "pedido recibido" se dispara solo cuando el pago está confirmado.

**Architecture:** El navegador sigue insertando en Supabase (RLS exige `estado = 'pendiente_pago'`), pero ya no basta con eso: llama a la Edge Function `crear-sesion-pago`, que relee el precio en el servidor y crea la sesión de Stripe Checkout. El navegador redirige a Stripe. Stripe llama a la Edge Function `webhook-stripe` (firma verificada) cuando el pago se confirma o falla, y esa función escribe `estado = 'pagado'` o `'pago_fallido'` con la clave `service_role`. Un trigger de Postgres dispara el email (cliente + negocio) solo cuando `estado` pasa a `pagado`. La página `comprar.html`, al volver de Stripe, no confía en la URL: sondea la fila hasta verla `pagado`.

**Tech Stack:** HTML/CSS/JS vanilla (sin framework), `@supabase/supabase-js@2` (CDN, ya cargado), Supabase Edge Functions (Deno + `npm:stripe`), Postgres + `pg_net` para el email vía Resend, Stripe Checkout (modo `payment`, alojado).

## Global Constraints

- **Nada de emoticonos** en la interfaz ni en los emails. Iconos SVG de línea si hacen falta.
- **Nada de rayas (—)** en los textos. Dos puntos, comas o paréntesis. Punto medio (·) en títulos de pestaña.
- **Nada de puntos finales** en textos de interfaz (títulos, párrafos cortos, botones, avisos). Los emails son texto corrido y sí llevan puntuación normal completa.
- **Todo `textContent`, nunca `innerHTML`** con datos que no sean literales fijos en el código.
- **`deploy/` es lo único que se sube a Netlify.** Cada archivo de sitio tocado en la raíz se copia también a `deploy/` al terminar la tarea que lo modifica. Los `.sql`, los `.md` de documentación y `supabase/` (las Edge Functions se despliegan con la CLI, no se sirven como archivos estáticos) **no** se copian a `deploy/`.
- **Sin framework de tests en este proyecto.** "Verificar" significa: `node --check` para sintaxis JS, `deno check` (si está instalado; si no, revisión visual cuidadosa) para las Edge Functions, comprobación por navegador (Browser pane) para comportamiento, lectura visual para HTML/CSS/SQL. No hay `pytest`.
- **Cada tarea termina con un commit de git**, después de sincronizar a `deploy/` (cuando la tarea toque archivos de sitio). Mensaje breve en español, en el mismo tono que los commits ya existentes del repo (`git log --oneline` para ver el estilo).
- **Nunca subir** `media_kit_adriana_carballo_2026.pdf`, ningún `.sql`, ni los bocetos de diseño (`logo-preview.html`, `direccion-artistica.html`, `landing-preview.html`, `birthstone-preview.html`, `style-preview.html`).
- **Precios en `null`.** El código debe funcionar hoy con todos los precios en `null` (mostrando "Precio pendiente de confirmar" y el botón desactivado) y sin ningún cambio de código cuando el cliente los rellene en `productos.js`.
- **Ningún renombrado de tabla, columna, id de producto, ids/clases HTML o funciones de `script.js` que ya existen**, salvo los que el diseño pide explícitamente (el archivo `reservar.html` a `comprar.html`, el copy visible). Cambiar nombres internos sin necesidad solo añade riesgo de romper referencias existentes.

---

## Task 1: Migración de Supabase (columnas, políticas, trigger de email)

**Files:**
- Create: `supabase-migracion-v7.sql`
- Modify: `ESTADO-DEL-PROYECTO.md` (sección 6 y sección 8)

**Interfaces:**
- Produces: `public.reservas` gana `precio_pagado numeric` y `stripe_session_id text`. La política de INSERT exige `estado = 'pendiente_pago'`. Nueva política de SELECT (`user_id = auth.uid()`). Función `notificar_pedido_pagado()` + trigger `after update of estado`. Las tareas 4 y 5 (Edge Functions) dependen de que estas columnas y políticas existan; la Tarea 6 (`comprar.html`) depende de poder hacer `select` sobre su propia fila.
- Consumes: nada de tareas anteriores.

- [ ] **Step 1: Escribir la migración**

Crear `supabase-migracion-v7.sql` en la raíz del proyecto:

```sql
-- ============================================================
-- MIGRACIÓN v7 · cobro real con Stripe
--
-- Pega esto en el SQL Editor de Supabase y pulsa Run.
-- A partir de aquí:
--   - Insertar en "reservas" desde el navegador exige estado = 'pendiente_pago'
--     (antes exigía estado = 'reserva').
--   - Cada persona puede LEER sus propias filas (antes no había SELECT).
--   - El email de "pedido recibido" ya no se dispara al crear la fila, se
--     dispara cuando estado pasa a 'pagado' (lo escribe la función
--     webhook-stripe con la clave service_role, nunca el navegador).
-- ============================================================

-- ---- Columnas nuevas ----
alter table public.reservas
  add column if not exists precio_pagado numeric,
  add column if not exists stripe_session_id text;

-- ---- Política de INSERT (sustituye a la de v6) ----
drop policy if exists "usuarios autenticados insertan sus reservas" on public.reservas;

create policy "usuarios autenticados insertan sus reservas"
  on public.reservas for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and producto in (
      'collar_esencial', 'pulsera_vinculo', 'pulsera_nombre',
      'brazalete_mensaje', 'collar_flor_natal',
      'kit_pedacito_nosotros', 'kit_mi_consentida'
    )
    and fuente = 'adri_story'
    and estado = 'pendiente_pago'
    and consentimiento = true
  );

-- ---- Política de SELECT (nueva) ----
-- La necesita comprar.html para sondear si su fila ya pasó a 'pagado'.
drop policy if exists "usuarios autenticados leen sus reservas" on public.reservas;

create policy "usuarios autenticados leen sus reservas"
  on public.reservas for select
  to authenticated
  using (user_id = auth.uid());

-- ---- Función que envía los dos emails, vía Resend con pg_net ----
-- Se ejecuta con los privilegios del propietario de la función (definer),
-- así puede leer app.settings.resend_api_key aunque quien dispara el
-- trigger sea la política de UPDATE de la clave service_role.
create or replace function public.notificar_pedido_pagado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resend_key text := current_setting('app.settings.resend_api_key', true);
  nombre_producto text;
  importe_texto text;
begin
  if resend_key is null or resend_key = '' then
    -- Sin la clave configurada (antes de completar la guía de configuración
    -- manual) no se intenta llamar a Resend: se deja constancia en los logs
    -- de Postgres y se sigue, para no bloquear el UPDATE que sí importa
    -- (marcar el pedido como pagado).
    raise warning 'notificar_pedido_pagado: app.settings.resend_api_key no está configurada, no se envían emails';
    return new;
  end if;

  nombre_producto := case new.producto
    when 'collar_esencial'        then 'Collar Esencia'
    when 'pulsera_vinculo'        then 'Pulsera Dos Almas'
    when 'pulsera_nombre'         then 'Pulsera Mi Cielo'
    when 'brazalete_mensaje'      then 'Brazalete Eterno'
    when 'collar_flor_natal'      then 'Collar Destino'
    when 'kit_pedacito_nosotros'  then 'Kit El Pedacito de Nosotros'
    when 'kit_mi_consentida'      then 'Kit Mi Consentida'
    else new.producto
  end;

  importe_texto := trim(to_char(new.precio_pagado, '999999999D99')) || ' €';

  -- ---- Email al cliente ----
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Cozumel Jewelry <pedidos@cozumeljewelry.es>',
      'to', array[new.email],
      'subject', 'Hemos recibido tu pago · Cozumel Jewelry',
      'html',
      '<div style="font-family:Arial,sans-serif; max-width:480px; margin:0 auto; color:#14454A;">' ||
      '<div style="background:#0B2E33; padding:24px; text-align:center;">' ||
      '<img src="https://cozumeljewelry.es/img/email-logo.png" alt="Cozumel Jewelry" width="220" style="max-width:70%;">' ||
      '</div>' ||
      '<div style="padding:28px 24px;">' ||
      '<h1 style="font-size:20px; color:#14454A; margin:0 0 12px;">Hemos recibido tu pago</h1>' ||
      '<p style="font-size:14px; line-height:1.6; margin:0 0 16px;">Hola ' || new.nombre || ', tu pedido ya está confirmado. En cuanto lo tengamos listo, te lo enviamos a la dirección que nos diste.</p>' ||
      '<table style="width:100%; font-size:13.5px; line-height:1.8; border-top:1px solid #E3EFF1; border-bottom:1px solid #E3EFF1; margin:16px 0; padding:8px 0;">' ||
      '<tr><td style="color:#4E9A9B;">Pieza</td><td style="text-align:right;">' || nombre_producto || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Importe pagado</td><td style="text-align:right;">' || importe_texto || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Envío a</td><td style="text-align:right;">' || new.direccion_envio || '</td></tr>' ||
      '</table>' ||
      '<p style="font-size:12.5px; line-height:1.6; color:#4E9A9B; margin:0;">Cozumel, somos un pedacito de lo que regalamos</p>' ||
      '</div></div>'
    )
  );

  -- ---- Email al negocio ----
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Cozumel Jewelry <pedidos@cozumeljewelry.es>',
      'to', array['cozumeljewel@gmail.com'],
      'subject', 'Pedido pagado: ' || nombre_producto,
      'html',
      '<div style="font-family:Arial,sans-serif; max-width:520px; margin:0 auto; color:#14454A;">' ||
      '<h2 style="font-size:18px;">Nuevo pedido pagado</h2>' ||
      '<table style="width:100%; font-size:13.5px; line-height:1.9;">' ||
      '<tr><td style="color:#4E9A9B; width:140px;">Pieza</td><td>' || nombre_producto || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Importe cobrado</td><td>' || importe_texto || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Cliente</td><td>' || new.nombre || ' ' || new.apellidos || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Email</td><td>' || new.email || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">WhatsApp</td><td>' || new.whatsapp || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">País</td><td>' || new.pais || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Dirección</td><td>' || new.direccion_envio || '</td></tr>' ||
      '<tr><td style="color:#4E9A9B;">Personalización</td><td>' || coalesce(new.personalizacion::text, 'ninguna') || '</td></tr>' ||
      '</table></div>'
    )
  );

  return new;
end;
$$;

drop trigger if exists notificar_pedido_pagado on public.reservas;

create trigger notificar_pedido_pagado
  after update of estado on public.reservas
  for each row
  when (new.estado = 'pagado' and old.estado is distinct from 'pagado')
  execute function public.notificar_pedido_pagado();

-- ============================================================
-- Nota: app.settings.resend_api_key se configura con
--   alter database postgres set app.settings.resend_api_key = 'la_clave';
-- Paso manual, documentado en configurar-stripe.md. Sin esa clave, los
-- pedidos se siguen marcando 'pagado' correctamente, solo que sin email.
-- ============================================================
```

- [ ] **Step 2: Comprobar el SQL a simple vista**

No se puede ejecutar desde aquí (la clave `anon` no tiene permiso de DDL).
Revisar a ojo:
- Los 7 ids de producto en la política de INSERT y en el `case` de
  `notificar_pedido_pagado()` coinciden con `productos.js`:

```bash
grep "id: '" productos.js
```

Debe salir exactamente: `collar_esencial`, `pulsera_vinculo`,
`pulsera_nombre`, `brazalete_mensaje`, `collar_flor_natal`,
`kit_pedacito_nosotros`, `kit_mi_consentida`.
- `drop policy if exists "usuarios autenticados insertan sus reservas"` usa
  el mismo nombre que creó `supabase-migracion-v6.sql`, para no dejar dos
  políticas activas.

- [ ] **Step 3: Actualizar el documento de estado**

En `ESTADO-DEL-PROYECTO.md`, sección 6 ("Migraciones"), añadir bajo el
listado existente:

```markdown
- **⚠️ `supabase-migracion-v7.sql` NO se ha ejecutado.** Añade
  `precio_pagado` y `stripe_session_id`, cambia la política de INSERT a
  `estado = 'pendiente_pago'`, añade una política de SELECT (cada quien lee
  sus propias filas) y mueve el disparador del email de "crear la fila" a
  "pasar a `estado = 'pagado'`". Sin esta migración el flujo de compra con
  Stripe no puede guardar nada.
```

En la sección 1 ("Qué es esto"), sustituir el párrafo que dice "No es una
tienda. No hay pagos ni Stripe..." por:

```markdown
**Es una tienda real.** El sitio cobra con Stripe Checkout. Los precios
todavía no están definidos (ver sección 8), pero toda la infraestructura de
cobro ya funciona: en cuanto se rellenen en `productos.js`, el sitio
empieza a vender sin más cambios de código.
```

- [ ] **Step 4: Sincronizar**

`supabase-migracion-v7.sql` **no va a `deploy/`** (ni los `.sql` ni
`ESTADO-DEL-PROYECTO.md` se suben). No hace falta copiar nada.

- [ ] **Step 5: Commit**

```bash
git add supabase-migracion-v7.sql ESTADO-DEL-PROYECTO.md
git commit -m "Añade la migración v7: cobro con Stripe (pendiente_pago/pagado/pago_fallido)"
```

---

## Task 2: Guía de configuración manual (Stripe + Supabase CLI + secretos)

**Files:**
- Create: `configurar-stripe.md`

**Interfaces:**
- Produces: ninguna interfaz de código. Es la referencia que el cliente
  sigue para activar Stripe de verdad. Sin completarla, las Edge Functions
  de las tareas 4 y 5 estarán desplegadas pero no funcionarán (sin las
  claves secretas, ni el webhook apuntando a la URL correcta).

- [ ] **Step 1: Escribir la guía**

Crear `configurar-stripe.md` en la raíz del proyecto:

```markdown
# Activar el cobro real con Stripe · pasos manuales

Esto hay que hacerlo una sola vez, con tu propia cuenta. Nadie más puede
hacerlo por ti: pide acceso a Stripe y al dashboard de Supabase del
proyecto.

## 1. Instalar la CLI de Supabase

Es la primera herramienta de desarrollo que usa este proyecto. Solo hace
falta para desplegar las dos funciones de servidor (Edge Functions) y para
guardar sus secretos.

1. Instala Node.js si no lo tienes (https://nodejs.org, versión LTS).
2. En una terminal, instala la CLI:
   ```bash
   npm install -g supabase
   ```
3. Inicia sesión (abre el navegador):
   ```bash
   supabase login
   ```
4. Enlaza este proyecto local con el proyecto de Supabase real:
   ```bash
   cd "ruta/a/ADRI 2"
   supabase link --project-ref ddcrkglgdbasbxanbjkc
   ```
   Te pedirá la contraseña de la base de datos (la misma que usaste al
   crear el proyecto en Supabase; si no la recuerdas, se puede resetear
   desde Project Settings → Database).

## 2. Crear la cuenta de Stripe

1. Entra en https://dashboard.stripe.com/register y crea la cuenta con los
   datos del negocio.
2. Completa la activación de la cuenta (datos fiscales y bancarios) para
   poder cobrar de verdad. Mientras no esté activada, Stripe solo deja
   operar en modo de prueba, que es exactamente lo que se usa para probar
   el flujo antes de activarla (ver el paso 5).
3. Ve a **Desarrolladores → Claves de API**. Ahí están la clave publicable
   y la clave secreta, en dos versiones: **de prueba** (empiezan por
   `pk_test_` / `sk_test_`) y **real** (`pk_live_` / `sk_live_`). Esta
   integración solo necesita la clave **secreta** (`sk_...`), nunca la
   publicable: todo el pago ocurre en la página alojada de Stripe, no en
   este sitio.

## 3. Desplegar las dos funciones

Desde la raíz del proyecto, con la CLI ya enlazada:

```bash
supabase functions deploy crear-sesion-pago
supabase functions deploy webhook-stripe --no-verify-jwt
```

`--no-verify-jwt` en `webhook-stripe` es necesario porque la llama Stripe,
no un usuario con sesión de Supabase: la función verifica la petición por
su cuenta, con la firma de Stripe (ver el código de la función).

## 4. Guardar los secretos

Con la clave secreta de Stripe (empieza en modo prueba, `sk_test_...`):

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
```

El "signing secret" del webhook se obtiene en el paso 5, después de crear
el webhook en el panel de Stripe.

## 5. Configurar el webhook en Stripe

1. En el dashboard de Stripe, ve a **Desarrolladores → Webhooks → Añadir
   endpoint**.
2. URL del endpoint:
   `https://ddcrkglgdbasbxanbjkc.supabase.co/functions/v1/webhook-stripe`
3. Eventos a escuchar: marca `checkout.session.completed` y
   `checkout.session.expired`.
4. Guarda. Stripe te muestra un **Signing secret** (empieza por `whsec_`).
   Cópialo y guárdalo como secreto de la función:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
   ```

## 6. El email de "pedido recibido" (opcional, pero recomendado)

Si quieres que salgan los dos emails automáticos (al cliente y a
`cozumeljewel@gmail.com`) en cuanto se confirme un pago:

1. Crea una cuenta en https://resend.com y verifica el dominio
   `cozumeljewelry.es` (Resend te da los registros DNS que hay que añadir
   donde esté gestionado el dominio).
2. Genera una API key en Resend.
3. En el **SQL Editor** de Supabase, ejecuta (sustituyendo la clave real):
   ```sql
   alter database postgres set app.settings.resend_api_key = 'la_clave_de_resend';
   ```
4. Sin este paso, el pago se sigue confirmando y la fila pasa a `pagado`
   igual: solo se quedan sin enviar los dos emails. Se puede completar más
   adelante sin volver a tocar código.

## 7. Pasar a cobros reales (cuando el cliente lo decida)

Todo lo anterior funciona en modo de prueba. Para cobrar de verdad:

1. Activa la cuenta de Stripe del todo (paso 2.2, si no lo estaba ya).
2. En el dashboard de Stripe, cambia el interruptor de arriba a la derecha
   de "Modo de prueba" a apagado.
3. Repite el paso 2.3 con las claves **reales** (`sk_live_...`) y el paso 5
   con un webhook nuevo apuntando a la misma URL, pero creado en modo real
   (los webhooks de prueba y reales son independientes en Stripe).
4. Actualiza los secretos:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
   ```

## 8. Cómo saber si ya está listo

Con las claves de prueba puestas: entra en el sitio, elige una pieza con
precio (necesita que `productos.js` tenga al menos un precio relleno,
punto 3 de la sección 8 de `ESTADO-DEL-PROYECTO.md`), rellena el
formulario de `comprar.html` y pulsa "Pagar y comprar". Debe llevarte a
una página de Stripe con una tarjeta de prueba (número
`4242 4242 4242 4242`, cualquier fecha futura y CVC). Si todo funciona,
vuelve al sitio con "Confirmando tu pago" y termina en "Listo".
```

- [ ] **Step 2: Confirmar que la URL del webhook es correcta**

```bash
grep SUPABASE_URL supabase-config.js
```

Debe coincidir con `https://ddcrkglgdbasbxanbjkc.supabase.co` (la URL del
webhook del paso 5 es esa misma más `/functions/v1/webhook-stripe`). Si
`supabase-config.js` cambió de proyecto, actualizar la guía antes de
continuar.

- [ ] **Step 3: Sincronizar**

`configurar-stripe.md` **no va a `deploy/`**: es documentación interna.

- [ ] **Step 4: Commit**

```bash
git add configurar-stripe.md
git commit -m "Documenta los pasos manuales para activar Stripe"
```

---

## Task 3: Catálogo de precios del lado del servidor

**Files:**
- Create: `supabase/functions/_shared/precios.ts`

**Interfaces:**
- Consumes: nada de tareas anteriores.
- Produces: `PRECIOS: Record<string, number | null>` y
  `PRODUCTOS_VALIDOS: string[]`, que la Tarea 4 (`crear-sesion-pago`)
  importa con `import { PRECIOS, PRODUCTOS_VALIDOS } from "../_shared/precios.ts"`.

- [ ] **Step 1: Escribir el catálogo**

Crear `supabase/functions/_shared/precios.ts`:

```typescript
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
  collar_esencial: null,
  pulsera_vinculo: null,
  pulsera_nombre: null,
  brazalete_mensaje: null,
  collar_flor_natal: null,
  kit_pedacito_nosotros: null,
  kit_mi_consentida: null,
};

export const PRODUCTOS_VALIDOS = Object.keys(PRECIOS);
```

- [ ] **Step 2: Comprobar que los ids coinciden con `productos.js`**

```bash
grep "id: '" productos.js
```

Comparar a ojo con las siete claves de `PRECIOS`: deben ser exactamente las
mismas, en cualquier orden.

- [ ] **Step 3: Sincronizar**

`supabase/` no se sube a `deploy/` (se despliega con la CLI de Supabase,
Tarea 2). No hace falta copiar nada.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/_shared/precios.ts
git commit -m "Añade el catálogo de precios del lado del servidor"
```

---

## Task 4: Edge Function `crear-sesion-pago`

**Files:**
- Create: `supabase/functions/crear-sesion-pago/index.ts`

**Interfaces:**
- Consumes: `PRECIOS`, `PRODUCTOS_VALIDOS` de la Tarea 3. Las columnas y
  políticas de la Tarea 1 (lee y actualiza `public.reservas`, exige la fila
  en `estado = 'pendiente_pago'` y del mismo `user_id` que llama). El
  secreto `STRIPE_SECRET_KEY` de la Tarea 2.
- Produces: endpoint HTTP `POST /functions/v1/crear-sesion-pago`, que
  recibe `{ reserva_id: string }` en el cuerpo con el token de sesión del
  usuario en `Authorization: Bearer <token>`, y devuelve
  `{ url: string }` (la URL de Stripe Checkout) o `{ error: string }` con
  código HTTP distinto de 200. La Tarea 7 (`script.js`) es quien la llama.

- [ ] **Step 1: Escribir la función**

Crear `supabase/functions/crear-sesion-pago/index.ts`:

```typescript
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
```

- [ ] **Step 2: Revisar la sintaxis**

Si hay Deno instalado localmente:

```bash
deno check supabase/functions/crear-sesion-pago/index.ts
```

Si no está instalado, revisión visual: confirmar que cada `{` tiene su `}`,
que los tres `return new Response(...)` de error usan `jsonHeaders`, y que
`fila.producto` se valida contra `PRODUCTOS_VALIDOS` antes de leer
`PRECIOS[fila.producto]`.

- [ ] **Step 3: Desplegar**

Requiere que la Tarea 2 (CLI enlazada, secretos puestos) esté hecha:

```bash
supabase functions deploy crear-sesion-pago
```

- [ ] **Step 4: Sincronizar**

`supabase/` no se sube a `deploy/`. No hace falta copiar nada.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/crear-sesion-pago/index.ts
git commit -m "Añade la Edge Function crear-sesion-pago"
```

---

## Task 5: Edge Function `webhook-stripe`

**Files:**
- Create: `supabase/functions/webhook-stripe/index.ts`

**Interfaces:**
- Consumes: las columnas de la Tarea 1 (`stripe_session_id`, `estado`).
  Los secretos `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` de la Tarea 2.
  Necesita la clave `service_role` de Supabase, disponible siempre como
  variable de entorno `SUPABASE_SERVICE_ROLE_KEY` dentro de cualquier Edge
  Function (no hace falta configurarla a mano).
- Produces: endpoint HTTP `POST /functions/v1/webhook-stripe`, llamado
  únicamente por Stripe. No lo consume ningún otro archivo de este plan
  directamente: cierra el flujo escribiendo en `reservas`, que sí
  observan la Tarea 1 (el trigger de email) y la Tarea 6/7 (el sondeo de
  `comprar.html`).

- [ ] **Step 1: Escribir la función**

Crear `supabase/functions/webhook-stripe/index.ts`:

```typescript
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

  if (evento.type === "checkout.session.completed") {
    const session = evento.data.object as Stripe.Checkout.Session;
    const { error } = await sb
      .from("reservas")
      .update({ estado: "pagado" })
      .eq("stripe_session_id", session.id);

    if (error) {
      console.error("No se pudo marcar como pagado:", error);
      return new Response("Error al actualizar", { status: 500 });
    }
  }

  if (evento.type === "checkout.session.expired") {
    const session = evento.data.object as Stripe.Checkout.Session;
    const { error } = await sb
      .from("reservas")
      .update({ estado: "pago_fallido" })
      .eq("stripe_session_id", session.id);

    if (error) {
      console.error("No se pudo marcar como fallido:", error);
      return new Response("Error al actualizar", { status: 500 });
    }
  }

  return new Response(JSON.stringify({ recibido: true }), { status: 200 });
});
```

- [ ] **Step 2: Revisar la sintaxis**

```bash
deno check supabase/functions/webhook-stripe/index.ts
```

Si no hay Deno instalado, revisión visual: confirmar que
`constructEventAsync` se llama con el cuerpo **crudo** (`cuerpoCrudo`,
nunca `JSON.parse`d) porque la firma se calcula sobre los bytes exactos
recibidos.

- [ ] **Step 3: Desplegar**

```bash
supabase functions deploy webhook-stripe --no-verify-jwt
```

- [ ] **Step 4: Sincronizar**

`supabase/` no se sube a `deploy/`. No hace falta copiar nada.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/webhook-stripe/index.ts
git commit -m "Añade la Edge Function webhook-stripe"
```

---

## Task 6: `comprar.html` (reemplaza a `reservar.html`)

**Files:**
- Create: `comprar.html` (a partir del contenido actual de `reservar.html`)
- Delete: `reservar.html`
- Delete: `deploy/reservar.html`

**Interfaces:**
- Consumes: `login-gate`, `btn-login-google`, `btn-logout`, `reserva-form`
  y el resto de ids ya existentes en `reservar.html` (sin renombrar: el
  diseño solo pide cambiar el copy visible y el nombre del archivo, ver
  Global Constraints). Añade tres ids nuevos que la Tarea 7 usa:
  `pago-confirmando`, `pago-cancelado`, `btn-reintentar-pago`.
- Produces: la página en su nueva URL `comprar.html`. Las tareas 8 y 9
  (los enlaces de las otras 6 páginas) apuntan aquí.

- [ ] **Step 1: Crear `comprar.html`**

Crear `comprar.html` con el contenido íntegro de `reservar.html`, con estos
cambios de copy y de estructura:

Cabecera (líneas 6-23 del `reservar.html` original):

```html
<title>Compra · Cozumel Jewelry</title>
<meta name="description" content="Pago seguro con tarjeta, a través de Stripe. Envío incluido">
<meta name="theme-color" content="#14454A">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='12' fill='%2314454A'/%3E%3Cellipse cx='50' cy='50' rx='25' ry='31' fill='none' stroke='%23C6A664' stroke-width='5'/%3E%3Cpath d='M26,50 C36,36 64,36 74,50 C64,64 36,64 26,50 Z' fill='none' stroke='%23C6A664' stroke-width='5'/%3E%3Ccircle cx='50' cy='50' r='7' fill='%23C6A664'/%3E%3C/svg%3E">

<!-- Previsualizacion al compartir el enlace (Instagram, WhatsApp, etc.) -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="Cozumel">
<meta property="og:locale" content="es_ES">
<meta property="og:title" content="Compra tu joya · Cozumel Jewelry">
<meta property="og:description" content="Pago seguro con tarjeta, a través de Stripe. Envío incluido">
<meta property="og:image" content="https://cozumeljewelry.es/img/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Compra tu joya · Cozumel Jewelry">
<meta name="twitter:description" content="Pago seguro con tarjeta, a través de Stripe. Envío incluido">
<meta name="twitter:image" content="https://cozumeljewelry.es/img/og-image.png">
```

`data-page` del `<body>` (línea 33 del original):

```html
<body data-page="comprar">
```

Los cinco enlaces de navegación (dos en el header, dos en el footer, más
el propio `href="reservar.html"` que apunta a sí misma) pasan de:

```html
<a href="reservar.html">Reservar</a>
```

a:

```html
<a href="comprar.html">Comprar</a>
```

El bloque principal (líneas 84-165 del original) pasa de:

```html
  <section class="reserva">
    <div class="reserva-content" id="reserva-content">
      <p class="edicion-badge">Edición de lanzamiento · unidades limitadas</p>
      <p class="eyebrow">Último paso</p>
      <h2>Reserva la tuya</h2>
      <p class="reserva-sub">Gratis. Sin compromiso. Es la primera edición de la colección, y te contactamos en cuanto abramos los primeros pedidos</p>

      <div class="reserva-recap">
        <span class="recap-label">Vas a reservar</span>
```

a:

```html
  <section class="reserva">
    <div class="reserva-content" id="reserva-content">
      <p class="edicion-badge">Edición de lanzamiento · unidades limitadas</p>
      <p class="eyebrow">Último paso</p>
      <h2>Cómpratela</h2>
      <p class="reserva-sub">Pago seguro con tarjeta, a través de Stripe. Envío incluido</p>

      <div class="reserva-recap">
        <span class="recap-label">Vas a comprar</span>
```

El texto del botón de envío (línea 161 del original) pasa de:

```html
<button class="btn btn-primary btn-lg" type="submit" id="reserva-submit">Reservar mi joya, gratis</button>
```

a:

```html
<button class="btn btn-primary btn-lg" type="submit" id="reserva-submit">Pagar y comprar</button>
```

Justo debajo del botón, antes de `<p class="reserva-error"...`, añadir un
aviso para cuando la pieza elegida no tiene precio (lo activa la Tarea 7,
mismo patrón que ya usa `#sin-pieza`):

```html
        <p class="reserva-config-warning" id="sin-precio" hidden>
          Precio pendiente de confirmar
        </p>
```

El bloque de "Listo" (líneas 167-177 del original) pasa de:

```html
    <div class="reserva-done" id="reserva-done" hidden>
      <span class="done-ico" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M24 38 C24 38 8 28.5 8 18.5 C8 13 12.2 9.5 16.5 9.5 C20 9.5 22.7 11.6 24 14 C25.3 11.6 28 9.5 31.5 9.5 C35.8 9.5 40 13 40 18.5 C40 28.5 24 38 24 38 Z"/>
        </svg>
      </span>
      <h2>Listo</h2>
      <p>Hemos guardado tu reserva de la edición de lanzamiento</p>
      <p>Te contactaremos cuando abramos los primeros pedidos</p>
    </div>
  </section>
```

a (mismo bloque con el copy nuevo, más dos pantallas nuevas: "confirmando"
y "cancelado", hermanas de `reserva-done` dentro de `<section class="reserva">`):

```html
    <div class="reserva-done" id="reserva-done" hidden>
      <span class="done-ico" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M24 38 C24 38 8 28.5 8 18.5 C8 13 12.2 9.5 16.5 9.5 C20 9.5 22.7 11.6 24 14 C25.3 11.6 28 9.5 31.5 9.5 C35.8 9.5 40 13 40 18.5 C40 28.5 24 38 24 38 Z"/>
        </svg>
      </span>
      <h2>Listo</h2>
      <p>Hemos recibido tu pago de tu pieza de la edición de lanzamiento</p>
      <p>Te avisaremos por email en cuanto se envíe</p>
    </div>

    <!-- Vuelta desde Stripe con éxito: se muestra mientras se sondea si
         el webhook ya marcó la fila como pagada. script.js decide cuándo
         pasar a #reserva-done. -->
    <div class="pago-confirmando" id="pago-confirmando" hidden>
      <span class="spinner" aria-hidden="true"></span>
      <h2>Confirmando tu pago</h2>
      <p>Esto tarda solo unos segundos</p>
    </div>

    <!-- Vuelta desde Stripe cancelada. Los datos ya escritos siguen en
         sessionStorage, así que reintentar no obliga a rellenar todo de
         nuevo. -->
    <div class="pago-cancelado" id="pago-cancelado" hidden>
      <h2>Pago cancelado</h2>
      <p>No te hemos cobrado nada. Puedes intentarlo de nuevo cuando quieras</p>
      <button type="button" class="btn btn-primary" id="btn-reintentar-pago">Volver a intentarlo</button>
    </div>
  </section>
```

- [ ] **Step 2: Borrar `reservar.html`**

```bash
rm "reservar.html"
```

- [ ] **Step 3: Verificar visualmente**

Abrir `comprar.html` en un editor y comprobar: los cinco enlaces
`reservar.html`/`Reservar` ya no aparecen en ningún sitio del archivo
(`grep -n "reservar" comprar.html` debe salir vacío, en minúsculas o
mayúsculas), `pago-confirmando` y `pago-cancelado` son hermanos de
`reserva-done`, y `btn-reintentar-pago` no está dentro de ningún `<form>`.

```bash
grep -ni "reservar" comprar.html
```

Esperado: sin salida.

- [ ] **Step 4: Sincronizar**

```bash
cp "comprar.html" "deploy/comprar.html"
rm "deploy/reservar.html"
diff "comprar.html" "deploy/comprar.html"
```

El `diff` debe salir vacío.

- [ ] **Step 5: Commit**

```bash
git add comprar.html deploy/comprar.html reservar.html deploy/reservar.html
git commit -m "Reserva pasa a compra: comprar.html sustituye a reservar.html"
```

---

## Task 7: Estilos de las pantallas de confirmación y cancelación

**Files:**
- Modify: `style.css` (junto a `.reserva-done`, línea ~893)

**Interfaces:**
- Consumes: las clases `pago-confirmando`, `pago-cancelado`, `spinner`
  creadas en la Tarea 6.
- Produces: nada que otra tarea consuma.

- [ ] **Step 1: Añadir los estilos**

En `style.css`, justo después de la regla `.reserva-done p{...}` (línea
893, justo antes del comentario `/* ---------- 8. CONTACTO ---------- */`),
insertar:

```css
.pago-confirmando, .pago-cancelado{
  padding:70px 24px; text-align:center;
}
.pago-confirmando h2, .pago-cancelado h2{
  font-family:'Playfair Display'; font-weight:700; font-size:28px; color:var(--deep);
}
.pago-confirmando p, .pago-cancelado p{
  margin-top:8px; font-size:15px; color:var(--ink); max-width:36ch; margin-left:auto; margin-right:auto;
}
.pago-cancelado .btn{margin-top:20px;}

.spinner{
  display:block; width:36px; height:36px; margin:0 auto 16px;
  border:3px solid var(--line-2); border-top-color:var(--gold-deep); border-radius:50%;
  animation:girar .8s linear infinite;
}
@keyframes girar{ to{ transform:rotate(360deg); } }
```

- [ ] **Step 2: Comprobar sintaxis y que no hay reglas duplicadas**

```bash
node -e "require('fs').readFileSync('style.css','utf8')" && echo "leído sin error"
grep -c "^\.pago-confirmando" style.css
grep -c "^\.spinner{" style.css
```

Las dos últimas deben devolver `1`.

- [ ] **Step 3: Sincronizar**

```bash
cp "style.css" "deploy/style.css"
diff "style.css" "deploy/style.css"
```

Debe salir vacío.

- [ ] **Step 4: Commit**

```bash
git add style.css deploy/style.css
git commit -m "Añade los estilos de confirmando pago y pago cancelado"
```

---

## Task 8: Flujo de compra en `script.js` (crear sesión, redirigir, confirmar)

**Files:**
- Modify: `script.js:968-1108` (bloque `if (reservaForm) { ... }`, dentro
  de él solo cambian las líneas indicadas más abajo, no todo el bloque)

**Interfaces:**
- Consumes: la Edge Function `crear-sesion-pago` de la Tarea 4 (fetch a
  `${SUPABASE_URL}/functions/v1/crear-sesion-pago`). Los ids
  `sin-precio`, `pago-confirmando`, `pago-cancelado`, `btn-reintentar-pago`
  de la Tarea 6. `getProductoElegido()`, `getGrabado()`, `getSessionId()`,
  `trackEvent()` (ya existían, sin cambios).
- Produces: nada que otra tarea consuma; cierra el flujo del navegador.

- [ ] **Step 1: Añadir el aviso de "sin precio" al bloque de comprobación inicial**

El bloque actual (script.js:981-986) es:

```javascript
  // No se puede reservar sin haber elegido pieza
  const prodElegido = getProductoElegido();
  if (!prodElegido) {
    if (sinPiezaAviso) sinPiezaAviso.hidden = false;
    reservaSubmitBtn.disabled = true;
  }
```

Sustituir por:

```javascript
  // No se puede comprar sin haber elegido pieza, ni sin que tenga precio
  const sinPrecioAviso = document.getElementById('sin-precio');
  const prodElegido = getProductoElegido();
  if (!prodElegido) {
    if (sinPiezaAviso) sinPiezaAviso.hidden = false;
    reservaSubmitBtn.disabled = true;
  } else if (prodElegido.precio === null || prodElegido.precio === undefined) {
    if (sinPrecioAviso) sinPrecioAviso.hidden = false;
    reservaSubmitBtn.disabled = true;
  }
```

- [ ] **Step 2: Sustituir el envío del formulario**

El bloque actual (script.js:1050-1107) es:

```javascript
  reservaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideReservaError();

    const prod = getProductoElegido();
    if (!prod) {
      showReservaError('Elige primero una pieza en la colección');
      return;
    }
    if (!sb) {
      showReservaError('Ahora mismo no podemos guardar tu reserva. Inténtalo de nuevo en unos minutos');
      return;
    }
    if (!sesionActual) {
      // No debería pasar (el formulario está oculto sin sesión), pero
      // cubre el caso de una sesión que caduca mientras la persona tenía
      // la pestaña abierta.
      showReservaError('Tu sesión ha caducado. Vuelve a identificarte con Google');
      mostrarSegunSesion(null);
      return;
    }

    const payload = {
      user_id: sesionActual.user.id,
      nombre: reservaForm.nombre.value.trim(),
      apellidos: reservaForm.apellidos.value.trim(),
      email: reservaForm.email.value.trim(),
      whatsapp: `${prefijoSelect.value} ${reservaForm.whatsapp.value.trim()}`.trim(),
      pais: reservaForm.pais.value.trim(),
      direccion_envio: reservaForm.direccion_envio.value.trim(),
      personalizacion: getGrabado(),
      producto: prod.id,
      fuente: 'adri_story',
      estado: 'reserva',
      consentimiento: document.getElementById('r-consent').checked,
      session_id: getSessionId(),
    };

    reservaSubmitBtn.disabled = true;
    reservaSubmitBtn.textContent = 'Guardando...';

    const { error } = await sb.from('reservas').insert(payload);

    if (error) {
      console.error(error);
      reservaSubmitBtn.disabled = false;
      reservaSubmitBtn.textContent = 'Reservar mi joya, gratis';
      showReservaError('No se pudo guardar tu reserva. Inténtalo de nuevo');
      return;
    }

    trackEvent('reserva_completada', prod.id);

    document.getElementById('reserva-content').hidden = true;
    const done = document.getElementById('reserva-done');
    done.hidden = false;
    done.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
```

Sustituirlo entero por:

```javascript
  reservaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideReservaError();

    const prod = getProductoElegido();
    if (!prod) {
      showReservaError('Elige primero una pieza en la colección');
      return;
    }
    if (prod.precio === null || prod.precio === undefined) {
      showReservaError('Esta pieza todavía no tiene precio, no se puede comprar');
      return;
    }
    if (!sb) {
      showReservaError('Ahora mismo no podemos procesar tu compra. Inténtalo de nuevo en unos minutos');
      return;
    }
    if (!sesionActual) {
      // No debería pasar (el formulario está oculto sin sesión), pero
      // cubre el caso de una sesión que caduca mientras la persona tenía
      // la pestaña abierta.
      showReservaError('Tu sesión ha caducado. Vuelve a identificarte con Google');
      mostrarSegunSesion(null);
      return;
    }

    const payload = {
      user_id: sesionActual.user.id,
      nombre: reservaForm.nombre.value.trim(),
      apellidos: reservaForm.apellidos.value.trim(),
      email: reservaForm.email.value.trim(),
      whatsapp: `${prefijoSelect.value} ${reservaForm.whatsapp.value.trim()}`.trim(),
      pais: reservaForm.pais.value.trim(),
      direccion_envio: reservaForm.direccion_envio.value.trim(),
      personalizacion: getGrabado(),
      producto: prod.id,
      fuente: 'adri_story',
      estado: 'pendiente_pago',
      precio_pagado: prod.precio,
      consentimiento: document.getElementById('r-consent').checked,
      session_id: getSessionId(),
    };

    reservaSubmitBtn.disabled = true;
    reservaSubmitBtn.textContent = 'Guardando...';

    const { data: filaCreada, error } = await sb.from('reservas').insert(payload).select('id').single();

    if (error) {
      console.error(error);
      reservaSubmitBtn.disabled = false;
      reservaSubmitBtn.textContent = 'Pagar y comprar';
      showReservaError('No se pudo guardar tu pedido. Inténtalo de nuevo');
      return;
    }

    reservaSubmitBtn.textContent = 'Conectando con Stripe...';

    try {
      const { data: sesion } = await sb.auth.getSession();
      const token = sesion.session ? sesion.session.access_token : '';

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/crear-sesion-pago`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reserva_id: filaCreada.id }),
      });
      const resultado = await resp.json();

      if (!resp.ok || !resultado.url) {
        throw new Error(resultado.error || 'sin url de pago');
      }

      window.location.href = resultado.url;
    } catch (err) {
      console.error(err);
      reservaSubmitBtn.disabled = false;
      reservaSubmitBtn.textContent = 'Pagar y comprar';
      showReservaError('No se pudo conectar con el pago. Inténtalo de nuevo');
    }
  });

  /* ---- Vuelta desde Stripe (comprar.html?pago=exito|cancelado) ---- */
  const parametros = new URLSearchParams(window.location.search);
  const pago = parametros.get('pago');

  if (pago === 'exito') {
    const sessionId = parametros.get('session_id');
    const contenido = document.getElementById('reserva-content');
    const confirmando = document.getElementById('pago-confirmando');
    const done = document.getElementById('reserva-done');

    contenido.hidden = true;
    confirmando.hidden = false;

    const sondear = async (intento) => {
      if (!sb || !sessionId) return;
      const { data } = await sb
        .from('reservas')
        .select('estado')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();

      if (data && data.estado === 'pagado') {
        confirmando.hidden = true;
        done.hidden = false;
        done.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if (intento >= 10) {
        confirmando.hidden = true;
        showReservaError('Tu pago está confirmándose, tarda más de lo normal. Revisa tu email en unos minutos');
        return;
      }

      setTimeout(() => sondear(intento + 1), 1000);
    };

    sondear(0);
  }

  if (pago === 'cancelado') {
    const contenido = document.getElementById('reserva-content');
    const cancelado = document.getElementById('pago-cancelado');
    const btnReintentar = document.getElementById('btn-reintentar-pago');

    contenido.hidden = true;
    cancelado.hidden = false;

    if (btnReintentar) {
      btnReintentar.addEventListener('click', () => {
        window.location.href = 'comprar.html';
      });
    }
  }
}
```

- [ ] **Step 3: Actualizar el copy del pop-up de preventa**

El texto actual (script.js:534) es:

```javascript
  p2.textContent = 'Cuando se acaben, se acaban. Si hay un pedacito que quieres que sea tuyo, o de alguien a quien quieras dar un pedacito de ti, este es el momento de reservarlo';
```

Pasa a:

```javascript
  p2.textContent = 'Cuando se acaben, se acaban. Si hay un pedacito que quieres que sea tuyo, o de alguien a quien quieras dar un pedacito de ti, este es el momento de comprarlo';
```

- [ ] **Step 4: Comprobar la sintaxis**

```bash
node --check script.js
```

Esperado: sin salida.

- [ ] **Step 5: Servir el sitio y comprobar el estado inicial**

```bash
cd "C:\Users\udetr\Desktop\ADRI 2"
python -m http.server 8096 --bind 127.0.0.1 --directory "." &
```

Abrir `http://127.0.0.1:8096/personalizar.html`, elegir una pieza, ir a
`http://127.0.0.1:8096/comprar.html` y ejecutar con `javascript_tool`:

```javascript
JSON.stringify({
  sinPrecioVisible: !document.getElementById('sin-precio').hidden,
  botonDesactivado: document.getElementById('reserva-submit').disabled,
});
```

Esperado (todos los precios siguen en `null` en `productos.js`):
`{"sinPrecioVisible":true,"botonDesactivado":true}`.

- [ ] **Step 6: Comprobar la pantalla de cancelado**

Abrir `http://127.0.0.1:8096/comprar.html?pago=cancelado` y comprobar con
`javascript_tool`:

```javascript
JSON.stringify({
  canceladoVisible: !document.getElementById('pago-cancelado').hidden,
  contenidoOculto: document.getElementById('reserva-content').hidden,
});
```

Esperado: `{"canceladoVisible":true,"contenidoOculto":true}`.

- [ ] **Step 7: Parar el servidor de prueba**

```bash
Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" | Where-Object { $_.CommandLine -like '*8096*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

(Ejecutar en PowerShell, no en la terminal Bash.)

- [ ] **Step 8: Sincronizar**

```bash
cp "script.js" "deploy/script.js"
diff "script.js" "deploy/script.js"
```

Debe salir vacío.

- [ ] **Step 9: Commit**

```bash
git add script.js deploy/script.js
git commit -m "Flujo de compra: crea sesión de Stripe y confirma el pago por sondeo"
```

---

## Task 9: Actualizar enlaces en las 6 páginas restantes

**Files:**
- Modify: `index.html:78,104`
- Modify: `productos.html:75,98`
- Modify: `personalizar.html:76,132,188`
- Modify: `historia.html:76,104`
- Modify: `contacto.html:77,134`
- Modify: `404.html:70,98`

**Interfaces:**
- Consumes: `comprar.html` de la Tarea 6 (destino de los enlaces).
- Produces: nada que otra tarea consuma.

- [ ] **Step 1: Cambiar los dos enlaces de navegación en cada una de las 6 páginas**

En cada uno de `index.html`, `productos.html`, `personalizar.html`,
`historia.html`, `contacto.html` y `404.html`, las dos apariciones
(cabecera y pie) de:

```html
<a href="reservar.html">Reservar</a>
```

pasan a:

```html
<a href="comprar.html">Comprar</a>
```

- [ ] **Step 2: Cambiar el destino del CTA de `personalizar.html`**

En `personalizar.html`, la línea 132:

```html
    <a class="btn btn-primary btn-lg" href="reservar.html" id="cta-reservar">Regálale un pedacito de ti</a>
```

pasa a (el texto del botón se queda igual, el diseño solo pide cambiar el
destino del enlace, no este CTA en concreto):

```html
    <a class="btn btn-primary btn-lg" href="comprar.html" id="cta-reservar">Regálale un pedacito de ti</a>
```

- [ ] **Step 3: Comprobar que no queda ningún enlace a `reservar.html`**

```bash
grep -rn "reservar.html" index.html productos.html personalizar.html historia.html contacto.html 404.html
```

Esperado: sin salida.

- [ ] **Step 4: Sincronizar**

```bash
cp "index.html" "deploy/index.html"
cp "productos.html" "deploy/productos.html"
cp "personalizar.html" "deploy/personalizar.html"
cp "historia.html" "deploy/historia.html"
cp "contacto.html" "deploy/contacto.html"
cp "404.html" "deploy/404.html"
diff "index.html" "deploy/index.html"
diff "productos.html" "deploy/productos.html"
diff "personalizar.html" "deploy/personalizar.html"
diff "historia.html" "deploy/historia.html"
diff "contacto.html" "deploy/contacto.html"
diff "404.html" "deploy/404.html"
```

Los seis `diff` deben salir vacíos.

- [ ] **Step 5: Commit**

```bash
git add index.html productos.html personalizar.html historia.html contacto.html 404.html deploy/index.html deploy/productos.html deploy/personalizar.html deploy/historia.html deploy/contacto.html deploy/404.html
git commit -m "Actualiza los enlaces de Reservar a Comprar en las 6 páginas restantes"
```

---

## Task 10: Prueba de extremo a extremo y cierre de documentación

Depende de que el cliente haya completado la Tarea 2 (Stripe activado en
modo prueba, funciones desplegadas con sus secretos, webhook configurado)
y de que al menos un producto tenga un precio real puesto en `productos.js`
**y** en `supabase/functions/_shared/precios.ts` (Tarea 3) para poder
probar el pago. Hasta entonces, queda pendiente y no bloquea nada más: el
código de las tareas 1 a 9 es correcto y verificable por su cuenta.

**Files:**
- Modify: `productos.js` (rellenar un precio de prueba, revertirlo después
  si el cliente no ha dado precios reales todavía)
- Modify: `supabase/functions/_shared/precios.ts` (el mismo precio)
- Modify: `ESTADO-DEL-PROYECTO.md`

**Interfaces:**
- Consumes: todo lo de las tareas 1 a 9.

- [ ] **Step 1: Confirmar que la Tarea 2 está lista**

Preguntar al cliente si completó `configurar-stripe.md` hasta el punto 5
(webhook con signing secret guardado). El punto 6 (Resend) y el 7 (modo
real) son opcionales para esta prueba.

- [ ] **Step 2: Confirmar que la migración v7 está ejecutada**

Preguntar al cliente si ya pegó `supabase-migracion-v7.sql` en el SQL
Editor de Supabase y le dio a Run.

- [ ] **Step 3: Poner un precio de prueba**

En `productos.js`, cambiar temporalmente el `precio: null` de
`collar_esencial` a `precio: 39.9`. En
`supabase/functions/_shared/precios.ts`, cambiar
`collar_esencial: null` a `collar_esencial: 39.9`, y redesplegar:

```bash
supabase functions deploy crear-sesion-pago
```

- [ ] **Step 4: Probar el flujo completo con tarjeta de prueba**

Servir el sitio en local:

```bash
cd "C:\Users\udetr\Desktop\ADRI 2"
python -m http.server 8080 --bind 127.0.0.1 --directory "deploy"
```

En el Browser pane: entrar en `productos.html`, elegir Collar Esencia, ir
a `comprar.html`, iniciar sesión con Google, rellenar el formulario y
pulsar "Pagar y comprar". Debe redirigir a una página de Stripe.
Completarla con la tarjeta de prueba `4242 4242 4242 4242`, fecha futura
cualquiera, CVC cualquiera. Comprobar:
- Vuelve a `comprar.html?pago=exito&session_id=...`.
- Se ve "Confirmando tu pago" brevemente y luego "Listo".
- En Supabase (Table Editor → `reservas`), la fila tiene
  `estado = 'pagado'`, `precio_pagado = 39.9` y `stripe_session_id`
  relleno.

- [ ] **Step 5: Probar un pago cancelado**

Repetir el flujo hasta llegar a la página de Stripe, y esta vez pulsar el
enlace de "volver" o cerrar sin pagar. Comprobar que vuelve a
`comprar.html?pago=cancelado`, se ve la pantalla de "Pago cancelado", y que
"Volver a intentarlo" lleva de nuevo a `comprar.html` sin haber perdido los
datos ya escritos en el formulario (mismo comportamiento que ya tiene el
grabado guardado en `sessionStorage`).

- [ ] **Step 6: Probar los casos de rechazo de `crear-sesion-pago`**

Con `javascript_tool`, sin haber iniciado sesión, intentar llamar
directamente a la función:

```javascript
fetch(`${SUPABASE_URL}/functions/v1/crear-sesion-pago`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer token-falso' },
  body: JSON.stringify({ reserva_id: '00000000-0000-0000-0000-000000000000' }),
}).then(r => r.status)
```

Esperado: `401`.

- [ ] **Step 7: Comprobar el email (si se completó el punto 6 de la guía)**

Si el cliente configuró Resend, comprobar que llegaron los dos emails: uno
a la dirección usada al comprar, otro a `cozumeljewel@gmail.com`.

- [ ] **Step 8: Revertir el precio de prueba (si el cliente no dio precios reales todavía)**

Si `39.9` era solo para esta prueba y no un precio real que el cliente ya
dio, revertir en ambos archivos:

En `productos.js`, volver `collar_esencial` a `precio: null`.
En `supabase/functions/_shared/precios.ts`, volver `collar_esencial` a
`null`, y redesplegar:

```bash
supabase functions deploy crear-sesion-pago
```

Si el precio sí era uno real que el cliente dio, dejarlo puesto y anotarlo
en `ESTADO-DEL-PROYECTO.md`, sección 8, punto de precios.

- [ ] **Step 9: Actualizar el documento de estado**

En `ESTADO-DEL-PROYECTO.md`:
- Marcar `supabase-migracion-v7.sql` como confirmada (igual que se hizo con
  v3 a v6), con la fecha.
- En la sección 8, añadir una nota de que la fila de prueba de este pago
  (Collar Esencia, si el precio no era real) queda pendiente de borrar
  junto con las demás filas de prueba ya anotadas.
- Actualizar la tabla de la sección 4 (Estructura del sitio):
  `reservar.html` → `comprar.html`, con la descripción "Formulario de
  compra → Stripe → Supabase".

- [ ] **Step 10: Commit**

```bash
git add ESTADO-DEL-PROYECTO.md productos.js supabase/functions/_shared/precios.ts
git commit -m "Prueba de extremo a extremo del cobro con Stripe y cierre de documentación"
```

---

## Self-review de este plan

- **Cobertura del spec:** columnas y políticas nuevas de Supabase (Tarea
  1), trigger de email movido a "pasa a pagado" (Tarea 1), configuración
  manual de Stripe/CLI/secretos (Tarea 2), catálogo de precios del
  servidor (Tarea 3), `crear-sesion-pago` con relectura de precio en
  servidor (Tarea 4), `webhook-stripe` con verificación de firma (Tarea
  5), botón desactivado sin precio (Tareas 6 y 8), redirección a Stripe
  Checkout (Tarea 8), sondeo de confirmación en vez de confiar en la URL
  de vuelta (Tarea 8), manejo de pago cancelado sin perder datos (Tareas 6
  y 8, apoyado en el `sessionStorage` de `grabado` que ya existía), copy
  de las 7 páginas y el pop-up (Tareas 6, 8 y 9), envío incluido sin línea
  aparte (no se añade ninguna línea de envío en ningún total, cumplido por
  omisión), "Reservar" → "Comprar" en todo el sitio (Tareas 6 y 9). Todo
  lo del spec tiene tarea. Fuera de alcance explícito (reembolsos,
  facturas, página de "mis pedidos") no tiene tarea, como corresponde.
- **Placeholders:** ninguno; cada paso trae el código completo.
- **Consistencia de nombres:** `reserva_id`, `precio_pagado`,
  `stripe_session_id`, `estado` (`pendiente_pago` / `pagado` /
  `pago_fallido`) se usan igual en la migración SQL (Tarea 1), en
  `crear-sesion-pago` (Tarea 4), en `webhook-stripe` (Tarea 5) y en
  `script.js` (Tarea 8). Los ids HTML `sin-precio`, `pago-confirmando`,
  `pago-cancelado`, `btn-reintentar-pago` coinciden entre la Tarea 6
  (HTML) y la Tarea 8 (JS que los busca con `getElementById`). `PRECIOS` y
  `PRODUCTOS_VALIDOS` se exportan en la Tarea 3 con esos nombres exactos y
  se importan igual en la Tarea 4.
