/* =========================================================
   COZUMEL · WEB CERRADA (desde el 15/10/2026)
   Mientras se prepara la colección de hombre, la web entera queda tapada
   por esta pantalla: el nombre, "Muy pronto" y un formulario para dejar
   el email (tabla lista_espera de Supabase, fuente 'newsletter', v32).

   · Se carga en <head>, sin defer, en las mismas páginas que
     cuenta-atras.js (todas salvo las legales, para que el enlace a
     privacidad del formulario se pueda abrir).
   · Para verla el equipo, con la clave (se recuerda en el navegador):
       ?acceso=cozumel-26122c   → abre la web
       ?acceso=cerrar           → vuelve a enseñar la pantalla
     La clave antigua ?tienda=abrir NO abre esta pantalla.
   · Para abrir la web a todo el mundo: CERRADA = false.
   · Ojo: es un candado de la web, no de los archivos; sirve para que
     la gente no la vea, no protege nada secreto.
   ========================================================= */
(function () {
  const CERRADA = true;
  const CLAVE_ACCESO = 'cozumel-26122c';
  const CLAVE_VER = 'cozumel_acceso_web';

  const params = new URLSearchParams(location.search);
  try {
    if (params.get('acceso') === CLAVE_ACCESO) localStorage.setItem(CLAVE_VER, '1');
    if (params.get('acceso') === 'cerrar') localStorage.removeItem(CLAVE_VER);
  } catch (_) {}

  let ver = false;
  try { ver = localStorage.getItem(CLAVE_VER) === '1'; } catch (_) {}
  if (!CERRADA || ver) return;

  // Se tapa todo YA, antes de que se pinte la página de debajo.
  document.documentElement.classList.add('web-cerrada');
  // Estilos de la pantalla aquí mismo: así funciona en cualquier página,
  // cargue o no style.css.
  const estilo = document.createElement('style');
  estilo.textContent = `html.web-cerrada, html.web-cerrada body{overflow:hidden; background:#F8F6F1;}
html.web-cerrada body > *:not(#web-cerrada){display:none !important;}
#web-cerrada{position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center;
  padding:32px 20px; background:#F8F6F1; color:#173634; text-align:center; overflow-y:auto;}
#web-cerrada .wc-contenido{width:100%; max-width:440px;}
#web-cerrada .wc-logo{margin:0; font-family:'Cormorant Garamond', Georgia, serif; font-weight:500; font-size:44px;
  letter-spacing:.14em; text-transform:uppercase; line-height:1;}
#web-cerrada .wc-logo span{display:block; margin-top:10px; font-family:'Inter', system-ui, sans-serif; font-size:10px;
  font-weight:500; letter-spacing:.42em;}
#web-cerrada .wc-muy-pronto{margin:44px 0 0; font-family:'Inter', system-ui, sans-serif; font-size:12px; font-weight:500;
  letter-spacing:.32em; text-transform:uppercase; color:#C4A15A;}
#web-cerrada .wc-texto{margin:14px 0 0; font-family:'Inter', system-ui, sans-serif; font-size:14px; line-height:1.6; color:#62625F;}
#web-cerrada .wc-form{margin-top:28px;}
#web-cerrada .wc-fila{display:flex; border-bottom:1px solid #173634;}
#web-cerrada .wc-fila input{flex:1; min-width:0; padding:12px 0; border:0; background:transparent;
  font-family:'Inter', system-ui, sans-serif; font-size:15px; color:#173634; outline:none;}
#web-cerrada .wc-boton{padding:0 0 0 16px; border:0; background:none; cursor:pointer;
  font-family:'Inter', system-ui, sans-serif; font-size:11px; font-weight:500; letter-spacing:.18em; text-transform:uppercase; color:#173634;}
#web-cerrada .wc-boton:disabled{opacity:.5;}
#web-cerrada .wc-consent{display:flex; gap:8px; align-items:flex-start; margin-top:14px; text-align:left;
  font-family:'Inter', system-ui, sans-serif; font-size:12px; line-height:1.5; color:#62625F;}
#web-cerrada .wc-consent a{color:inherit;}
#web-cerrada .wc-aviso{min-height:1.4em; margin:12px 0 0; font-family:'Inter', system-ui, sans-serif; font-size:13px;}
#web-cerrada .wc-error{color:#9A2B1E;}
#web-cerrada .wc-ok{color:#173634;}
#web-cerrada .wc-oculto{position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0);}
@media (min-width:900px){ #web-cerrada .wc-logo{font-size:58px;} }`;
  document.head.appendChild(estilo);

  const SUPABASE = {
    url: 'https://qesyjtqxbouodgldvbtq.supabase.co',
    clave: 'sb_publishable_lmFNgpMEy4Axi6dYQ9E1UA_b63xSwJ6',
  };

  const montar = () => {
    const pantalla = document.createElement('div');
    pantalla.id = 'web-cerrada';
    pantalla.setAttribute('role', 'dialog');
    pantalla.setAttribute('aria-modal', 'true');
    pantalla.setAttribute('aria-labelledby', 'wc-titulo');
    pantalla.innerHTML = `
      <div class="wc-contenido">
        <h1 class="wc-logo" id="wc-titulo">Cozumel<span>Jewelry</span></h1>
        <p class="wc-muy-pronto">Muy pronto</p>
        <p class="wc-texto">Estamos preparando la nueva colección. Déjanos tu email y te avisamos el primero.</p>
        <form class="wc-form" novalidate>
          <div class="wc-fila">
            <label class="wc-oculto" for="wc-email">Tu email</label>
            <input id="wc-email" type="email" name="email" required autocomplete="email" placeholder="Tu email">
            <button type="submit" class="wc-boton">Avisadme</button>
          </div>
          <label class="wc-consent">
            <input type="checkbox" name="consent" required>
            <span>Acepto que Cozumel guarde mi email para avisarme. <a href="privacidad.html">Privacidad</a></span>
          </label>
          <p class="wc-aviso" role="status" aria-live="polite"></p>
        </form>
      </div>`;
    document.body.appendChild(pantalla);

    const form = pantalla.querySelector('.wc-form');
    const aviso = pantalla.querySelector('.wc-aviso');
    const boton = pantalla.querySelector('.wc-boton');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      aviso.className = 'wc-aviso';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        aviso.textContent = 'Escribe un email válido';
        aviso.classList.add('wc-error');
        form.email.focus();
        return;
      }
      if (!form.consent.checked) {
        aviso.textContent = 'Marca la casilla para poder avisarte';
        aviso.classList.add('wc-error');
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
          body: JSON.stringify({ email, consentimiento: true, fuente: 'newsletter' }),
        });
        // 409 = ya estaba apuntado: para quien se apunta, es lo mismo.
        if (!resp.ok && resp.status !== 409) throw new Error('HTTP ' + resp.status);
        form.querySelector('.wc-fila').remove();
        form.querySelector('.wc-consent').remove();
        aviso.textContent = '¡Listo! Te avisaremos en cuanto abramos.';
        aviso.classList.add('wc-ok');
      } catch (err) {
        console.error('Lista de espera:', err);
        aviso.textContent = 'No se ha podido guardar. Inténtalo de nuevo en un momento';
        aviso.classList.add('wc-error');
        boton.disabled = false;
      }
    });
  };

  if (document.body) montar();
  else document.addEventListener('DOMContentLoaded', montar);
})();
