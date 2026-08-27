# Login con Google — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que reservar una pieza en `reservar.html` exija haber iniciado sesión con Google, y que la reserva quede ligada a esa cuenta en Supabase.

**Architecture:** Supabase Auth con el proveedor de Google, flujo de redirección (`signInWithOAuth`). El formulario de `reservar.html` queda oculto tras un aviso de login hasta que hay sesión; al volver de Google, `onAuthStateChange` revela el formulario y precarga nombre/email. La política de seguridad de `reservas` pasa de aceptar la clave `anon` a exigir `to authenticated` con `user_id = auth.uid()`.

**Tech Stack:** HTML/CSS/JS vanilla (sin framework), `@supabase/supabase-js@2` (ya cargado por CDN en `reservar.html`), Supabase Auth + Postgres RLS.

## Global Constraints

- **Nada de emoticonos** en la interfaz. Iconos SVG de línea si hacen falta.
- **Nada de rayas (—)** en los textos. Dos puntos, comas o paréntesis. Punto medio (·) en títulos de pestaña.
- **Nada de puntos finales** en textos de interfaz (títulos, párrafos cortos, botones, avisos). Dentro de un párrafo largo con varias frases, se quita solo el último punto, no los internos.
- **Todo `textContent`, nunca `innerHTML`** con datos que no sean literales fijos en el código: no se interpreta HTML venido de fuera.
- **`deploy/` es lo único que se sube a Netlify.** Cada archivo tocado en la raíz se copia también a `deploy/` al terminar la tarea que lo modifica. Los `.sql` y este plan **no** se copian a `deploy/`.
- **Sin framework de tests ni git en este proyecto.** "Verificar" en este plan significa: `node --check` para sintaxis JS, comprobación por navegador (Browser pane, `javascript_tool`) para comportamiento, y lectura visual para HTML/CSS. No hay `pytest` ni `git commit`; en vez de un paso de commit, cada tarea termina sincronizando a `deploy/`.
- **Nunca subir** `media_kit_adriana_carballo_2026.pdf`, ningún `.sql`, ni los bocetos de diseño (`logo-preview.html`, `direccion-artistica.html`, `landing-preview.html`).

---

## Task 1: Migración de Supabase (columna + política)

**Files:**
- Create: `supabase-migracion-v6.sql`
- Modify: `ESTADO-DEL-PROYECTO.md` (sección 6 y sección 8, punto bloqueante)

**Interfaces:**
- Produces: la tabla `public.reservas` pasa a tener una columna `user_id uuid` que referencia `auth.users(id)`. La política de INSERT exige sesión (`to authenticated`) y `user_id = auth.uid()`. Las tareas siguientes (el JS del formulario) dependen de mandar `user_id` en el payload o el INSERT será rechazado.

- [ ] **Step 1: Escribir la migración**

Crear `supabase-migracion-v6.sql` en la raíz del proyecto:

```sql
-- ============================================================
-- MIGRACIÓN v6 · login obligatorio con Google para reservar
--
-- Pega esto en el SQL Editor de Supabase y pulsa Run.
-- A partir de aquí, la clave anon YA NO puede insertar en "reservas":
-- hace falta sesión iniciada. Sin ejecutar esto, el formulario de
-- reservar.html (una vez tenga el login) fallará al enviar SIEMPRE,
-- no solo para un producto concreto.
-- ============================================================

alter table public.reservas
  add column if not exists user_id uuid references auth.users(id);

drop policy if exists "anon inserta reservas" on public.reservas;

create policy "usuarios autenticados insertan sus reservas"
  on public.reservas for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and producto in (
      'collar_esencial',
      'pulsera_vinculo',
      'pulsera_nombre',
      'brazalete_mensaje',
      'collar_flor_natal',
      'kit_pedacito_nosotros',
      'kit_mi_consentida'
    )
    and fuente = 'adri_story'
    and estado = 'reserva'
    and consentimiento = true
  );

-- ============================================================
-- Las filas ya guardadas con la política anterior (anon) se quedan con
-- user_id en null. No pasa nada: siguen ahí, solo que sin dueño asignado.
-- ============================================================
```

- [ ] **Step 2: Comprobar que el SQL es válido a simple vista**

