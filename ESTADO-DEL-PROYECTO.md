# Cozumel Jewelry — estado del proyecto

> Documento de traspaso. Resume qué está hecho, qué falta y las decisiones
> que ya se tomaron, para retomar el trabajo sin releer toda la conversación.

---

## 1. Qué es esto

Prueba de validación de demanda para una marca de joyería personalizada,
vinculada a la influencer **Adriana Carballo**. El tráfico vendrá de una
story de Instagram suya.

**Es una tienda real.** El sitio cobra con Stripe Checkout. Los precios
todavía no están definidos (ver sección 8), pero toda la infraestructura de
cobro ya funciona: en cuanto se rellenen en `productos.js`, el sitio
empieza a vender sin más cambios de código.

**Reservar exige iniciar sesión con Google** (añadido el 2026-08-26,
probado con una cuenta real el 2026-08-27, ver sección 4).

Métrica que manda: **reservas ÷ visitas**.

**Público objetivo:** hombre joven que busca un regalo para su pareja
(en TikTok Adriana tiene 85% de seguidores hombres, 94% de espectadores).
México es el 36,9% de su audiencia de Instagram; el 66% tiene 18–34 años.

---

## 2. Estado: LISTO PARA DESPLEGAR (con contenido pendiente)

**Login con Google probado de principio a fin el 2026-08-27**, con una
cuenta real: entra, precarga nombre y email, reserva, guarda con
`user_id`, cierra sesión. Ya se puede subir `deploy/` a Netlify.

- **Dominio:** `cozumeljewelry.es` — DNS propagado, HTTPS con certificado
  Let's Encrypt válido, sirviendo desde Netlify. **Funcionando.**
- **Netlify:** proyecto `cerulean-malasada-16bc9f.netlify.app`
- **Supabase:** proyecto `ddcrkglgdbasbxanbjkc`, tablas y seguridad
  verificadas contra la base real.

---

## 3. Cómo se despliega

La carpeta **`deploy/`** es lo único que se sube. Se arrastra entera a
Netlify (Deploys → drag & drop). Todo lo demás del proyecto se queda fuera
a propósito.

**Nunca subir:** `media_kit_adriana_carballo_2026.pdf` (lleva el teléfono y
el email personales de Adriana), los `.sql`, ni los bocetos de diseño
(`logo-preview.html`, `direccion-artistica.html`, etc.).

### Cómo probar en local (importante)

```bash
python -m http.server 8080 --bind 127.0.0.1 --directory "C:\Users\udetr\Desktop\ADRI 2\deploy"
```

Usar **siempre `--directory`**, no `cd`. Ya pasó dos veces que un servidor
antiguo seguía vivo en el puerto y servía la raíz del proyecto en vez de
`deploy/` — y en la raíz está el PDF privado. **Verificar siempre** que
`/media_kit_adriana_carballo_2026.pdf` devuelve **404** antes de dar por
buena una comprobación.

---

## 4. Estructura del sitio

| Página | Contenido |
|---|---|
| `index.html` | Hero con foto de Adriana. Entrada desde la story. |
| `productos.html` | La colección — 6 productos, rejilla 3+3 |
| `personalizar.html` | Ficha de producto (`?p=slug`) + banda de grabado |
| `historia.html` | "Quiénes somos" |
| `reservar.html` | Formulario de reserva → Supabase |
| `contacto.html` | Contacto (el formulario **no envía nada** todavía) |
| `404.html` | Error, con identidad de marca |

**Sin frameworks.** HTML + CSS + JS vanilla. Mobile-first.

### Pop-up de preventa

Modal "Un Pedacito de Mí" — anuncia la primera colección y la edición
limitada a **100 piezas**. Lo inyecta `script.js`, así que no hay que
tocar los HTML: aparece en todas las páginas automáticamente.

- Sale a los **700 ms** de cargar (dar tiempo a que pinte la página).
- Diseño original: una vez cerrado, no vuelve a salir nunca (se guarda en
  `localStorage`, clave `popupPreventaCerrado`).
  **⚠️ TEMPORAL (2026-08-27, pedido del cliente): ahora mismo sale en
  cada entrada**, durante esta promoción. Es `MOSTRAR_SIEMPRE = true` en
  `script.js`, justo donde arranca el pop-up. El cliente avisará cuándo
  volver a `false` para que recupere el comportamiento de "una vez y no
  más".
