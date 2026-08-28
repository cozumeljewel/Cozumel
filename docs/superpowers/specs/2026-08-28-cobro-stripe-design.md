# Cobro real con Stripe — diseño

> Segunda y tercera pieza del plan de tres que empezó con el login de
> Google (login → email de confirmación → paso de reserva a pedido),
> fusionadas: el sitio deja de ser una validación de demanda con reserva
> gratuita y pasa a cobrar de verdad con Stripe. Cambia la premisa
> central del proyecto (ver `ESTADO-DEL-PROYECTO.md`, sección 1).

## Por qué

El cliente ha decidido (2026-08-28) empezar a vender directamente, sin
esperar a validar más la demanda con reservas gratuitas. Los precios
todavía no están definidos, pero toda la infraestructura de cobro se
construye ya, para que en cuanto se rellenen los precios en
`productos.js` el sitio empiece a cobrar sin más cambios de código.

## Decisiones ya tomadas con el cliente

- Las tres piezas (copy, cobro, precios) se diseñan y construyen juntas.
- El pago se verifica en el servidor (Supabase), no basta con el
  navegador: hace falta una función de verdad, no solo SQL.
- Se acepta instalar la CLI de Supabase (primera herramienta de
  desarrollo del proyecto) para desplegar esa función.
- El pago es una redirección a la página alojada de Stripe (Stripe
  Checkout), no un formulario de tarjeta embebido.
- "Reservar" pasa a "Comprar" en todo el sitio; "tu reserva" pasa a "tu
  pedido".
- El envío va incluido en el precio: sin línea aparte en el cobro.

## Alcance de esta pieza

Incluye: cambio de datos en Supabase, el flujo de compra completo
(formulario → Stripe → confirmación), las dos funciones de servidor, el
cambio de `estado` que dispara el email ya diseñado, y el copy de las 7
páginas + el email al cliente + el email al negocio.

**Fuera de alcance, explícitamente:**
- Los precios en sí — el cliente los da más adelante, se rellenan en
  `productos.js` sin tocar código.
- Reembolsos, cancelaciones tras el pago, disputas — no hay flujo para
  eso todavía; se gestionarían a mano desde el panel de Stripe.
- Facturas — Stripe puede generarlas, no se activa en esta pieza salvo
  que el cliente lo pida.
- Página de "mis pedidos" — sigue aplazada, ya se decidió al diseñar el
  login.

## Cambios en Supabase

### Columnas nuevas en `reservas`

La tabla se queda con ese nombre internamente (renombrarla no aporta
nada al usuario y sí riesgo de romper referencias existentes en
`script.js` y en las políticas RLS ya creadas).

```sql
alter table public.reservas
  add column if not exists precio_pagado numeric,
  add column if not exists stripe_session_id text;
```

`precio_pagado` guarda el importe real cobrado en el momento de la
compra: si más adelante se sube el precio en `productos.js`, los
pedidos ya pagados no cambian de valor retroactivamente.

### El campo `estado` pasa a tener tres valores

- `pendiente_pago` — la fila se acaba de crear, camino de Stripe. Es el
  **único** valor que la política de INSERT permite crear desde el
  navegador.
- `pagado` — Stripe confirmó el cobro. Solo lo escribe la función
  `webhook-stripe`, usando la clave `service_role` (que salta las
  políticas RLS), nunca el cliente.
- `pago_fallido` — Stripe avisó de que el pago no se completó (tarjeta
  rechazada, sesión expirada sin pagar, etc.).

### Política de INSERT (sustituye a la de v6)

Igual que la de v6, pero exige `estado = 'pendiente_pago'` en vez de
`'reserva'`:

```sql
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
```

### Política de SELECT (nueva)

Cada persona puede leer sus propias filas, nada más. La necesita la
pantalla de "confirmando tu pago" para comprobar si ya se marcó como
pagada.

```sql
create policy "usuarios autenticados leen sus reservas"
  on public.reservas for select
  to authenticated
  using (user_id = auth.uid());
```

### El trigger de email cambia de disparador

