/* =========================================================
   COZUMEL · CUENTA ATRÁS DEL LANZAMIENTO
   Hasta el 2 de octubre de 2026 a las 21:00 (hora de España) la web
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
  // 21:00 en España el 2 de octubre = horario de verano (UTC+2).
  const LANZAMIENTO = new Date('2026-10-02T21:00:00+02:00').getTime();
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

  // Hora del lanzamiento en la hora local de quien mira, si no es la de
  // España (p.ej. "13:00 en tu hora" desde México).
  const horaLocal = (() => {
    try {
      const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const fmt = (tz) => new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(LANZAMIENTO);
      const local = fmt(zona);
      return local === fmt('Europe/Madrid') ? '' : ' (' + local + ' en tu hora)';
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
        <p class="ca-fecha">2 de octubre · 21:00 en España${horaLocal}</p>
        <div class="ca-reloj" aria-live="off">
          <div><span data-u="d">00</span><small>días</small></div>
          <div><span data-u="h">00</span><small>horas</small></div>
          <div><span data-u="m">00</span><small>min</small></div>
          <div><span data-u="s">00</span><small>seg</small></div>
        </div>
        <p class="ca-texto">Solo 100 piezas. Deja tu email y te avisamos antes que a nadie para reservar la tuya.</p>
        <form class="ca-form" novalidate>
          <div class="ca-fila">
            <label class="ca-oculto" for="ca-email">Tu email</label>
            <input id="ca-email" type="email" name="email" required autocomplete="email" placeholder="Tu email">
            <button type="submit" class="ca-boton">Reservar</button>
          </div>
          <label class="ca-consent">
            <input type="checkbox" name="consent" required>
            <span>Acepto que Cozumel guarde mi email para avisarme del lanzamiento. <a href="privacidad.html">Privacidad</a></span>
          </label>
          <p class="ca-aviso" role="status" aria-live="polite"></p>
        </form>
      </div>`;
    document.body.appendChild(pantalla);

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
    const mercado = (() => {
      try {
        const manual = JSON.parse(localStorage.getItem('cozumel_mercado_manual'));
        if (manual) return manual;
        const geo = JSON.parse(localStorage.getItem('cozumel_mercado_geo'));
        return geo && geo.mercado ? geo.mercado : null;
      } catch (_) { return null; }
    })();

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
      try {
        const resp = await fetch(SUPABASE.url + '/rest/v1/lista_espera', {
          method: 'POST',
          headers: {
            apikey: SUPABASE.clave,
            Authorization: 'Bearer ' + SUPABASE.clave,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ email, mercado, consentimiento: true, fuente: 'cuenta_atras' }),
        });
        // 409 = ya estaba apuntado: para quien se apunta, es lo mismo.
        if (!resp.ok && resp.status !== 409) throw new Error('HTTP ' + resp.status);
        form.querySelector('.ca-fila').remove();
        form.querySelector('.ca-consent').remove();
        aviso.textContent = '¡Apuntado! Te escribiremos antes del lanzamiento para que reserves tu pedacito.';
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