- **No sale en `reservar.html`** a propósito: ahí la persona ya está
  rellenando el formulario y un aviso que la devuelve a la colección
  trabaja en contra de la conversión que estamos midiendo.
- Se cierra con la ×, con Escape, pulsando fuera, o con el botón
  "Ver la colección".

**Detalle técnico que costó un bug:** la animación de entrada NO puede
usar `requestAnimationFrame` — no se ejecuta en pestañas en segundo plano,
y el pop-up se quedaría invisible bloqueando el scroll. Se fuerza un
reflow (`void capa.offsetWidth`) en su lugar.

### Login con Google (reservar.html, añadido el 2026-08-26)

Reservar exige haber iniciado sesión con Google. Encima del formulario hay
un aviso ("Continuar con Google") que tapa los campos hasta que hay
sesión; nombre y email se autocompletan desde la cuenta de Google
(editables), y hay un enlace de "Cerrar sesión" junto al formulario.

Esto es solo la primera de tres piezas hacia gestionar pedidos reales, ver
[el diseño](docs/superpowers/specs/2026-08-26-google-login-design.md) y
[el plan de implementación](docs/superpowers/plans/2026-08-26-google-login.md).
Las otras dos (email de "pedido recibido" y el paso de "reserva" a
"pedido") no están empezadas.

**Nota para cuando se construya el email de "pedido recibido":** el
cliente indicó (2026-08-27) que las notificaciones internas de pedidos
tienen que llegar a `cozumeljewel@gmail.com`. Es distinto del email de
`auth.users` de cada comprador (ese es a quien se le confirmaría SU
pedido); `cozumeljewel@gmail.com` es la bandeja de la marca, donde se
enteran de que ha entrado uno nuevo.

**El bloqueo no es solo visual.** La política de Supabase también cambió:
sin sesión, la base de datos rechaza el insert aunque alguien manipule el
JavaScript para forzar el formulario a mostrarse. Ver "Migraciones" en la
sección 6.

**Probado de principio a fin con una cuenta real (2026-08-27):** entra,
precarga nombre y email, reserva, guarda con `user_id` en Supabase, cierra
sesión. Migración v6 ejecutada y `configurar-login-google.md` completado.
Ya se puede subir `deploy/` a Netlify.

**No hay página de "mis pedidos".** Se decidió adrede al diseñar esta
pieza: la cuenta solo identifica el pedido, nada más. El cliente lo
volvió a preguntar el 2026-08-27 tras probarlo; si se quiere añadir,
es un diseño aparte (no una extensión rápida de esto).

### Página de producto (estructura actual, rehecha el 2026-08-26)

1. Nombre del producto + olas debajo
2. **Galería de fotos**: varias por pieza, a lo ancho, con scroll lateral
3. **Descripción** (una sola columna centrada, también en escritorio)
4. **Personalización**, solo si la pieza se graba
5. **Compra**: precio + "Envío gratis" + CTA, todo junto
6. Bloque de confianza

**No hay previsualización en vivo del grabado** — se quitó a propósito.

#### Las cartitas del Collar Destino

Dentro de la caja va una carta distinta según el mes de nacimiento que
eligió el cliente. En la web se enseña **la del mes seleccionado**, debajo
del selector, y cambia sola al tocar otro mes: quien compra ve lo que va a
recibir la otra persona.

Están en `productos.js`, en `CARTITAS`, con el texto acortado a partir del
PDF del cliente (`cozumel-cartitas-collar-destino.pdf`). Todas cierran con
`CARTITA_CIERRE`. Aparecen en cualquier pieza con campo `mes`, o sea el
Collar Destino y el Kit Mi Consentida.

**Los nombres de los tonos (decidido el 2026-08-26).** Mandan los del PDF,
y van **siempre con "Color" delante**: "Color granate", "Color amatista".
La palabra no es decorativa: la pieza es de acero, y sin ella parecería que
lleva la piedra de verdad.

El nombre vive **solo en `MESES_NATAL`**. La cartita lo lee de ahí para
componer su título, así que la etiqueta del selector y la de la carta no
pueden volver a decir cosas distintas.