El diseño anterior (`docs/superpowers/specs/... email de pedido
recibido`, todavía sin construir cuando se decidió este cambio) disparaba
el email al **crear** la fila. Ahora se dispara cuando `estado` **pasa a
`pagado`**, porque crear la fila ya no significa que se haya pagado:

```sql
create trigger notificar_pedido_pagado
  after update of estado on public.reservas
  for each row
  when (new.estado = 'pagado' and old.estado is distinct from 'pagado')
  execute function notificar_pedido_pagado();
```

La función en sí (`notificar_pedido_pagado()`, con `pg_net` llamando a
Resend) se construye igual que ya se había diseñado, solo cambia cuándo
se ejecuta el trigger.

## El flujo de compra, completo

1. **Login con Google** (sin cambios).
2. **Formulario** en `comprar.html` (antes `reservar.html`): nombre,
   apellidos, email, WhatsApp, país, dirección, grabado — todo igual que
   ahora.
3. **Si la pieza no tiene precio** (`producto.precio === null`), el botón
   de compra queda desactivado con un aviso ("Precio pendiente de
   confirmar"), mismo patrón que ya existe para "elige primero una
   pieza" (`#sin-pieza`).
4. **Al enviar:** se inserta la fila en Supabase con
   `estado = 'pendiente_pago'` y `precio_pagado` igual al precio actual
   de la pieza en `productos.js` (el del Kit Mi Consentida, si algún día
   lleva descuento, ya vendría rebajado en ese mismo campo — no hay
   cálculo de descuento en el código, es el número final que ponga el
   cliente).
5. **Se llama a la función `crear-sesion-pago`**, pasándole el id de la
   fila recién creada. La función:
   - Vuelve a mirar el precio **en el servidor**, no se fía del que
     mande el navegador (evita que alguien manipule el importe desde el
     JavaScript).
   - Crea la sesión de Stripe Checkout con ese importe, y con
     `success_url` → `comprar.html?pago=exito&session_id={CHECKOUT_SESSION_ID}`
     y `cancel_url` → `comprar.html?pago=cancelado`.
   - Devuelve la URL de la sesión.
6. El navegador redirige a esa URL (`window.location.href = url`). El
   cliente paga en la página de Stripe.
7. Stripe redirige de vuelta a `comprar.html?pago=exito&session_id=...`.
   La página muestra "Confirmando tu pago…" y consulta la fila (por
   `stripe_session_id`) cada segundo, hasta 10 veces: en cuanto ve
   `estado = 'pagado'`, muestra la pantalla de "Listo". Si se cancela en
   Stripe, vuelve con `pago=cancelado` y puede reintentar sin perder los
   datos ya escritos (quedan en `sessionStorage`, como ya pasa con el
   grabado).

### Por qué hace falta consultar y no basta con la redirección

Llegar a `comprar.html?pago=exito` no demuestra que se haya pagado:
cualquiera podría escribir esa URL a mano. La consulta a la fila (que
solo cambia a `pagado` cuando `webhook-stripe` lo confirma con la firma
de Stripe verificada) es la única fuente de verdad.

## Las dos funciones de servidor (Supabase Edge Functions)

### `crear-sesion-pago`

- La llama el navegador, autenticado (con el token de sesión de
  Supabase, para saber de quién es la fila).
- Recibe el id de la fila `pendiente_pago`.
- Comprueba que la fila pertenece a quien llama y que sigue en
  `pendiente_pago`.
- Lee el precio del producto correspondiente **desde su propia copia de
  los datos del catálogo** (no desde lo que mande el navegador).
- Crea la sesión de Stripe Checkout (`stripe.checkout.sessions.create`)
  con ese importe, en modo `payment` (pago único, no suscripción).
- Guarda el `stripe_session_id` en la fila.
- Devuelve la URL de Stripe al navegador.

### `webhook-stripe`

- La llama Stripe, nunca el navegador.
- Verifica la firma de la petición con el "signing secret" del webhook
  (si no verifica, se rechaza sin más — evita que cualquiera simule un
  aviso de pago falso).
- En el evento `checkout.session.completed`: busca la fila por
  `stripe_session_id` y la pasa a `estado = 'pagado'`.
- En `checkout.session.expired` o pagos rechazados: pasa a
  `estado = 'pago_fallido'`.
- Usa la clave `service_role` de Supabase (nunca expuesta al navegador),
  porque necesita saltarse las políticas RLS para escribir en una fila
  que no es "suya".

## El copy, sitio por sitio

| Dónde | Antes | Después |
|---|---|---|
| Archivo | `reservar.html` | `comprar.html` (con los enlaces de las 7 páginas actualizados) |
| Menú y pie (7 páginas) | "Reservar" | "Comprar" |
| Título de la página | "Reserva tu joya" | "Compra tu joya" |
| `<h2>` principal | "Reserva la tuya" | "Cómpratela" |
| Subtítulo | "Gratis. Sin compromiso..." | "Pago seguro con tarjeta, a través de Stripe" |
| Botón de envío | "Reservar mi joya, gratis" | "Pagar y comprar" |
| Pantalla final | "Hemos guardado tu reserva..." | "Hemos recibido tu pago..." |
| Pop-up de preventa | "reservarlo" | "comprarlo" |
| Email al cliente | "Hemos recibido tu reserva", bloque "gratis, sin compromiso" | "Hemos recibido tu pago", resumen con el importe pagado |
| Email al negocio | — | añade el importe cobrado a los datos ya incluidos |

Las fichas de producto (`personalizar.html`) mantienen su CTA actual
("Regálale un pedacito de ti" / similar), solo cambia el destino del
enlace, de `reservar.html` a `comprar.html`.

## Configuración manual (solo la puede hacer el cliente)

1. Cuenta de Stripe activada para cobros reales (no en modo prueba).
2. Instalar la CLI de Supabase y hacer login una vez.
3. Desplegar las dos Edge Functions con la CLI.
4. Guardar la clave secreta de Stripe como secreto de la Edge Function
   en Supabase (nunca en un archivo del proyecto).
5. Configurar el webhook en el panel de Stripe, apuntando a la URL
   pública de `webhook-stripe`; copiar el "signing secret" que genera
   Stripe y guardarlo también como secreto en Supabase.
6. Rellenar precios reales en `productos.js`.

Se documentan los pasos exactos (como `configurar-login-google.md`)
cuando se llegue a esa tarea del plan de implementación.

## Manejo de errores

- **Pago cancelado en Stripe:** vuelve a `comprar.html?pago=cancelado`,
  puede reintentar; la fila se queda en `pendiente_pago` o pasa a
  `pago_fallido` si Stripe llega a notificarlo.
- **Falla `crear-sesion-pago`** (Stripe caído, error de red): se
  reutiliza el mismo tipo de aviso de error que ya tiene el formulario
  (`showReservaError`).
- **El navegador se cierra entre el paso 5 y el 6** (tras crear la
  sesión pero antes de que Stripe confirme el pago): no pasa nada, la
  fila se queda en `pendiente_pago`; si el cliente vuelve a intentarlo
  más tarde, se crea una fila nueva. Las filas `pendiente_pago`
  abandonadas no cobran nada ni bloquean nada, solo quedan sin usar en
  la tabla.
- **El webhook nunca llega** (fallo de red del lado de Stripe, poco
  común): la fila se queda en `pendiente_pago` con el dinero ya cobrado
  en Stripe. Es un caso raro que se detecta a mano mirando el panel de
  Stripe si algún pedido no aparece como pagado; no se construye
  reconciliación automática en esta pieza.

## Cómo se prueba

- Con las claves de prueba de Stripe (antes de activar cobros reales):
  completar el flujo entero con una tarjeta de prueba, confirmar que la
  fila pasa a `pagado`, que llegan los dos emails, y que la pantalla de
  "Confirmando tu pago" no se queda colgada.
- Cancelar un pago a medias y confirmar que se puede reintentar sin
  perder los datos del formulario.
- Confirmar que sin sesión, o con una fila que no es la del usuario
  actual, `crear-sesion-pago` rechaza la petición.
- Confirmar que un aviso de webhook sin firma válida se rechaza.
