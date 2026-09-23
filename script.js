/* ---------- Página actual (nav activo + qué trackear) ---------- */
const CURRENT_PAGE = document.body.dataset.page || '';

/* ---------- Sesión anónima (solo para medir el embudo) ---------- */
function getSessionId() {
  let id = sessionStorage.getItem('sid');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('sid', id);
  }
  return id;
}

/* ---------- Cliente Supabase ---------- */
const SUPA_READY =
  typeof SUPABASE_URL === 'string' &&
  typeof SUPABASE_ANON_KEY === 'string' &&
  !SUPABASE_URL.includes('TU-PROYECTO');

let sb = null;
if (SUPA_READY && window.supabase) {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn('Supabase no configurado todavía: rellena supabase-config.js. Los eventos y reservas no se están guardando.');
}


/* =========================================================
   SELECCIÓN DE PRODUCTO
   La pieza elegida viaja entre páginas en sessionStorage.
   ========================================================= */
function getProductoElegido() {
  if (typeof PRODUCTOS === 'undefined') return null;
  const id = sessionStorage.getItem('productoId');
  return PRODUCTOS.find(p => p.id === id) || null;
}

function setProductoElegido(prod) {
  sessionStorage.setItem('productoId', prod.id);
}

/* =========================================================
   CARRITO
   Varias piezas en un mismo pedido, cada una ya configurada (producto +
   su personalización, acabado incluido). En localStorage a propósito —
   a diferencia de sessionStorage, sobrevive a cerrar la pestaña, así que
   si alguien vuelve más tarde no pierde lo que llevaba añadido.

   Cada elemento: { producto: 'collar_esencial', personalizacion: {...} }.
   El precio NUNCA se guarda aquí: se relee en comprar.html desde
   productos.js para mostrarlo, y la fuente de verdad real al cobrar sigue
   siendo PRECIOS en el servidor (ver crear-sesion-pago), igual que ya
   pasaba con una sola pieza — el carrito no cambia esa garantía.
   ========================================================= */
const CARRITO_KEY = 'cozumel_carrito';

/* Cada línea del carrito guarda, además de la pieza y su grabado, el
   mercado y el precio con los que se añadió:

     { producto, variante, cantidad, mercado, moneda, precio, personalizacion }

   El precio guardado NO es el que manda al cobrar (eso lo recalcula el
   servidor): sirve para detectar que se cambió de país y refrescar la
   línea. Las líneas antiguas, de antes de los mercados, se completan al
   vuelo para que a nadie se le vacíe el carrito con esta versión. */
function getCarrito() {
  try {
    const items = JSON.parse(localStorage.getItem(CARRITO_KEY));
    if (!Array.isArray(items)) return [];
    return items.map(normalizarItemCarrito);
  } catch {
    return [];
  }
}

function normalizarItemCarrito(item) {
  if (!item || typeof item !== 'object') return item;
  const pers = item.personalizacion || {};
  const linea = {
    producto: item.producto,
    // La "variante" es lo que distingue dos unidades de la misma pieza:
    // hoy, el acabado (y el de cada pieza en los kits).
    variante: item.variante || Object.keys(pers)
      .filter(k => k.startsWith('acabado'))
      .sort()
      .map(k => k + '=' + pers[k])
      .join(','),
    cantidad: typeof item.cantidad === 'number' && item.cantidad > 0 ? item.cantidad : 1,
    mercado: item.mercado || null,
    moneda: item.moneda || null,
    precio: typeof item.precio === 'number' ? item.precio : null,
    personalizacion: pers,
  };
  return linea;
}

/* Reprecia el carrito al mercado activo. Se llama al cambiar de país: no
   se tocan ni las piezas ni sus grabados, solo mercado/moneda/precio. */
function repreciarCarrito() {
  if (typeof PRODUCTOS === 'undefined' || typeof precioDe !== 'function') return;
  const items = getCarrito();
  if (!items.length) return;
  let cambio = false;
  const nuevos = items.map(item => {
    const prod = PRODUCTOS.find(p => p.id === item.producto);
    const precio = prod ? precioDe(prod) : null;
    if (!precio) return item;
    if (item.mercado === precio.mercado && item.precio === precio.importe) return item;
    cambio = true;
    return { ...item, mercado: precio.mercado, moneda: precio.moneda, precio: precio.importe };
  });
  if (cambio) guardarCarrito(nuevos);
}

function guardarCarrito(items) {
  localStorage.setItem(CARRITO_KEY, JSON.stringify(items));
  actualizarBadgeCarrito();
}

function añadirAlCarrito(item) {
  const items = getCarrito();
  items.push(item);
  guardarCarrito(items);
  return items;
}

function quitarDelCarrito(indice) {
  const items = getCarrito();
  items.splice(indice, 1);
  guardarCarrito(items);
  return items;
}

function vaciarCarrito() {
  guardarCarrito([]);
}

/* Insignia con el número de piezas, sobre el icono del carrito del header
   (mismo elemento en las 12 páginas: .header-carrito). Se añade por JS en
   vez de tocar cada HTML, así que no puede faltar en ninguna página que
   cargue script.js. */
function actualizarBadgeCarrito() {
  const n = getCarrito().length;
  document.querySelectorAll('.header-carrito').forEach(a => {
    let badge = a.querySelector('.header-carrito-badge');
    if (n > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'header-carrito-badge';
        a.appendChild(badge);
      }
      badge.textContent = String(n);
    } else if (badge) {
      badge.remove();
    }
  });
}
actualizarBadgeCarrito();

/* =========================================================
   PASE DE FOTOS DE COZUMEL STORIES (index.html)
   Cada historia va cambiando de foto sola, con un fundido largo. Mismo
   mecanismo que el de "Arma tu kit": dos capas superpuestas: la de abajo
   carga la siguiente foto y se funde encima de la de arriba.

   Detalles pensados a propósito:
     · Los seis pases arrancan DESFASADOS entre sí. Si cambiaran todos a
       la vez, la sección entera parpadearía y se notaría el truco.
     · Se para cuando la pestaña no está a la vista (no gasta datos ni
       batería) y cuando el sistema pide menos movimiento.
     · Si el navegador no ejecuta el JS, se queda la primera foto fija:
       el HTML ya la trae puesta.
   ========================================================= */
(function () {
  const PASE_MS = 4000;          // cuánto se queda cada foto (4 s, pedido del cliente)
  const DESFASE_MS = 900;        // separación entre una historia y la siguiente
  const historias = document.querySelectorAll('.stories-foto[data-pase]');
  if (!historias.length) return;

  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

  historias.forEach((caja, indice) => {
    const capaA = caja.querySelector('.stories-foto-capa');
    if (!capaA) return;

    const imgA = capaA.querySelector('img');
    const siguientes = (caja.dataset.fotos || '').split('|').map(f => f.trim()).filter(Boolean);
    if (!imgA || !siguientes.length) return;

    // Todas las fotos de esta historia, empezando por la que ya se ve.
    const fotos = [{ src: imgA.getAttribute('src'), alt: imgA.getAttribute('alt') }]
      .concat(siguientes.map(src => ({ src, alt: imgA.getAttribute('alt') })));

    // Segunda capa, idéntica a la primera pero transparente: es la que
    // entra en cada cambio.
    const capaB = capaA.cloneNode(true);
    const imgB = capaB.querySelector('img');
    imgB.removeAttribute('src');
    imgB.alt = '';
    capaB.setAttribute('aria-hidden', 'true');
    capaA.classList.add('visible');
    capaB.classList.remove('visible');
    capaA.parentNode.insertBefore(capaB, capaA.nextSibling);
    caja.classList.add('pase-listo');

    let visible = capaA;
    let indiceFoto = 0;
    let temporizador = null;

    const mostrar = (foto) => {
      const entra = visible === capaA ? capaB : capaA;
      const imgEntra = entra.querySelector('img');
      // Se descarta un cambio anterior que siguiera esperando su foto:
      // si no, al resolverse los dos se apagarían entre sí.
      capaA.querySelector('img').onload = null;
      capaB.querySelector('img').onload = null;
      imgEntra.src = foto.src;
      imgEntra.alt = foto.alt || '';

      const cambiar = () => {
        entra.classList.add('visible');
        const sale = entra === capaA ? capaB : capaA;
        sale.classList.remove('visible');
        sale.setAttribute('aria-hidden', 'true');
        sale.querySelector('img').alt = '';
        entra.removeAttribute('aria-hidden');
        visible = entra;
      };
      if (imgEntra.complete && imgEntra.naturalWidth) cambiar();
      else imgEntra.onload = cambiar;
    };

    const arrancar = () => {
      clearInterval(temporizador);
      temporizador = null;
      if (sinMovimiento.matches || fotos.length < 2) return;
      temporizador = setInterval(() => {
        if (document.hidden) return;
        indiceFoto = (indiceFoto + 1) % fotos.length;
        mostrar(fotos[indiceFoto]);
      }, PASE_MS);
    };

    // El desfase hace que no cambien todas a la vez.
    setTimeout(arrancar, indice * DESFASE_MS);
    sinMovimiento.addEventListener('change', arrancar);
  });
})();

/* =========================================================
   SELECTOR DE PAÍS / MONEDA
   Va en el header (junto al carrito) y en el menú móvil. Se inyecta por
   JS, igual que la insignia del carrito, para no tener que tocar las 12
   páginas y para que no pueda faltar en ninguna.

   Al cambiar de país: se guarda la elección (a partir de ahí la IP ya no
   la pisa), se repuntúan las líneas del carrito y se recarga la página.
   La recarga es a propósito: es la forma más simple de garantizar que NO
   quede ni un precio viejo en pantalla, y no se pierde nada porque el
   carrito y el grabado viven en localStorage/sessionStorage.
   ========================================================= */
function pintarSelectorMercado() {
  if (typeof MERCADOS === 'undefined') return;

  const crear = () => {
    const caja = document.createElement('div');
    caja.className = 'mercado-selector';

    const etiqueta = document.createElement('label');
    etiqueta.className = 'sr-only';
    const id = 'mercado-select-' + Math.random().toString(36).slice(2, 8);
    etiqueta.setAttribute('for', id);
    etiqueta.textContent = 'País y moneda';

    const select = document.createElement('select');
    select.className = 'mercado-select';
    select.id = id;
    Object.keys(MERCADOS).forEach(codigo => {
      const op = document.createElement('option');
      op.value = codigo;
      op.textContent = MERCADOS[codigo].pais + ' · ' + MERCADOS[codigo].moneda;
      select.appendChild(op);
    });
    select.value = getMercado();
    select.addEventListener('change', () => {
      setMercado(select.value);
      repreciarCarrito();
      window.location.reload();
    });

    caja.append(etiqueta, select);
    return caja;
  };

  const acciones = document.querySelector('.header-acciones');
  if (acciones && !acciones.querySelector('.mercado-selector')) {
    acciones.insertBefore(crear(), acciones.firstChild);
  }
  const menuMovil = document.querySelector('.menu-movil-nav');
  if (menuMovil && !menuMovil.querySelector('.mercado-selector')) {
    menuMovil.appendChild(crear());
  }
}

/* Mantiene los selectores al día si el mercado cambia por detección. */
function sincronizarSelectorMercado() {
  document.querySelectorAll('.mercado-select').forEach(sel => { sel.value = getMercado(); });
}

if (typeof MERCADOS !== 'undefined') {
  pintarSelectorMercado();
  alCambiarMercado(() => { sincronizarSelectorMercado(); repreciarCarrito(); });

  /* Detección por IP: una sola vez cada 30 días, nunca por página, y sin
     pedir permiso de ubicación. Si el resultado cambia el mercado que ya
     se estaba enseñando (primera visita), se repinta la página para que
     no quede ningún precio del mercado anterior. */
  const mercadoAlCargar = getMercado();
  resolverMercadoAutomatico().then(mercadoFinal => {
    sincronizarSelectorMercado();
    if (mercadoFinal !== mercadoAlCargar) {
      repreciarCarrito();
      window.location.reload();
    }
  }).catch(() => {});
}

/* ---------- Tracking del embudo ---------- */
function trackEvent(evento, productoId) {
  if (!sb) return Promise.resolve();
  const fila = { evento, session_id: getSessionId(), fuente: 'adri_story' };
  // producto es opcional: en "view" todavía no hay pieza elegida
  const prod = productoId !== undefined ? productoId : (getProductoElegido() || {}).id;
  if (prod) fila.producto = prod;

  return sb.from('eventos').insert(fila)
    .then(({ error }) => { if (error) console.warn('trackEvent', evento, error); })
    .catch(err => console.warn('trackEvent', evento, err));
}

// "view" = llegada a la landing (primer paso del embudo), solo en Inicio.
if (CURRENT_PAGE === 'inicio' && sessionStorage.getItem('viewTracked') !== '1') {
  sessionStorage.setItem('viewTracked', '1');
  trackEvent('view', null);
}

// Los pasos siguientes se cuentan una vez por producto, no una vez por sesión:
// si alguien mira dos piezas, queremos verlo en los dos embudos.
function trackOncePorProducto(prefijo, evento) {
  const prod = (getProductoElegido() || {}).id || 'sin_producto';
  const clave = prefijo + ':' + prod;
  if (sessionStorage.getItem(clave) === '1') return Promise.resolve();
  sessionStorage.setItem(clave, '1');
  return trackEvent(evento);
}
const trackPersonalizacionIniciada = () => trackOncePorProducto('pz', 'personalizacion_iniciada');
const trackReservaIniciada = () => trackOncePorProducto('ri', 'reserva_iniciada');


/* =========================================================
   GRABADO (los valores que escribe el usuario)
   ========================================================= */
function getGrabado() {
  try {
    return JSON.parse(sessionStorage.getItem('grabado')) || {};
  } catch {
    return {};
  }
}
function setGrabado(datos) {
  sessionStorage.setItem('grabado', JSON.stringify(datos));
}

/* Valores de ejemplo cuando el usuario aún no ha escrito nada */
const EJEMPLOS = {
  nombre: 'Adri',
  mensajeSolo: 'siempre tú',   // piezas donde el mensaje ES el grabado
  grabado: '20.42 N, 86.92 W', // brazalete: admite frase, fecha o coordenadas
};

function getMesData(valor) {
  return MESES_NATAL.find(m => m.valor === valor) || MESES_NATAL[0];
}

/* Cómo se reparte el grabado en las (hasta 3) líneas de la pieza.
   Se decide por los campos que tiene el producto, no por orden fijo:
   así una pieza que solo lleva mensaje no acaba mostrando un nombre.
   Para piezas sin campos (campos: []), no hay nada que mostrar. */
function lineasDePieza(prod, datos) {
  if (!prod || prod.campos.length === 0) return ['', '', ''];
  const v = c => (datos[c] || '').trim();
  const tiene = c => prod.campos.includes(c);
  const comillas = t => (t ? `“${t}”` : '');

  if (tiene('mes')) {
    const m = getMesData(v('mes') || MESES_NATAL[0].valor);
    return [m.mes + ' · ' + m.piedra, '', ''];
  }
  if (tiene('nombre')) {
    return [v('nombre') || EJEMPLOS.nombre, v('fecha'), comillas(v('mensaje'))];
  }
  if (tiene('grabado')) {
    return [v('grabado') || EJEMPLOS.grabado, '', ''];
  }
  if (tiene('mensaje')) {
    return [v('mensaje') || EJEMPLOS.mensajeSolo, '', ''];
  }
  return ['', '', ''];
}

/* El kit a tu gusto no tiene campos propios: lleva dos piezas dentro,
   cada una con su grabado bajo el prefijo p1__ / p2__. Esto lo deshace
   para poder enseñarlo en el carrito y en el recap igual que el resto. */
