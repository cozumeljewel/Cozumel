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

/* Resumen en una línea, para el recap y el bloque de producto */
function resumenGrabado(prod, datos) {
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
const grid = document.getElementById('producto-grid');
if (grid && typeof PRODUCTOS !== 'undefined') {
  PRODUCTOS.forEach(prod => {
    const card = document.createElement('a');
    card.className = 'producto-card';
    card.href = 'personalizar.html?p=' + encodeURIComponent(prod.slug);

    const media = document.createElement('div');
    media.className = 'producto-media forma-' + prod.forma;
    if (prod.foto) {
      // La foto va encima del degradado: si el archivo faltara, el
      // degradado sigue ahí y no queda un hueco roto.
      media.style.backgroundImage = `url('${prod.foto}')`;
      media.classList.add('con-foto');
    } else {
      const tag = document.createElement('span');
      tag.className = 'ph-tag';
      tag.textContent = 'imagen pendiente';
      media.appendChild(tag);
    }

    const body = document.createElement('div');
    body.className = 'producto-body';

    const h3 = document.createElement('h3');
    h3.textContent = prod.nombre;

    const resumen = document.createElement('p');
    resumen.className = 'producto-resumen';
    resumen.textContent = prod.resumen;

    const precio = document.createElement('p');
    precio.className = 'producto-precio';
    precio.textContent = formatearPrecio(prod.precio) || 'Precio pendiente';

    const cta = document.createElement('span');
    cta.className = 'producto-cta';
    cta.textContent = prod.campos.length > 0 ? 'Personalizar →' : 'Ver pieza →';

    body.append(h3, resumen, precio, cta);
    card.append(media, body);
    grid.appendChild(card);
  });
}


/* =========================================================
   PÁGINA: PERSONALIZAR (personalizar.html)
   ========================================================= */

/* Galería de la ficha: una foto por tarjeta, scroll lateral con snap.
   Acepta "fotos" (array) o el "foto" antiguo (una sola). Si no hay
   ninguna, deja una tarjeta con el degradado y el aviso de pendiente. */
function pintarGaleria(prod) {
  const pista = document.getElementById('galeria-pista');
  const puntos = document.getElementById('galeria-puntos');
  if (!pista) return;

  pista.textContent = '';
  if (puntos) puntos.textContent = '';

  const fotos = (prod.fotos && prod.fotos.length)
    ? prod.fotos
    : (prod.foto ? [prod.foto] : []);

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

  fotos.forEach((src, i) => {
    const card = document.createElement('div');
    card.className = 'galeria-foto con-foto';
    // Va como variable CSS: el degradado de respaldo sigue debajo, así que
    // si el archivo no existe no queda un hueco roto.
    card.style.setProperty('--foto', `url('${src}')`);
    card.setAttribute('role', 'img');
    card.setAttribute('aria-label', `${prod.nombre}, imagen ${i + 1} de ${fotos.length}`);
    pista.appendChild(card);
  });

  // Un punto por foto, solo si hay más de una
  if (puntos && fotos.length > 1) {
    fotos.forEach((_, i) => {
      const p = document.createElement('span');
      p.className = 'galeria-punto' + (i === 0 ? ' activo' : '');
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

  const precioTxt = formatearPrecio(prod.precio);
  const resPrecio = document.getElementById('resumen-precio');
  const resNota = document.getElementById('resumen-precio-nota');
  if (resPrecio) resPrecio.textContent = precioTxt || '— · — €';
  if (resNota) resNota.hidden = !!precioTxt;

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

    if (prod.oferta) {
      const oferta = document.createElement('p');
      oferta.className = 'ficha-oferta';
      oferta.textContent = prod.oferta;
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
    input.maxLength = meta.max;
    input.placeholder = meta.placeholder;
    input.value = datos[campo] || '';

    wrap.append(label, input);
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

   NO se muestra en reservar.html: ahí la persona ya está rellenando
   el formulario y un aviso que la manda de vuelta a la colección
   trabaja en contra de la conversión que estamos midiendo.
   ========================================================= */
(function () {
  const YA_CERRADO = 'popupPreventaCerrado';
  if (CURRENT_PAGE === 'reservar') return;

  // TEMPORAL (2026-08-27, pedido del cliente para esta promoción): el
  // pop-up sale en cada entrada, no solo la primera. Sigue guardando en
  // localStorage por si se necesita ese dato, pero ya no se consulta para
  // decidir si mostrarlo. Para volver a "una vez y no más": cambiar
  // MOSTRAR_SIEMPRE a false.
  const MOSTRAR_SIEMPRE = true;

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
  p1.textContent = 'Solo existen 100 pedacitos. No porque queramos que corras, sino porque cada pieza está hecha a mano, una por una, y eso no se puede apurar ni multiplicar';

  const p2 = document.createElement('p');
  p2.className = 'popup-texto';
  p2.textContent = 'Cuando se acaben, se acaban. Si hay un pedacito que quieres que sea tuyo, o de alguien a quien quieras dar un pedacito de ti, este es el momento de reservarlo';

  const badge = document.createElement('p');
  badge.className = 'popup-badge';
  badge.textContent = 'Preventa abierta · edición limitada a 100 piezas';

  const cierre = document.createElement('p');
  cierre.className = 'popup-cierre';
  cierre.textContent = 'Un pedacito de mí, mientras quede alguno por dar';

  const cta = document.createElement('a');
  cta.className = 'btn btn-primary popup-cta';
  cta.href = 'productos.html';
  cta.textContent = 'Ver la colección';

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


/* ---------- Menú móvil ---------- */
const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Abrir menú');
    });
  });
}

/* ---------- Marcar el enlace de la página activa ---------- */
const currentFile = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav a, .footer-nav a').forEach(a => {
  if (a.getAttribute('href') === currentFile) a.setAttribute('aria-current', 'page');
});


/* ---------- CTA "Quiero el mío" → reservar.html ----------
   Es una navegación entre páginas: si no esperamos, el navegador puede
   cancelar el insert a medio camino. Interceptamos, lanzamos el tracking
   y navegamos al terminar (o a los 500ms como máximo, para no bloquear). */
const ctaReservar = document.getElementById('cta-reservar');
if (ctaReservar) {
  ctaReservar.addEventListener('click', (e) => {
    const prodId = (getProductoElegido() || {}).id || 'sin_producto';
    if (!sb || sessionStorage.getItem('ri:' + prodId) === '1') return;
    e.preventDefault();
    const dest = ctaReservar.href;
    let navegado = false;
    const ir = () => { if (!navegado) { navegado = true; window.location.href = dest; } };
    trackReservaIniciada().finally(ir);
    setTimeout(ir, 500);
  });
}


/* Prefijos telefonicos internacionales, para el desplegable del campo
   WhatsApp de reservar.html. Primero los 20 paises de habla hispana
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

/* ---------- Formulario de reserva (reservar.html) ---------- */
const reservaForm = document.getElementById('reserva-form');

if (reservaForm) {
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
    const buscar = document.getElementById('tel-combo-buscar');
    const lista = document.getElementById('tel-combo-lista');

    const banderaUrl = iso => `https://cdn.jsdelivr.net/npm/flag-icons@7/flags/4x3/${iso}.svg`;

    // Sin tildes y en minúsculas, para que "espana" encuentre "España".
    const normalizar = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    let indiceActivo = -1;
    let opciones = [];

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

    const renderLista = filtro => {
      lista.textContent = '';
      const f = normalizar(filtro.trim());
      opciones = !f
        ? PAISES_TELEFONO
        : PAISES_TELEFONO.filter(p => normalizar(p.pais).includes(f) || p.codigo.includes(f));

      if (!opciones.length) {
        const vacio = document.createElement('li');
        vacio.className = 'tel-combo-vacio';
        vacio.textContent = 'Ningún país coincide';
        lista.appendChild(vacio);
        indiceActivo = -1;
        return;
      }

      opciones.forEach(pais => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        const img = document.createElement('img');
        img.src = banderaUrl(pais.iso);
        img.alt = '';
        const nombre = document.createElement('span');
        nombre.className = 'tel-combo-nombre';
        nombre.textContent = pais.pais;
        const codigo = document.createElement('span');
        codigo.className = 'tel-combo-codigo';
        codigo.textContent = pais.codigo;
        li.append(img, nombre, codigo);
        li.addEventListener('click', () => seleccionar(pais));
        lista.appendChild(li);
      });
      marcarActiva(-1);
    };

    function abrir() {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      buscar.value = '';
      renderLista('');
      buscar.focus();
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

    buscar.addEventListener('input', () => renderLista(buscar.value));

    buscar.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cerrar();
        toggle.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (opciones.length) marcarActiva(Math.min(indiceActivo + 1, opciones.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (opciones.length) marcarActiva(Math.max(indiceActivo - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const elegido = opciones[indiceActivo] || opciones[0];
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
  const loginGate = document.getElementById('login-gate');
  const btnLoginGoogle = document.getElementById('btn-login-google');
  const btnLogout = document.getElementById('btn-logout');

  if (!SUPA_READY || !sb) {
    reservaConfigWarning.hidden = false;
    reservaSubmitBtn.disabled = true;
  }

  // No se puede reservar sin haber elegido pieza
  const prodElegido = getProductoElegido();
  if (!prodElegido) {
    if (sinPiezaAviso) sinPiezaAviso.hidden = false;
    reservaSubmitBtn.disabled = true;
  }

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
