/* =========================================================
   COZUMEL · IDIOMA (español / inglés)
   La web está escrita en español. En inglés, este script la traduce en el
   navegador con el diccionario de idioma-en.js, que solo se descarga si
   hace falta (quien la ve en español no gasta ni un byte más).

   · Va en <head>, sin defer, ANTES de cuenta-atras.js: deja puesto
     <html lang="en"> para que la cuenta atrás escriba fechas en inglés.
   · Elegir idioma: el selector "ES · EN" de la cabecera (no en las
     páginas con precios, donde va la moneda) y de la cuenta atrás, o
     ?lang=en / ?lang=es. Se recuerda en este navegador.
   · Por defecto, español.
   · Cómo traduce: cada texto de la página (y cada atributo alt,
     placeholder, aria-label, title) se busca tal cual en el diccionario.
     Los párrafos con enlaces o negritas dentro se buscan enteros, con su
     HTML, para que la frase inglesa pueda ordenarse a su manera. Lo que
     pinta script.js después (carrito, fichas, avisos) lo recoge un
     MutationObserver. Los textos con números o precios dentro van en
     "patrones" (expresiones regulares).
   · Lo que no esté en el diccionario se queda en español. Para encontrar
     lo que falta: ?lang=en y en la consola COZUMEL_IDIOMA.faltan.
   · Un trozo que no se deba traducir: data-no-traducir.
   ========================================================= */
