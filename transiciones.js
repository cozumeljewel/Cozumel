/* ---------- Fundido de salida (respaldo para Firefox/Safari) ----------
   Chrome/Edge ya tienen el fundido nativo por CSS (@view-transition en
   style.css). Este script solo entra en juego si el navegador NO lo
   soporta: detecta clics en enlaces internos, añade un fundido de
   salida brevísimo (.09s) y navega. Nada de esto retrasa la navegación
   más de lo que dura el propio fundido, y respeta el atrás/adelante
   (el navegador restaura la página tal cual, no se queda "pillada"
   en fundido). */
(function () {
  var SOPORTA_NATIVO = 'onpagereveal' in window;
  var PREFIERE_MENOS_MOVIMIENTO =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (SOPORTA_NATIVO || PREFIERE_MENOS_MOVIMIENTO) return;

  var DURACION_MS = 90;

  document.addEventListener('click', function (evento) {
    if (evento.defaultPrevented || evento.button !== 0) return;
    if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;

    var enlace = evento.target.closest('a[href]');
    if (!enlace) return;

    var destino;
    try {
      destino = new URL(enlace.href, location.href);
    } catch (e) {
      return;
    }

    if (destino.origin !== location.origin) return;
    if (enlace.target && enlace.target !== '_self') return;
    if (enlace.hasAttribute('download')) return;
    if (destino.pathname === location.pathname && destino.hash) return;

    evento.preventDefault();
    document.documentElement.classList.add('is-leaving');
    setTimeout(function () {
      location.href = destino.href;
    }, DURACION_MS);
  });

  window.addEventListener('pageshow', function () {
    document.documentElement.classList.remove('is-leaving');
  });
})();