Al renombrar hubo que **retocar tres tonos** (enero, junio y julio): eran
los de otra piedra y el punto de color habría contradicho a la etiqueta
(junio salía morado con la etiqueta "Color perla"). Los 12 tonos siguen
**sin confirmar con EMANCO**.

#### La galería

Las fotos se declaran en `productos.js` con `fotos: ['img/a.png', ...]`, en
orden; la primera es la que se ve al entrar. El campo antiguo `foto`
(una sola) sigue funcionando. Si no hay ninguna, sale el degradado marino
con el aviso "imagen pendiente".

Cada foto va **entera** (`contain`), con el degradado debajo, y lleva el
mismo **marco difuminado** que el hero: se funde hacia dentro por los cuatro
lados sin recortar nada. Los puntos de debajo solo aparecen con 2 fotos o
más.

**Dos detalles que costaron un rato:**

- El ancho de la tarjeta va en **píxeles fijos**, y el padding de la pista
  atado a él con `calc(50% - mitad)`. No se puede poner el `flex-basis` en
  porcentaje: se calcula sobre la caja **ya sin padding**, así que los dos
  porcentajes se multiplican y la foto sale a la mitad de tamaño y
  descentrada. Ese padding es lo que permite que la primera y la última
  foto lleguen al centro.
- El punto activo se actualiza con `setTimeout`, **nunca con
  `requestAnimationFrame`**: rAF no corre en pestañas en segundo plano y los
  puntos se quedarían congelados. Es el mismo bug que ya costó una vez en el
  pop-up de preventa.

---

## 5. El catálogo — `productos.js`

Es el **único** sitio donde se tocan los productos. Editar ahí se refleja
en todas las páginas.

| id (Supabase) | Nombre | Grabado |
|---|---|---|
| `collar_esencial` | Collar Esencia | nombre + fecha + mensaje |
| `pulsera_vinculo` | Pulsera Dos Almas | — (sin grabado) |
| `pulsera_nombre` | Pulsera Mi Cielo | grabado libre |
| `brazalete_mensaje` | Brazalete Eterno | grabado libre |
| `collar_flor_natal` | Collar Destino | mes de nacimiento (color) |
| `kit_pedacito_nosotros` | Kit El Pedacito de Nosotros | nombre + fecha + mensaje |
| `kit_mi_consentida` | Kit Mi Consentida | mes de nacimiento + grabado libre |