No hay forma de ejecutar esto desde aquí (la clave `anon` del proyecto no
tiene permiso de `ALTER TABLE` ni de gestionar políticas). Revisar a ojo:
- Los 7 ids de producto coinciden exactamente con los de `productos.js`
  (comparar con `grep "id: '" productos.js`).
- `drop policy if exists` usa el mismo nombre de política que creó
  `supabase-migracion-v3.sql` (`"anon inserta reservas"`), para no dejar
  dos políticas activas a la vez.

Correr para comparar:
```bash
grep "id: '" productos.js
```
Debe salir exactamente: `collar_esencial`, `pulsera_vinculo`,
`pulsera_nombre`, `brazalete_mensaje`, `collar_flor_natal`,
`kit_pedacito_nosotros`, `kit_mi_consentida`.

- [ ] **Step 3: Actualizar el documento de estado**

En `ESTADO-DEL-PROYECTO.md`, sección 6 ("Supabase"), añadir bajo el listado
de migraciones existentes:

```markdown
- **⚠️ `supabase-migracion-v6.sql` NO se ha ejecutado.** Añade `user_id` a
  `reservas` y cambia la política de INSERT: de aquí en adelante hace falta
  sesión de Google para reservar (ver el login en la sección 4). Sin esta
  migración, en cuanto el login esté activo en el sitio, **todas** las
  reservas fallarán al guardar, no solo las de un producto.
```

Y en la sección 8, punto "Bloqueante", añadir esta migración a la lista de
pendientes (o crear el punto si ya no había ninguno bloqueante).

- [ ] **Step 4: Sincronizar**

`supabase-migracion-v6.sql` y `ESTADO-DEL-PROYECTO.md` **no van a
`deploy/`** (regla ya existente: ni los `.sql` ni el documento de estado
se suben). No hace falta copiar nada en este paso.

---

## Task 2: Guía de configuración manual (Google Cloud + Supabase)

Esta tarea no es código: es un documento con los pasos exactos que **solo
el cliente puede hacer**, porque piden su propia cuenta de Google y acceso
al dashboard de Supabase. Sin completarlo, el botón "Continuar con Google"
de las tareas siguientes existirá pero no funcionará de verdad.

**Files:**
- Create: `configurar-login-google.md`

**Interfaces:**
- Produces: ninguna interfaz de código. Es la referencia que el cliente
  sigue para activar el proveedor de Google en Supabase Auth.

- [ ] **Step 1: Escribir la guía**

Crear `configurar-login-google.md` en la raíz del proyecto:

```markdown
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
7. En **Redirect URLs**, añade:
   - `https://cozumeljewelry.es/reservar.html`
   - `http://127.0.0.1:8080/reservar.html` (para las pruebas en local; si
     Supabase permite comodines en esta versión del dashboard, puedes usar
     algo como `http://127.0.0.1:*/**` para no tener que añadir cada
     puerto que uses al probar — compruébalo en la ayuda del propio campo,
     puede variar)
8. Guarda.

## 3. Cómo saber si ya está listo

Cuando esto esté hecho, avisa: se prueba el botón "Continuar con Google"
en `reservar.html` y, si todo está bien configurado, lleva a la pantalla
de cuentas de Google y vuelve con la sesión iniciada. Si da un error de
`redirect_uri_mismatch`, casi siempre es que la URI del paso 1 no coincide
carácter por carácter con la de Supabase, o que falta añadir la URL de la
página en el paso 2.
```

- [ ] **Step 2: Confirmar que las URLs del documento son correctas**

Comparar la URL de Supabase que aparece en la guía con la real del
proyecto:

```bash
grep SUPABASE_URL supabase-config.js
```

Debe coincidir con `https://ddcrkglgdbasbxanbjkc.supabase.co` (la URI de
redirección del paso 1.4 es esa misma URL + `/auth/v1/callback`). Si
`supabase-config.js` cambió de proyecto en algún momento, actualizar la
guía con la URL real antes de continuar.

- [ ] **Step 3: Sincronizar**

`configurar-login-google.md` **no va a `deploy/`**: es documentación
interna, no parte del sitio.

---

## Task 3: Marcado HTML del aviso de login

