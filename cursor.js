/* ---------- Cursor personalizado (solo escritorio con ratón) ----------
   Un punto pequeño que sigue al puntero. Se activa solo si el navegador
   confirma hover:hover + pointer:fine (ratón de verdad): en táctil esta
   guarda corta todo lo demás y el cursor nativo queda intacto. */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const raiz = document.documentElement;
  raiz.classList.add('cursor-custom-activo');

  const punto = document.createElement('div');
  punto.className = 'cursor-custom cursor-custom--oculto';
  punto.setAttribute('aria-hidden', 'true');
  const texto = document.createElement('span');
  texto.className = 'cursor-custom-texto';
  texto.textContent = 'Ver';
  punto.appendChild(texto);
  document.body.appendChild(punto);

  const SELECTOR_NATIVO = 'input, textarea, select, [contenteditable="true"]';
  const SELECTOR_PRODUCTO = '.producto-card';
  const SELECTOR_LINK = 'a, button, summary, label';

  const estadoParaObjetivo = (objetivo) => {
    if (objetivo.closest(SELECTOR_NATIVO)) return 'oculto';
    if (objetivo.closest(SELECTOR_PRODUCTO)) return 'ver';
    if (objetivo.closest(SELECTOR_LINK)) return 'link';
    return 'normal';
  };

  let estadoActual = 'normal';
  const aplicarEstado = (estado) => {
    if (estado === estadoActual) return;
    estadoActual = estado;
    punto.classList.toggle('cursor-custom--oculto', estado === 'oculto');
    punto.classList.toggle('cursor-custom--ver', estado === 'ver');
    punto.classList.toggle('cursor-custom--link', estado === 'link');
  };

  document.addEventListener('mousemove', (e) => {
    punto.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
    aplicarEstado(estadoParaObjetivo(e.target));
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    punto.classList.add('cursor-custom--oculto');
    estadoActual = 'oculto';
  });
})();