**Los `id` y `slug` NO coinciden con los nombres nuevos** (ej. "Pulsera Dos
Almas" tiene id `pulsera_vinculo`). Es deliberado: cambiarlos obligaría a
otra migración de Supabase. Es invisible para el usuario.

Campos opcionales de ficha: `parrafos`, `caracteristicas`, `cierre`,
`oferta`, `foto`.

**Las 6 fichas se reescribieron el 2026-08-26.** El texto anterior (del
cliente) abría 4 de las 6 con la misma frase, "Somos un pedacito de lo que
regalamos", y cerraba 3 con ella otra vez: leídas seguidas parecían
plantilla. El texto nuevo le da a cada pieza su propia voz y habla a quien
compra de verdad, un chico buscando regalo para su pareja (85% de la
audiencia de Adriana son hombres). La frase de marca sigue viva en el hero
y en el pie de todas las páginas.

---

## 6. Supabase

**Tabla `reservas`:** id, created_at, nombre, apellidos, email, whatsapp, pais,
direccion_envio, personalizacion (jsonb), producto, fuente, estado,
consentimiento, session_id

**Tabla `eventos`:** id, created_at, evento, session_id, fuente, producto

### Seguridad (verificado contra la base real)

- La clave `anon` va en el JS del cliente. **Es pública por diseño**; lo que
  protege los datos son las políticas RLS.
- **Solo se permite INSERT.** Sin políticas de SELECT/UPDATE/DELETE: nadie
  puede leer los emails ni los teléfonos desde el navegador. Comprobado:
  un `select` devuelve 0 filas.
- El `with check` obliga a que `producto`, `fuente`, `estado` y
  `consentimiento` tengan los valores correctos, aunque alguien manipule
  el JavaScript.
- La clave `service_role` **nunca** va en el frontend.

### Migraciones

- **`supabase-migracion-v3.sql`** (política RLS del Kit): según el cliente,
  ya ejecutada (confirmado 2026-08-26). No se ha podido verificar desde
  aquí porque la clave `anon` solo permite INSERT, nunca SELECT.
- **`supabase-migracion-v4.sql`** (columnas `apellidos` y `direccion_envio`
  en `reservas`, necesarias para el Excel de pedidos, ver más abajo): según
  el cliente, ya ejecutada (confirmado 2026-08-26). Tampoco verificable
  desde aquí por el mismo motivo.
- **`supabase-migracion-v5.sql`** (añade `kit_mi_consentida` a la lista de
  productos permitidos; sustituye a la política de la v3, su lista ya trae
  los 7): según el cliente, ya ejecutada (confirmado 2026-08-26). No
  verificable desde aquí por el mismo motivo que las anteriores.
- **`supabase-migracion-v6.sql`** (añade `user_id` a `reservas`, exige
  sesión de Google para reservar): ejecutada y probada con una cuenta real
  (confirmado 2026-08-27, ver sección 4).
- **`supabase-migracion-v7.sql`** (añade `precio_pagado` y
  `stripe_session_id`, cambia la política de INSERT a
  `estado = 'pendiente_pago'`, añade políticas de SELECT y UPDATE, y mueve
  el disparador del email a "pasar a `estado = 'pagado'`"): según el
  cliente, ejecutada (confirmado 2026-08-28).

Regla: **cada vez que se añade o renombra un `id` en `productos.js`, hay que
repetir la migración v3** con la lista actualizada.

### Exportar los pedidos a Excel

Nombre, apellidos, dirección de envío, producto y personalización (la
opción de grabado elegida, si la hay) ya están todos en la tabla `reservas`.
Para sacarlos: en Supabase Studio → **Table Editor → reservas** → botón
**Export to CSV** (arriba a la derecha de la tabla). El CSV se abre
directamente en Excel. La columna `personalizacion` sale como texto JSON
en bruto (ej. `{"nombre":"Ana","fecha":"14.02.2024"}`); si hace falta que
salga en columnas separadas y legibles, se puede automatizar más adelante,
pero de momento es manual.

### Embudo

Eventos: `view` → `personalizacion_iniciada` → `reserva_iniciada` →
`reserva_completada`. Se cuentan una vez **por producto**, no por sesión.

```sql
select evento, count(distinct session_id) as personas
from eventos group by evento;
```

---

## 7. Diseño

**Paleta marina** (de superficie a profundidad): espuma `#F2F8F8`, bajío
`#E3EFF1`, turquesa `#A8D5D2`, mar `#4E9A9B`, profundidad `#14454A`,
fondo marino `#0B2E33`. Metales: oro `#C6A664` y plata `#B9C9CC`.

**Tipografía:** Playfair Display (titulares) + Jost (texto).

**Marca de agua:** el emblema del ojo, en turquesa al 20%, uno por página.

**Motivo de olas:** una sola línea ondulada. Aparece bajo el logo, bajo los
títulos de sección y en el pie.

### Reglas de color aprendidas (importantes)

- **El oro sobre fondo claro da 2,3:1 de contraste** — sirve para filetes y
  gráficos, **nunca para texto**. Texto dorado solo sobre fondo oscuro.
- **El plateado como texto sobre claro da 1,59:1** — ilegible. Solo líneas.
- La insignia de "edición de lanzamiento" usa `#7A5F2A`, un oro oscurecido
  a propósito para llegar a 4,5:1.

### Regla aprendida: `hidden` contra `display` (ha costado dos bugs)

Si un elemento se oculta con `elemento.hidden = true` desde JS, pero su
propia regla CSS le pone `display` distinto de `none` (flex, block...),
**ese `display` gana siempre**, aunque `[hidden]` sea del navegador y
parezca que debería mandar. El elemento se queda visible con el atributo
puesto, mintiendo sobre su propio estado.

Ya pasó con `#reserva-form` (el login se podía saltar) y con
`#tel-combo-panel` (el desplegable de prefijo no cerraba nunca). La regla:
**todo elemento con `display` propio que además se oculte con `.hidden` en
JS necesita su `#id[hidden]{display:none;}` al lado**, mismo patrón que ya
tiene `.grabado-banda[hidden]`. Al añadir un elemento nuevo que se
oculte así, comprobarlo con `getComputedStyle(el).display === 'none'`,
nunca solo con `el.hidden === true` (eso no demuestra que se vea o no).

### Cómo verificar cambios visuales

Hay un patrón de auditoría que se ha usado en cada cambio: recorrer las 12
páginas × 2 anchos (390 y 1440) midiendo contraste en el **peor caso**
(texto justo encima de un trazo de la marca de agua), desbordamiento
horizontal y errores de JS. El objetivo siempre es **0 fallos**.

---

## 8. Lo que falta

### Bloqueante
Ninguno. Migración v6 ejecutada, login de Google configurado y **probado
de principio a fin con una cuenta real** (2026-08-27): entra, precarga
nombre y email, reserva, guarda con `user_id`, cierra sesión. Ya se puede
subir `deploy/` a Netlify.

Queda una fila de prueba en `reservas` de esa prueba real, pendiente de
borrar junto con las demás (ver el punto de filas de prueba, más abajo).

### Contenido (decisiones del cliente)
2. **Fotos de 6 de los 7 productos.** Solo Collar Destino tiene
   (`img/collar-destino.png`). Las demás muestran "imagen pendiente".
   Se añaden guardando los archivos en `img/` **y** `deploy/img/`, y
   poniendo `fotos: ['img/a.png', 'img/b.png']` en `productos.js`. Sin
   espacios ni acentos en los nombres. Ahora la ficha admite **varias por
   pieza**: conviene pedirlas cuadradas, que la galería las muestra así.
3. **Precios.** Todos en `null` → sale "Precio pendiente". Ojo: el Kit
   promete "10% de descuento", así que su precio debe cuadrar con eso.
4. **Email real en Contacto: hecho (2026-08-27)**, `cozumeljewel@gmail.com`.
   **Instagram** sigue pendiente de definir.
5. ~~La imagen de previsualización al compartir~~ **HECHO (2026-08-27).**
   `img/og-image.png`, 1200×630: emblema, COZUMEL JEWELRY y "Regala un
   pedacito de ti" sobre fondo espuma, con el mismo lenguaje visual que la
   cabecera. No usa foto de producto (no hay ninguna todavía) ni la foto
   del hero (lleva texto quemado, ver riesgo 8). En las 6 páginas con
   `og:description`; `404.html` no lleva.

### Riesgos señalados y no resueltos
6. **Las fichas afirman "Acero inoxidable, no se oxida ni pierde color con
   el uso diario".** No se ha confirmado con el proveedor ni el grado
   (316L vs 304) ni el tipo de baño. Es una promesa al cliente: conviene
   verificarla antes de que llegue tráfico real.
7. ~~El grabado a mano~~ **RESUELTO (2026-08-26).** Se preguntó a EMANCO y
   confirman que **graban a mano**. La afirmación se queda tal cual está en
   las fichas, en la banda de grabado, en el bloque de confianza y en el
   pop-up. No hace falta tocar nada.
8. **La foto del hero tiene el logo y un eslogan QUEMADOS en el JPG**
   (logo del 7,5% al 14,4% de la altura; eslogan del 90,6% al 94,2%,
   medido píxel a píxel). Se intentó recortar y el resultado no gustó.
   **La solución real es reexportar la foto sin texto.**
9. **La preventa promete "edición limitada a 100 piezas".** Es una
   afirmación de escasez concreta y visible en el pop-up: conviene que el
   número sea real y se respete, porque una escasez falsa es un problema
   de consumo, no solo de marketing.
10. **El formulario de Contacto no envía nada.** Es solo maqueta.
11. **Filas de prueba en Supabase** pendientes de borrar: `TEST — borrar`
    y `TEST MIGRACION — borrar` en `reservas`, la reserva real de prueba
    de la Tarea 6 del login (2026-08-27, con `user_id` relleno), y algún
    `view` de prueba en `eventos`.
12. ~~La caja de regalo del Kit Mi Consentida~~ **DECIDIDO (2026-08-26).**
    Se arranca con el packaging estándar de EMANCO, que ya sirve como caja
    de regalo, y se pasa al personalizado con el logo cuando suba el
    volumen. La línea "Envío en caja especial de regalo" se queda.
13. **Pago cancelado crea una fila nueva al reintentar**, en vez de
    reanudar la misma. Cada cancelación en Stripe deja una fila huérfana en
    `pendiente_pago` (el `reserva_id` no se recuerda entre reintentos). No
    afecta al cobro (nunca se cobra dos veces), pero ensucia la tabla: al
    exportar pedidos a Excel, filtrar siempre por `estado = 'pagado'`.
14. **Pendientes de "hacerlo real" antes de lanzar con dinero real**
    (aplazado el 2026-08-28, revisar cuando Stripe esté activo y probado):
    - Página de política de privacidad (con login de Google y datos de
      envío guardados, casi obligatoria legalmente)
    - Página de términos y condiciones (plazos de envío, devoluciones)
    - Banner de cookies (revisar si hace falta según qué analítica se use)
    - Texto alternativo (`alt`) en las imágenes de producto, casi ninguna
      lo lleva ahora mismo
    - `sitemap.xml`, para que Google indexe las páginas más rápido
    - Comprimir las fotos de producto al subirlas (punto 2 de esta misma
      lista)
    - Repasar que no quede ningún enlace roto tras el cambio de
      `reservar.html` a `comprar.html`

---

## 9. Sourcing (fase aparte, sin código)

Las piezas salen de **EMANCO** en Alibaba (acero inoxidable con baño PVD).
Instagram del proveedor: `emanco.Sammi` y `emancojewelry`.

Ojo: son **5 referencias, no 7**. Los dos kits son combinaciones de piezas
que ya existen, así que no hay que abastecer nada nuevo para venderlos.

### Confirmado con el proveedor (conversación del 2026-08-26)

- **Dropshipping:** envían directos al cliente final, **sin mínimo por
  modelo**, y pueden empaquetar sin su logo.
- **Logo en el packaging: sí.** Se empieza con packaging estándar y se pasa
  al personalizado cuando suba el volumen. MOQ, plazos y arte del packaging
  personalizado se hablan más adelante.
- **Pedidos por Excel: sí.** Se les manda una hoja con todos los pedidos
  (dirección de envío + personalización de cada uno) y lo procesan por
  lotes. Es exactamente el flujo que alimenta la exportación de Supabase
  de la sección 6, y valida los campos `apellidos` y `direccion_envio`.
- **Plazo: 5 a 7 días** de envío según ellos. **Decisión (2026-08-26): se
  comunicará como "envío en 7 días laborables".** Todavía NO está puesto en
  ninguna página, es solo la cifra acordada para cuando toque ponerla.
- **Grabado a mano: confirmado por el proveedor** (2026-08-26). También
  confirman que pueden grabar textos concretos (se validó "Adri Carballo"
  en pulseras y "Adri ❤️" en collares) y que garantizan grabado y envío
  correctos **en pedidos de hasta 200 piezas**.
- **Primera muestra enviada el 2026-08-26.**

### Sigue sin confirmar

- **El grado del acero (316L vs 304)** y el tipo de baño. Es lo único que
  queda por confirmar de las promesas del sitio: sostiene el "no se oxida ni
  pierde color" que hacen las 7 fichas. Buen momento para preguntarlo, ya
  que hay conversación abierta con ellos.
- Certificado de material y calidad en mano antes de comprometer stock.

---

## 10. Preferencias del cliente (aprendidas)

- **Nada de emoticonos** en la interfaz. Los iconos son SVG de línea.
- **Nada de rayas (—) en los textos.** Le parecen "de ChatGPT". Se usan
  dos puntos, comas o paréntesis según pida la frase. En los títulos de
  pestaña, el separador es el punto medio (·).
- **Nada de puntos finales en los textos de la interfaz** ("es una página
  web, no un libro"). Se quita el punto que cierra cada bloque de texto
  (títulos, párrafos cortos, botones, meta descripciones): titulares,
  taglines, badges, notas de formulario, mensajes de error. Dentro de un
  párrafo largo con varias frases, los puntos internos se mantienen para
  que se pueda leer; solo se quita el último.
- Estética: artesanal, femenina, emocional, premium, cercana.
  **Nunca** parecer AliExpress, Shein o dropshipping.
- Todo centrado y con aire; 56px entre la barra superior y el contenido.
- Prefiere ver los cambios en local antes de subirlos.
- El eslogan de marca es **"Cozumel, somos un pedacito de lo que regalamos"**
  y aparece en el pie de todas las páginas.
