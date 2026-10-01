/* =========================================================
   COZUMEL · CUENTA ATRÁS DEL LANZAMIENTO
   Hasta el 2 de octubre de 2026 a las 21:00 (hora de México; 05:00 del
   3/10 en España) la web
   entera queda tapada por esta pantalla: la foto de Adriana atenuada de
   fondo, el nombre, la cuenta atrás y un formulario para dejar el email y
   reservar una de las unidades limitadas. Nada más.

   · Se carga en <head>, sin defer, en todas las páginas salvo las legales
     (privacidad, cookies, términos, aviso legal), para que el enlace a la
     política de privacidad del formulario se pueda abrir.
   · Al llegar la hora, la pantalla se quita sola y aparece la web.
   · Para ver la tienda antes del lanzamiento (el equipo):
       ?tienda=abrir   → se recuerda en este navegador
       ?tienda=cerrar  → vuelve a enseñar la cuenta atrás
   · Los emails van a la tabla lista_espera de Supabase (migración v18),
     con la clave pública: la tabla solo admite añadir, nadie puede leerla
     desde la web. Se exporta desde el Table Editor.
   ========================================================= */
(function () {
  // 21:00 en México (Ciudad de México, UTC-6 todo el año) el 2 de octubre
  // = 05:00 del 3 de octubre en España (horario de verano, UTC+2).
  const LANZAMIENTO = new Date('2026-10-02T21:00:00-06:00').getTime();
  const CLAVE_VER = 'cozumel_ver_tienda';

  const params = new URLSearchParams(location.search);
  try {
    if (params.get('tienda') === 'abrir') localStorage.setItem(CLAVE_VER, '1');
    if (params.get('tienda') === 'cerrar') localStorage.removeItem(CLAVE_VER);
  } catch (_) {}

  let verTienda = false;
  try { verTienda = localStorage.getItem(CLAVE_VER) === '1'; } catch (_) {}
  if (verTienda || Date.now() >= LANZAMIENTO) return;

  // Se tapa todo YA, antes de que se pinte nada de la página de debajo.
  document.documentElement.classList.add('prelanzamiento');

  const SUPABASE = {
    url: 'https://qesyjtqxbouodgldvbtq.supabase.co',
    clave: 'sb_publishable_lmFNgpMEy4Axi6dYQ9E1UA_b63xSwJ6',
  };

  // Hora del lanzamiento en España y en México (calculada, no escrita a
  // mano, por si cambia algún horario de verano). Si quien mira está en
  // otra zona, se añade también su hora.
  // En inglés (idioma.js ya ha puesto <html lang="en">) las fechas van en
  // inglés; los textos fijos los traduce idioma.js con su diccionario.
  const EN = document.documentElement.lang === 'en';
  const LOC = EN ? 'en-US' : 'es-ES';
  const fmtHora = (tz) => new Intl.DateTimeFormat(LOC, { hour: EN ? 'numeric' : '2-digit', minute: '2-digit', timeZone: tz }).format(LANZAMIENTO);
  const fmtDia = (tz) => new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'long', timeZone: tz }).format(LANZAMIENTO);
  // Hora con su día solo si el día no es el del lanzamiento en México.
  const conDia = (tz) => {
    const dia = fmtDia(tz);
    return dia === diaMexico ? fmtHora(tz) : fmtHora(tz) + (EN ? ', ' : ' del ') + dia;
  };
  const diaMexico = (() => { try { return fmtDia('America/Mexico_City'); } catch (_) { return EN ? 'October 2' : '2 de octubre'; } })();
  const horaMexico = (() => { try { return fmtHora('America/Mexico_City'); } catch (_) { return EN ? '9:00 PM' : '21:00'; } })();
  const horaEspana = (() => { try { return conDia('Europe/Madrid'); } catch (_) { return EN ? '5:00 AM, October 3' : '05:00 del 3 de octubre'; } })();
  const horaLocal = (() => {
    try {
      const local = conDia(Intl.DateTimeFormat().resolvedOptions().timeZone);
      return local === horaEspana || local === horaMexico ? '' : ' · ' + local + (EN ? ' your time' : ' en tu hora');
    } catch (_) { return ''; }
  })();

  const montar = () => {
    const pantalla = document.createElement('div');
    pantalla.id = 'cuenta-atras';
    pantalla.setAttribute('role', 'dialog');
    pantalla.setAttribute('aria-modal', 'true');
    pantalla.setAttribute('aria-labelledby', 'ca-titulo');
    pantalla.innerHTML = `
      <div class="ca-fondo" role="img" aria-label="Adriana llevando piezas de Cozumel Jewelry"></div>
      <div class="ca-contenido">
        <h1 class="ca-logo" id="ca-titulo"><img src="img/hero-logo-texto-1.png" alt="Cozumel Jewelry" width="1000" height="312"></h1>
        <p class="ca-edicion">Un Pedacito <em>de ti</em></p>
        <p class="ca-fecha" data-no-traducir>${diaMexico}<br><span>${horaMexico} ${EN ? 'in Mexico' : 'en México'}</span> · <span>${horaEspana} ${EN ? 'in Spain' : 'en España'}</span>${horaLocal ? ' · <span>' + horaLocal.slice(3) + '</span>' : ''}</p>
        <div class="ca-reloj" aria-live="off">
          <div><span data-u="d">00</span><small>días</small></div>
          <div><span data-u="h">00</span><small>horas</small></div>
          <div><span data-u="m">00</span><small>min</small></div>
          <div><span data-u="s">00</span><small>seg</small></div>
        </div>
        <p class="ca-texto"><span>Unidades limitadas en el lanzamiento.</span> <span>Déjanos tu email y tendrás acceso antes que nadie.</span></p>
        <!-- Solo el sorteo. El vídeo por completar la colección sigue
             activo (v19), pero se comunicará después, como incentivo de
             recompra: aquí competía con el mensaje principal. -->
        <p class="ca-extra">✦ Entre las primeras 100 compras sortearemos <strong>5 videollamadas privadas con Adri</strong> ✦</p>
        <form class="ca-form" novalidate>
          <div class="ca-fila">
            <label class="ca-oculto" for="ca-email">Tu email</label>
            <input id="ca-email" type="email" name="email" required autocomplete="email" placeholder="Tu email">
            <button type="submit" class="ca-boton">Quiero acceso anticipado</button>
          </div>
          <label class="ca-consent">
            <input type="checkbox" name="consent" required>
            <span>Acepto que Cozumel guarde mi email para avisarme del lanzamiento. <a href="privacidad.html">Privacidad</a></span>
          </label>
          <p class="ca-aviso" role="status" aria-live="polite"></p>
        </form>
      </div>`;
    document.body.appendChild(pantalla);
    if (window.COZUMEL_IDIOMA && window.COZUMEL_IDIOMA.selector) pantalla.appendChild(window.COZUMEL_IDIOMA.selector());

    // ---- Reloj ----
    const casillas = {};
    pantalla.querySelectorAll('[data-u]').forEach(el => { casillas[el.dataset.u] = el; });
    const dos = n => String(n).padStart(2, '0');
    const tic = () => {
      const falta = LANZAMIENTO - Date.now();
      if (falta <= 0) {
        // Ya es la hora: fuera la pantalla, se ve la web.
        document.documentElement.classList.remove('prelanzamiento');
        pantalla.remove();
        // Lo que esperaba a la tienda (p.ej. las fotos de Stories) arranca ya.
        window.dispatchEvent(new Event('cozumel:lanzamiento'));
        clearInterval(reloj);
        return;
      }
      const s = Math.floor(falta / 1000);
      casillas.d.textContent = dos(Math.floor(s / 86400));
      casillas.h.textContent = dos(Math.floor(s % 86400 / 3600));
      casillas.m.textContent = dos(Math.floor(s % 3600 / 60));
      casillas.s.textContent = dos(s % 60);
    };
    const reloj = setInterval(tic, 1000);
    tic();

    // ---- Formulario ----
    const form = pantalla.querySelector('.ca-form');
    const aviso = pantalla.querySelector('.ca-aviso');
    const boton = pantalla.querySelector('.ca-boton');
    // Grupo de precios (MX, US, ES...) y país REAL (CO, AR, ES...). El país
    // lo da la función /api/geo de Netlify; mercados.js lo guarda al
    // detectarlo. Si aún no ha terminado (primera visita), se pregunta aquí
    // mismo al enviar, sin esperar más de 3 s: mejor guardar el email sin
    // país que hacer esperar a la persona.
    const leerGeo = () => {
      try { return JSON.parse(localStorage.getItem('cozumel_mercado_geo')) || null; } catch (_) { return null; }
    };
    const mercadoGuardado = () => {
      try {
        const manual = JSON.parse(localStorage.getItem('cozumel_mercado_manual'));
        if (manual) return manual;
      } catch (_) {}
      const geo = leerGeo();
      return geo && geo.mercado ? geo.mercado : null;
    };
    const paisReal = async () => {
      const geo = leerGeo();
      if (geo && typeof geo.pais === 'string') return geo.pais.toUpperCase();
      try {
        const control = new AbortController();
        const corte = setTimeout(() => control.abort(), 3000);
        const resp = await fetch('/api/geo', { headers: { Accept: 'application/json' }, signal: control.signal });
        clearTimeout(corte);
        if (!resp.ok) return null;
        const datos = await resp.json();
        return datos && typeof datos.country === 'string' ? datos.country.toUpperCase() : null;
      } catch (_) { return null; }
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      aviso.className = 'ca-aviso';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        aviso.textContent = 'Escribe un email válido';
        aviso.classList.add('ca-error');
        form.email.focus();
        return;
      }
      if (!form.consent.checked) {
        aviso.textContent = 'Marca la casilla para poder avisarte';
        aviso.classList.add('ca-error');
        return;
      }
      boton.disabled = true;
      aviso.textContent = 'Guardando…';
      const pais = await paisReal();
      try {
        const resp = await fetch(SUPABASE.url + '/rest/v1/lista_espera', {
          method: 'POST',
          headers: {
            apikey: SUPABASE.clave,
            Authorization: 'Bearer ' + SUPABASE.clave,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            email,
            pais,
            // Si el grupo de precios no se sabe aún, se deduce del país con
            // la misma tabla de mercados.js (cargado ya a estas alturas).
            mercado: mercadoGuardado() || (pais && typeof mercadoDePais === 'function' ? mercadoDePais(pais) : null),
            consentimiento: true,
            fuente: 'cuenta_atras',
          }),
        });
        // 409 = ya estaba apuntado: para quien se apunta, es lo mismo.
        if (!resp.ok && resp.status !== 409) throw new Error('HTTP ' + resp.status);
        form.querySelector('.ca-fila').remove();
        form.querySelector('.ca-consent').remove();
        aviso.textContent = '¡Listo! Te escribiremos antes del lanzamiento con tu acceso anticipado.';
        aviso.classList.add('ca-ok');
      } catch (err) {
        console.error('Lista de espera:', err);
        aviso.textContent = 'No se ha podido guardar. Inténtalo de nuevo en un momento';
        aviso.classList.add('ca-error');
        boton.disabled = false;
      }
    });
  };

  if (document.body) montar();
  else document.addEventListener('DOMContentLoaded', montar);
})();