**Files:**
- Modify: `reservar.html:97-138`

**Interfaces:**
- Consumes: nada de tareas anteriores.
- Produces: los ids `login-gate`, `btn-login-google`, `btn-logout` y el
  atributo `hidden` inicial en `#reserva-form`. La Tarea 5 (`script.js`)
  los usa tal cual.

- [ ] **Step 1: Insertar el aviso de login antes del formulario, y ocultar el formulario por defecto**

En `reservar.html`, el bloque que hoy es:

```html
      <p class="reserva-config-warning" id="sin-pieza" hidden>
        Todavía no has elegido pieza. Entra en <a href="productos.html">la colección</a> y elige la tuya
      </p>

      <form id="reserva-form">
        <div class="field">
          <label for="r-nombre">Nombre</label>
```

pasa a:

```html
      <p class="reserva-config-warning" id="sin-pieza" hidden>
        Todavía no has elegido pieza. Entra en <a href="productos.html">la colección</a> y elige la tuya
      </p>

      <!-- Tapa el formulario hasta que hay sesión. script.js decide cuál
           de los dos se ve, comprobando sb.auth.getSession(). -->
      <div class="login-gate" id="login-gate">
        <p class="login-gate-texto">Para reservar, primero identifícate</p>
        <button type="button" class="btn btn-primary" id="btn-login-google">Continuar con Google</button>
      </div>

      <form id="reserva-form" hidden>
        <div class="field">
          <label for="r-nombre">Nombre</label>
```

El `hidden` en el `<form>` es a propósito: así, si `script.js` tarda una
fracción de segundo en comprobar la sesión, nunca se ve el formulario
parpadear antes de decidir si tocaba mostrarlo.

- [ ] **Step 2: Añadir el enlace de cerrar sesión, después del formulario**

El final de la sección hoy es:

```html
        <button class="btn btn-primary btn-lg" type="submit" id="reserva-submit">Reservar mi joya, gratis</button>
        <p class="reserva-error" id="reserva-error" hidden></p>
      </form>
    </div>
```

pasa a:

```html
        <button class="btn btn-primary btn-lg" type="submit" id="reserva-submit">Reservar mi joya, gratis</button>
        <p class="reserva-error" id="reserva-error" hidden></p>
      </form>
      <button type="button" class="link-logout" id="btn-logout" hidden>Cerrar sesión</button>
    </div>
```

- [ ] **Step 3: Verificar visualmente**

Abrir `reservar.html` en un editor y comprobar que queda bien anidado: el
`login-gate` y el `form` son hermanos dentro de `#reserva-content`, y
`btn-logout` está fuera del `form` pero dentro de `#reserva-content`. Un
`<button>` sin `type="button"` dentro de un `<form>` actúa como submit por
defecto — por eso `btn-logout` lo lleva explícito, aunque esté fuera del
formulario (así queda a salvo si algún día se mueve dentro).

- [ ] **Step 4: Sincronizar**

```bash
cp "reservar.html" "deploy/reservar.html"
diff "reservar.html" "deploy/reservar.html"
```
Debe salir vacío (sin diferencias).

---

## Task 4: Estilos del aviso de login y el enlace de salir

**Files:**
- Modify: `style.css` (añadir junto a `.reserva-config-warning`, sobre la línea 799)

**Interfaces:**
- Consumes: las clases `login-gate`, `login-gate-texto`, `link-logout`
  creadas en la Tarea 3.
- Produces: nada que otra tarea consuma directamente; es solo estilo.

- [ ] **Step 1: Añadir los estilos**

En `style.css`, justo antes del comentario `/* Aviso y error se mantienen
en tono cálido a propósito... */` (línea ~799), insertar:

```css
/* ---------- LOGIN CON GOOGLE (reservar.html) ----------
   Tapa el formulario hasta que hay sesión. Mismo ancho que
   .reserva-content, para que no salte al aparecer el formulario debajo. */
.login-gate{
  margin:26px auto 0; max-width:340px; padding:24px 20px;
  background:var(--white); border:1px solid var(--line-2); border-radius:2px;
  text-align:center;
}
.login-gate-texto{
  font-size:13.5px; color:var(--ink); margin-bottom:16px;
}
.login-gate .btn{width:100%;}

/* Enlace de cerrar sesión: texto, no botón, para no competir con el CTA
   principal del formulario. */
.link-logout{
  display:block; margin:16px auto 0; padding:4px;
  background:none; border:none; cursor:pointer;
  font-family:'Jost'; font-size:12px; letter-spacing:.03em;
  color:var(--sea-dark); text-decoration:underline; text-underline-offset:2px;
}
.link-logout:hover{color:var(--deep);}
```

- [ ] **Step 2: Comprobar sintaxis y que no rompe nada existente**

```bash
node -e "require('fs').readFileSync('style.css','utf8')" && echo "leído sin error"
grep -c "^\.login-gate{" style.css
grep -c "^\.link-logout{" style.css
```
Las dos últimas deben devolver `1` (una sola definición de cada regla, sin
duplicados de una edición anterior).

- [ ] **Step 3: Sincronizar**

```bash
cp "style.css" "deploy/style.css"
diff "style.css" "deploy/style.css"
```
Debe salir vacío.

---

## Task 5: Lógica de login en `script.js`

**Files:**
- Modify: `script.js:620-695` (todo el bloque `if (reservaForm) { ... }`)

**Interfaces:**
- Consumes: `sb` y `SUPA_READY` (definidos en `script.js:15-25`, ya
  existían). Los ids HTML `login-gate`, `btn-login-google`, `btn-logout`
  de la Tarea 3.
- Produces: la variable `sesionActual` dentro del cierre del bloque
  `if (reservaForm)`, y el campo `user_id` en el payload que se manda a
  `sb.from('reservas').insert(...)`.

- [ ] **Step 1: Sustituir el bloque completo**

El bloque actual en `script.js` (línea 620) es:

```javascript
/* ---------- Formulario de reserva (reservar.html) ---------- */
const reservaForm = document.getElementById('reserva-form');

if (reservaForm) {
  reservaForm.addEventListener('focusin', trackReservaIniciada, { once: true });

  const reservaSubmitBtn = document.getElementById('reserva-submit');
  const reservaConfigWarning = document.getElementById('reserva-config-warning');
  const reservaError = document.getElementById('reserva-error');
  const sinPiezaAviso = document.getElementById('sin-pieza');

  if (!SUPA_READY) {
    reservaConfigWarning.hidden = false;
    reservaSubmitBtn.disabled = true;
  }

  // No se puede reservar sin haber elegido pieza
  const prodElegido = getProductoElegido();
  if (!prodElegido) {
    if (sinPiezaAviso) sinPiezaAviso.hidden = false;
    reservaSubmitBtn.disabled = true;
  }

  const showReservaError = (msg) => { reservaError.textContent = msg; reservaError.hidden = false; };
  const hideReservaError = () => { reservaError.hidden = true; };

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

    const payload = {
      nombre: reservaForm.nombre.value.trim(),
      apellidos: reservaForm.apellidos.value.trim(),
      email: reservaForm.email.value.trim(),
      whatsapp: reservaForm.whatsapp.value.trim(),
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
/* ---------- Formulario de reserva (reservar.html) ---------- */
const reservaForm = document.getElementById('reserva-form');

if (reservaForm) {
  reservaForm.addEventListener('focusin', trackReservaIniciada, { once: true });

  const reservaSubmitBtn = document.getElementById('reserva-submit');
  const reservaConfigWarning = document.getElementById('reserva-config-warning');
  const reservaError = document.getElementById('reserva-error');
  const sinPiezaAviso = document.getElementById('sin-pieza');
  const loginGate = document.getElementById('login-gate');
  const btnLoginGoogle = document.getElementById('btn-login-google');
  const btnLogout = document.getElementById('btn-logout');

  if (!SUPA_READY) {
    reservaConfigWarning.hidden = false;
    reservaSubmitBtn.disabled = true;
  }

  // No se puede reservar sin haber elegido pieza
  const prodElegido = getProductoElegido();
  if (!prodElegido) {
    if (sinPiezaAviso) sinPiezaAviso.hidden = false;
    reservaSubmitBtn.disabled = true;
  }

  const showReservaError = (msg) => { reservaError.textContent = msg; reservaError.hidden = false; };
  const hideReservaError = () => { reservaError.hidden = true; };

  /* ---- Login con Google ----
     Guarda la sesión en un cierre (no en window) para que el envío del
     formulario pueda leer el user_id sin volver a preguntarle a Supabase. */
  let sesionActual = null;

  const mostrarSegunSesion = (session) => {
    sesionActual = session || null;
    const haySesion = !!sesionActual;

    loginGate.hidden = haySesion;
    reservaForm.hidden = !haySesion;
    btnLogout.hidden = !haySesion;

    if (haySesion) {
      const meta = sesionActual.user.user_metadata || {};
      // Solo precarga si el campo está vacío: si la persona ya escribió
      // algo (o volvió a la página con datos guardados), no se lo pisa.
      if (!reservaForm.nombre.value) reservaForm.nombre.value = meta.full_name || meta.name || '';
      if (!reservaForm.email.value) reservaForm.email.value = sesionActual.user.email || '';
    }
  };

  if (SUPA_READY && sb) {
    sb.auth.getSession().then(({ data }) => mostrarSegunSesion(data.session));
    sb.auth.onAuthStateChange((_evento, session) => mostrarSegunSesion(session));
  } else {
    // Sin Supabase configurado no hay nada que pedir: el aviso de
    // "Supabase no está conectado todavía" ya cubre este caso.
    loginGate.hidden = true;
  }

  if (btnLoginGoogle) {
    btnLoginGoogle.addEventListener('click', () => {
      if (!sb) return;
      sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href },
      });
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (sb) sb.auth.signOut();
    });
  }

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
      whatsapp: reservaForm.whatsapp.value.trim(),
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

- [ ] **Step 2: Comprobar la sintaxis**

```bash
node --check script.js
```
Esperado: sin salida (sintaxis correcta).

- [ ] **Step 3: Servir el sitio y comprobar el estado inicial sin sesión**

```bash
cd "C:\Users\udetr\Desktop\ADRI 2"
python -m http.server 8095 --bind 127.0.0.1 --directory "." &
```

Abrir en el Browser pane `http://127.0.0.1:8095/personalizar.html`, elegir
una pieza (para que `getProductoElegido()` no bloquee el botón), luego ir
a `http://127.0.0.1:8095/reservar.html` y ejecutar con `javascript_tool`:

```javascript
JSON.stringify({
  gateVisible: !document.getElementById('login-gate').hidden,
  formOculto: document.getElementById('reserva-form').hidden,
  logoutOculto: document.getElementById('btn-logout').hidden,
});
```

Esperado: `{"gateVisible":true,"formOculto":true,"logoutOculto":true}`.

- [ ] **Step 4: Confirmar por qué la precarga no se prueba aquí**

`mostrarSegunSesion` vive dentro del cierre de `if (reservaForm)` y no se
expuso a `window` a propósito (para no ensuciar el ámbito global con algo
que solo sirve para esta página). Eso significa que no hay forma de
inyectarle una sesión falsa desde fuera sin cambiar el diseño del código
de producción solo para hacerlo testeable, que no compensa aquí.

La prueba real de "el formulario se revela y precarga nombre/email" solo
puede hacerse con una sesión de Google auténtica, así que queda en la
Tarea 6 (prueba de extremo a extremo), una vez el cliente complete la
Tarea 2. Este paso queda anotado como pendiente, no como hecho.

- [ ] **Step 5: Comprobar que enviar sin sesión no revienta**

Con el formulario todavía oculto (sin sesión), confirmar que no hay forma
de dispararlo por accidente:

```javascript
(() => {
  const form = document.getElementById('reserva-form');
  return JSON.stringify({ formTieneHidden: form.hasAttribute('hidden') });
})();
```

Esperado: `{"formTieneHidden":true}`. Al estar oculto con `hidden`, el
navegador no permite que reciba foco ni que se dispare su `submit` por
interacción del usuario, así que no hace falta simular un envío real aquí.

- [ ] **Step 6: Parar el servidor de prueba**

