# Cozumel — carpeta lista para Netlify

Esta carpeta contiene **solo** lo que debe ser público. Se sube tal cual.

## Cómo desplegar (opción rápida, sin Git)

1. Entra en [app.netlify.com](https://app.netlify.com) e inicia sesión.
2. Ve a **Sites** → arrastra **esta carpeta `deploy`** entera al recuadro
   "Drag and drop your site output folder here".
3. Netlify te da una URL tipo `https://algo-aleatorio.netlify.app`.
4. En **Site configuration → Change site name** puedes ponerle un nombre
   decente antes de pasársela a Adri.

Cada vez que quieras actualizar, vuelves a arrastrar la carpeta.

## Cómo desplegar con Git (si más adelante lo quieres automático)

Si conectas el repositorio entero a Netlify, en la configuración de build pon:

- **Build command:** *(vacío)*
- **Publish directory:** `deploy`

## Qué hay dentro

| Archivo | Qué es |
|---|---|
| `index.html` | Inicio — punto de entrada desde la story |
| `productos.html` | La colección (6 productos) |
| `personalizar.html` | Ficha de producto + banda de grabado |
| `historia.html` | La marca |
| `reservar.html` | Formulario de reserva → Supabase |
| `contacto.html` | Contacto |
| `404.html` | Página de error con la identidad de la marca |
| `productos.js` | **El catálogo. Nombres, textos, fotos y precios.** |
| `img/` | Fotos (hero + producto) |
| `style.css` · `script.js` | Estilos y lógica |
| `supabase-config.js` | URL y clave pública de Supabase |
| `_headers` | Cabeceras de seguridad básicas |

## ⚠️ ANTES DE QUE ESTO FUNCIONE: ejecutar la migración v3

El catálogo tiene 6 productos. **Hasta que no ejecutes
`supabase-migracion-v3.sql` en el SQL Editor de Supabase, la base de datos
rechazará las reservas del Kit** (los otros 5 sí funcionan, si ya corriste v2).
El archivo está un nivel por encima de esta carpeta.

Si cambias un `id` en `productos.js`, hay que actualizar también esa política
o ese producto dejará de poder reservarse.

## Qué se ha quedado FUERA a propósito

- `media_kit_adriana_carballo_2026.pdf` — contiene el teléfono y el email
  personales de Adriana. **Nunca** debe subirse a un sitio público.
- `supabase-schema.sql` — no hace falta en el sitio; se ejecuta en el panel
  de Supabase.
- `style-preview.html`, `direccion-artistica.html`, `landing-preview.html`,
  `logo-preview.html` — bocetos internos de diseño.

## Sobre la clave de Supabase

`supabase-config.js` lleva la clave **publishable/anon**, que está diseñada
para ser pública. Lo que protege los datos son las políticas RLS: se ha
verificado que desde el navegador solo se puede **insertar**, nunca leer,
modificar ni borrar.

La clave `service_role` no está aquí y no debe estar nunca.

## Antes de mandar el enlace a la story

- [ ] **Ejecutar `supabase-migracion-v3.sql`** (si no, el Kit no se puede reservar)
- [ ] Fotos de las 5 piezas que aún dicen "imagen pendiente"
      (solo Collar Destino tiene foto)
- [ ] Precios reales en `productos.js` (todos en `null` ahora mismo)
- [ ] Email e Instagram reales en Contacto ("pendiente de definir")
- [ ] Confirmar con el proveedor el grado del acero y el baño, antes de
      mantener el "no se oxida ni pierde color" de las fichas
- [ ] Borrar de Supabase las filas de prueba (`TEST — borrar`, `TEST MIGRACION`)
