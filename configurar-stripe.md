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