function piezasDelKitLibre(datos) {
  if (!datos) return [];
  return [['pieza_1', 'p1__'], ['pieza_2', 'p2__']].map(([clave, prefijo]) => {
    const prod = (typeof PRODUCTOS !== 'undefined') ? PRODUCTOS.find(p => p.id === datos[clave]) : null;
    if (!prod) return null;
    const grabado = {};
    Object.keys(datos).forEach(k => {
      if (k.startsWith(prefijo)) grabado[k.slice(prefijo.length)] = datos[k];
    });
    return { prod, grabado, acabado: datos['acabado__' + clave] || 'oro' };
  }).filter(Boolean);
}

function esKitLibre(prod) {
  return !!prod && prod.id === 'kit_personalizado';
}

/* Tope de caracteres de un campo: manda el del producto ("limites") si lo
   declara, y 0 significa sin tope (el Collar Esencia, con su grabado
   libre). Si no declara nada, el general de CAMPOS_META. */
function topeDeCampo(prod, campo, meta) {
  const propio = prod && prod.limites ? prod.limites[campo] : undefined;
  const tope = propio === undefined ? (meta ? meta.max : null) : propio;
  return tope ? tope : null; // null = sin maxlength
}

/* A partir de aquí, un grabado libre empieza a no caber cómodamente en
   la placa. No se bloquea (el cliente escribe lo que quiera): solo se
   avisa, y el taller lo ajusta con él antes de grabar. */
const GRABADO_COMODO = 30;

/* Engancha a un campo sin tope el aviso de "esto igual no cabe". Devuelve
   el <p> por si quien llama quiere colocarlo en otro sitio. */
function ponerAvisoGrabadoLargo(input, contenedor) {
  const aviso = document.createElement('p');
  aviso.className = 'campo-aviso';
  aviso.setAttribute('role', 'status');
  aviso.setAttribute('aria-live', 'polite');
  aviso.hidden = true;
  contenedor.appendChild(aviso);

  const revisar = () => {
    const n = (input.value || '').trim().length;
    if (n > GRABADO_COMODO) {
      aviso.textContent = 'Son ' + n + ' caracteres. Es posible que no quepan en la placa: '
        + 'si hace falta ajustarlo, te escribimos antes de grabar.';
      aviso.hidden = false;
    } else {
      aviso.hidden = true;
    }
  };
  input.addEventListener('input', revisar);
  revisar();
  return aviso;
}

/* Resumen en una línea, para el recap y el bloque de producto */
function resumenGrabado(prod, datos) {
  if (esKitLibre(prod)) {
    return piezasDelKitLibre(datos)
      .map(({ prod: pieza, grabado }) => {
        const texto = lineasDePieza(pieza, grabado).filter(Boolean).join(' · ');
        return texto ? pieza.nombre + ': ' + texto : pieza.nombre;
      })
      .join('  ·  ');
  }
  return lineasDePieza(prod, datos).filter(Boolean).join(' · ');
}

/* Ya no hay previsualización en vivo de la pieza: la página muestra la
   foto real del producto. Esta función solo mantiene al día los textos
   de resumen (el recap de la reserva). */
function actualizarResumen(prod, datos) {
  const resumen = resumenGrabado(prod, datos);
  document.querySelectorAll('[data-bind="resumen"]').forEach(el => {
    el.textContent = resumen;
    el.hidden = !resumen;
  });
  document.querySelectorAll('[data-bind="producto"]').forEach(el => {
    el.textContent = prod ? prod.nombre : 'Sin pieza elegida';
  });
}


/* =========================================================
   PÁGINA: LA COLECCIÓN (productos.html)
   ========================================================= */
function crearTarjetaProducto(prod) {
  const card = document.createElement('a');
  card.className = 'producto-card reveal';
  card.href = 'personalizar.html?p=' + encodeURIComponent(prod.slug);

  const media = document.createElement('div');
  media.className = 'producto-media forma-' + prod.forma;

  // Portada dedicada (p.ej. una foto en oro y otra en plata) si existe;
  // si no, "fotos" en formato lista antigua o el "foto" suelto de
  // siempre. Sin ninguna, se queda el degradado con el aviso.
  const fotos = prod.fotoPortada && prod.fotoPortada.length
    ? prod.fotoPortada
    : (Array.isArray(prod.fotos) && prod.fotos.length ? prod.fotos : (prod.foto ? [prod.foto] : []));

  if (fotos.length) {
    media.classList.add('con-foto');

    // Tira con scroll-snap: con una foto no hay nada que arrastrar: con
    // varias (p.ej. portada en oro y en plata) se desliza para verlas,
    // en vez de depender del hover, que en móvil no existe.
    const tira = document.createElement('div');
    tira.className = 'producto-tira';
    fotos.forEach(src => {
      const foto = document.createElement('div');
      foto.className = 'producto-foto';
      foto.style.backgroundImage = `url('${src}')`;
      tira.appendChild(foto);
    });
    media.appendChild(tira);

    if (fotos.length > 1) {
      const puntos = document.createElement('div');
      puntos.className = 'producto-puntos';
      puntos.setAttribute('aria-hidden', 'true');
      fotos.forEach((_, i) => {
        const p = document.createElement('span');
        p.className = 'producto-punto' + (i === 0 ? ' activo' : '');
        puntos.appendChild(p);
      });
      media.appendChild(puntos);

      let temporizadorTira = null;
      tira.addEventListener('scroll', () => {
        clearTimeout(temporizadorTira);
        temporizadorTira = setTimeout(() => {
          const activo = Math.round(tira.scrollLeft / tira.clientWidth);
          [...puntos.children].forEach((p, i) => p.classList.toggle('activo', i === activo));
        }, 60);
      }, { passive: true });
    }
  } else {
    const tag = document.createElement('span');
    tag.className = 'ph-tag';
    tag.textContent = 'imagen pendiente';
    media.appendChild(tag);
  }

  const hoverCta = document.createElement('span');
  hoverCta.className = 'producto-hover-cta';
  hoverCta.innerHTML = '<span>Ver producto →</span>';
  media.appendChild(hoverCta);

  const body = document.createElement('div');
  body.className = 'producto-body';

  const h3 = document.createElement('h3');
  h3.textContent = prod.nombre;

  const precio = document.createElement('p');
  precio.className = 'producto-precio';
  // Precio del mercado activo (mercados.js): la misma fuente que usan la
  // ficha, el carrito y el checkout.
  precio.textContent = precioTexto(prod) || 'Precio pendiente';

  // Kits: el precio de las piezas por separado tachado delante y el
  // ahorro debajo, para que se vea de un vistazo sin entrar en la ficha.
  const ahorroTarjeta = (prod.piezas && prod.piezas.length) ? ahorroKit(prod, prod.piezas) : null;
  if (ahorroTarjeta) {
    const antes = document.createElement('s');
    antes.className = 'precio-antes';
    antes.textContent = ahorroTarjeta.sueltoTexto;
    precio.prepend(antes, ' ');
    const etiqueta = document.createElement('span');
    etiqueta.className = 'precio-ahorro';
    etiqueta.textContent = 'Ahorras ' + ahorroTarjeta.texto;
    precio.append(etiqueta);
  }

  const cta = document.createElement('span');
  cta.className = 'producto-cta';
  cta.textContent = prod.campos.length > 0 ? 'Personalizar →' : 'Ver pieza →';

  body.append(h3, precio, cta);
  card.append(media, body);
  return card;
}

const grid = document.getElementById('producto-grid');
const gridKits = document.getElementById('producto-grid-kits');
if (grid && typeof PRODUCTOS !== 'undefined') {
  // Los kits (id que empieza por "kit_") van en su propia rejilla, con el
  // separador que hay en productos.html entre las dos.
  PRODUCTOS.filter(prod => !prod.oculto).forEach(prod => {
    const destino = prod.id.startsWith('kit_') && gridKits ? gridKits : grid;
    destino.appendChild(crearTarjetaProducto(prod));
  });
  // Estas tarjetas nacen con la clase "reveal" (opacity:0 hasta que se
  // ven). Hay que registrarlas en el observador de revelar.js, que ya
  // escaneó la página antes de que existieran; si no, se quedan
  // invisibles para siempre.
  if (typeof window.registrarReveal === 'function') window.registrarReveal();
}

/* =========================================================
   DESPLEGABLE "PERSONALIZA" DEL MENÚ (todas las páginas, escritorio)
   Enlaces a las piezas que sí se personalizan, directo desde el menú
   de arriba, sin pasar primero por la colección. Pulsera Dos Almas no
   lleva grabado (campos: []) pero igualmente vive aquí: se añade a
   mano para que no falte de la lista.
   ========================================================= */
(function () {
  const panel = document.getElementById('nav-personaliza-panel');
  const dropdown = panel ? panel.closest('.nav-dropdown') : null;
  const trigger = dropdown ? dropdown.querySelector('.nav-dropdown-trigger') : null;
  if (!panel || typeof PRODUCTOS === 'undefined') return;

  PRODUCTOS
    .filter(prod => prod.campos.length > 0 || prod.id === 'pulsera_vinculo')
    .forEach(prod => {
      const a = document.createElement('a');
      a.href = 'personalizar.html?p=' + encodeURIComponent(prod.slug);
      a.textContent = prod.nombre;
      panel.appendChild(a);
    });

  // Puro CSS ya muestra/oculta el panel (:hover / :focus-within); esto
  // solo mantiene aria-expanded correcto para quien usa lector de pantalla.
  if (dropdown && trigger) {
    const marcar = (abierto) => trigger.setAttribute('aria-expanded', String(abierto));
    dropdown.addEventListener('mouseenter', () => marcar(true));
    dropdown.addEventListener('mouseleave', () => marcar(false));
    dropdown.addEventListener('focusin', () => marcar(true));
    dropdown.addEventListener('focusout', (e) => {
      if (!dropdown.contains(e.relatedTarget)) marcar(false);
    });
  }
})();

/* ---------- Lo mismo, dentro del menú móvil ----------
   Aquí no vale con CSS: en móvil no hay :hover, así que "Personaliza tu
   joya" es un botón que despliega la lista al tocarlo (no navega él
   mismo a ningún sitio), y cada pieza de la lista sí es un enlace real. */
(function () {
  const toggle = document.getElementById('menu-movil-personaliza-toggle');
  const lista = document.getElementById('menu-movil-personaliza-lista');
  if (!toggle || !lista || typeof PRODUCTOS === 'undefined') return;

  PRODUCTOS
    .filter(prod => prod.campos.length > 0 || prod.id === 'pulsera_vinculo')
    .forEach(prod => {
      const a = document.createElement('a');
      a.href = 'personalizar.html?p=' + encodeURIComponent(prod.slug);
      a.textContent = prod.nombre;
      lista.appendChild(a);
    });

  toggle.addEventListener('click', () => {
    const abierto = lista.hidden; // va a abrirse si estaba oculta
    lista.hidden = !abierto;
    toggle.setAttribute('aria-expanded', String(abierto));
  });
})();


/* =========================================================
   PÁGINA: PERSONALIZAR (personalizar.html)
   ========================================================= */

/* Galería de la ficha: una foto por tarjeta, scroll lateral con snap.
   Acepta "fotos" (array) o el "foto" antiguo (una sola). Si no hay
   ninguna, deja una tarjeta con el degradado y el aviso de pendiente. */
/* Fotos de la pieza para el acabado elegido.
   Admite tres formas, de más nueva a más vieja:
     fotos: { oro:[...], plata:[...] }   una galería por acabado
     fotos: [...]                        misma galería para los dos
     foto:  'img/x.jpg'                  una sola foto
   Si un acabado todavía no tiene fotos propias, cae al otro antes que a
   dejar el hueco vacío: mejor enseñar la pieza en el otro color que un
   placeholder. */
/* Cada foto es normalmente solo una ruta, pero puede venir como
   {src, pos} cuando el encuadre por defecto (centrado) deja la pieza
   fuera o justo en el borde: "pos" es el valor CSS de
   background-position que corrige ese recorte para esa foto en
   concreto (ver mi-cielo-oro-1 en productos.js). */
function normFoto(f) {
  return typeof f === 'string' ? { src: f, pos: null } : { src: f.src, pos: f.pos || null };
}

function fotosDe(prod, acabado) {
  const f = prod.fotos;
  if (f && !Array.isArray(f) && typeof f === 'object') {
    const elegidas = f[acabado];
    if (elegidas && elegidas.length) return elegidas;
    const otro = acabado === 'oro' ? f.plata : f.oro;
    if (otro && otro.length) return otro;
    return [];
  }
  if (Array.isArray(f) && f.length) return f;
  return prod.foto ? [prod.foto] : [];
}