(function () {
  const CLAVE = 'cozumel_idioma';
  const params = new URLSearchParams(location.search);
  let idioma = 'es';
  try {
    const pedido = params.get('lang');
    if (pedido === 'en' || pedido === 'es') localStorage.setItem(CLAVE, pedido);
    idioma = localStorage.getItem(CLAVE) === 'en' ? 'en' : 'es';
  } catch (_) {
    if (params.get('lang') === 'en') idioma = 'en';
  }

  const html = document.documentElement;
  const api = { idioma, faltan: new Set() };
  window.COZUMEL_IDIOMA = api;

  // ---- Selector ES · EN ----
  const cambiar = (nuevo) => {
    try { localStorage.setItem(CLAVE, nuevo); } catch (_) {}
    const url = new URL(location.href);
    url.searchParams.set('lang', nuevo);
    location.href = url.toString();
  };
  const selector = (clase) => {
    const caja = document.createElement('div');
    caja.className = 'selector-idioma ' + (clase || '');
    caja.setAttribute('data-no-traducir', '');
    caja.setAttribute('role', 'group');
    caja.setAttribute('aria-label', idioma === 'en' ? 'Language' : 'Idioma');
    [['es', 'ES', 'Español'], ['en', 'EN', 'English']].forEach(([cod, txt, nombre], i) => {
      if (i) {
        const sep = document.createElement('span');
        sep.className = 'selector-idioma-sep';
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = '·';
        caja.appendChild(sep);
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.lang = cod;
      b.textContent = txt;
      b.setAttribute('aria-label', nombre);
      if (cod === idioma) { b.className = 'activo'; b.setAttribute('aria-current', 'true'); }
      else b.addEventListener('click', () => cambiar(cod));
      caja.appendChild(b);
    });
    return caja;
  };
  api.selector = selector;

  // En la cabecera, el idioma ocupa el hueco de la moneda salvo en las
  // páginas con precios (colección, ficha, kit, compra): ahí va la moneda
  // (script.js, PAGINAS_CON_PRECIO) y el idioma no sale.
  const CON_PRECIO = ['productos', 'personalizar', 'arma-kit', 'comprar'];
  const ponerSelector = () => {
    if (CON_PRECIO.includes(document.body.dataset.page)) return;
    const acciones = document.querySelector('.header-acciones');
    if (acciones && !acciones.querySelector('.selector-idioma')) {
      acciones.insertBefore(selector('selector-cabecera'), acciones.firstChild);
    }
  };

  if (idioma === 'es') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ponerSelector);
    else ponerSelector();
    return;
  }

  // ================= INGLÉS =================
  html.lang = 'en';
  // La página no se enseña hasta estar traducida (máximo 2,5 s).
  html.classList.add('traduciendo');
  const destapar = () => html.classList.remove('traduciendo');
  setTimeout(destapar, 2500);

  const SALTAR = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'TEXTAREA', 'CODE']);
  const EN_LINEA = new Set(['A', 'STRONG', 'EM', 'B', 'I', 'BR', 'SPAN', 'SMALL', 'SUP', 'SUB', 'U']);
  const ATRIBUTOS = ['alt', 'placeholder', 'aria-label', 'title'];
  const norm = (s) => s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

  let textos = null;
  let patrones = [];

  // Nombres de países: los da el propio navegador (Intl), sin diccionario.
  let paises = null;
  const paisEn = (k) => {
    if (!paises) {
      paises = {};
      try {
        const es = new Intl.DisplayNames(['es'], { type: 'region' });
        const en = new Intl.DisplayNames(['en'], { type: 'region' });
        const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (const a of A) for (const b of A) {
          const c = a + b, n = es.of(c);
          if (n && n !== c) paises[norm(n)] = en.of(c);
        }
      } catch (_) {}
    }
    return paises[k];
  };

  const exacto = (k) => {
    if (Object.prototype.hasOwnProperty.call(textos, k)) return textos[k];
    for (const [re, sust] of patrones) {
      if (re.test(k)) return k.replace(re, sust);
    }
    return paisEn(k);
  };

  // Textos compuestos que pinta script.js: "Bañado en oro · Sin grabado",
  // "Collar: Plateado", "México · MXN". Se traduce cada trozo conocido; lo
  // que escribió la persona (su grabado) se queda tal cual.
  const compuesto = (k) => {
    if (k.includes(' · ')) {
      let alguno = false;
      const partes = k.split(' · ').map(p => {
        const t = exacto(p) ?? dosPuntos(p);
        if (typeof t === 'string') { alguno = true; return t; }
        return p;
      });
      return alguno ? partes.join(' · ') : undefined;
    }
    return dosPuntos(k);
  };
  const dosPuntos = (k) => {
    const i = k.indexOf(': ');
    if (i < 1) return undefined;
    const a = exacto(k.slice(0, i));
    if (typeof a !== 'string') return undefined;
    const resto = k.slice(i + 2);
    const b = exacto(resto);
    return a + ': ' + (typeof b === 'string' ? b : resto);
  };

  const traducir = (s) => {
    const k = norm(s);
    if (!k || !/[a-záéíóúñü¿¡]/i.test(k)) return null;
    const t = exacto(k);
    if (typeof t === 'string') return t;
    return compuesto(k);
  };
  // Para los patrones: traduce un trozo si se sabe, si no lo deja igual.
  const T = (s) => { const t = traducir(s); return typeof t === 'string' ? t : s; };
  // Lo que ya está en inglés (lo acaba de escribir este script) no cuenta
  // como pendiente.
  let ingles = new Set();
  const apuntar = (k) => { if (k && !ingles.has(k) && api.faltan.size < 2000) api.faltan.add(k); };

  const traducirAtributos = (el) => {
    for (const a of ATRIBUTOS) {
      const v = el.getAttribute(a);
      if (!v) continue;
      const t = traducir(v);
      if (typeof t === 'string') { ingles.add(norm(t)); if (t !== v) el.setAttribute(a, t); }
      else if (t === undefined) apuntar(norm(v));
    }
  };

  // Un elemento con texto y solo etiquetas "de línea" (enlaces, negritas)
  // se traduce entero por su HTML, siempre que nada de dentro tenga id o
  // data-*: script.js podría tener guardada esa etiqueta.
  const esFrase = (el) => {
    let hayTexto = false, hayEtiqueta = false;
    for (const n of el.childNodes) {
      if (n.nodeType === 3) { if (n.nodeValue.trim()) hayTexto = true; }
      else if (n.nodeType === 1) {
        if (!EN_LINEA.has(n.tagName)) return false;
        hayEtiqueta = true;
      }
    }
    if (!hayTexto || !hayEtiqueta) return false;
    for (const d of el.querySelectorAll('*')) {
      if (d.id || Object.keys(d.dataset).length) return false;
      if (d.children.length && d.tagName !== 'A' && d.tagName !== 'SPAN' && d.tagName !== 'STRONG' && d.tagName !== 'EM') return false;
    }
    return true;
  };

  const traducirTexto = (n) => {
    const v = n.nodeValue;
    const t = traducir(v);
    if (typeof t === 'string') {
      const pre = v.match(/^\s*/)[0], post = v.match(/\s*$/)[0];
      ingles.add(norm(t));
      const nuevo = pre + t + post;
      if (nuevo !== v) n.nodeValue = nuevo;
    } else if (t === undefined) apuntar(norm(v));
  };

  const recorrer = (nodo) => {
    if (nodo.nodeType === 3) {
      const p = nodo.parentElement;
      if (p && (SALTAR.has(p.tagName.toUpperCase()) || p.closest('[data-no-traducir]'))) return;
      traducirTexto(nodo);
      return;
    }
    if (nodo.nodeType !== 1) return;
    const el = nodo;
    if (SALTAR.has(el.tagName.toUpperCase()) || el.hasAttribute('data-no-traducir')) return;
    traducirAtributos(el);
    if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button') && el.value) {
      const t = traducir(el.value);
      if (typeof t === 'string') el.value = t;
    }
    if (esFrase(el)) {
      const k = norm(el.innerHTML);
      const t = traducir(k);
      if (typeof t === 'string') {
        if (norm(el.innerHTML) !== t) el.innerHTML = t;
        return;
      }
      if (t === undefined) { apuntar(k); return; }
    }
    for (const hijo of Array.from(el.childNodes)) recorrer(hijo);
  };

  const traducirHead = () => {
    const t = traducir(document.title);
    if (typeof t === 'string') document.title = t;
    else if (t === undefined) apuntar(norm(document.title));
    document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"], meta[name="twitter:title"], meta[name="twitter:description"]').forEach(m => {
      const v = traducir(m.content || '');
      if (typeof v === 'string') m.content = v;
    });
  };

  const arrancar = () => {
    traducirHead();
    ponerSelector();
    recorrer(document.body);
    destapar();
    new MutationObserver((cambios) => {
      for (const c of cambios) {
        if (c.type === 'characterData') recorrer(c.target);
        else if (c.type === 'attributes') { if (c.target.nodeType === 1) traducirAtributos(c.target); }
        else c.addedNodes.forEach(recorrer);
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
  };

  // ---- Carga del diccionario ----
  let diccionarioListo = false, domListo = document.readyState !== 'loading';
  const intentar = () => { if (diccionarioListo && domListo) arrancar(); };
  window.COZUMEL_EN_CARGADO = (dic) => {
    textos = {};
    for (const [es, en] of Object.entries(dic.textos || {})) { textos[norm(es)] = en; ingles.add(norm(en)); }
    patrones = typeof dic.patrones === 'function' ? dic.patrones(T) : (dic.patrones || []);
    diccionarioListo = true;
    intentar();
  };
  const s = document.createElement('script');
  s.src = 'idioma-en.js';
  s.onerror = destapar;
  document.head.appendChild(s);
  if (!domListo) document.addEventListener('DOMContentLoaded', () => { domListo = true; intentar(); });
})();
