/* ---------- Aparición progresiva al hacer scroll ----------
   Actúa sobre cualquier ".reveal" de la página (nacen en opacity:0 y se
   muestran al entrar en pantalla). Vive en su propio archivo, cargado
   SIN "defer" y antes que los demás scripts a propósito: si estuviera
   dentro de script.js (con defer, detrás del SDK de Supabase) tendría
   que esperar a ese SDK externo antes de activarse.

   Este archivo ha roto la página dos veces, así que va escrito a la
   defensiva. Dos trampas reales que hay que respetar:

   1) ORDEN: las tarjetas de producto NO están en el HTML, las crea
      script.js (deferred) más tarde. Escanear una sola vez al arrancar
      no basta: esas tarjetas nunca se registrarían y se quedarían
      invisibles para siempre ("no se ven los productos"). Por eso se
      re-escanea en DOMContentLoaded y existe window.registrarReveal()
      para lo que aparezca aún más tarde.

   2) NUNCA DEJAR NADA INVISIBLE: lo que ya está en pantalla se muestra
      en el acto sin esperar al observador, y hay un plazo de seguridad
      que muestra todo lo que quede pendiente. Si algo falla, el peor
      caso es que aparezca sin animación — jamás que no aparezca. */
(function () {
  const EN_PANTALLA_MARGEN = 0.92; // igual que el rootMargin de abajo
  const PLAZO_SEGURIDAD_MS = 4000;

  const mostrar = (el) => el.classList.add('reveal-visto');
  const pendientes = () => document.querySelectorAll('.reveal:not(.reveal-visto)');
  const mostrarTodo = () => pendientes().forEach(mostrar);

  const prefiereMenosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sin animación posible o no deseada: se muestra todo tal cual.
  if (!('IntersectionObserver' in window) || prefiereMenosMovimiento) {
    mostrarTodo();
    document.addEventListener('DOMContentLoaded', mostrarTodo);
    window.registrarReveal = mostrarTodo;
    return;
  }

  const observador = new IntersectionObserver((entradas, obs) => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) {
        mostrar(entrada.target);
        obs.unobserve(entrada.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

  // Observar dos veces el mismo elemento no hace nada, así que registrar()
  // se puede llamar tantas veces como haga falta.
  const registrar = () => {
    const alto = window.innerHeight || document.documentElement.clientHeight;
    pendientes().forEach(el => {
      const caja = el.getBoundingClientRect();
      const yaSeVe = caja.top < alto * EN_PANTALLA_MARGEN && caja.bottom > 0;
      // Lo que ya está a la vista se muestra sin esperar al observador
      // (sigue animándose: la transición del CSS hace el fundido).
      if (yaSeVe) mostrar(el);
      else observador.observe(el);
    });
  };

  registrar();
  document.addEventListener('DOMContentLoaded', registrar);
  window.registrarReveal = registrar;

  // Red de seguridad: pase lo que pase, nada se queda invisible.
  window.setTimeout(mostrarTodo, PLAZO_SEGURIDAD_MS);
})();
