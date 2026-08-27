# Login con Google — diseño

> Primera de tres piezas hacia gestionar pedidos reales (no reservas):
> login con Google, email de "pedido recibido", y el paso de "reserva" a
> "pedido". Esta pieza es solo la primera. Las otras dos tienen su propio
> diseño cuando les toque.

## Por qué

Ahora mismo `reservar.html` guarda una reserva anónima: cualquiera puede
mandar el formulario sin identificarse, protegido solo por una política de
Supabase que exige los valores correctos de `producto`, `fuente`, `estado`
y `consentimiento`. Cuando se lance de verdad y empiecen a llegar pedidos
en volumen, hace falta que cada pedido quede ligado a una cuenta real, para
poder contactar, dar seguimiento y (más adelante) enseñar el estado del
pedido a quien lo hizo.

## Alcance de esta pieza

- Login obligatorio con Google antes de poder reservar/pedir.
- Cuenta "muy básica": no hay página de perfil ni de "mis pedidos". Solo
  sirve para identificar quién hace el pedido y autocompletar sus datos.
- Nombre y email se autocompletan desde Google, pero quedan editables.
- Enlace de "Cerrar sesión" junto al formulario.

**Fuera de esta pieza** (quedan para las siguientes dos, ya acordadas con
el cliente): email de confirmación de pedido, página de "mis pedidos",
estados del pedido (recibido / en producción / enviado), y el cambio de
nombre "reserva" → "pedido" en toda la web.

## Enfoque técnico

**Supabase Auth con el proveedor de Google, flujo de redirección.**
Es el flujo estándar de Supabase Auth: el botón manda al navegador a la
pantalla de Google, y al volver la sesión ya está activa. No necesita
librerías nuevas ni servidor propio — encaja con que el sitio es HTML
estático y ya usa `@supabase/supabase-js` en el cliente.

Se descarta un flujo de ventana emergente / Google One Tap: se siente algo
más pulido, pero exige cargar la librería de Google Identity Services
aparte y más código de enganche, sin ninguna ganancia real para un sitio
con el tráfico que tiene esto todavía.

## Cambios en Supabase

### Columna nueva

```sql
alter table public.reservas
  add column if not exists user_id uuid references auth.users(id);
```

### Política de seguridad (sustituye a la actual)

Dos condiciones a la vez: la fila tiene que pertenecer a quien la inserta
(`user_id = auth.uid()`), y se mantienen las comprobaciones de producto,
fuente, estado y consentimiento que ya había — no cuestan nada y evitan
que alguien manipulando el JavaScript cuele un valor que no toca.

El cambio importante es que la política pasa de `to anon` a
`to authenticated`: sin sesión, no se puede insertar nada. La clave `anon`
deja de necesitar permiso de escritura sobre `reservas`.

```sql
drop policy if exists "anon inserta reservas" on public.reservas;

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
    and estado = 'reserva'
    and consentimiento = true
  );
```

### Configurar el proveedor (acción manual, solo la puede hacer el cliente)

Dos pasos fuera de este repositorio, con las credenciales de Google del
cliente:

1. Crear credenciales OAuth en Google Cloud Console (Client ID + Client
   Secret), con la URI de redirección que da Supabase
   (`https://ddcrkglgdbasbxanbjkc.supabase.co/auth/v1/callback`).
2. Pegarlas en Supabase → Authentication → Providers → Google, y activar
   el proveedor. También añadir `https://cozumeljewelry.es` y
   `http://127.0.0.1:8080` (para probar en local) a las Redirect URLs
   permitidas.

Se documentan los pasos exactos con capturas/instrucciones cuando llegue
el momento de implementar — esto no se puede automatizar, necesita que el
cliente entre en su propia cuenta de Google.

## Cambios en el sitio

### `reservar.html`

Encima del `<form id="reserva-form">`, un bloque nuevo que tapa el
formulario mientras no hay sesión:

```html
<div class="login-gate" id="login-gate">
  <p>Para reservar, primero identifícate</p>
  <button id="btn-login-google">Continuar con Google</button>
</div>
```

El formulario (`#reserva-form`) queda `hidden` hasta que hay sesión. Junto
al formulario, un enlace pequeño:

```html
<button id="btn-logout" class="link-logout" hidden>Cerrar sesión</button>
```

### `script.js`

- Al cargar `reservar.html`, comprobar si hay sesión
  (`sb.auth.getSession()`).
  - Sin sesión: `login-gate` visible, formulario oculto, botón de logout
    oculto.
  - Con sesión: `login-gate` oculto, formulario visible, botón de logout
    visible. Nombre y email del formulario se rellenan desde
    `session.user.user_metadata` (`full_name`, `email`), editables.
- `btn-login-google` → `sb.auth.signInWithOAuth({ provider: 'google' })`.
- `btn-logout` → `sb.auth.signOut()`, y se vuelve a mostrar el aviso de
  login.
- Al enviar el formulario, el payload que se manda a `reservas` incluye
  `user_id: session.user.id`.
- `sb.auth.onAuthStateChange` escucha el regreso desde Google (la sesión
  llega async tras la redirección) y actualiza la vista sin recargar.

### Nada más cambia

`productos.html`, `personalizar.html`, `contacto.html`, etc. siguen
exactamente igual. El login solo vive en `reservar.html`, porque es el
único sitio donde hoy se escribe en Supabase.

## Manejo de errores

- Login de Google cancelado o fallido: se queda como estaba (aviso de
  login visible), sin mensaje de error nuevo — no hay nada roto, solo no
  se completó la acción.
- Fallo al guardar la reserva estando ya logueado: se reutiliza el mensaje
  de error que ya existe hoy (*"No se pudo guardar tu reserva. Inténtalo
  de nuevo"*).

## Cómo se prueba

- Sin sesión: el formulario está oculto y solo se ve el botón de Google.
- Tras el login: aparecen los campos con nombre/email precargados
  (editables) y el enlace de cerrar sesión.
- Reservar con sesión: la fila en Supabase lleva `user_id` relleno.
- Cerrar sesión: vuelve a tapar el formulario.
- Recargar la página con sesión activa: entra directo al formulario, sin
  pedir login otra vez.
- Probar en local (servidor en `127.0.0.1:8080`) una vez el cliente añada
  esa URL a las Redirect URLs de Supabase.

## Riesgos / decisiones pendientes que no bloquean esto

- Las filas de prueba (`TEST — borrar`, `TEST MIGRACION — borrar`) fueron
  insertadas con la política antigua (`anon`, sin `user_id`). Al cambiar
  la política, esas filas se quedan con `user_id` nulo — no pasa nada,
  siguen ahí hasta que se borren a mano (ya estaba pendiente).
- Si algún día se quiere permitir pedir sin cuenta (invitado), hay que
  volver a tocar la política — no está contemplado en esta pieza porque el
  cliente decidió login obligatorio.
