/* ---------- Aparición progresiva al hacer scroll ----------
   Genérico: actúa sobre cualquier ".reveal" que haya en la página. Vive
   en su propio archivo, cargado SIN "defer" y antes que los demás
   scripts a propósito: si estuviera en script.js (con defer, detrás del
   SDK de Supabase) tendría que esperar a que ese SDK externo termine de
   cargar antes de activarse, dejando el contenido invisible más tiempo
   del necesario y apareciendo de golpe al final ("parpadeo"/doble carga).
   Aquí no depende de nada externo, así que se activa en cuanto el HTML
   termina de parsearse.
   Respeta "menos movimiento", y si el navegador no soporta
   IntersectionObserver, todo se muestra directamente sin animar. */
(function () {
  const elementosReveal = document.querySelectorAll('.reveal');
  if (!elementosReveal.length) return;

  const prefiereMenosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window) || prefiereMenosMovimiento) {
    elementosReveal.forEach(el => el.classList.add('reveal-visto'));
    return;
  }

  const observadorReveal = new IntersectionObserver((entradas, obs) => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('reveal-visto');
        obs.unobserve(entrada.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

  elementosReveal.forEach(el => observadorReveal.observe(el));
})();
