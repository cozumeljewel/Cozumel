# Cozumel Jewelry — estado del proyecto

> Documento de traspaso. Resume qué está hecho, qué falta y las decisiones
> que ya se tomaron, para retomar el trabajo sin releer toda la conversación.

---

## 1. Qué es esto

Prueba de validación de demanda para una marca de joyería personalizada,
vinculada a la influencer **Adriana Carballo**. El tráfico vendrá de una
story de Instagram suya.

**No es una tienda.** No hay pagos ni Stripe. El objetivo es medir
**intención de compra**: cuánta gente llega y cuánta deja sus datos en una
**reserva gratuita**.

**Reservar exige iniciar sesión con Google** (añadido el 2026-08-26, ver
sección 4). Está en el código pero todavía no en producción: falta
completar la configuración manual y ejecutar la migración v6, ver
sección 8.

Métrica que manda: **reservas ÷ visitas**.

**Público objetivo:** hombre joven que busca un regalo para su pareja
(en TikTok Adriana tiene 85% de seguidores hombres, 94% de espectadores).
México es el 36,9% de su audiencia de Instagram; el 66% tiene 18–34 años.

---

## 2. Estado: NO SUBIR deploy/ TODAVÍA (login de Google a medio activar)

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
- Una vez cerrado, **no vuelve a salir nunca** — se guarda en
  `localStorage` (`popupPreventaCerrado`), así sobrevive a cerrar el
  navegador. Para volver a verlo en pruebas:
  `localStorage.removeItem('popupPreventaCerrado')`.
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

**El bloqueo no es solo visual.** La política de Supabase también cambió:
sin sesión, la base de datos rechaza el insert aunque alguien manipule el
JavaScript para forzar el formulario a mostrarse. Ver "Migraciones" en la
sección 6.

**Para activar esto en producción hacen falta dos cosas, las dos
pendientes** (sección 8): ejecutar `supabase-migracion-v6.sql`, y que el
cliente complete `configurar-login-google.md` (crear credenciales en
Google Cloud y activar el proveedor en Supabase). **`deploy/` ya lleva
el login integrado**: subirlo a Netlify antes de terminar esas dos cosas
deja el formulario de reserva inservible para todo el mundo, porque el
botón de Google no tendría con qué autenticar.

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
- **⚠️ `supabase-migracion-v6.sql` NO se ha ejecutado.** Añade `user_id` a
  `reservas` y cambia la política de INSERT: de aquí en adelante hace falta
  sesión de Google para reservar (ver el login en la sección 4). Sin esta
  migración, en cuanto el login esté activo en el sitio, **todas** las
  reservas fallarán al guardar, no solo las de un producto.

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

### Cómo verificar cambios visuales

Hay un patrón de auditoría que se ha usado en cada cambio: recorrer las 12
páginas × 2 anchos (390 y 1440) midiendo contraste en el **peor caso**
(texto justo encima de un trazo de la marca de agua), desbordamiento
horizontal y errores de JS. El objetivo siempre es **0 fallos**.

---

## 8. Lo que falta

### Bloqueante
**No subir `deploy/` a Netlify hasta que estos dos pasos estén hechos.**
El login de Google ya está en `deploy/`: sin ellos, el formulario de
reserva queda inservible para todo el mundo en cuanto se publique (ver
sección 4).

1. **Ejecutar `supabase-migracion-v6.sql`** en el SQL Editor de Supabase.
   Sin ella, todas las reservas fallarán al guardar, no solo las de un
   producto.
2. **Completar `configurar-login-google.md`.** Son pasos manuales que solo
   puede hacer el cliente (crear credenciales OAuth en Google Cloud,
   activar el proveedor en Supabase). Sin esto, pulsar "Continuar con
   Google" saca al visitante del sitio y lo deja en una pantalla de error
   de Supabase, fuera de `cozumeljewelry.es` (ver el final de
   `configurar-login-google.md`).

Hecho lo anterior, falta un paso más antes de anunciar el lanzamiento:
probar una reserva real de principio a fin (ver la Tarea 6 del plan de
implementación, todavía sin hacer).

### Contenido (decisiones del cliente)
2. **Fotos de 6 de los 7 productos.** Solo Collar Destino tiene
   (`img/collar-destino.png`). Las demás muestran "imagen pendiente".
   Se añaden guardando los archivos en `img/` **y** `deploy/img/`, y
   poniendo `fotos: ['img/a.png', 'img/b.png']` en `productos.js`. Sin
   espacios ni acentos en los nombres. Ahora la ficha admite **varias por
   pieza**: conviene pedirlas cuadradas, que la galería las muestra así.
3. **Precios.** Todos en `null` → sale "Precio pendiente". Ojo: el Kit
   promete "10% de descuento", así que su precio debe cuadrar con eso.
4. **Email e Instagram** reales en Contacto.
5. **Imagen de previsualización al compartir** (og:image, 1200×630). Sin
   ella, el enlace en la story sale con texto pero sin imagen.

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
    y `TEST MIGRACION — borrar` en `reservas`, y algún `view` de prueba
    en `eventos`.
12. ~~La caja de regalo del Kit Mi Consentida~~ **DECIDIDO (2026-08-26).**
    Se arranca con el packaging estándar de EMANCO, que ya sirve como caja
    de regalo, y se pasa al personalizado con el logo cuando suba el
    volumen. La línea "Envío en caja especial de regalo" se queda.

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
