# Activar login con Google — pasos manuales

Esto hay que hacerlo una sola vez, con tu propia cuenta de Google. Nadie
más puede hacerlo por ti: pide acceso a Google Cloud Console y al
dashboard de Supabase del proyecto.

## 1. Crear las credenciales en Google Cloud

1. Entra en https://console.cloud.google.com/ con la cuenta de Google que
   quieras usar para gestionar esto.
2. Si no tienes un proyecto todavía, créalo (arriba a la izquierda,
   "Seleccionar proyecto" → "Proyecto nuevo"). Nombre sugerido: `Cozumel
   Jewelry`.
3. Ve a **APIs y servicios → Pantalla de consentimiento OAuth**.
   - Tipo de usuario: **Externo**.
   - Nombre de la app: `Cozumel Jewelry`.
   - Email de asistencia y email de contacto del desarrollador: el que
     uses para el proyecto.
   - Guarda y continúa en las pantallas siguientes (scopes y test users se
     pueden dejar como vienen por defecto).
4. Ve a **APIs y servicios → Credenciales → Crear credenciales → ID de
   cliente de OAuth**.
   - Tipo de aplicación: **Aplicación web**.
   - Nombre: `Cozumel Jewelry - Supabase`.
   - **Orígenes de JavaScript autorizados**, añade:
     - `https://cozumeljewelry.es`
     - `http://127.0.0.1:8080` (para probar en local; si usas otro
       puerto, añade también ese)
   - **URI de redirección autorizados**, añade exactamente esta, tal cual,
     sin cambiar nada:
     - `https://ddcrkglgdbasbxanbjkc.supabase.co/auth/v1/callback`
   - Pulsa **Crear**.
5. Google te muestra un **Client ID** y un **Client Secret**. Cópialos,
   los necesitas en el paso siguiente. El Client Secret no se comparte ni
   se pega en ningún archivo del proyecto.

## 2. Activar el proveedor en Supabase

1. Entra en https://supabase.com/dashboard, proyecto `ddcrkglgdbasbxanbjkc`.
2. Ve a **Authentication → Providers**.
3. Busca **Google** en la lista, actívalo.
4. Pega el **Client ID** y el **Client Secret** que copiaste de Google.
5. Guarda.
6. Ve a **Authentication → URL Configuration**.
7. En **Site URL**, cambia el valor por defecto (`http://localhost:3000`,
   viene así en todo proyecto nuevo de Supabase) por:
   - `https://cozumeljewelry.es`

   Es la URL de referencia del proyecto: la usa Supabase cuando una
   redirección no coincide con nada de la lista de abajo, y también se
   inserta en las plantillas de email. Si se queda en `localhost`, cosas
   que dependen de ella (como esas plantillas) apuntan a un sitio que no
   existe.
8. En **Redirect URLs**, añade:
   - `https://cozumeljewelry.es/reservar.html`
   - `http://127.0.0.1:8080/reservar.html` (para las pruebas en local; si
     Supabase permite comodines en esta versión del dashboard, puedes usar
     algo como `http://127.0.0.1:*/**` para no tener que añadir cada
     puerto que uses al probar — compruébalo en la ayuda del propio campo,
     puede variar)
9. Guarda.

## 3. Cómo saber si ya está listo

Cuando esto esté hecho, avisa: se prueba el botón "Continuar con Google"
en `reservar.html` y, si todo está bien configurado, lleva a la pantalla
de cuentas de Google y vuelve con la sesión iniciada. Si da un error de
`redirect_uri_mismatch`, casi siempre es que la URI del paso 1 no coincide
carácter por carácter con la de Supabase, o que falta añadir la URL de la
página en el paso 2.

**Si pruebas el botón antes de terminar el paso 2** (activar el proveedor
en Supabase), no aparece ningún aviso en la propia página: el navegador te
saca del sitio y aterriza en una pantalla de error de Supabase, fuera de
`cozumeljewelry.es`. Es normal, significa que aún falta ese paso, no que
algo esté roto.
