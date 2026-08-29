/* ---------- Volver arriba (solo móvil) ----------
   Aparece tras bajar un poco, desaparece cerca del inicio. El botón ya
   está oculto por defecto en el HTML (atributo "hidden"): si este script
   no llega a cargar, simplemente no aparece nunca, no rompe nada. */
(function () {
  const boton = document.getElementById('volver-arriba');
  if (!boton) return;

  const UMBRAL = 500;
  boton.hidden = false;

  let visible = false;
  const comprobar = () => {
    const debeVerse = window.scrollY > UMBRAL;
    if (debeVerse === visible) return;
    visible = debeVerse;
    boton.classList.toggle('visible', visible);
  };

  comprobar();
  window.addEventListener('scroll', comprobar, { passive: true });

  boton.addEventListener('click', () => {
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: sinMovimiento ? 'auto' : 'smooth' });
  });
})();