function pintarGaleria(prod, acabado) {
  const pista = document.getElementById('galeria-pista');
  const puntos = document.getElementById('galeria-puntos');
  if (!pista) return;

  pista.textContent = '';
  if (puntos) puntos.textContent = '';

  const fotos = fotosDe(prod, acabado || getGrabado().acabado || 'oro');

  if (!fotos.length) {
    const vacia = document.createElement('div');
    vacia.className = 'galeria-foto';
    const tag = document.createElement('span');
    tag.className = 'ph-tag';
    tag.textContent = 'imagen pendiente';
    vacia.appendChild(tag);
    pista.appendChild(vacia);
    return;
  }

  fotos.forEach((f, i) => {
    const { src, pos } = normFoto(f);
    const card = document.createElement('div');
    card.className = 'galeria-foto con-foto';
    // Va como variable CSS: el degradado de respaldo sigue debajo, así que
    // si el archivo no existe no queda un hueco roto.
    card.style.setProperty('--foto', `url('${src}')`);
    if (pos) card.style.setProperty('--foto-pos', pos);
    const etiqueta = `${prod.nombre}, imagen ${i + 1} de ${fotos.length}`;
    // role="button" y no "img": ya no es solo ilustrativa, se puede
    // pulsar para ampliarla (abrirZoomFoto).
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Ampliar foto: ${etiqueta}`);
    card.addEventListener('click', () => abrirZoomFoto(src, etiqueta));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirZoomFoto(src, etiqueta); }
    });
    pista.appendChild(card);
  });

  // Al cambiar de acabado la pista se rehace, pero conserva el scroll que
  // tenía: se veía la foto 3 del nuevo color en vez de la primera. Vuelve
  // al principio sin animación (el cambio de color ya es el gesto).
  pista.scrollTo({ left: 0, behavior: 'instant' });

  // Un punto por foto, solo si hay más de una. Son <button>, no <span>:
  // en escritorio se ven como miniaturas y se puede pulsar para saltar
  // directo a esa foto (en móvil siguen siendo solo puntos pequeños).
  if (puntos && fotos.length > 1) {
    fotos.forEach((f, i) => {
      const { src, pos } = normFoto(f);
      const p = document.createElement('button');
      p.type = 'button';
      p.className = 'galeria-punto' + (i === 0 ? ' activo' : '');
      p.style.backgroundImage = `url('${src}')`;
      if (pos) p.style.backgroundPosition = pos;
      p.setAttribute('aria-label', `Ver imagen ${i + 1} de ${fotos.length}`);
      p.addEventListener('click', () => {
        pista.children[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
      puntos.appendChild(p);
    });

    // El punto activo es el de la foto más cercana al centro de la pista,
    // que es justo donde la deja el scroll-snap.
    // Se usa setTimeout y NO requestAnimationFrame: rAF no se ejecuta en
    // pestañas en segundo plano, y los puntos se quedarían congelados
    // (es el mismo bug que ya costó una vez en el pop-up de preventa).
    let temporizador = null;
    const marcarPuntoActivo = () => {
      const centro = pista.scrollLeft + pista.clientWidth / 2;
      let cerca = 0, min = Infinity;
      [...pista.children].forEach((c, i) => {
        const d = Math.abs((c.offsetLeft + c.offsetWidth / 2) - centro);
        if (d < min) { min = d; cerca = i; }
      });
      [...puntos.children].forEach((p, i) => {
        p.classList.toggle('activo', i === cerca);
      });
    };
    pista.addEventListener('scroll', () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(marcarPuntoActivo, 60);
    }, { passive: true });
  }
}

/* =========================================================
   ZOOM DE FOTO (ficha de producto)
   Al pulsar una foto de la galería se abre a pantalla completa. Un
   clic/toque alterna entre ajustada y ampliada (centrado en el punto
   pulsado); ya ampliada, se puede arrastrar para moverse, y también
   hay zoom continuo con la rueda del ratón o pellizcando en móvil.
   Mismo patrón de overlay que los pop-ups (capa + Escape + clic
   fuera para cerrar), reconstruido cada vez porque solo hace falta
   mientras está abierto. ========================================================= */
let capaZoomFoto = null;
function abrirZoomFoto(src, etiqueta) {
  if (capaZoomFoto) capaZoomFoto.remove();

  const capa = document.createElement('div');
  capa.className = 'foto-zoom-capa';
  capa.setAttribute('role', 'dialog');
  capa.setAttribute('aria-modal', 'true');
  capa.setAttribute('aria-label', etiqueta || 'Foto ampliada');

  const cerrarBtn = document.createElement('button');
  cerrarBtn.type = 'button';
  cerrarBtn.className = 'foto-zoom-cerrar';
  cerrarBtn.setAttribute('aria-label', 'Cerrar');
  cerrarBtn.textContent = '×';

  const marco = document.createElement('div');
  marco.className = 'foto-zoom-marco';

  const img = document.createElement('img');
  img.className = 'foto-zoom-img';
  img.src = src;
  img.alt = etiqueta || '';
  img.draggable = false;

  marco.appendChild(img);
  capa.append(cerrarBtn, marco);

  const antesDelZoom = document.activeElement;
  const MIN = 1, MAX = 4;
  let escala = 1, x = 0, y = 0;

  function aplicar() {
    img.style.transform = `translate(${x}px, ${y}px) scale(${escala})`;
    img.style.cursor = escala > 1 ? 'grab' : 'zoom-in';
  }
  // Cuanto más ampliada, más margen hay para moverse; a escala 1 no se
  // mueve nada (no tendría sentido arrastrar una foto que ya cabe entera).
  function limitar() {
    const maxX = (escala - 1) * marco.clientWidth / 2;
    const maxY = (escala - 1) * marco.clientHeight / 2;
    x = Math.max(-maxX, Math.min(maxX, x));
    y = Math.max(-maxY, Math.min(maxY, y));
  }

  function cerrarZoom() {
    capa.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', porTecla);
    capaZoomFoto = null;
    if (antesDelZoom && antesDelZoom.focus) antesDelZoom.focus();
  }
  function porTecla(e) { if (e.key === 'Escape') cerrarZoom(); }

  cerrarBtn.addEventListener('click', cerrarZoom);
  capa.addEventListener('click', e => { if (e.target === capa) cerrarZoom(); });
  document.addEventListener('keydown', porTecla);

  // Clic/toque sobre la foto: alterna ajustada ↔ ampliada, centrado en
  // el punto exacto donde se pulsó.
  img.addEventListener('click', e => {
    e.stopPropagation();
    if (escala > 1) {
      escala = 1; x = 0; y = 0;
    } else {
      const r = img.getBoundingClientRect();
      // Si la foto aún no ha terminado de cargar, el rect puede venir a
      // 0: sin esta guarda, dividir por 0 da NaN y el navegador descarta
      // el transform en silencio (el zoom no se aplicaría). Sin tamaño
      // fiable, se centra en vez de fallar.
      const px = r.width ? (e.clientX - r.left) / r.width - 0.5 : 0;
      const py = r.height ? (e.clientY - r.top) / r.height - 0.5 : 0;
      escala = 2.4;
      x = -px * r.width * (escala - 1) / escala;
      y = -py * r.height * (escala - 1) / escala;
      limitar();
    }
    aplicar();
  });

  // Rueda del ratón: zoom continuo centrado en el cursor.
  marco.addEventListener('wheel', e => {
    e.preventDefault();
    escala = Math.max(MIN, Math.min(MAX, escala * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
    if (escala === MIN) { x = 0; y = 0; }
    limitar();
    aplicar();
  }, { passive: false });

  // Arrastre (ratón o dedo) para moverse por la foto ya ampliada.
  let arrastrando = false, inicioX = 0, inicioY = 0, origenX = 0, origenY = 0;
  marco.addEventListener('pointerdown', e => {
    if (escala <= 1) return;
    arrastrando = true;
    inicioX = e.clientX; inicioY = e.clientY;
    origenX = x; origenY = y;
    marco.setPointerCapture(e.pointerId);
  });
  marco.addEventListener('pointermove', e => {
    if (!arrastrando) return;
    x = origenX + (e.clientX - inicioX);
    y = origenY + (e.clientY - inicioY);
    limitar();
    aplicar();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
    marco.addEventListener(ev, () => { arrastrando = false; })
  );

  // Pellizco con dos dedos: la distancia entre ellos marca la escala.
  let pellizco = null;
  const distancia = (t0, t1) => Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
  marco.addEventListener('touchstart', e => {
    if (e.touches.length === 2) pellizco = { d: distancia(e.touches[0], e.touches[1]), escala };
  }, { passive: true });
  marco.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && pellizco) {
      e.preventDefault();
      escala = Math.max(MIN, Math.min(MAX, pellizco.escala * (distancia(e.touches[0], e.touches[1]) / pellizco.d)));
      limitar();
      aplicar();
    }
  }, { passive: false });
  marco.addEventListener('touchend', e => { if (e.touches.length < 2) pellizco = null; });

  document.body.appendChild(capa);
  capaZoomFoto = capa;
  document.body.style.overflow = 'hidden';
  void capa.offsetWidth;
  capa.classList.add('visible');
  cerrarBtn.focus();
}

/* Cartita del mes: solo tiene sentido en las piezas con campo "mes"
   (hoy, el Collar Destino). Si el mes no está en el catálogo de cartitas,
   la tarjeta simplemente no se enseña. */
function pintarCartita(valorMes) {
  const caja = document.getElementById('cartita');
  if (!caja) return;

  const carta = (typeof CARTITAS !== 'undefined' && valorMes) ? CARTITAS[valorMes] : null;
  if (!carta) { caja.hidden = true; return; }

  const mes = getMesData(valorMes);
  const titulo = document.getElementById('cartita-titulo');
  const texto  = document.getElementById('cartita-texto');
  const cierre = document.getElementById('cartita-cierre');

  // textContent siempre: nunca interpretamos HTML venido del catálogo
  // El nombre del tono sale de MESES_NATAL, el mismo que marca el selector:
  // así la etiqueta y la cartita no pueden acabar diciendo cosas distintas.
  if (titulo) titulo.textContent = `${mes.mes} · ${carta.flor} y ${mes.piedra.toLowerCase()}`;
  if (texto) texto.textContent = carta.texto;
  if (cierre) cierre.textContent = (typeof CARTITA_CIERRE !== 'undefined') ? CARTITA_CIERRE : '';
  caja.hidden = false;
}

const campos = document.getElementById('campos');
if (campos && typeof PRODUCTOS !== 'undefined') {

  // Qué pieza: la del enlace (?p=slug), o la que ya venía elegida, o la destacada
  const slug = new URLSearchParams(location.search).get('p');
  const prod = (slug && getProductoPorSlug(slug)) || getProductoElegido() || productoPorDefecto();

  // Si se cambia de pieza, el grabado anterior deja de tener sentido
  const anterior = sessionStorage.getItem('productoId');
  if (anterior && anterior !== prod.id) sessionStorage.removeItem('grabado');
  setProductoElegido(prod);

  // Cabecera y descripción del producto
  const esPersonalizable = prod.campos.length > 0;

  const eyebrowEl = document.getElementById('producto-eyebrow');
  if (eyebrowEl) eyebrowEl.textContent = 'La colección';
  const titulo = document.getElementById('producto-titulo');
  if (titulo) titulo.textContent = prod.nombre;
  const desc = document.getElementById('producto-desc');
  if (desc) desc.textContent = prod.descripcion;

  pintarGaleria(prod);

  // La banda de grabado solo existe si la pieza se personaliza
  const bandaGrabado = document.getElementById('grabado-banda');
  if (bandaGrabado) bandaGrabado.hidden = !esPersonalizable;

  // El acordeón de "Personalización" (info adicional): si la pieza no se
  // graba, lo dice tal cual en vez de describir un grabado que no existe.
  // Ojo: este texto PISA el que haya en personalizar.html, así que el
  // bueno es este — cambiarlo aquí, no en el HTML.
  const infoPersonalizacion = document.getElementById('info-personalizacion-texto');
  if (infoPersonalizacion) {
    infoPersonalizacion.textContent = esPersonalizable
      ? 'Cada pieza se personaliza con un grabado de máxima precisión y calidad, realizado para conseguir un acabado elegante, definido y duradero. Un detalle único pensado para conservar ese significado especial durante mucho tiempo.'
      : 'Esta pieza no lleva grabado';
  }

  const precioTxt = precioTexto(prod);
  const resPrecio = document.getElementById('resumen-precio');
  const resNota = document.getElementById('resumen-precio-nota');
  if (resPrecio) resPrecio.textContent = precioTxt || '—';
  const resAhorro = document.getElementById('resumen-ahorro');
  const ahorroResumen = (prod.piezas && prod.piezas.length) ? ahorroKit(prod, prod.piezas) : null;
  if (resAhorro) {
    resAhorro.hidden = !ahorroResumen;
    if (ahorroResumen) {
      resAhorro.replaceChildren();
      const antes = document.createElement('s');
      antes.className = 'precio-antes';
      antes.textContent = ahorroResumen.sueltoTexto;
      const etiqueta = document.createElement('span');
      etiqueta.className = 'precio-ahorro';
      etiqueta.textContent = 'Ahorras ' + ahorroResumen.texto;
      resAhorro.append(antes, ' ', etiqueta);
    }
  }
  if (resNota) resNota.hidden = !!precioTxt;

  // Si la pieza todavía no tiene precio, "Añadir al carrito" no puede
  // quedar habilitado: llevaría a comprar.html con un precio inválido.
  // Se apaga aquí el CTA principal y el sticky (que reutiliza el mismo
  // botón vía click(), así que basta con tocar uno).
  [document.getElementById('cta-reservar'), document.getElementById('cta-sticky-btn')].forEach(btn => {
    if (!btn) return;
    if (!precioTxt) {
      btn.setAttribute('aria-disabled', 'true');
      btn.classList.add('is-disabled');
    } else {
      btn.removeAttribute('aria-disabled');
      btn.classList.remove('is-disabled');
    }
  });

  // Ficha larga del producto (opcional). Todo con textContent: nunca
  // interpretamos HTML venido del catálogo.
  const ficha = document.getElementById('producto-ficha');
  if (ficha) {
    ficha.textContent = '';

    (prod.parrafos || []).forEach(txt => {
      const p = document.createElement('p');
      p.className = 'ficha-parrafo';
      p.textContent = txt;
      ficha.appendChild(p);
    });

    if (prod.caracteristicas && prod.caracteristicas.length) {
      const ul = document.createElement('ul');
      ul.className = 'ficha-lista';
      prod.caracteristicas.forEach(txt => {
        const li = document.createElement('li');
        li.textContent = txt;
        ul.appendChild(li);
      });
      ficha.appendChild(ul);
    }

    // Ahorro del kit: piezas sueltas menos precio propio del kit, en la
    // moneda del mercado activo. Solo se enseña si sale positivo.
    const ahorro = (prod.piezas && prod.piezas.length) ? ahorroKit(prod, prod.piezas) : null;
    const reclamo = ahorro
      ? 'Ahorras ' + ahorro.texto + ' (' + ahorro.porcentaje + ' %): por separado, las dos piezas cuestan ' + ahorro.sueltoTexto
      : prod.oferta;
    if (reclamo) {
      const oferta = document.createElement('p');
      oferta.className = 'ficha-oferta';
      oferta.textContent = reclamo;
      ficha.appendChild(oferta);
    }

    if (prod.cierre) {
      const cierre = document.createElement('p');
      cierre.className = 'ficha-cierre';
      cierre.textContent = prod.cierre;
      ficha.appendChild(cierre);
    }
  }

  // Campos de grabado según el producto. Cada campo se lee como { value }
  // (sea un <input> real o el selector de color) para que sincronizar()
  // funcione igual en los dos casos.
  const datos = getGrabado();
  const entradas = {};

  prod.campos.forEach(campo => {
    const meta = CAMPOS_META[campo];
    if (!meta) return;

    if (meta.tipo === 'color') {
      const wrap = document.createElement('div');
      wrap.className = 'field field-color';

      const label = document.createElement('label');
      label.textContent = meta.label;
      wrap.appendChild(label);

      const picker = document.createElement('div');
      picker.className = 'picker';

      const estado = { value: datos[campo] || meta.opciones[0].valor };
      entradas[campo] = estado;

      meta.opciones.forEach(opcion => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'swatch';
        if (opcion.valor === estado.value) btn.classList.add('activo');
        btn.innerHTML =
          `<span class="dot" style="background:${opcion.color}"></span>` +
          `<span class="mes-abr">${opcion.mes.slice(0, 3)}</span>`;
        btn.addEventListener('click', () => {
          estado.value = opcion.valor;
          picker.querySelectorAll('.swatch').forEach(b => b.classList.remove('activo'));
          btn.classList.add('activo');
          trackPersonalizacionIniciada();
          sincronizar();
        });
        picker.appendChild(btn);
      });

      wrap.appendChild(picker);
      campos.appendChild(wrap);
      return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'field';

    const label = document.createElement('label');
    label.setAttribute('for', 'in-' + campo);
    label.textContent = meta.label;
    // Un campo solo es opcional si la pieza tiene mas campos: si es el
    // unico grabado posible (ej. el brazalete), deja de serlo.
    if (meta.opcional && prod.campos.length > 1) {
      const op = document.createElement('span');
      op.textContent = ' (opcional)';
      label.appendChild(op);
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'in-' + campo;
    const tope = topeDeCampo(prod, campo, meta);
    if (tope) input.maxLength = tope;
    input.placeholder = meta.placeholder;
    input.value = datos[campo] || '';

    wrap.append(label, input);
    // Campo sin tope (el grabado libre del Collar Esencia): se avisa si
    // el texto se alarga, pero nunca se corta.
    if (!tope) ponerAvisoGrabadoLargo(input, wrap);
    campos.appendChild(wrap);
    entradas[campo] = input;
  });

  const sincronizar = () => {
    const actuales = {};
    Object.entries(entradas).forEach(([c, el]) => { actuales[c] = el.value; });
    setGrabado(actuales);
    actualizarResumen(prod, actuales);
    pintarCartita(actuales.mes);
  };

  // Se llama una vez ya al cargar, ANTES de que nadie toque nada: si no,
  // getGrabado() se queda sin el valor por defecto de campos como "mes"
  // (el selector de piedra natal) hasta el primer clic. Pasó de verdad al
  // probar el carrito: si alguien añadía Collar Destino sin tocar el mes,
  // el pedido llegaba sin él y el SKU no se podía resolver. Los campos de
  // texto no lo necesitan (ya nacen con su valor, vacío o no, en el
  // input), pero llamar aquí una vez es más simple que distinguir cuáles
  // sí y cuáles no.
  sincronizar();

  /* ---------- Acabado: bañado en oro o plateado ----------
     No es un campo de grabado (lo tienen todas las piezas, se graben o
     no), pero cada grupo se registra en "entradas" para heredar toda la
     fontanería que ya existe: sincronizar() lo guarda y el carrito lo
     manda dentro de "personalizacion".

     Una pieza suelta lleva UN grupo (campo "acabado"). Un kit declara
     "acabados" en productos.js con un grupo POR PIEZA del kit (ej. el
     collar puede ir en oro y la pulsera en plata a la vez) — sin eso, se
     usa el grupo por defecto para no romper las piezas sueltas.

     Se guarda el valor por defecto de cada grupo nada más cargar: si la
     persona no toca ningún selector, el pedido lleva igual el acabado. */
  const gruposAcabado = (prod.acabados && prod.acabados.length)
    ? prod.acabados
    : [{ campo: 'acabado', label: 'Acabado' }];

  const contenedorAcabado = document.getElementById('acabado-contenedor');
  if (contenedorAcabado) {
    contenedorAcabado.textContent = '';
    let datosIniciales = { ...getGrabado() };

    gruposAcabado.forEach((grupo, i) => {
      const idLabel = 'acabado-label-' + i;
      const bloque = document.createElement('div');
      bloque.className = 'acabado-grupo';

      const label = document.createElement('p');
      label.className = 'acabado-label';
      label.id = idLabel;
      label.textContent = grupo.label;
      bloque.appendChild(label);

      const opciones = document.createElement('div');
      opciones.className = 'acabado-opciones';
      opciones.setAttribute('role', 'radiogroup');
      opciones.setAttribute('aria-labelledby', idLabel);

      const estadoAcabado = { value: datos[grupo.campo] || 'oro' };
      entradas[grupo.campo] = estadoAcabado;
      datosIniciales[grupo.campo] = estadoAcabado.value;

      const defs = [
        { valor: 'oro', clase: 'acabado-dot--oro', texto: 'Bañado en oro' },
        { valor: 'plata', clase: 'acabado-dot--plata', texto: 'Plateado' },
      ];
      const botones = defs.map(def => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'acabado-op';
        btn.dataset.acabado = def.valor;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', def.valor === estadoAcabado.value ? 'true' : 'false');

        const dot = document.createElement('span');
        dot.className = 'acabado-dot ' + def.clase;
        dot.setAttribute('aria-hidden', 'true');

        btn.append(dot, document.createTextNode(def.texto));
        opciones.appendChild(btn);
        return btn;
      });

      const marcarAcabado = () => {
        botones.forEach(b => {
          const activo = b.dataset.acabado === estadoAcabado.value;
          b.classList.toggle('activo', activo);
          b.setAttribute('aria-checked', activo ? 'true' : 'false');
        });
      };
      marcarAcabado();

      botones.forEach(btn => {
        btn.addEventListener('click', () => {
          estadoAcabado.value = btn.dataset.acabado;
          marcarAcabado();
          sincronizar();
          // La galería sigue al acabado del PRIMER grupo (la pieza
          // principal del kit, o la única pieza si no es un kit): cuando
          // cada pieza tenga sus fotos en oro y en plata, esto se enseña
          // solo. Ver comentario en fotosDe() de más arriba.
          if (i === 0) pintarGaleria(prod, estadoAcabado.value);
        });
      });

      bloque.appendChild(opciones);
      contenedorAcabado.appendChild(bloque);
    });

    setGrabado(datosIniciales);
  }

  Object.entries(entradas).forEach(([campo, el]) => {
    // El selector de color ya sincroniza en su propio click (arriba);
    // aquí solo enganchamos los <input> de texto reales.
    if (el instanceof HTMLElement) {
      el.addEventListener('input', () => {
        trackPersonalizacionIniciada();
        sincronizar();
      });
    }
  });

  actualizarResumen(prod, datos);
  // Cartita de arranque: la del mes guardado, o la del primero del selector
  // (que es el que sale marcado). Si la pieza no lleva mes, se queda oculta.
  pintarCartita(prod.campos.includes('mes') ? (datos.mes || MESES_NATAL[0].valor) : null);
}


/* =========================================================
   Otras páginas que solo muestran lo ya elegido (ej. el recap)
   ========================================================= */
if (!campos && document.querySelector('[data-bind="resumen"]')) {
  const prod = getProductoElegido();
  actualizarResumen(prod, getGrabado());
  document.querySelectorAll('[data-bind="producto"]').forEach(el => {
    el.textContent = prod ? prod.nombre : 'Sin pieza elegida';
  });
}


/* =========================================================
   POP-UP DE PREVENTA · "Un Pedacito de Mí"
   Aparece al abrir la página y, una vez cerrado, no vuelve a salir
   nunca más (localStorage, así sobrevive a cerrar el navegador).

   SOLO en productos.html (2026-08-29, pedido del cliente): en el resto de
   páginas no se muestra, porque un aviso que compite con lo que la
   persona ya está mirando (una ficha, el propio formulario de compra)
   trabaja en contra de la conversión que estamos midiendo.
   ========================================================= */
(function () {
  const YA_CERRADO = 'popupPreventaCerrado';
  if (CURRENT_PAGE !== 'productos') return;

  // Vuelve al comportamiento original (2026-08-29, pedido del cliente):
  // una vez cerrado, no vuelve a salir. Antes salía en cada entrada
  // (MOSTRAR_SIEMPRE = true), para una promoción puntual ya terminada.
  const MOSTRAR_SIEMPRE = false;

  let cerrado = false;
  try { cerrado = localStorage.getItem(YA_CERRADO) === '1'; } catch (e) { /* modo privado */ }
  if (cerrado && !MOSTRAR_SIEMPRE) return;

  const capa = document.createElement('div');
  capa.className = 'popup-capa';
  capa.setAttribute('role', 'dialog');
  capa.setAttribute('aria-modal', 'true');
  capa.setAttribute('aria-labelledby', 'popup-titulo');

  const caja = document.createElement('div');
  caja.className = 'popup-caja';

  const cerrar = document.createElement('button');
  cerrar.className = 'popup-cerrar';
  cerrar.type = 'button';
  cerrar.setAttribute('aria-label', 'Cerrar');
  cerrar.textContent = '×';

  const olas = document.createElement('span');
  olas.className = 'popup-olas';
  olas.setAttribute('aria-hidden', 'true');

  const eyebrow = document.createElement('p');
  eyebrow.className = 'popup-eyebrow';
  eyebrow.textContent = 'Primera colección';

  const titulo = document.createElement('h2');
  titulo.className = 'popup-titulo';
  titulo.id = 'popup-titulo';
  titulo.textContent = 'Un Pedacito de Mí';

  const p1 = document.createElement('p');
  p1.className = 'popup-texto';
  p1.textContent = 'Solo existen 100 pedacitos. No porque queramos que corras, sino porque cada pieza se graba una por una, con un acabado de calidad, y eso no se puede apurar ni multiplicar';

  const p2 = document.createElement('p');
  p2.className = 'popup-texto';
  p2.textContent = 'Cuando se acaben, se acaban. Si hay un pedacito que quieres que sea tuyo, o de alguien a quien quieras dar un pedacito de ti, este es el momento de comprarlo';

  const badge = document.createElement('p');
  badge.className = 'popup-badge';
  badge.textContent = 'Preventa abierta · edición limitada a 100 piezas';

  const cierre = document.createElement('p');
  cierre.className = 'popup-cierre';
  cierre.textContent = 'Un pedacito de mí, mientras quede alguno por dar';

  const cta = document.createElement('a');
  cta.className = 'btn btn-primary popup-cta';
  cta.href = 'productos.html';
  cta.textContent = 'Descubrir ahora';

  caja.append(cerrar, olas, eyebrow, titulo, p1, p2, badge, cierre, cta);
  capa.appendChild(caja);

  const antesDelPopup = document.activeElement;

  function ocultar() {
    try { localStorage.setItem(YA_CERRADO, '1'); } catch (e) { /* modo privado */ }
    capa.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', porTecla);
    if (antesDelPopup && antesDelPopup.focus) antesDelPopup.focus();
  }
  function porTecla(e) { if (e.key === 'Escape') ocultar(); }

  cerrar.addEventListener('click', ocultar);
  cta.addEventListener('click', ocultar);           // al ir a la colección, ya no reaparece
  capa.addEventListener('click', e => { if (e.target === capa) ocultar(); });
  document.addEventListener('keydown', porTecla);

  // Un respiro para que la página pinte antes: aparecer de golpe es brusco.
  setTimeout(() => {
    document.body.appendChild(capa);
    document.body.style.overflow = 'hidden';
    // Forzar un reflow (en vez de requestAnimationFrame) para arrancar la
    // transición: rAF NO corre en pestañas en segundo plano, y el pop-up
    // se quedaría invisible bloqueando el scroll hasta enfocar la pestaña.
    void capa.offsetWidth;
    capa.classList.add('visible');
    cerrar.focus();
  }, 700);
})();


/* =========================================================
   BURBUJA DE CONTACTO (solo faq.html)
   Mismo patrón accesible que el pop-up de preventa (construido al
   pulsar, no al cargar la página), reutilizando sus mismas clases
   .popup-* para que se vea igual. Datos reales, nada inventado: el
   email ya publicado en contacto.html.
   ========================================================= */
(function () {
  const burbuja = document.getElementById('burbuja-contacto');
  if (!burbuja) return;

  burbuja.addEventListener('click', () => {
    const capa = document.createElement('div');
    capa.className = 'popup-capa';
    capa.setAttribute('role', 'dialog');
    capa.setAttribute('aria-modal', 'true');
    capa.setAttribute('aria-labelledby', 'popup-contacto-titulo');

    const caja = document.createElement('div');
    caja.className = 'popup-caja';

    const cerrar = document.createElement('button');
    cerrar.className = 'popup-cerrar';
    cerrar.type = 'button';
    cerrar.setAttribute('aria-label', 'Cerrar');
    cerrar.textContent = '×';

    const olas = document.createElement('span');
    olas.className = 'popup-olas';
    olas.setAttribute('aria-hidden', 'true');

    const titulo = document.createElement('h2');
    titulo.className = 'popup-titulo';
    titulo.id = 'popup-contacto-titulo';
    titulo.textContent = '¿Hablamos?';

    const texto = document.createElement('p');
    texto.className = 'popup-texto';
    texto.textContent = 'Si tu pregunta no aparece en el FAQ, escríbenos directamente y te contestamos personalmente';

    const cta = document.createElement('a');
    cta.className = 'btn btn-primary popup-cta';
    cta.href = 'mailto:cozumeljewel@gmail.com';
    cta.textContent = 'cozumeljewel@gmail.com';

    const link = document.createElement('a');
    link.className = 'popup-contacto-link';
    link.href = 'contacto.html';
    link.textContent = 'Ir al formulario de contacto →';

    caja.append(cerrar, olas, titulo, texto, cta, link);
    capa.appendChild(caja);

    const antesDelPopup = document.activeElement;

    function ocultar() {
      capa.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', porTecla);
      if (antesDelPopup && antesDelPopup.focus) antesDelPopup.focus();
    }
    function porTecla(e) { if (e.key === 'Escape') ocultar(); }

    cerrar.addEventListener('click', ocultar);
    capa.addEventListener('click', e => { if (e.target === capa) ocultar(); });
    document.addEventListener('keydown', porTecla);

    document.body.appendChild(capa);
    document.body.style.overflow = 'hidden';
    void capa.offsetWidth; // fuerza el reflow, ver nota arriba en el otro pop-up
    capa.classList.add('visible');
    cerrar.focus();
  });
})();


/* ---------- Menú móvil, a pantalla completa ----------
   #nav (la lista de arriba) ahora es solo la barra de escritorio; en
   móvil el que se abre y cierra es #menu-movil, un overlay aparte. */
const navToggle = document.querySelector('.nav-toggle');
const menuMovil = document.getElementById('menu-movil');
const menuMovilCerrar = document.getElementById('menu-movil-cerrar');

if (navToggle && menuMovil) {
  let elementoAntesDeAbrir = null;

  const elementosFocuables = () =>
    [...menuMovil.querySelectorAll('a, button')].filter(el => el.offsetParent !== null);

  const abrirMenu = () => {
    elementoAntesDeAbrir = document.activeElement;
    menuMovil.hidden = false;
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Cerrar menú');
    document.body.style.overflow = 'hidden'; // bloquea el scroll de fondo

    // Fuerza un reflow antes de añadir la clase que dispara la entrada
    // escalonada: si no, al aplicarse en el mismo frame que hidden=false,
    // el navegador se salta la transición y todo aparece de golpe.
    void menuMovil.offsetWidth;
    menuMovil.classList.add('menu-movil-visible');

    const primero = elementosFocuables()[0];
    if (primero) primero.focus();
  };

  const cerrarMenu = () => {
    menuMovil.hidden = true;
    menuMovil.classList.remove('menu-movil-visible');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menú');
    document.body.style.overflow = '';
    // Devuelve el foco a donde estaba (normalmente el propio botón
    // hamburguesa), para quien navega con teclado.
    if (elementoAntesDeAbrir) elementoAntesDeAbrir.focus();
  };

  navToggle.addEventListener('click', () => {
    if (menuMovil.hidden) abrirMenu(); else cerrarMenu();
  });

  if (menuMovilCerrar) menuMovilCerrar.addEventListener('click', cerrarMenu);

  // Clic fuera de la caja (sobre el velo oscuro) cierra el menú.
  menuMovil.addEventListener('click', (e) => {
    if (e.target === menuMovil) cerrarMenu();
  });

  // Cada enlace del menú lo cierra al navegar.
  menuMovil.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', cerrarMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (menuMovil.hidden) return;

    if (e.key === 'Escape') {
      cerrarMenu();
      return;
    }

    // Atrapa el foco dentro del menú mientras está abierto (Tab / Shift+Tab
    // no deben poder salirse a lo que hay detrás del velo).
    if (e.key === 'Tab') {
      const focuables = elementosFocuables();
      if (!focuables.length) return;
      const primero = focuables[0];
      const ultimo = focuables[focuables.length - 1];

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }
  });
}

/* ---------- Header sólido al hacer scroll (solo inicio) ----------
   En el resto de páginas el header ya es sólido siempre: esta clase no
   cambia nada allí, la regla que le da efecto está acotada a inicio en
   style.css. Sin scroll-listener costoso: se limita a comprobar un
   umbral pequeño y solo toca el DOM cuando el estado realmente cambia. */
(function () {
  const header = document.getElementById('site-header');
  if (!header || CURRENT_PAGE !== 'inicio') return;

  const UMBRAL = 40;
  let solido = false;

  const comprobar = () => {
    const debeSerSolido = window.scrollY > UMBRAL;
    if (debeSerSolido === solido) return;
    solido = debeSerSolido;
    header.classList.toggle('scrolled', solido);
  };

  comprobar();
  window.addEventListener('scroll', comprobar, { passive: true });
})();

/* ---------- Marcar el enlace de la página activa ---------- */
const currentFile = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav a, .footer-nav a, .menu-movil-nav a').forEach(a => {
  if (a.getAttribute('href') === currentFile) a.setAttribute('aria-current', 'page');
});


/* ---------- CTA "Añade al carrito" → comprar.html ----------
   Añadir al carrito es instantáneo (solo localStorage), pero se mantiene
   la misma espera/estados que antes para el tracking, que sí es una
   llamada de red: si no se espera, el navegador puede cancelarla a medio
   camino al cambiar de página. El tracking sigue siendo "best effort"
   (si falla, se compra igual, ver el .finally de más abajo).

   IMPORTANTE: el añadido al carrito pasa SIEMPRE, incluso sin Supabase
   configurado o si el tracking de esta pieza ya se mandó antes en esta
   sesión — antes esos dos casos se limitaban a dejar el <a> navegar solo
   (sin preventDefault), lo cual ya no vale: ahora hace falta guardar el
   ítem pase lo que pase con el tracking. */
const ctaReservar = document.getElementById('cta-reservar');
if (ctaReservar) {
  const ctaTexto = ctaReservar.querySelector('.cta-texto');
  const ponerTexto = (t) => { if (ctaTexto) ctaTexto.textContent = t; };

  ctaReservar.addEventListener('click', (e) => {
    // Ya está en marcha (o ya terminó con éxito): ignora los clicks de
    // más, no se añade dos veces ni se navega dos veces.
    if (ctaReservar.classList.contains('is-loading') || ctaReservar.classList.contains('is-success')) {
      e.preventDefault();
      return;
    }

    // Pieza todavía sin precio: el CTA se ve apagado (ver pintado de
    // arriba), pero un <a> siempre es clicable, así que se corta aquí
    // también por si acaso.
    if (ctaReservar.classList.contains('is-disabled')) {
      e.preventDefault();
      return;
    }

    const prod = getProductoElegido();
    if (!prod) { e.preventDefault(); return; } // producto no resuelto: no navega con el carrito a medias

    e.preventDefault();
    const grabadoActual = getGrabado();
    const precioActual = typeof precioDe === 'function' ? precioDe(prod) : null;
    añadirAlCarrito(normalizarItemCarrito({
      producto: prod.id,
      cantidad: 1,
      personalizacion: grabadoActual,
      mercado: precioActual ? precioActual.mercado : null,
      moneda: precioActual ? precioActual.moneda : null,
      precio: precioActual ? precioActual.importe : null,
    }));

    ctaReservar.classList.remove('is-error');
    ctaReservar.classList.add('is-loading');
    ponerTexto('Añadiendo a tu carrito…');

    const dest = ctaReservar.href;
    let navegado = false;
    const ir = () => {
      if (navegado) return;
      try {
        if (!dest) throw new Error('cta-reservar sin destino');
        navegado = true;
        ctaReservar.classList.remove('is-loading');
        ctaReservar.classList.add('is-success');
        ponerTexto('Añadida');
        // Deja ver el estado de éxito un instante antes de irse de verdad.
        setTimeout(() => { window.location.href = dest; }, 180);
      } catch (err) {
        console.error(err);
        ctaReservar.classList.remove('is-loading');
        ctaReservar.classList.add('is-error');
        ponerTexto('No se pudo continuar, pulsa de nuevo');
      }
    };

    const yaTrackeado = sessionStorage.getItem('ri:' + prod.id) === '1';
    if (sb && !yaTrackeado) {
      trackReservaIniciada().finally(ir);
      setTimeout(ir, 500);
    } else {
      ir();
    }
  });
}

/* =========================================================
   ARMA TU KIT
   Kit libre: 1 pulsera + 1 colgante, elegidos entre las piezas sueltas
   (campo "tipo" en productos.js). No es un producto nuevo ni un SKU
   propio: cada pieza se personaliza en su ficha de siempre y entra en el
   carrito como pieza suelta, así que el pedido, el precio y el SKU se
   resuelven exactamente igual que al comprarlas por separado.
     Selector (arma-tu-kit.html) → personalizar.html?p=PULSERA&kit=COLGANTE
     Paso 1: el CTA añade la pulsera y lleva a ?p=COLGANTE&kitpaso=2
     Paso 2: el CTA añade el colgante y va al carrito, como siempre.
   ========================================================= */
(function () {
  if (typeof PRODUCTOS === 'undefined') return;
  const piezas = tipo => PRODUCTOS.filter(p => p.tipo === tipo);

  /* ---- Selector, en arma-tu-kit.html ---- */
  const selector = document.getElementById('kit-selector');
  if (selector) {
    const elegido = { pulsera: null, colgante: null };
    const material = { pulsera: 'oro', colgante: 'oro' };

    // Foto de la opción según el material: la portada de ese acabado
    // (fotoPortada lleva la de oro y la de plata); si no la hay, la
    // primera de la galería de ese acabado.
    const fotoDe = (prod, acabado) => {
      const portada = (prod.fotoPortada || []).find(f => f.includes('-' + acabado + '-'));
      return portada || fotosDe(prod, acabado).map(f => normFoto(f).src)[0] || '';
    };
    const continuar = document.getElementById('kit-continuar');
    const ayuda = document.getElementById('kit-ayuda');

    // Foto de la sección: en plata solo cuando las dos piezas van en
    // plata; en cualquier mezcla manda el oro, que es lo que se ve en la
    // foto dorada.
    /* Pase automático de la foto de la sección. Dos capas <img> que se
       turnan: la de abajo carga la siguiente y se funde encima. Cambia
       sola cada 5 s, se para si la pestaña no está a la vista o si el
       sistema pide menos movimiento, y al cambiar de material arranca de
       nuevo con las fotos de ese acabado. */
    const capaA = document.getElementById('arma-kit-foto-img');
    const capaB = document.getElementById('arma-kit-foto-img-b');
    // Todas las fotos del kit, en bucle: la foto grande es ambiente, no
    // tiene que coincidir con lo elegido (para eso está el resumen de
    // abajo, con una foto por pieza).
    const FOTOS_SECCION = [
      { src: 'img/arma-tu-kit-oro-1.jpg', alt: 'Caja de regalo de Cozumel abierta con un collar y una pulsera dorados, junto a la tarjeta y la caja con lazo' },
      { src: 'img/arma-tu-kit-plata-1.jpg', alt: 'Caja de regalo abierta con un collar de placa y un brazalete plateados, grabados' },
      { src: 'img/arma-tu-kit-oro-2.jpg', alt: 'Caja de regalo abierta con un collar de flor y un brazalete dorados, grabado con una fecha' },
      { src: 'img/arma-tu-kit-plata-2.jpg', alt: 'Caja de regalo abierta con un collar de flor y un brazalete plateados' },
    ];
    const PASE_MS = 4000; // cada 4 s (como Cozumel Stories), con el fundido largo de style.css
    let indiceFoto = 0, capaVisible = capaA, temporizadorFoto = null;
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

    const ponerFoto = (foto, conFundido) => {
      if (!capaA || !capaB) return;
      const entra = capaVisible === capaA ? capaB : capaA;
      if (!conFundido) {
        capaVisible.src = foto.src;
        capaVisible.alt = foto.alt;
        return;
      }
      // Si había un cambio esperando a que cargase su foto, se descarta:
      // si no, al resolverse los dos se apagaban entre sí y la sección se
      // quedaba sin foto.
      capaA.onload = null;
      capaB.onload = null;
      entra.src = foto.src;
      entra.alt = foto.alt;
      const mostrar = () => {
        entra.classList.add('visible');
        const sale = entra === capaA ? capaB : capaA;
        sale.classList.remove('visible');
        // La que sale deja de anunciarse al lector de pantalla.
        sale.setAttribute('aria-hidden', 'true');
        sale.alt = '';
        entra.removeAttribute('aria-hidden');
        capaVisible = entra;
      };
      if (entra.complete && entra.naturalWidth) mostrar();
      else entra.onload = mostrar;
    };

    const pararPase = () => { clearInterval(temporizadorFoto); temporizadorFoto = null; };
    const arrancarPase = () => {
      pararPase();
      if (!capaA || !capaB || sinMovimiento.matches) return;
      if (FOTOS_SECCION.length < 2) return;
      temporizadorFoto = setInterval(() => {
        if (document.hidden) return;
        indiceFoto = (indiceFoto + 1) % FOTOS_SECCION.length;
        ponerFoto(FOTOS_SECCION[indiceFoto], true);
      }, PASE_MS);
    };

    /* Resumen: la pieza elegida de cada hueco, en foto grande y con el
       material puesto. Es lo que deja ver de verdad qué se está armando;
       la foto de arriba va a su aire. */
    // Grabado de cada hueco: { pulsera: {grabado:'...'}, colgante: {...} }
    const grabados = { pulsera: {}, colgante: {} };

    /* Campos de grabado de una pieza, dentro del propio panel: la
       selección entera (pieza + material + grabado) se hace en esta
       pantalla, y de aquí se va directo al pago. Reutiliza CAMPOS_META,
       el mismo catálogo de campos que usa la ficha de producto. */
    const pintarCamposPieza = (fig, prod, hueco) => {
      const previa = fig.querySelector('.kit-campos');
      if (previa) previa.remove();
      if (!prod || !prod.campos || !prod.campos.length) return;

      const caja = document.createElement('div');
      caja.className = 'kit-campos';

      prod.campos.forEach(campo => {
        const meta = CAMPOS_META[campo];
        if (!meta) return;

        if (meta.tipo === 'color') {
          const wrap = document.createElement('div');
          wrap.className = 'kit-campo kit-campo--mes';
          const label = document.createElement('label');
          label.className = 'kit-campo-label';
          label.textContent = meta.label;
          const picker = document.createElement('div');
          picker.className = 'kit-meses';
          grabados[hueco][campo] = grabados[hueco][campo] || meta.opciones[0].valor;
          meta.opciones.forEach(opcion => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'kit-mes' + (opcion.valor === grabados[hueco][campo] ? ' activo' : '');
            btn.title = opcion.mes;
            const punto = document.createElement('span');
            punto.className = 'dot';
            punto.style.background = opcion.color;
            const abr = document.createElement('span');
            abr.textContent = opcion.mes.slice(0, 3);
            btn.append(punto, abr);
            btn.addEventListener('click', () => {
              grabados[hueco][campo] = opcion.valor;
              picker.querySelectorAll('.kit-mes').forEach(b => b.classList.remove('activo'));
              btn.classList.add('activo');
            });
            picker.appendChild(btn);
          });
          wrap.append(label, picker);
          caja.appendChild(wrap);
          return;
        }

        const wrap = document.createElement('div');
        wrap.className = 'kit-campo';
        const idCampo = 'kit-' + hueco + '-' + campo;
        const label = document.createElement('label');
        label.className = 'kit-campo-label';
        label.setAttribute('for', idCampo);
        label.textContent = meta.label + (meta.opcional ? ' (opcional)' : '');
        const input = document.createElement('input');
        input.type = 'text';
        input.id = idCampo;
        input.className = 'kit-campo-input';
        const tope = topeDeCampo(prod, campo, meta);
        if (tope) input.maxLength = tope;
        input.placeholder = meta.placeholder || '';
        input.value = grabados[hueco][campo] || '';
        input.addEventListener('input', () => { grabados[hueco][campo] = input.value.trim(); });
        wrap.append(label, input);
        if (!tope) ponerAvisoGrabadoLargo(input, wrap);
        caja.appendChild(wrap);
      });

      fig.appendChild(caja);
    };

    /* Pase de fotos de las piezas elegidas: cada 4 s pasa a la siguiente
       de su galería, las dos a la vez. Mismas reglas que el pase de
       arriba: quieto si la pestaña no se ve o se pide menos movimiento. */
    const fotosResumen = { pulsera: null, colgante: null };
    const ponerFotoResumen = (caja, f) => {
      caja.style.backgroundImage = f ? `url('${f.src}')` : '';
      caja.style.backgroundPosition = (f && f.pos) || '';
    };
    setInterval(() => {
      if (document.hidden || sinMovimiento.matches) return;
      document.querySelectorAll('.kit-resumen-pieza').forEach(fig => {
        const estado = fotosResumen[fig.dataset.hueco];
        if (!elegido[fig.dataset.hueco] || !estado || estado.lista.length < 2) return;
        estado.indice = (estado.indice + 1) % estado.lista.length;
        ponerFotoResumen(fig.querySelector('.kit-resumen-foto'), estado.lista[estado.indice]);
      });
    }, PASE_MS);

    const pintarResumen = () => {
      document.querySelectorAll('.kit-resumen-pieza').forEach(fig => {
        const hueco = fig.dataset.hueco;
        const prod = elegido[hueco];
        const foto = fig.querySelector('.kit-resumen-foto');
        const nombre = fig.querySelector('.kit-resumen-nombre');
        fig.classList.toggle('esta-elegida', !!prod);
        if (!prod) {
          foto.style.backgroundImage = '';
          delete fig.dataset.clave;
          fotosResumen[hueco] = null;
          nombre.textContent = 'Sin elegir';
          pintarCamposPieza(fig, null, hueco);
          return;
        }
        // Todas las fotos de la pieza en ese acabado: el pase de abajo las
        // va rotando. Solo se reinicia si cambia la pieza o el acabado,
        // no cada vez que se repinta el resumen.
        const clave = prod.id + '|' + material[hueco];
        if (fig.dataset.clave !== clave) {
          const lista = fotosDe(prod, material[hueco]).map(normFoto);
          if (!lista.length) {
            const unica = fotoDe(prod, material[hueco]);
            if (unica) lista.push({ src: unica });
          }
          fotosResumen[hueco] = { lista, indice: 0 };
          fig.dataset.clave = clave;
          ponerFotoResumen(foto, lista[0]);
        }
        nombre.textContent = prod.nombre + ' · ' + (material[hueco] === 'plata' ? 'plata' : 'oro');
        pintarCamposPieza(fig, prod, hueco);
      });
    };

    sinMovimiento.addEventListener('change', arrancarPase);
    arrancarPase();

    // El kit a tu gusto cuesta lo MISMO que los kits cerrados: es un
    // producto con precio propio, no la suma de las dos piezas.
    const productoKit = PRODUCTOS.find(p => p.id === 'kit_personalizado');

    const refrescar = () => {
      pintarResumen();
      const listo = elegido.pulsera && elegido.colgante;
      continuar.classList.toggle('is-disabled', !listo);
      const precioKit = productoKit ? precioTexto(productoKit) : null;
      continuar.textContent = listo && precioKit ? 'Ir a pagar · ' + precioKit : 'Arma tu kit';
      if (listo) {
        continuar.removeAttribute('aria-disabled');
        const txt = { oro: 'oro', plata: 'plata' };
        const ahorro = productoKit
          ? ahorroKit(productoKit, [elegido.pulsera.id, elegido.colgante.id])
          : null;
        ayuda.textContent = elegido.pulsera.nombre + ' en ' + txt[material.pulsera]
          + ' + ' + elegido.colgante.nombre + ' en ' + txt[material.colgante]
          + (ahorro ? ' · Ahorras ' + ahorro.texto + ' frente a comprarlas por separado (' + ahorro.sueltoTexto + ')' : '');
      } else {
        continuar.setAttribute('aria-disabled', 'true');
        ayuda.textContent = !elegido.pulsera && !elegido.colgante
          ? 'Elige una pulsera y un colgante'
          : (elegido.pulsera ? 'Ahora elige tu colgante' : 'Ahora elige tu pulsera');
      }
    };

    ['pulsera', 'colgante'].forEach(tipo => {
      const caja = document.getElementById('kit-opciones-' + tipo);
      if (!caja) return;
      piezas(tipo).forEach(prod => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'kit-opcion';
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', 'false');
        const foto = document.createElement('span');
        foto.className = 'kit-opcion-foto';
        const src = fotoDe(prod, material[tipo]);
        if (src) foto.style.backgroundImage = `url('${src}')`;
        b._prod = prod;
        const nombre = document.createElement('span');
        nombre.className = 'kit-opcion-nombre';
        nombre.textContent = prod.nombre;
        b.append(foto, nombre);
        b.addEventListener('click', () => {
          elegido[tipo] = prod;
          caja.querySelectorAll('.kit-opcion').forEach(o => o.setAttribute('aria-checked', String(o === b)));
          refrescar();
        });
        caja.appendChild(b);
      });
    });

    // Material de cada fila: mismas bolitas que el selector de acabado de
    // la ficha (.acabado-op), para que se reconozca al llegar a ella.
    document.querySelectorAll('.kit-material').forEach(grupo => {
      const tipo = grupo.dataset.tipo;
      const caja = document.getElementById('kit-opciones-' + tipo);
      const botones = [
        { valor: 'oro', clase: 'acabado-dot--oro', texto: 'Oro' },
        { valor: 'plata', clase: 'acabado-dot--plata', texto: 'Plata' },
      ].map(def => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'acabado-op';
        b.dataset.acabado = def.valor;
        b.setAttribute('role', 'radio');
        const dot = document.createElement('span');
        dot.className = 'acabado-dot ' + def.clase;
        dot.setAttribute('aria-hidden', 'true');
        b.append(dot, document.createTextNode(def.texto));
        grupo.appendChild(b);
        return b;
      });
      const marcar = () => botones.forEach(b => {
        const activo = b.dataset.acabado === material[tipo];
        b.classList.toggle('activo', activo);
        b.setAttribute('aria-checked', String(activo));
      });
      botones.forEach(b => b.addEventListener('click', () => {
        material[tipo] = b.dataset.acabado;
        marcar();
        pintarResumen();
        caja.querySelectorAll('.kit-opcion').forEach(o => {
          const src = fotoDe(o._prod, material[tipo]);
          if (src) o.querySelector('.kit-opcion-foto').style.backgroundImage = `url('${src}')`;
        });
        refrescar();
      }));
      marcar();
    });

    const avisar = (texto) => {
      if (texto) ayuda.textContent = texto;
      ayuda.classList.remove('kit-ayuda--aviso');
      void ayuda.offsetWidth; // reinicia la animación del aviso
      ayuda.classList.add('kit-ayuda--aviso');
    };

    continuar.addEventListener('click', e => {
      e.preventDefault();

      if (continuar.classList.contains('is-disabled') || !productoKit) {
        avisar();
        return;
      }

      // Falta algún grabado obligatorio: se avisa y no se sigue.
      const falta = ['pulsera', 'colgante'].find(hueco => (elegido[hueco].campos || []).some(campo => {
        const meta = CAMPOS_META[campo];
        return meta && !meta.opcional && meta.tipo !== 'color' && !(grabados[hueco][campo] || '').trim();
      }));
      if (falta) {
        avisar('Escribe el grabado de tu ' + falta);
        const vacio = document.querySelector('.kit-resumen-pieza[data-hueco="' + falta + '"] .kit-campo-input');
        if (vacio) vacio.focus();
        return;
      }

      /* Qué dos piezas, con qué acabado y con qué grabado cada una. El
         prefijo p1__/p2__ mantiene separados los grabados de las dos
         piezas; la base de datos lo deshace para resolver el SKU de cada
         una (ver supabase-migracion-v15.sql). */
      const personalizacion = {
        pieza_1: elegido.pulsera.id,
        pieza_2: elegido.colgante.id,
        acabado__pieza_1: material.pulsera,
        acabado__pieza_2: material.colgante,
      };
      Object.entries(grabados.pulsera).forEach(([k, v]) => { if (v) personalizacion['p1__' + k] = v; });
      Object.entries(grabados.colgante).forEach(([k, v]) => { if (v) personalizacion['p2__' + k] = v; });

      const precio = precioDe(productoKit);
      anadirKitAlCarrito(productoKit, personalizacion, precio);
      window.location.href = 'comprar.html';
    });

    function anadirKitAlCarrito(prodKit, personalizacion, precio) {
      añadirAlCarrito(normalizarItemCarrito({
        producto: prodKit.id,
        cantidad: 1,
        personalizacion,
        mercado: precio ? precio.mercado : null,
        moneda: precio ? precio.moneda : null,
        precio: precio ? precio.importe : null,
      }));
    }
    refrescar();
  }

  /* Antes, el kit se armaba en dos pasos (una ficha por pieza). Ahora se
     configura entero en la propia sección "Arma tu kit" y de ahí se va al
     pago, así que ese recorrido y su aviso de "Paso 1 de 2" ya no
     existen. */
})();

/* ---------- CTA STICKY (ficha de producto) ----------
   Aparece cuando #cta-reservar sale del viewport y el usuario ya hizo
   scroll (para no mostrarlo de entrada, antes de que nadie toque nada).
   El botón sticky no repite la lógica de compra: dispara un click()
   sobre el CTA real, así reutiliza tal cual su tracking, sus estados y
   su navegación (justo arriba). */
(function () {
  const sticky = document.getElementById('cta-sticky');
  const ctaOriginal = document.getElementById('cta-reservar');
  if (!sticky || !ctaOriginal) return;

  const nombreEl = document.getElementById('cta-sticky-nombre');
  const precioEl = document.getElementById('cta-sticky-precio');
  const botonSticky = document.getElementById('cta-sticky-btn');

  let yaHizoScroll = false;
  let ctaOriginalVisible = true;

  const actualizar = () => {
    const debeMostrarse = yaHizoScroll && !ctaOriginalVisible;
    if (debeMostrarse === sticky.classList.contains('visible')) return;
    if (debeMostrarse) {
      const titulo = document.getElementById('producto-titulo');
      const precio = document.getElementById('resumen-precio');
      if (nombreEl) nombreEl.textContent = titulo ? titulo.textContent : '';
      if (precioEl) precioEl.textContent = precio ? precio.textContent : '';
    }
    sticky.classList.toggle('visible', debeMostrarse);
    sticky.setAttribute('aria-hidden', String(!debeMostrarse));
  };

  new IntersectionObserver((entradas) => {
    ctaOriginalVisible = entradas[0].isIntersecting;
    actualizar();
  }).observe(ctaOriginal);

  window.addEventListener('scroll', () => {
    yaHizoScroll = true;
    actualizar();
  }, { once: true, passive: true });

  if (botonSticky) {
    botonSticky.addEventListener('click', () => {
      sticky.classList.remove('visible');
      sticky.setAttribute('aria-hidden', 'true');
      ctaOriginal.click();
    });
  }
})();


/* Prefijos telefonicos internacionales, para el desplegable del campo
   WhatsApp de comprar.html. Primero los 20 paises de habla hispana
   (Mexico y Espana delante, por peso de audiencia; el resto alfabetico),
   luego el resto del mundo, tambien alfabetico. Varios paises comparten
   el mismo prefijo a proposito (+1 para EE. UU., Canada y el Caribe
   angloparlante; +7 para Rusia y Kazajistan): no es un error, es como
   funciona la numeracion E.164. */
const PAISES_TELEFONO = [
  { pais: 'México', codigo: '+52', iso: 'mx' },
  { pais: 'España', codigo: '+34', iso: 'es' },
  { pais: 'Argentina', codigo: '+54', iso: 'ar' },
  { pais: 'Bolivia', codigo: '+591', iso: 'bo' },
  { pais: 'Chile', codigo: '+56', iso: 'cl' },
  { pais: 'Colombia', codigo: '+57', iso: 'co' },
  { pais: 'Costa Rica', codigo: '+506', iso: 'cr' },
  { pais: 'Cuba', codigo: '+53', iso: 'cu' },
  { pais: 'Ecuador', codigo: '+593', iso: 'ec' },
  { pais: 'El Salvador', codigo: '+503', iso: 'sv' },
  { pais: 'Guatemala', codigo: '+502', iso: 'gt' },
  { pais: 'Guinea Ecuatorial', codigo: '+240', iso: 'gq' },
  { pais: 'Honduras', codigo: '+504', iso: 'hn' },
  { pais: 'Nicaragua', codigo: '+505', iso: 'ni' },
  { pais: 'Panamá', codigo: '+507', iso: 'pa' },
  { pais: 'Paraguay', codigo: '+595', iso: 'py' },
  { pais: 'Perú', codigo: '+51', iso: 'pe' },
  { pais: 'República Dominicana', codigo: '+1', iso: 'do' },
  { pais: 'Uruguay', codigo: '+598', iso: 'uy' },
  { pais: 'Venezuela', codigo: '+58', iso: 've' },
  { pais: 'Afganistán', codigo: '+93', iso: 'af' },
  { pais: 'Albania', codigo: '+355', iso: 'al' },
  { pais: 'Alemania', codigo: '+49', iso: 'de' },
  { pais: 'Andorra', codigo: '+376', iso: 'ad' },
  { pais: 'Angola', codigo: '+244', iso: 'ao' },
  { pais: 'Anguila', codigo: '+1', iso: 'ai' },
  { pais: 'Antigua y Barbuda', codigo: '+1', iso: 'ag' },
  { pais: 'Arabia Saudita', codigo: '+966', iso: 'sa' },
  { pais: 'Argelia', codigo: '+213', iso: 'dz' },
  { pais: 'Armenia', codigo: '+374', iso: 'am' },
  { pais: 'Aruba', codigo: '+297', iso: 'aw' },
  { pais: 'Australia', codigo: '+61', iso: 'au' },
  { pais: 'Austria', codigo: '+43', iso: 'at' },
  { pais: 'Azerbaiyán', codigo: '+994', iso: 'az' },
  { pais: 'Bahamas', codigo: '+1', iso: 'bs' },
  { pais: 'Bangladés', codigo: '+880', iso: 'bd' },
  { pais: 'Barbados', codigo: '+1', iso: 'bb' },
  { pais: 'Baréin', codigo: '+973', iso: 'bh' },
  { pais: 'Belice', codigo: '+501', iso: 'bz' },
  { pais: 'Benín', codigo: '+229', iso: 'bj' },
  { pais: 'Bermudas', codigo: '+1', iso: 'bm' },
  { pais: 'Bielorrusia', codigo: '+375', iso: 'by' },
  { pais: 'Bosnia y Herzegovina', codigo: '+387', iso: 'ba' },
  { pais: 'Botsuana', codigo: '+267', iso: 'bw' },
  { pais: 'Brasil', codigo: '+55', iso: 'br' },
  { pais: 'Brunéi', codigo: '+673', iso: 'bn' },
  { pais: 'Bulgaria', codigo: '+359', iso: 'bg' },
  { pais: 'Burkina Faso', codigo: '+226', iso: 'bf' },
  { pais: 'Burundi', codigo: '+257', iso: 'bi' },
  { pais: 'Bután', codigo: '+975', iso: 'bt' },
  { pais: 'Bélgica', codigo: '+32', iso: 'be' },
  { pais: 'Cabo Verde', codigo: '+238', iso: 'cv' },
  { pais: 'Camboya', codigo: '+855', iso: 'kh' },
  { pais: 'Camerún', codigo: '+237', iso: 'cm' },
  { pais: 'Canadá', codigo: '+1', iso: 'ca' },
  { pais: 'Catar', codigo: '+974', iso: 'qa' },
  { pais: 'Chad', codigo: '+235', iso: 'td' },
  { pais: 'China', codigo: '+86', iso: 'cn' },
  { pais: 'Chipre', codigo: '+357', iso: 'cy' },
  { pais: 'Ciudad del Vaticano', codigo: '+379', iso: 'va' },
  { pais: 'Comoras', codigo: '+269', iso: 'km' },
  { pais: 'Congo (Brazzaville)', codigo: '+242', iso: 'cg' },
  { pais: 'Congo (Kinshasa)', codigo: '+243', iso: 'cd' },
  { pais: 'Corea del Norte', codigo: '+850', iso: 'kp' },
  { pais: 'Corea del Sur', codigo: '+82', iso: 'kr' },
  { pais: 'Costa de Marfil', codigo: '+225', iso: 'ci' },
  { pais: 'Croacia', codigo: '+385', iso: 'hr' },
  { pais: 'Dinamarca', codigo: '+45', iso: 'dk' },
  { pais: 'Dominica', codigo: '+1', iso: 'dm' },
  { pais: 'Egipto', codigo: '+20', iso: 'eg' },
  { pais: 'Emiratos Árabes Unidos', codigo: '+971', iso: 'ae' },
  { pais: 'Eritrea', codigo: '+291', iso: 'er' },
  { pais: 'Eslovaquia', codigo: '+421', iso: 'sk' },
  { pais: 'Eslovenia', codigo: '+386', iso: 'si' },
  { pais: 'Estados Unidos', codigo: '+1', iso: 'us' },
  { pais: 'Estonia', codigo: '+372', iso: 'ee' },
  { pais: 'Esuatini', codigo: '+268', iso: 'sz' },
  { pais: 'Etiopía', codigo: '+251', iso: 'et' },
  { pais: 'Filipinas', codigo: '+63', iso: 'ph' },
  { pais: 'Finlandia', codigo: '+358', iso: 'fi' },
  { pais: 'Fiyi', codigo: '+679', iso: 'fj' },
  { pais: 'Francia', codigo: '+33', iso: 'fr' },
  { pais: 'Gabón', codigo: '+241', iso: 'ga' },
  { pais: 'Gambia', codigo: '+220', iso: 'gm' },
  { pais: 'Georgia', codigo: '+995', iso: 'ge' },
  { pais: 'Ghana', codigo: '+233', iso: 'gh' },
  { pais: 'Gibraltar', codigo: '+350', iso: 'gi' },
  { pais: 'Granada', codigo: '+1', iso: 'gd' },
  { pais: 'Grecia', codigo: '+30', iso: 'gr' },
  { pais: 'Groenlandia', codigo: '+299', iso: 'gl' },
  { pais: 'Guadalupe', codigo: '+590', iso: 'gp' },
  { pais: 'Guam', codigo: '+1', iso: 'gu' },
  { pais: 'Guayana Francesa', codigo: '+594', iso: 'gf' },
  { pais: 'Guinea', codigo: '+224', iso: 'gn' },
  { pais: 'Guinea-Bisáu', codigo: '+245', iso: 'gw' },
  { pais: 'Guyana', codigo: '+592', iso: 'gy' },
  { pais: 'Haití', codigo: '+509', iso: 'ht' },
  { pais: 'Hong Kong', codigo: '+852', iso: 'hk' },
  { pais: 'Hungría', codigo: '+36', iso: 'hu' },
  { pais: 'India', codigo: '+91', iso: 'in' },
  { pais: 'Indonesia', codigo: '+62', iso: 'id' },
  { pais: 'Irak', codigo: '+964', iso: 'iq' },
  { pais: 'Irlanda', codigo: '+353', iso: 'ie' },
  { pais: 'Irán', codigo: '+98', iso: 'ir' },
  { pais: 'Islandia', codigo: '+354', iso: 'is' },
  { pais: 'Islas Caimán', codigo: '+1', iso: 'ky' },
  { pais: 'Islas Cook', codigo: '+682', iso: 'ck' },
  { pais: 'Islas Feroe', codigo: '+298', iso: 'fo' },
  { pais: 'Islas Malvinas', codigo: '+500', iso: 'fk' },
  { pais: 'Islas Marshall', codigo: '+692', iso: 'mh' },
  { pais: 'Islas Salomón', codigo: '+677', iso: 'sb' },
  { pais: 'Islas Turcas y Caicos', codigo: '+1', iso: 'tc' },
  { pais: 'Islas Vírgenes Británicas', codigo: '+1', iso: 'vg' },
  { pais: 'Islas Vírgenes de EE. UU.', codigo: '+1', iso: 'vi' },
  { pais: 'Israel', codigo: '+972', iso: 'il' },
  { pais: 'Italia', codigo: '+39', iso: 'it' },
  { pais: 'Jamaica', codigo: '+1', iso: 'jm' },
  { pais: 'Japón', codigo: '+81', iso: 'jp' },
  { pais: 'Jordania', codigo: '+962', iso: 'jo' },
  { pais: 'Kazajistán', codigo: '+7', iso: 'kz' },
  { pais: 'Kenia', codigo: '+254', iso: 'ke' },
  { pais: 'Kirguistán', codigo: '+996', iso: 'kg' },
  { pais: 'Kiribati', codigo: '+686', iso: 'ki' },
  { pais: 'Kosovo', codigo: '+383', iso: 'xk' },
  { pais: 'Kuwait', codigo: '+965', iso: 'kw' },
  { pais: 'Laos', codigo: '+856', iso: 'la' },
  { pais: 'Lesoto', codigo: '+266', iso: 'ls' },
  { pais: 'Letonia', codigo: '+371', iso: 'lv' },
  { pais: 'Liberia', codigo: '+231', iso: 'lr' },
  { pais: 'Libia', codigo: '+218', iso: 'ly' },
  { pais: 'Liechtenstein', codigo: '+423', iso: 'li' },
  { pais: 'Lituania', codigo: '+370', iso: 'lt' },
  { pais: 'Luxemburgo', codigo: '+352', iso: 'lu' },
  { pais: 'Líbano', codigo: '+961', iso: 'lb' },
  { pais: 'Macao', codigo: '+853', iso: 'mo' },
  { pais: 'Macedonia del Norte', codigo: '+389', iso: 'mk' },
  { pais: 'Madagascar', codigo: '+261', iso: 'mg' },
  { pais: 'Malasia', codigo: '+60', iso: 'my' },
  { pais: 'Malaui', codigo: '+265', iso: 'mw' },
  { pais: 'Maldivas', codigo: '+960', iso: 'mv' },
  { pais: 'Malta', codigo: '+356', iso: 'mt' },
  { pais: 'Malí', codigo: '+223', iso: 'ml' },
  { pais: 'Marruecos', codigo: '+212', iso: 'ma' },
  { pais: 'Martinica', codigo: '+596', iso: 'mq' },
  { pais: 'Mauricio', codigo: '+230', iso: 'mu' },
  { pais: 'Mauritania', codigo: '+222', iso: 'mr' },
  { pais: 'Mayotte', codigo: '+262', iso: 'yt' },
  { pais: 'Micronesia', codigo: '+691', iso: 'fm' },
  { pais: 'Moldavia', codigo: '+373', iso: 'md' },
  { pais: 'Mongolia', codigo: '+976', iso: 'mn' },
  { pais: 'Montenegro', codigo: '+382', iso: 'me' },
  { pais: 'Montserrat', codigo: '+1', iso: 'ms' },
  { pais: 'Mozambique', codigo: '+258', iso: 'mz' },
  { pais: 'Myanmar (Birmania)', codigo: '+95', iso: 'mm' },
  { pais: 'Mónaco', codigo: '+377', iso: 'mc' },
  { pais: 'Namibia', codigo: '+264', iso: 'na' },
  { pais: 'Nauru', codigo: '+674', iso: 'nr' },
  { pais: 'Nepal', codigo: '+977', iso: 'np' },
  { pais: 'Nigeria', codigo: '+234', iso: 'ng' },
  { pais: 'Noruega', codigo: '+47', iso: 'no' },
  { pais: 'Nueva Caledonia', codigo: '+687', iso: 'nc' },
  { pais: 'Nueva Zelanda', codigo: '+64', iso: 'nz' },
  { pais: 'Níger', codigo: '+227', iso: 'ne' },
  { pais: 'Omán', codigo: '+968', iso: 'om' },
  { pais: 'Pakistán', codigo: '+92', iso: 'pk' },
  { pais: 'Palaos', codigo: '+680', iso: 'pw' },
  { pais: 'Palestina', codigo: '+970', iso: 'ps' },
  { pais: 'Papúa Nueva Guinea', codigo: '+675', iso: 'pg' },
  { pais: 'Países Bajos', codigo: '+31', iso: 'nl' },
  { pais: 'Polinesia Francesa', codigo: '+689', iso: 'pf' },
  { pais: 'Polonia', codigo: '+48', iso: 'pl' },
  { pais: 'Portugal', codigo: '+351', iso: 'pt' },
  { pais: 'Puerto Rico', codigo: '+1', iso: 'pr' },
  { pais: 'Reino Unido', codigo: '+44', iso: 'gb' },
  { pais: 'República Centroafricana', codigo: '+236', iso: 'cf' },
  { pais: 'República Checa', codigo: '+420', iso: 'cz' },
  { pais: 'Ruanda', codigo: '+250', iso: 'rw' },
  { pais: 'Rumanía', codigo: '+40', iso: 'ro' },
  { pais: 'Rusia', codigo: '+7', iso: 'ru' },
  { pais: 'Samoa', codigo: '+685', iso: 'ws' },
  { pais: 'Samoa Americana', codigo: '+1', iso: 'as' },
  { pais: 'San Cristóbal y Nieves', codigo: '+1', iso: 'kn' },
  { pais: 'San Marino', codigo: '+378', iso: 'sm' },
  { pais: 'San Pedro y Miquelón', codigo: '+508', iso: 'pm' },
  { pais: 'San Vicente y las Granadinas', codigo: '+1', iso: 'vc' },
  { pais: 'Santa Elena', codigo: '+290', iso: 'sh' },
  { pais: 'Santa Lucía', codigo: '+1', iso: 'lc' },
  { pais: 'Santo Tomé y Príncipe', codigo: '+239', iso: 'st' },
  { pais: 'Senegal', codigo: '+221', iso: 'sn' },
  { pais: 'Serbia', codigo: '+381', iso: 'rs' },
  { pais: 'Seychelles', codigo: '+248', iso: 'sc' },
  { pais: 'Sierra Leona', codigo: '+232', iso: 'sl' },
  { pais: 'Singapur', codigo: '+65', iso: 'sg' },
  { pais: 'Siria', codigo: '+963', iso: 'sy' },
  { pais: 'Somalia', codigo: '+252', iso: 'so' },
  { pais: 'Sri Lanka', codigo: '+94', iso: 'lk' },
  { pais: 'Sudáfrica', codigo: '+27', iso: 'za' },
  { pais: 'Sudán', codigo: '+249', iso: 'sd' },
  { pais: 'Sudán del Sur', codigo: '+211', iso: 'ss' },
  { pais: 'Suecia', codigo: '+46', iso: 'se' },
  { pais: 'Suiza', codigo: '+41', iso: 'ch' },
  { pais: 'Surinam', codigo: '+597', iso: 'sr' },
  { pais: 'Tailandia', codigo: '+66', iso: 'th' },
  { pais: 'Taiwán', codigo: '+886', iso: 'tw' },
  { pais: 'Tanzania', codigo: '+255', iso: 'tz' },
  { pais: 'Tayikistán', codigo: '+992', iso: 'tj' },
  { pais: 'Timor Oriental', codigo: '+670', iso: 'tl' },
  { pais: 'Togo', codigo: '+228', iso: 'tg' },
  { pais: 'Tonga', codigo: '+676', iso: 'to' },
  { pais: 'Trinidad y Tobago', codigo: '+1', iso: 'tt' },
  { pais: 'Turkmenistán', codigo: '+993', iso: 'tm' },
  { pais: 'Turquía', codigo: '+90', iso: 'tr' },
  { pais: 'Tuvalu', codigo: '+688', iso: 'tv' },
  { pais: 'Túnez', codigo: '+216', iso: 'tn' },
  { pais: 'Ucrania', codigo: '+380', iso: 'ua' },
  { pais: 'Uganda', codigo: '+256', iso: 'ug' },
  { pais: 'Uzbekistán', codigo: '+998', iso: 'uz' },
  { pais: 'Vanuatu', codigo: '+678', iso: 'vu' },
  { pais: 'Vietnam', codigo: '+84', iso: 'vn' },
  { pais: 'Wallis y Futuna', codigo: '+681', iso: 'wf' },
  { pais: 'Yemen', codigo: '+967', iso: 'ye' },
  { pais: 'Yibuti', codigo: '+253', iso: 'dj' },
  { pais: 'Zambia', codigo: '+260', iso: 'zm' },
  { pais: 'Zimbabue', codigo: '+263', iso: 'zw' },
];

/* ---------- Formulario de reserva (comprar.html) ---------- */
const reservaForm = document.getElementById('reserva-form');

/* Documento de identidad para la aduana: en Chile (RUT) y Perú (DNI o
   RUC) el transportista no libera el paquete sin él. Solo se pide en esos
   dos mercados; en el resto el campo ni se ve ni es obligatorio. */
const DOCUMENTO_ADUANA = {
  CL: { etiqueta: 'RUT (obligatorio para la aduana de Chile)', ejemplo: '12345678-K' },
  PE: { etiqueta: 'DNI o RUC (obligatorio para la aduana de Perú)', ejemplo: 'Tu DNI o RUC' },
};

function sincronizarCampoDocumento() {
  const campo = document.getElementById('campo-documento');
  const input = document.getElementById('r-documento');
  if (!campo || !input) return;
  const doc = DOCUMENTO_ADUANA[getMercado()];
  campo.hidden = !doc;
  input.required = !!doc;
  if (doc) {
    document.getElementById('r-documento-label').textContent = doc.etiqueta;
    input.placeholder = doc.ejemplo;
  }
}

if (reservaForm) {
  sincronizarCampoDocumento();
  alCambiarMercado(sincronizarCampoDocumento);
  reservaForm.addEventListener('focusin', trackReservaIniciada, { once: true });

  // Desplegable de prefijos: no se puede usar un <select> nativo porque
  // no admite bandera ni buscar por texto libre (solo salta a la primera
  // letra). El valor real vive en el input oculto #r-whatsapp-prefijo;
  // el resto del formulario lo lee igual que antes leía el <select>.
  const prefijoSelect = document.getElementById('r-whatsapp-prefijo');
  const telCombo = document.getElementById('tel-combo');
  if (prefijoSelect && telCombo) {
    const toggle = document.getElementById('tel-combo-toggle');
    const bandera = document.getElementById('tel-combo-bandera');
    const codigoTxt = document.getElementById('tel-combo-codigo');
    const panel = document.getElementById('tel-combo-panel');
    const lista = document.getElementById('tel-combo-lista');

    const banderaUrl = iso => `https://cdn.jsdelivr.net/npm/flag-icons@7/flags/4x3/${iso}.svg`;

    let indiceActivo = -1;

    const marcarActiva = i => {
      indiceActivo = i;
      [...lista.children].forEach((li, idx) => li.classList.toggle('activa', idx === i));
      if (i >= 0) lista.children[i].scrollIntoView({ block: 'nearest' });
    };

    const seleccionar = pais => {
      bandera.src = banderaUrl(pais.iso);
      bandera.alt = pais.pais;
      codigoTxt.textContent = pais.codigo;
      prefijoSelect.value = pais.codigo;
      cerrar();
      toggle.focus();
    };

    // La lista se construye UNA sola vez (no en cada apertura): rehacer
    // 224 filas con su bandera cada vez que se abría el panel era lo que
    // se sentía "pillado".
    PAISES_TELEFONO.forEach((pais, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      const img = document.createElement('img');
      img.src = banderaUrl(pais.iso);
      img.alt = '';
      img.loading = 'lazy';
      const nombre = document.createElement('span');
      nombre.className = 'tel-combo-nombre';
      nombre.textContent = pais.pais;
      const codigo = document.createElement('span');
      codigo.className = 'tel-combo-codigo';
      codigo.textContent = pais.codigo;
      li.append(img, nombre, codigo);
      li.addEventListener('click', () => seleccionar(pais));
      li.addEventListener('mouseenter', () => marcarActiva(i));
      lista.appendChild(li);
    });

    function abrir() {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      const iActual = PAISES_TELEFONO.findIndex(p => p.codigo === prefijoSelect.value);
      marcarActiva(iActual >= 0 ? iActual : 0);
      document.addEventListener('click', alClicFuera);
    }

    function cerrar() {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', alClicFuera);
    }

    function alClicFuera(e) {
      if (!telCombo.contains(e.target)) cerrar();
    }

    toggle.addEventListener('click', () => {
      if (panel.hidden) abrir(); else cerrar();
    });

    toggle.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (!panel.hidden) { e.preventDefault(); cerrar(); }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (panel.hidden) abrir();
        else marcarActiva(Math.min(indiceActivo + 1, PAISES_TELEFONO.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!panel.hidden) marcarActiva(Math.max(indiceActivo - 1, 0));
      } else if (e.key === 'Enter' && !panel.hidden) {
        e.preventDefault();
        const elegido = PAISES_TELEFONO[indiceActivo];
        if (elegido) seleccionar(elegido);
      }
    });

    // Selección inicial: el valor por defecto del input oculto (+52).
    const inicial = PAISES_TELEFONO.find(p => p.codigo === prefijoSelect.value) || PAISES_TELEFONO[0];
    bandera.src = banderaUrl(inicial.iso);
    bandera.alt = inicial.pais;
    codigoTxt.textContent = inicial.codigo;
  }

  const reservaSubmitBtn = document.getElementById('reserva-submit');
  const reservaConfigWarning = document.getElementById('reserva-config-warning');
  const reservaError = document.getElementById('reserva-error');
  const sinPiezaAviso = document.getElementById('sin-pieza');
  const sinPrecioAviso = document.getElementById('sin-precio');
  const carritoLista = document.getElementById('carrito-lista');
  const loginGate = document.getElementById('login-gate');
  const btnLoginGoogle = document.getElementById('btn-login-google');
  const btnLogout = document.getElementById('btn-logout');

  if (!SUPA_READY || !sb) {
    reservaConfigWarning.hidden = false;
    reservaSubmitBtn.disabled = true;
  }

  /* ---------- Etiqueta corta del acabado, para el resumen del carrito ----------
     Una pieza suelta: "Bañado en oro". Un kit (varios grupos): una línea
     por pieza del kit, con su etiqueta corta ("pieza" en productos.js). */
  function resumenAcabado(prod, datos) {
    if (esKitLibre(prod)) {
      return piezasDelKitLibre(datos)
        .map(({ prod: pieza, acabado }) =>
          pieza.nombre + ': ' + (acabado === 'plata' ? 'Plateado' : 'Bañado en oro'))
        .join(' · ');
    }
    const grupos = (prod.acabados && prod.acabados.length)
      ? prod.acabados
      : [{ campo: 'acabado', pieza: null }];
    return grupos.map(g => {
      const texto = datos[g.campo] === 'plata' ? 'Plateado' : 'Bañado en oro';
      return g.pieza ? `${g.pieza}: ${texto}` : texto;
    }).join(' · ');
  }

  /* ---------- Pintar el carrito entero ----------
     Se llama al cargar la página y cada vez que se quita una pieza. No
     hace falta llamarla al añadir: añadir siempre navega aquí desde cero
     (ver el CTA de personalizar.html), así que la página ya carga con el
     carrito al día. */
  function pintarCarrito() {
    const items = getCarrito();
    carritoLista.textContent = '';

    let total = 0;
    let huboPiezaSinPrecio = false;

    items.forEach((item, indice) => {
      const prod = PRODUCTOS.find(p => p.id === item.producto);
      if (!prod) return; // el catálogo cambió desde que se añadió: se ignora sin romper el resto

      // El precio se relee del mercado ACTIVO, no del que se guardó al
      // añadir: si se cambió de país, el carrito se recalcula solo.
      const precioItem = precioDe(prod);
      if (!precioItem) huboPiezaSinPrecio = true;
      else total += precioItem.importe;

      const tarjeta = document.createElement('div');
      tarjeta.className = 'carrito-item';

      const nombre = document.createElement('p');
      nombre.className = 'carrito-item-nombre';
      nombre.textContent = prod.nombre;
      tarjeta.appendChild(nombre);

      const resumen = resumenGrabado(prod, item.personalizacion);
      if (resumen) {
        const linea = document.createElement('p');
        linea.className = 'carrito-item-linea';
        linea.textContent = resumen;
        tarjeta.appendChild(linea);
      }

      const acabado = document.createElement('p');
      acabado.className = 'carrito-item-acabado';
      acabado.textContent = resumenAcabado(prod, item.personalizacion);
      tarjeta.appendChild(acabado);

      const precio = document.createElement('p');
      precio.className = 'carrito-item-precio';
      precio.textContent = precioItem ? formatearImporte(precioItem.importe, precioItem.moneda) : 'Precio pendiente de confirmar';
      tarjeta.appendChild(precio);

      const quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.className = 'carrito-item-quitar';
      quitar.setAttribute('aria-label', `Quitar ${prod.nombre} del carrito`);
      quitar.textContent = '×';
      quitar.addEventListener('click', () => {
        quitarDelCarrito(indice);
        pintarCarrito();
      });
      tarjeta.appendChild(quitar);

      carritoLista.appendChild(tarjeta);
    });

    let totalEl = document.querySelector('.carrito-total');
    if (totalEl) totalEl.remove();
    if (items.length) {
      totalEl = document.createElement('div');
      totalEl.className = 'carrito-total';
      totalEl.innerHTML = '<span>Total</span><strong></strong>';
      totalEl.querySelector('strong').textContent = formatearImporte(total, getMoneda()) || '—';
      carritoLista.insertAdjacentElement('afterend', totalEl);
    }

    const carritoVacio = items.length === 0;
    if (sinPiezaAviso) sinPiezaAviso.hidden = !carritoVacio;
    if (sinPrecioAviso) sinPrecioAviso.hidden = !huboPiezaSinPrecio;
    reservaSubmitBtn.disabled = carritoVacio || huboPiezaSinPrecio || (!SUPA_READY || !sb);

    return items;
  }

  pintarCarrito();

  // El aviso se destapa ANTES de escribir el texto: un lector de pantalla
  // no anuncia cambios dentro de una región aria-live que sigue oculta.
  const showReservaError = (msg) => { reservaError.hidden = false; reservaError.textContent = msg; };
  const hideReservaError = () => { reservaError.hidden = true; };

  /* ---- Login con Google ----
     Guarda la sesión en un cierre (no en window) para que el envío del
     formulario pueda leer el user_id sin volver a preguntarle a Supabase. */
  let sesionActual = null;

  const mostrarSegunSesion = (session) => {
    sesionActual = session || null;
    const haySesion = !!sesionActual;

    if (loginGate) loginGate.hidden = haySesion;
    reservaForm.hidden = !haySesion;
    if (btnLogout) btnLogout.hidden = !haySesion;

    if (haySesion) {
      const meta = sesionActual.user.user_metadata || {};
      // Solo precarga si el campo está vacío: si la persona ya escribió
      // algo (o volvió a la página con datos guardados), no se lo pisa.
      if (!reservaForm.nombre.value) reservaForm.nombre.value = meta.full_name || meta.name || '';
      if (!reservaForm.email.value) reservaForm.email.value = sesionActual.user.email || '';
    }
  };

  if (SUPA_READY && sb) {
    sb.auth.getSession().then(({ data }) => mostrarSegunSesion(data.session)).catch(() => mostrarSegunSesion(null));
    sb.auth.onAuthStateChange((_evento, session) => mostrarSegunSesion(session));
  } else {
    // Sin Supabase configurado no hay nada que pedir: el aviso de
    // "Supabase no está conectado todavía" ya cubre este caso.
    if (loginGate) loginGate.hidden = true;
  }

  if (btnLoginGoogle) {
    btnLoginGoogle.addEventListener('click', async () => {
      if (!sb) return;
      hideReservaError();
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href },
      });
      if (error) {
        console.error(error);
        showReservaError('No se ha podido abrir el login de Google. Inténtalo de nuevo en unos minutos');
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      if (!sb) return;
      const { error } = await sb.auth.signOut();
      if (error) {
        console.error(error);
        showReservaError('No se ha podido cerrar la sesión. Inténtalo de nuevo');
      }
    });
  }

  reservaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideReservaError();

    // Los datos de la ficha (nombre/dirección/etc) se comparten para
    // TODAS las piezas del pedido: es un único envío a una dirección, no
    // uno por pieza. Cada fila de "reservas" guarda su propio producto y
    // personalización, pero repite estos mismos datos de contacto.
    const items = getCarrito()
      .map(item => ({ item, prod: PRODUCTOS.find(p => p.id === item.producto) }))
      .filter(({ prod }) => prod); // el catálogo pudo cambiar desde que se añadió

    if (!items.length) {
      showReservaError('Tu carrito está vacío. Añade alguna pieza antes de comprar');
      return;
    }
    if (items.some(({ prod }) => !precioDe(prod))) {
      showReservaError('Alguna pieza de tu carrito todavía no tiene precio, no se puede comprar');
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

    const datosComunes = {
      user_id: sesionActual.user.id,
      nombre: reservaForm.nombre.value.trim(),
      apellidos: reservaForm.apellidos.value.trim(),
      email: reservaForm.email.value.trim(),
      whatsapp: `${prefijoSelect.value} ${reservaForm.whatsapp.value.trim()}`.trim(),
      pais: reservaForm.pais.value.trim(),
      // El RUT/DNI va pegado a la dirección: es donde se mira al preparar
      // el envío, y así no hace falta una columna nueva en la base.
      direccion_envio: [
        reservaForm.direccion_envio.value.trim(),
        DOCUMENTO_ADUANA[getMercado()] && reservaForm.documento.value.trim()
          ? `${getMercado() === 'CL' ? 'RUT' : 'DNI/RUC'}: ${reservaForm.documento.value.trim()}`
          : '',
      ].filter(Boolean).join(' · '),
      fuente: 'adri_story',
      estado: 'pendiente_pago',
      consentimiento: document.getElementById('r-consent').checked,
      session_id: getSessionId(),
    };

    /* Reintento tras cancelar en Stripe: sin esto, cada intento insertaba
       filas nuevas y dejaba las anteriores huérfanas en 'pendiente_pago'.
       Se recuerdan los ids del último intento junto con una huella del
       pedido (piezas + personalización + precio). Si se vuelve con el
       mismo carrito y el mismo usuario, esas filas se reutilizan: se
       actualizan los datos de envío y se mandan a Stripe otra vez. Si el
       carrito cambió, o las filas ya no están pendientes (pagadas o
       borradas), se insertan nuevas como siempre. La política de UPDATE
       de Supabase solo deja tocar filas propias en 'pendiente_pago' (ver
       supabase-migracion-v7.sql), así que esto no abre nada nuevo. */
    const RESERVA_PENDIENTE_KEY = 'cozumel_reserva_pendiente';
    const leerReservaPendiente = () => {
      try {
        const guardado = JSON.parse(sessionStorage.getItem(RESERVA_PENDIENTE_KEY));
        return guardado && Array.isArray(guardado.ids) && guardado.ids.length ? guardado : null;
      } catch (_) { return null; }
    };
    const guardarReservaPendiente = (datos) => {
      try { sessionStorage.setItem(RESERVA_PENDIENTE_KEY, JSON.stringify(datos)); } catch (_) {}
    };

    // Mercado y moneda viajan con el pedido: el servidor vuelve a
    // calcular el precio con ellos (crear-sesion-pago), así que lo que se
    // manda desde aquí es informativo, nunca la fuente del cobro.
    const payloads = items.map(({ item, prod }) => {
      const precio = precioDe(prod);
      return {
        ...datosComunes,
        personalizacion: item.personalizacion,
        producto: prod.id,
        mercado: precio.mercado,
        moneda: precio.moneda,
        precio_pagado: precio.importe,
      };
    });

    reservaSubmitBtn.disabled = true;
    reservaSubmitBtn.textContent = items.length > 1 ? 'Guardando tu pedido...' : 'Guardando...';

    const huellaPedido = JSON.stringify(payloads.map(p => [p.producto, p.precio_pagado, p.personalizacion]));
    const pendiente = leerReservaPendiente();

    // 1) ¿Hay filas del intento anterior que sirvan? Se actualizan.
    let filasCreadas = null;
    if (pendiente && pendiente.huella === huellaPedido && pendiente.user === sesionActual.user.id) {
      const { data: filasReusadas, error: errorUpdate } = await sb
        .from('reservas')
        .update(datosComunes)
        .in('id', pendiente.ids)
        .eq('estado', 'pendiente_pago')
        .select('id');
      if (!errorUpdate && filasReusadas && filasReusadas.length === payloads.length) {
        filasCreadas = filasReusadas;
      } else if (errorUpdate) {
        console.error(errorUpdate); // no es fatal: se insertan nuevas abajo
      }
    }

    // 2) Si no, una fila por pieza, todas en el mismo insert (Supabase
    // valida cada una contra la misma política RLS de siempre, fila a
    // fila — no hace falta tocar la base de datos para admitir varias a
    // la vez).
    let error = null;
    if (!filasCreadas) {
      const inserto = await sb.from('reservas').insert(payloads).select('id');
      filasCreadas = inserto.data;
      error = inserto.error;
    }

    if (error || !filasCreadas || filasCreadas.length !== payloads.length) {
      console.error(error ?? `esperadas ${payloads.length} filas, llegaron ${filasCreadas?.length ?? 0}`);
      reservaSubmitBtn.disabled = false;
      reservaSubmitBtn.textContent = 'Pagar y comprar';
      showReservaError('No se pudo guardar tu pedido. Inténtalo de nuevo');
      return;
    }

    guardarReservaPendiente({
      ids: filasCreadas.map(f => f.id),
      huella: huellaPedido,
      user: sesionActual.user.id,
    });

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
        body: JSON.stringify({ reserva_ids: filasCreadas.map(f => f.id) }),
      });
      const resultado = await resp.json();

      if (!resp.ok || !resultado.url) {
        throw new Error(resultado.error || 'sin url de pago');
      }

      await Promise.all(items.map(({ prod }) => trackEvent('compra_iniciada', prod.id)));
      // El carrito NO se vacía aquí a propósito: si Stripe cancela y
      // vuelve a comprar.html, tiene que seguir viendo las mismas piezas
      // sin tener que volver a añadirlas. Se vacía solo cuando el pago se
      // confirma de verdad (ver el sondeo de más abajo).
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
      if (!sb || !sessionId) {
        const spinnerEl = confirmando.querySelector('.spinner');
        if (spinnerEl) spinnerEl.hidden = true;
        const pagoLento = document.getElementById('pago-lento');
        pagoLento.hidden = false;
        pagoLento.textContent = 'Tu pago está confirmándose, tarda más de lo normal. Revisa tu email en unos minutos';
        return;
      }

      if (intento >= 10) {
        const spinnerEl = confirmando.querySelector('.spinner');
        if (spinnerEl) spinnerEl.hidden = true;
        const pagoLento = document.getElementById('pago-lento');
        pagoLento.hidden = false;
        pagoLento.textContent = 'Tu pago está confirmándose, tarda más de lo normal. Revisa tu email en unos minutos';
        return;
      }

      // Un pedido con varias piezas comparte un mismo stripe_session_id
      // entre varias filas de "reservas" (una por pieza): .maybeSingle()
      // asumía una sola fila y con dos o más piezas fallaba directamente
      // con "multiple rows returned". Se piden todas y se espera a que
      // TODAS estén pagadas — el webhook las marca juntas en un mismo
      // UPDATE, así que en la práctica cambian de estado a la vez.
      const { data, error } = await sb
        .from('reservas')
        .select('estado, producto')
        .eq('stripe_session_id', sessionId);

      if (error) console.error(error);

      if (data && data.length > 0 && data.every(fila => fila.estado === 'pagado')) {
        data.forEach(fila => trackEvent('compra_completada', fila.producto));
        vaciarCarrito(); // ahora sí: el pago ya está confirmado de verdad
        // Esas filas ya están pagadas: no se pueden reutilizar nunca más.
        try { sessionStorage.removeItem('cozumel_reserva_pendiente'); } catch (_) {}
        confirmando.hidden = true;
        done.hidden = false;
        done.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

/* ---------- Formulario de contacto (contacto.html) ----------
   Manda el mensaje a la Edge Function "enviar-contacto", que lo reenvía
   por email a Cozumel con Resend. El visitante NO necesita iniciar
   sesión ni tener un cliente de correo configurado: se envía desde el
   servidor.

   Si el envío falla (sin red, función caída), no se finge un éxito: se
   dice lo que pasa y se ofrece el email de siempre como salida. */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const nombreInput = document.getElementById('c-name');
  const emailInput = document.getElementById('c-email');
  const msgInput = document.getElementById('c-msg');
  const trampaInput = document.getElementById('c-web');
  const submitBtn = document.getElementById('contact-submit');
  const errorEl = document.getElementById('contact-error');
  const okEl = document.getElementById('contact-ok');

  // Se destapa ANTES de escribir el texto: un lector de pantalla no
  // anuncia cambios dentro de una región aria-live que sigue oculta.
  const showError = (msg) => { okEl.hidden = true; errorEl.hidden = false; errorEl.textContent = msg; };
  const hideError = () => { errorEl.hidden = true; };
  const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  let enviando = false;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (enviando) return; // evita doble envío con doble click

    const nombre = nombreInput.value.trim();
    const email = emailInput.value.trim();
    const mensaje = msgInput.value.trim();

    if (!nombre) return showError('Escribe tu nombre');
    if (!email || !emailValido(email)) return showError('Escribe un email válido');
    if (!mensaje) return showError('Escribe tu mensaje');
    hideError();

    if (!SUPA_READY) {
      showError('No se puede enviar ahora mismo. Escríbenos a cozumeljewel@gmail.com');
      return;
    }

    enviando = true;
    submitBtn.disabled = true;
    const textoOriginal = submitBtn.textContent;
    submitBtn.textContent = 'Enviando…';

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/enviar-contacto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          nombre,
          email,
          mensaje,
          web: trampaInput ? trampaInput.value : '',
        }),
      });

      const resultado = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(resultado.error || `HTTP ${resp.status}`);
      }

      contactForm.reset();
      okEl.hidden = false;
      okEl.textContent = 'Mensaje enviado. Te contestamos en cuanto lo leamos';
      submitBtn.textContent = 'Enviado';
      // El botón se queda desactivado tras el éxito: no hay motivo para
      // volver a mandar el mismo mensaje, y evita duplicados por
      // impaciencia. Recargar la página lo reinicia.
    } catch (err) {
      console.error(err);
      showError(
        err.message && err.message.includes('varios mensajes')
          ? err.message
          : 'No se pudo enviar. Inténtalo de nuevo o escríbenos a cozumeljewel@gmail.com'
      );
      submitBtn.disabled = false;
      submitBtn.textContent = textoOriginal;
      enviando = false;
    }
  });
}