```bash
# En PowerShell:
Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" | Where-Object { $_.CommandLine -like '*8095*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

- [ ] **Step 7: Sincronizar**

```bash
cp "script.js" "deploy/script.js"
diff "script.js" "deploy/script.js"
```
Debe salir vacío.

---

## Task 6: Prueba de extremo a extremo (una vez el cliente complete la Tarea 2)

Esta tarea depende de que el cliente haya terminado la configuración
manual de la Tarea 2. Hasta entonces, queda pendiente y no bloquea nada
más: el código de las tareas 1 a 5 es correcto y verificable por su cuenta.

**Files:**
- Ninguno (solo verificación manual en el navegador real, contra Supabase
  de verdad).

**Interfaces:**
- Consumes: todo lo de las tareas 1 a 5.

- [ ] **Step 1: Confirmar que la Tarea 2 está lista**

Preguntar al cliente si ya activó el proveedor de Google en Supabase
(sección "3. Cómo saber si ya está listo" de `configurar-login-google.md`).

- [ ] **Step 2: Confirmar que la migración v6 está ejecutada**

Preguntar al cliente si ya pegó `supabase-migracion-v6.sql` en el SQL
Editor de Supabase y le dio a Run (no se puede comprobar desde aquí: la
clave `anon` no tiene permiso de lectura sobre `reservas`).

- [ ] **Step 3: Probar el login real**

Servir el sitio en local:

```bash
cd "C:\Users\udetr\Desktop\ADRI 2"
python -m http.server 8080 --bind 127.0.0.1 --directory "deploy"
```

En el Browser pane: entrar en `productos.html`, elegir una pieza, ir a
`reservar.html`, pulsar "Continuar con Google", completar el login real.
Comprobar:
- Vuelve a `reservar.html` con el formulario visible.
- Nombre y email aparecen precargados con los datos de la cuenta usada.
- Aparece el enlace "Cerrar sesión".

- [ ] **Step 4: Probar una reserva real**

Rellenar el resto de campos y enviar. Comprobar en Supabase (Table Editor
→ `reservas`) que la fila nueva tiene `user_id` relleno con un UUID (no
null).

Esta fila de prueba se suma a las que ya estaban pendientes de borrar
(`TEST — borrar`, `TEST MIGRACION — borrar`): anotarla en
`ESTADO-DEL-PROYECTO.md`, sección 8, punto de filas de prueba pendientes,
para no olvidarla en la limpieza final.

- [ ] **Step 5: Probar cerrar sesión**

Pulsar "Cerrar sesión". Comprobar que vuelve a aparecer el aviso de login
y el formulario se oculta.

- [ ] **Step 6: Probar que la sesión persiste al recargar**

Volver a iniciar sesión, recargar la página (F5). Comprobar que entra
directo al formulario, sin pedir login de nuevo.

- [ ] **Step 7: Actualizar el documento de estado**

En `ESTADO-DEL-PROYECTO.md`, marcar `supabase-migracion-v6.sql` como
confirmada (igual que se hizo con v3, v4 y v5), y anotar la fecha en que
quedó funcionando el login real.

---

## Self-review de este plan

- **Cobertura del spec:** login obligatorio (Tarea 3+5), cuenta básica sin
  página propia (no se crea ninguna página nueva, cumplido por omisión),
  precarga editable de nombre/email (Tarea 5, Step 1), botón de cerrar
  sesión (Tareas 3 y 5), gate que tapa el formulario (Tareas 3 y 5),
  columna y política de Supabase (Tarea 1), configuración manual de Google
  (Tarea 2), manejo de errores de login cancelado y de fallo al guardar
  (Tarea 5, ya cubierto por el flujo existente + el nuevo caso de sesión
  caducada). Todo lo del spec tiene tarea.
- **Placeholders:** ninguno; cada paso trae el código completo, no hay
  "TBD" ni "similar a la tarea anterior" sin el código repetido.
- **Consistencia de nombres:** `sesionActual`, `mostrarSegunSesion`,
  `loginGate`, `btnLoginGoogle`, `btnLogout` se usan igual en la Tarea 5;
  los ids `login-gate`, `btn-login-google`, `btn-logout` coinciden entre
  la Tarea 3 (HTML) y la Tarea 5 (JS que los busca con
  `getElementById`).
