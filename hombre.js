/* =========================================================
   COLECCIÓN MEN (rediseño 10/2026)
   Solo para mostrar en el Shop (pestaña MEN). Todavía sin ficha ni
   compra: faltan nombre, precios y SKU de cada pieza.
   tipo: colgantes | pulseras | brazaletes | anillos.
   acabados: en el orden en que salen los circulitos. Cada acabado lleva
   [foto de producto (portada), foto puesto, otra foto puesta]. El packaging se añade
   siempre como última foto.
   ========================================================= */
const TIPOS_HOMBRE = [
  { clave: 'colgantes', nombre: 'Colgantes' },
  { clave: 'pulseras',  nombre: 'Pulseras' },
  { clave: 'brazaletes', nombre: 'Brazaletes' },
  { clave: 'anillos',   nombre: 'Anillos' },
];
const COLECCION_HOMBRE = [
  { id: 'hombre_collar_1', tipo: 'colgantes', nombre: 'Holbox', acabados: {
      oro:        ['img/hombre/collar-1-oro-producto.png', 'img/hombre/collar-1-oro-puesto.png', 'img/hombre/collar-1-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/collar-1-oro-blanco-producto.png', 'img/hombre/collar-1-oro-blanco-puesto.png', 'img/hombre/collar-1-oro-blanco-puesto-2.png'],
      negro:      ['img/hombre/collar-1-negro-producto.jpg', 'img/hombre/collar-1-negro-puesto.png', 'img/hombre/collar-1-negro-puesto-2.png'],
  } },
  { id: 'hombre_collar_2', tipo: 'colgantes', nombre: 'Pulque', acabados: {
      oro:        ['img/hombre/collar-2-oro-producto.jpg', 'img/hombre/collar-2-oro-puesto.png', 'img/hombre/collar-2-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/collar-2-oro-blanco-producto.png', 'img/hombre/collar-2-oro-blanco-puesto.png', 'img/hombre/collar-2-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_collar_3', tipo: 'colgantes', nombre: 'Mezcal', acabados: {
      oro:        ['img/hombre/collar-3-oro-producto.jpg', 'img/hombre/collar-3-oro-puesto.png', 'img/hombre/collar-3-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/collar-3-oro-blanco-producto.png', 'img/hombre/collar-3-oro-blanco-puesto.jpg', 'img/hombre/collar-3-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_collar_4', tipo: 'colgantes', nombre: 'Guajillo', acabados: {
      oro:        ['img/hombre/collar-4-oro-producto.jpg', 'img/hombre/collar-4-oro-puesto.jpg', 'img/hombre/collar-4-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/collar-4-oro-blanco-producto.png', 'img/hombre/collar-4-oro-blanco-puesto.png', 'img/hombre/collar-4-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_collar_6', tipo: 'colgantes', nombre: 'Cacao', acabados: {
      oro:        ['img/hombre/collar-6-oro-producto.jpg', 'img/hombre/collar-6-oro-puesto.png', 'img/hombre/collar-6-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/collar-6-oro-blanco-producto.png', 'img/hombre/collar-6-oro-blanco-puesto.png', 'img/hombre/collar-6-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_collar_7', tipo: 'colgantes', nombre: 'Copal', acabados: {
      oro:        ['img/hombre/collar-7-oro-producto.png', 'img/hombre/collar-7-oro-puesto.png', 'img/hombre/collar-7-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/collar-7-oro-blanco-producto.png', 'img/hombre/collar-7-oro-blanco-puesto.png', 'img/hombre/collar-7-oro-blanco-puesto-2.png'],
      negro:      ['img/hombre/collar-7-negro-producto.png', 'img/hombre/collar-7-negro-puesto.png', 'img/hombre/collar-7-negro-puesto-2.png'],
  } },
  { id: 'hombre_collar_8', tipo: 'colgantes', nombre: 'Obsidiana', acabados: {
      oro:        ['img/hombre/collar-8-oro-producto.jpg', 'img/hombre/collar-8-oro-puesto.png', 'img/hombre/collar-8-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/collar-8-oro-blanco-producto.png', 'img/hombre/collar-8-oro-blanco-puesto.png', 'img/hombre/collar-8-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_colgante_1', tipo: 'colgantes', nombre: 'Alma Caribeña', acabados: {
      oro:        ['img/hombre/colgante-1-oro-producto.jpg', 'img/hombre/colgante-1-oro-puesto.png', 'img/hombre/colgante-1-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/colgante-1-oro-blanco-producto.png', 'img/hombre/colgante-1-oro-blanco-puesto.png', 'img/hombre/colgante-1-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_colgante_2', tipo: 'colgantes', nombre: 'Pacífico', acabados: {
      oro:        ['img/hombre/colgante-2-oro-producto.jpg', 'img/hombre/colgante-2-oro-puesto.png', 'img/hombre/colgante-2-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/colgante-2-oro-blanco-producto.png', 'img/hombre/colgante-2-oro-blanco-puesto.png', 'img/hombre/colgante-2-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_colgante_3', tipo: 'colgantes', nombre: 'Mazunte', acabados: {
      oro:        ['img/hombre/colgante-3-oro-producto.jpg', 'img/hombre/colgante-3-oro-puesto.png', 'img/hombre/colgante-3-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/colgante-3-oro-blanco-producto.png', 'img/hombre/colgante-3-oro-blanco-puesto.png'],
  } },
  { id: 'hombre_pulsera_1', tipo: 'pulseras', nombre: 'Maya', acabados: {
      oro:        ['img/hombre/pulsera-1-oro-producto.jpg', 'img/hombre/pulsera-1-oro-puesto.jpg', 'img/hombre/pulsera-1-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/pulsera-1-oro-blanco-producto.png', 'img/hombre/pulsera-1-oro-blanco-puesto.png', 'img/hombre/pulsera-1-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_2', tipo: 'pulseras', nombre: 'Coyote', acabados: {
      oro:        ['img/hombre/pulsera-2-oro-producto.jpg', 'img/hombre/pulsera-2-oro-puesto.jpg', 'img/hombre/pulsera-2-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/pulsera-2-oro-blanco-producto.png', 'img/hombre/pulsera-2-oro-blanco-puesto.png', 'img/hombre/pulsera-2-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_3', tipo: 'pulseras', nombre: 'Tulum', acabados: {
      oro:        ['img/hombre/pulsera-3-oro-producto.jpg', 'img/hombre/pulsera-3-oro-puesto.png', 'img/hombre/pulsera-3-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/pulsera-3-oro-blanco-producto.png', 'img/hombre/pulsera-3-oro-blanco-puesto.png', 'img/hombre/pulsera-3-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_4', tipo: 'pulseras', nombre: 'Quetzal', acabados: {
      oro:        ['img/hombre/pulsera-4-oro-producto.jpg', 'img/hombre/pulsera-4-oro-puesto.jpg', 'img/hombre/pulsera-4-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/pulsera-4-oro-blanco-producto.png', 'img/hombre/pulsera-4-oro-blanco-puesto.png', 'img/hombre/pulsera-4-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_5', tipo: 'pulseras', nombre: 'Palenque', acabados: {
      oro:        ['img/hombre/pulsera-5-oro-producto.jpg', 'img/hombre/pulsera-5-oro-puesto.png', 'img/hombre/pulsera-5-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/pulsera-5-oro-blanco-producto.png', 'img/hombre/pulsera-5-oro-blanco-puesto.png', 'img/hombre/pulsera-5-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_brazalete_1', tipo: 'brazaletes', nombre: 'Jaguar', acabados: {
      oro:        ['img/hombre/brazalete-1-oro-producto.jpg', 'img/hombre/brazalete-1-oro-puesto.png', 'img/hombre/brazalete-1-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/brazalete-1-oro-blanco-producto.png', 'img/hombre/brazalete-1-oro-blanco-puesto.png', 'img/hombre/brazalete-1-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_brazalete_2', tipo: 'brazaletes', nombre: 'Agave', acabados: {
      oro:        ['img/hombre/brazalete-2-oro-producto.jpg', 'img/hombre/brazalete-2-oro-puesto.png', 'img/hombre/brazalete-2-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/brazalete-2-oro-blanco-producto.png', 'img/hombre/brazalete-2-oro-blanco-puesto.png', 'img/hombre/brazalete-2-oro-blanco-puesto-2.png'],
      negro:      ['img/hombre/brazalete-2-negro-producto.png', 'img/hombre/brazalete-2-negro-puesto.png', 'img/hombre/brazalete-2-negro-puesto-2.png'],
  } },
  { id: 'hombre_brazalete_3', tipo: 'brazaletes', nombre: 'Bacalar', acabados: {
      oro:        ['img/hombre/brazalete-3-oro-producto.jpg', 'img/hombre/brazalete-3-oro-puesto.png', 'img/hombre/brazalete-3-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/brazalete-3-oro-blanco-producto.png', 'img/hombre/brazalete-3-oro-blanco-puesto.jpg', 'img/hombre/brazalete-3-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_brazalete_4', tipo: 'brazaletes', nombre: 'Ajolote', acabados: {
      oro:        ['img/hombre/brazalete-4-oro-producto.jpg', 'img/hombre/brazalete-4-oro-puesto.png', 'img/hombre/brazalete-4-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/brazalete-4-oro-blanco-producto.png', 'img/hombre/brazalete-4-oro-blanco-puesto.jpg', 'img/hombre/brazalete-4-oro-blanco-puesto-2.jpg'],
  } },
  { id: 'hombre_anillo_1', tipo: 'anillos', nombre: 'Ocaso', acabados: {
      oro:        ['img/hombre/anillo-1-oro-producto.png', 'img/hombre/anillo-1-oro-puesto.png', 'img/hombre/anillo-1-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/anillo-1-oro-blanco-producto.png', 'img/hombre/anillo-1-oro-blanco-puesto.png', 'img/hombre/anillo-1-oro-blanco-puesto-2.png'],
      negro:      ['img/hombre/anillo-1-negro-producto.png', 'img/hombre/anillo-1-negro-puesto.jpg', 'img/hombre/anillo-1-negro-puesto-2.png'],
  } },
  { id: 'hombre_anillo_2', tipo: 'anillos', nombre: 'Marea', acabados: {
      oro:        ['img/hombre/anillo-2-oro-producto.png', 'img/hombre/anillo-2-oro-puesto.png', 'img/hombre/anillo-2-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/anillo-2-oro-blanco-producto.png', 'img/hombre/anillo-2-oro-blanco-puesto.png', 'img/hombre/anillo-2-oro-blanco-puesto-2.png'],
      negro:      ['img/hombre/anillo-2-negro-producto.png', 'img/hombre/anillo-2-negro-puesto.jpg', 'img/hombre/anillo-2-negro-puesto-2.png'],
  } },
  { id: 'hombre_anillo_3', tipo: 'anillos', nombre: 'Cenote', acabados: {
      oro:        ['img/hombre/anillo-3-oro-producto.png', 'img/hombre/anillo-3-oro-puesto.png', 'img/hombre/anillo-3-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/anillo-3-oro-blanco-producto.png', 'img/hombre/anillo-3-oro-blanco-puesto.png', 'img/hombre/anillo-3-oro-blanco-puesto-2.png'],
      negro:      ['img/hombre/anillo-3-negro-producto.png', 'img/hombre/anillo-3-negro-puesto.png', 'img/hombre/anillo-3-negro-puesto-2.png'],
  } },
  // Nuevas del catálogo (14/10/2026)
  { id: 'hombre_pulsera_6', tipo: 'pulseras', nombre: 'Sayulita', acabados: {
      oro_blanco: ['img/hombre/pulsera-6-oro-blanco-producto.png', 'img/hombre/pulsera-6-oro-blanco-puesto.png', 'img/hombre/pulsera-6-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_7', tipo: 'pulseras', nombre: 'Tequila', acabados: {
      oro:        ['img/hombre/pulsera-7-oro-producto.png', 'img/hombre/pulsera-7-oro-puesto.png', 'img/hombre/pulsera-7-oro-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_8', tipo: 'pulseras', nombre: 'Oaxaca', acabados: {
      oro:        ['img/hombre/pulsera-8-oro-producto.png', 'img/hombre/pulsera-8-oro-puesto.png', 'img/hombre/pulsera-8-oro-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_9', tipo: 'pulseras', nombre: 'Henequén', acabados: {
      plata:      ['img/hombre/pulsera-9-plata-producto.png', 'img/hombre/pulsera-9-plata-puesto.png', 'img/hombre/pulsera-9-plata-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_10', tipo: 'pulseras', nombre: 'Uxmal', acabados: {
      plata:      ['img/hombre/pulsera-10-plata-producto.png', 'img/hombre/pulsera-10-plata-puesto.png', 'img/hombre/pulsera-10-plata-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_11', tipo: 'pulseras', nombre: 'Izamal', acabados: {
      plata:      ['img/hombre/pulsera-11-plata-producto.png', 'img/hombre/pulsera-11-plata-puesto.png', 'img/hombre/pulsera-11-plata-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_12', tipo: 'pulseras', nombre: 'Sonora', acabados: {
      plata:      ['img/hombre/pulsera-12-plata-producto.png', 'img/hombre/pulsera-12-plata-puesto.png', 'img/hombre/pulsera-12-plata-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_13', tipo: 'pulseras', nombre: 'Durango', acabados: {
      plata:      ['img/hombre/pulsera-13-plata-producto.png', 'img/hombre/pulsera-13-plata-puesto.png', 'img/hombre/pulsera-13-plata-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_14', tipo: 'pulseras', nombre: 'Huasteca', acabados: {
      plata:      ['img/hombre/pulsera-14-plata-producto.png', 'img/hombre/pulsera-14-plata-puesto.png', 'img/hombre/pulsera-14-plata-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_15', tipo: 'pulseras', nombre: 'Celestún', acabados: {
      plata:      ['img/hombre/pulsera-15-plata-producto.png', 'img/hombre/pulsera-15-plata-puesto.png', 'img/hombre/pulsera-15-plata-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_16', tipo: 'pulseras', nombre: 'Volcán', acabados: {
      negro:      ['img/hombre/pulsera-16-negro-producto.png', 'img/hombre/pulsera-16-negro-puesto.png', 'img/hombre/pulsera-16-negro-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_17', tipo: 'pulseras', nombre: 'Xibalbá', acabados: {
      negro:      ['img/hombre/pulsera-17-negro-producto.png', 'img/hombre/pulsera-17-negro-puesto.png', 'img/hombre/pulsera-17-negro-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_18', tipo: 'pulseras', nombre: 'Tezontle', acabados: {
      negro:      ['img/hombre/pulsera-18-negro-producto.png', 'img/hombre/pulsera-18-negro-puesto.png', 'img/hombre/pulsera-18-negro-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_19', tipo: 'pulseras', nombre: 'Chamula', acabados: {
      negro:      ['img/hombre/pulsera-19-negro-producto.png', 'img/hombre/pulsera-19-negro-puesto.png', 'img/hombre/pulsera-19-negro-puesto-2.png'],
  } },
  { id: 'hombre_anillo_4', tipo: 'anillos', nombre: 'Xcaret', acabados: {
      oro:        ['img/hombre/anillo-4-oro-producto.png', 'img/hombre/anillo-4-oro-puesto.png', 'img/hombre/anillo-4-oro-puesto-2.png'],
  } },
  { id: 'hombre_anillo_5', tipo: 'anillos', nombre: 'Calakmul', acabados: {
      oro_blanco: ['img/hombre/anillo-5-oro-blanco-producto.png', 'img/hombre/anillo-5-oro-blanco-puesto.png', 'img/hombre/anillo-5-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_anillo_6', tipo: 'anillos', nombre: 'Baja', acabados: {
      oro_blanco: ['img/hombre/anillo-6-oro-blanco-producto.png', 'img/hombre/anillo-6-oro-blanco-puesto.png', 'img/hombre/anillo-6-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_anillo_7', tipo: 'anillos', nombre: 'Frida', acabados: {
      oro:        ['img/hombre/anillo-7-oro-producto.png', 'img/hombre/anillo-7-oro-puesto.png', 'img/hombre/anillo-7-oro-puesto-2.png'],
      plata:      ['img/hombre/anillo-7-plata-producto.png', 'img/hombre/anillo-7-plata-puesto.png', 'img/hombre/anillo-7-plata-puesto-2.png'],
  } },
  { id: 'hombre_anillo_8', tipo: 'anillos', nombre: 'Guadalupe', acabados: {
      plata:      ['img/hombre/anillo-8-plata-producto.png', 'img/hombre/anillo-8-plata-puesto.png', 'img/hombre/anillo-8-plata-puesto-2.png'],
  } },
  { id: 'hombre_anillo_9', tipo: 'anillos', nombre: 'Luchador', acabados: {
      plata:      ['img/hombre/anillo-9-plata-producto.png', 'img/hombre/anillo-9-plata-puesto.png', 'img/hombre/anillo-9-plata-puesto-2.png'],
  } },
  { id: 'hombre_anillo_10', tipo: 'anillos', nombre: 'Misión', acabados: {
      oro:        ['img/hombre/anillo-10-oro-producto.png', 'img/hombre/anillo-10-oro-puesto.png', 'img/hombre/anillo-10-oro-puesto-2.png'],
      plata:      ['img/hombre/anillo-10-plata-producto.png', 'img/hombre/anillo-10-plata-puesto.png', 'img/hombre/anillo-10-plata-puesto-2.png'],
  } },
  { id: 'hombre_anillo_11', tipo: 'anillos', nombre: 'Charro', acabados: {
      plata:      ['img/hombre/anillo-11-plata-producto.png', 'img/hombre/anillo-11-plata-puesto.png', 'img/hombre/anillo-11-plata-puesto-2.png'],
  } },
  { id: 'hombre_anillo_12', tipo: 'anillos', nombre: 'Catedral', acabados: {
      plata:      ['img/hombre/anillo-12-plata-producto.png', 'img/hombre/anillo-12-plata-puesto.png', 'img/hombre/anillo-12-plata-puesto-2.png'],
  } },
  { id: 'hombre_anillo_13', tipo: 'anillos', nombre: 'Nahual', acabados: {
      oro:        ['img/hombre/anillo-13-oro-producto.png', 'img/hombre/anillo-13-oro-puesto.png', 'img/hombre/anillo-13-oro-puesto-2.png'],
      plata:      ['img/hombre/anillo-13-plata-producto.png', 'img/hombre/anillo-13-plata-puesto.png', 'img/hombre/anillo-13-plata-puesto-2.png'],
  } },
];
/* ---------- Precios ----------
   Escalones de la colección de mujer (mismo proveedor y costes) más uno
   de 39,90 € para lo más grueso. Cada pieza va al suyo según su coste,
   su tamaño y si lleva charm de regalo (margen calculado el 14/10/2026:
   en España, el país más justo, nada baja de ~9 $ por pieza). Precio
   final con envío incluido; MX es el maestro y el resto de países van
   fijados a mano, igual que en productos.js. */
const ESCALONES_HOMBRE = {
  A: { MX: 349, ES: 24.90, US: 29.90, CL: 24990, PE: 79.90, AR: 30.90 },
  B: { MX: 399, ES: 27.90, US: 32.90, CL: 27990, PE: 89.90, AR: 33.90 },
  C: { MX: 449, ES: 29.90, US: 34.90, CL: 29990, PE: 99.90, AR: 35.90 },
  D: { MX: 499, ES: 34.90, US: 39.90, CL: 34990, PE: 119.90, AR: 40.90 },
  E: { MX: 549, ES: 39.90, US: 44.90, CL: 39990, PE: 139.90, AR: 45.90 },
};
const ESCALON_HOMBRE = {
  // 24,90 €: precio de entrada, anillos lisos finos
  hombre_anillo_2: 'A', hombre_anillo_3: 'A', hombre_anillo_4: 'A',
  // 27,90 €: pulseras finas con chapa y pulseras de eslabón finas
  hombre_pulsera_1: 'B', hombre_pulsera_2: 'B', hombre_pulsera_3: 'B', hombre_pulsera_4: 'B', hombre_pulsera_5: 'B', hombre_pulsera_6: 'B',
  hombre_pulsera_9: 'B', hombre_pulsera_10: 'B', hombre_pulsera_15: 'B', hombre_pulsera_18: 'B',
  // 29,90 €: anillos de sello y con relieve, brazaletes y Pulque (cadena sin charm)
  hombre_anillo_1: 'C', hombre_anillo_5: 'C', hombre_anillo_6: 'C', hombre_anillo_7: 'C', hombre_anillo_8: 'C',
  hombre_anillo_9: 'C', hombre_anillo_10: 'C', hombre_anillo_11: 'C', hombre_anillo_12: 'C', hombre_anillo_13: 'C',
  hombre_brazalete_1: 'C', hombre_brazalete_2: 'C', hombre_brazalete_3: 'C',
  hombre_collar_2: 'C',
  // 34,90 €: collares con charm de regalo, colgantes de barra y pulseras de eslabón medias
  hombre_collar_3: 'D', hombre_collar_4: 'D', hombre_collar_6: 'D', hombre_collar_8: 'D',
  hombre_colgante_1: 'D', hombre_colgante_2: 'D', hombre_colgante_3: 'D',
  hombre_pulsera_7: 'D', hombre_pulsera_8: 'D', hombre_pulsera_14: 'D', hombre_pulsera_16: 'D', hombre_pulsera_17: 'D', hombre_pulsera_19: 'D',
  // 39,90 €: cadenas gruesas, pulseras gruesas y Ajolote
  hombre_collar_1: 'E', hombre_collar_7: 'E',
  hombre_pulsera_11: 'E', hombre_pulsera_12: 'E', hombre_pulsera_13: 'E',
  hombre_brazalete_4: 'E',
};
COLECCION_HOMBRE.forEach(p => { if (ESCALON_HOMBRE[p.id]) p.precios = ESCALONES_HOMBRE[ESCALON_HOMBRE[p.id]]; });

// Piezas con baño de oro de 14 K (catálogos GF-SD y TR del proveedor);
// el resto, oro y oro blanco de 18 K.
const ORO_14K_HOMBRE = ['hombre_pulsera_7', 'hombre_pulsera_8', 'hombre_anillo_7', 'hombre_anillo_10', 'hombre_anillo_13'];
// Promoción de lanzamiento (descuento REAL sobre los precios de arriba:
// el tachado es el precio de siempre). null = sin promoción.
// Semana de lanzamiento: del 1 al 8 de noviembre (21:00 de México).
// hasta: se apaga sola al pasar esa fecha.
const PROMO_HOMBRE = { descuento: 15, hasta: '2026-11-08T21:00:00-06:00', texto: 'Semana de lanzamiento · −15 % en todas las piezas hasta el 8 de noviembre' };

const NOMBRE_ACABADO_HOMBRE = { oro: 'Oro', oro_blanco: 'Oro blanco', plata: 'Plata', negro: 'Negro' };

/* =========================================================
   CHARMS GRATIS para las cadenas (sin colgante)
   Se eligen en la ficha, en el desplegable "Añade un charm · Gratis".
   colores: referencia del proveedor por color. Si el charm existe en
   los dos, se pone en el color de la cadena (oro blanco/negro -> plata).
   fotos: foto de cada color (img/hombre/charms/, de CHARMS/LIMPIAS).
   Referencias en "SKU PRODUCTOS COLECCIÓN 1/skus-hombre.md".
   ========================================================= */
const CHARMS_HOMBRE = [
  { id: 'charm_1', codigo: '1', nombre: 'Placa cuadrada', grupo: 'Placas', fotos: { dorado: 'img/hombre/charms/charm-1-dorado.png', plateado: 'img/hombre/charms/charm-1-plateado.png' },
    colores: { dorado: 'YP23728-Gold Color', plateado: 'YP23728-Silver Color' } },
  { id: 'charm_2', codigo: '2', nombre: 'Placa rectangular', grupo: 'Placas', fotos: { dorado: 'img/hombre/charms/charm-2-dorado.png', plateado: 'img/hombre/charms/charm-2-plateado.png' },
    colores: { dorado: 'YP23732-Gold Color', plateado: 'YP23731-Silver Color' } },
  { id: 'charm_3', codigo: '3', nombre: 'Placa ovalada', grupo: 'Placas', fotos: { dorado: 'img/hombre/charms/charm-3-dorado.png', plateado: 'img/hombre/charms/charm-3-plateado.png' },
    colores: { dorado: 'XP49649-Gold Color', plateado: 'XP49649-Silver Color' } },
  { id: 'cruz_1', codigo: 'C1', nombre: 'Cruz con circonitas', grupo: 'Cruces', fotos: { dorado: 'img/hombre/charms/cruz-1-dorado.png', plateado: 'img/hombre/charms/cruz-1-plateado.png' },
    colores: { dorado: 'AP43158-Gold Color', plateado: 'AP43158-Silver Color' } },
  { id: 'cruz_2', codigo: 'C2', nombre: 'Cruz grande', grupo: 'Cruces', fotos: { dorado: 'img/hombre/charms/cruz-2-dorado.png' },
    colores: { dorado: 'JP40788-Gold Color' } },
  { id: 'cruz_3', codigo: 'C3', nombre: 'Cruz de perlas', grupo: 'Cruces', fotos: { dorado: 'img/hombre/charms/cruz-3-dorado.png' },
    colores: { dorado: 'AP40919-Gold Color' } },
  { id: 'cruz_5', codigo: 'C5', nombre: 'Cruz lisa', grupo: 'Cruces', fotos: { dorado: 'img/hombre/charms/cruz-5-dorado.png' },
    colores: { dorado: 'YP2877-Gold Color' } },
  { id: 'simbolo_a', codigo: 'A', nombre: 'Triángulo con ojo', grupo: 'Símbolos', fotos: { dorado: 'img/hombre/charms/simbolo-a-dorado.png' },
    colores: { dorado: 'YP33599-Gold Color' } },
  { id: 'simbolo_b', codigo: 'B', nombre: 'Sol con ojo', grupo: 'Símbolos', fotos: { dorado: 'img/hombre/charms/simbolo-b-dorado.png' },
    colores: { dorado: 'YP33606-Gold Color' } },
  { id: 'simbolo_c', codigo: 'C', nombre: 'Medalla con ojo', grupo: 'Símbolos', fotos: { dorado: 'img/hombre/charms/simbolo-c-dorado.png' },
    colores: { dorado: 'FP31840-Gold Color' } },
  { id: 'simbolo_d', codigo: 'D', nombre: 'Mano', grupo: 'Símbolos', fotos: { dorado: 'img/hombre/charms/simbolo-d-dorado.png' },
    colores: { dorado: 'YP33627-Gold Color' } },
  { id: 'simbolo_e', codigo: 'E', nombre: 'Ojo', grupo: 'Símbolos', fotos: { dorado: 'img/hombre/charms/simbolo-e-dorado.png' },
    colores: { dorado: 'BP00049-Gold Color' } },
  { id: 'simbolo_f', codigo: 'F', nombre: 'Hamsa', grupo: 'Símbolos', fotos: { dorado: 'img/hombre/charms/simbolo-f-dorado.png' },
    colores: { dorado: 'BP2522-Gold Color' } },
  // Números, letras y circonitas (Emanco Charms Catalog), en oro y plata.
  { id: 'numero_0', codigo: '0', nombre: 'Número 0', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-0-dorado.png', plateado: 'img/hombre/charms/numero-0-plateado.png' },
    colores: { dorado: 'YP33055D0W0', plateado: 'YP33055A0W0' } },
  { id: 'numero_1', codigo: '1', nombre: 'Número 1', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-1-dorado.png', plateado: 'img/hombre/charms/numero-1-plateado.png' },
    colores: { dorado: 'YP33056D0W0', plateado: 'YP33056A0W0' } },
  { id: 'numero_2', codigo: '2', nombre: 'Número 2', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-2-dorado.png', plateado: 'img/hombre/charms/numero-2-plateado.png' },
    colores: { dorado: 'YP33057D0W0', plateado: 'YP33057A0W0' } },
  { id: 'numero_3', codigo: '3', nombre: 'Número 3', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-3-dorado.png', plateado: 'img/hombre/charms/numero-3-plateado.png' },
    colores: { dorado: 'YP33058D0W0', plateado: 'YP33058A0W0' } },
  { id: 'numero_4', codigo: '4', nombre: 'Número 4', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-4-dorado.png', plateado: 'img/hombre/charms/numero-4-plateado.png' },
    colores: { dorado: 'YP33059D0W0', plateado: 'YP33059A0W0' } },
  { id: 'numero_5', codigo: '5', nombre: 'Número 5', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-5-dorado.png', plateado: 'img/hombre/charms/numero-5-plateado.png' },
    colores: { dorado: 'YP33060D0W0', plateado: 'YP33060A0W0' } },
  { id: 'numero_6', codigo: '6', nombre: 'Número 6', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-6-dorado.png', plateado: 'img/hombre/charms/numero-6-plateado.png' },
    colores: { dorado: 'YP33061D0W0', plateado: 'YP33061A0W0' } },
  { id: 'numero_7', codigo: '7', nombre: 'Número 7', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-7-dorado.png', plateado: 'img/hombre/charms/numero-7-plateado.png' },
    colores: { dorado: 'YP33062D0W0', plateado: 'YP33062A0W0' } },
  { id: 'numero_8', codigo: '8', nombre: 'Número 8', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-8-dorado.png', plateado: 'img/hombre/charms/numero-8-plateado.png' },
    colores: { dorado: 'YP33063D0W0', plateado: 'YP33063A0W0' } },
  { id: 'numero_9', codigo: '9', nombre: 'Número 9', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-9-dorado.png', plateado: 'img/hombre/charms/numero-9-plateado.png' },
    colores: { dorado: 'YP33064D0W0', plateado: 'YP33064A0W0' } },
  { id: 'numero_10', codigo: '10', nombre: 'Número 10', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-10-dorado.png', plateado: 'img/hombre/charms/numero-10-plateado.png' },
    colores: { dorado: 'YP33065D0W0', plateado: 'YP33065A0W0' } },
  { id: 'numero_12', codigo: '12', nombre: 'Número 12', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-12-dorado.png', plateado: 'img/hombre/charms/numero-12-plateado.png' },
    colores: { dorado: 'YP33068D0W0', plateado: 'YP33068A0W0' } },
  { id: 'numero_13', codigo: '13', nombre: 'Número 13', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-13-dorado.png', plateado: 'img/hombre/charms/numero-13-plateado.png' },
    colores: { dorado: 'YP33066D0W0', plateado: 'YP33066A0W0' } },
  { id: 'numero_17', codigo: '17', nombre: 'Número 17', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-17-dorado.png', plateado: 'img/hombre/charms/numero-17-plateado.png' },
    colores: { dorado: 'YP33069D0W0', plateado: 'YP33069A0W0' } },
  { id: 'numero_21', codigo: '21', nombre: 'Número 21', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-21-dorado.png', plateado: 'img/hombre/charms/numero-21-plateado.png' },
    colores: { dorado: 'YP33067D0W0', plateado: 'YP33067A0W0' } },
  { id: 'numero_23', codigo: '23', nombre: 'Número 23', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-23-dorado.png', plateado: 'img/hombre/charms/numero-23-plateado.png' },
    colores: { dorado: 'YP33071D0W0', plateado: 'YP33071A0W0' } },
  { id: 'numero_24', codigo: '24', nombre: 'Número 24', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-24-dorado.png', plateado: 'img/hombre/charms/numero-24-plateado.png' },
    colores: { dorado: 'YP33072D0W0', plateado: 'YP33072A0W0' } },
  { id: 'numero_33', codigo: '33', nombre: 'Número 33', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-33-dorado.png', plateado: 'img/hombre/charms/numero-33-plateado.png' },
    colores: { dorado: 'YP33073D0W0', plateado: 'YP33073A0W0' } },
  { id: 'numero_34', codigo: '34', nombre: 'Número 34', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-34-dorado.png', plateado: 'img/hombre/charms/numero-34-plateado.png' },
    colores: { dorado: 'YP33074D0W0', plateado: 'YP33074A0W0' } },
  { id: 'numero_77', codigo: '77', nombre: 'Número 77', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-77-dorado.png', plateado: 'img/hombre/charms/numero-77-plateado.png' },
    colores: { dorado: 'YP33070D0W0', plateado: 'YP33070A0W0' } },
  { id: 'letra_a', codigo: 'a', nombre: 'Letra a', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-a-dorado.jpg', plateado: 'img/hombre/charms/letra-a-plateado.png' },
    colores: { dorado: 'XP49461A-2', plateado: 'XP49461A-1' } },
  { id: 'letra_b', codigo: 'b', nombre: 'Letra b', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-b-dorado.jpg', plateado: 'img/hombre/charms/letra-b-plateado.png' },
    colores: { dorado: 'XP49461B-2', plateado: 'XP49461B-1' } },
  { id: 'letra_c', codigo: 'c', nombre: 'Letra c', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-c-dorado.jpg', plateado: 'img/hombre/charms/letra-c-plateado.png' },
    colores: { dorado: 'XP49461C-2', plateado: 'XP49461C-1' } },
  { id: 'letra_d', codigo: 'd', nombre: 'Letra d', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-d-dorado.jpg', plateado: 'img/hombre/charms/letra-d-plateado.png' },
    colores: { dorado: 'XP49461D-2', plateado: 'XP49461D-1' } },
  { id: 'letra_e', codigo: 'e', nombre: 'Letra e', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-e-dorado.jpg', plateado: 'img/hombre/charms/letra-e-plateado.png' },
    colores: { dorado: 'XP49461E-2', plateado: 'XP49461E-1' } },
  { id: 'letra_f', codigo: 'f', nombre: 'Letra f', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-f-dorado.jpg', plateado: 'img/hombre/charms/letra-f-plateado.png' },
    colores: { dorado: 'XP49461F-2', plateado: 'XP49461F-1' } },
  { id: 'letra_g', codigo: 'g', nombre: 'Letra g', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-g-dorado.jpg', plateado: 'img/hombre/charms/letra-g-plateado.png' },
    colores: { dorado: 'XP49461G-2', plateado: 'XP49461G-1' } },
  { id: 'letra_h', codigo: 'h', nombre: 'Letra h', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-h-dorado.jpg', plateado: 'img/hombre/charms/letra-h-plateado.png' },
    colores: { dorado: 'XP49461H-2', plateado: 'XP49461H-1' } },
  { id: 'letra_i', codigo: 'i', nombre: 'Letra i', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-i-dorado.jpg', plateado: 'img/hombre/charms/letra-i-plateado.png' },
    colores: { dorado: 'XP49461I-2', plateado: 'XP49461I-1' } },
  { id: 'letra_j', codigo: 'j', nombre: 'Letra j', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-j-dorado.jpg', plateado: 'img/hombre/charms/letra-j-plateado.png' },
    colores: { dorado: 'XP49461J-2', plateado: 'XP49461J-1' } },
  { id: 'letra_k', codigo: 'k', nombre: 'Letra k', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-k-dorado.jpg', plateado: 'img/hombre/charms/letra-k-plateado.png' },
    colores: { dorado: 'XP49461K-2', plateado: 'XP49461K-1' } },
  { id: 'letra_l', codigo: 'l', nombre: 'Letra l', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-l-dorado.jpg', plateado: 'img/hombre/charms/letra-l-plateado.png' },
    colores: { dorado: 'XP49461L-2', plateado: 'XP49461L-1' } },
  { id: 'letra_m', codigo: 'm', nombre: 'Letra m', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-m-dorado.jpg', plateado: 'img/hombre/charms/letra-m-plateado.png' },
    colores: { dorado: 'XP49461M-2', plateado: 'XP49461M-1' } },
  { id: 'letra_n', codigo: 'n', nombre: 'Letra n', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-n-dorado.jpg', plateado: 'img/hombre/charms/letra-n-plateado.png' },
    colores: { dorado: 'XP49461N-2', plateado: 'XP49461N-1' } },
  { id: 'letra_o', codigo: 'o', nombre: 'Letra o', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-o-dorado.jpg', plateado: 'img/hombre/charms/letra-o-plateado.png' },
    colores: { dorado: 'XP49461O-2', plateado: 'XP49461O-1' } },
  { id: 'letra_p', codigo: 'p', nombre: 'Letra p', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-p-dorado.jpg', plateado: 'img/hombre/charms/letra-p-plateado.png' },
    colores: { dorado: 'XP49461P-2', plateado: 'XP49461P-1' } },
  { id: 'letra_q', codigo: 'q', nombre: 'Letra q', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-q-dorado.jpg', plateado: 'img/hombre/charms/letra-q-plateado.png' },
    colores: { dorado: 'XP49461Q-2', plateado: 'XP49461Q-1' } },
  { id: 'letra_r', codigo: 'r', nombre: 'Letra r', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-r-dorado.jpg', plateado: 'img/hombre/charms/letra-r-plateado.png' },
    colores: { dorado: 'XP49461R-2', plateado: 'XP49461R-1' } },
  { id: 'letra_s', codigo: 's', nombre: 'Letra s', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-s-dorado.jpg', plateado: 'img/hombre/charms/letra-s-plateado.png' },
    colores: { dorado: 'XP49461S-2', plateado: 'XP49461S-1' } },
  { id: 'letra_t', codigo: 't', nombre: 'Letra t', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-t-dorado.jpg', plateado: 'img/hombre/charms/letra-t-plateado.png' },
    colores: { dorado: 'XP49461T-2', plateado: 'XP49461T-1' } },
  { id: 'letra_u', codigo: 'u', nombre: 'Letra u', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-u-dorado.jpg', plateado: 'img/hombre/charms/letra-u-plateado.png' },
    colores: { dorado: 'XP49461U-2', plateado: 'XP49461U-1' } },
  { id: 'letra_v', codigo: 'v', nombre: 'Letra v', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-v-dorado.jpg', plateado: 'img/hombre/charms/letra-v-plateado.png' },
    colores: { dorado: 'XP49461V-2', plateado: 'XP49461V-1' } },
  { id: 'letra_w', codigo: 'w', nombre: 'Letra w', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-w-dorado.jpg', plateado: 'img/hombre/charms/letra-w-plateado.png' },
    colores: { dorado: 'XP49461W-2', plateado: 'XP49461W-1' } },
  { id: 'letra_x', codigo: 'x', nombre: 'Letra x', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-x-dorado.jpg', plateado: 'img/hombre/charms/letra-x-plateado.png' },
    colores: { dorado: 'XP49461X-2', plateado: 'XP49461X-1' } },
  { id: 'letra_y', codigo: 'y', nombre: 'Letra y', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-y-dorado.jpg', plateado: 'img/hombre/charms/letra-y-plateado.png' },
    colores: { dorado: 'XP49461Y-2', plateado: 'XP49461Y-1' } },
  { id: 'letra_z', codigo: 'z', nombre: 'Letra z', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-z-dorado.jpg', plateado: 'img/hombre/charms/letra-z-plateado.png' },
    colores: { dorado: 'XP49461Z-2', plateado: 'XP49461Z-1' } },
  { id: 'circonita_gota', codigo: '', nombre: 'Circonita gota', grupo: 'Circonitas', fotos: { dorado: 'img/hombre/charms/circonita-gota-dorado.jpg', plateado: 'img/hombre/charms/circonita-gota-plateado.png' },
    colores: { dorado: 'XP49970D0W0', plateado: 'XP49970A0W0' } },
  { id: 'circonita_rectangular', codigo: '', nombre: 'Circonita rectangular', grupo: 'Circonitas', fotos: { dorado: 'img/hombre/charms/circonita-rectangular-dorado.jpg', plateado: 'img/hombre/charms/circonita-rectangular-plateado.png' },
    colores: { dorado: 'XP49971D0W0', plateado: 'XP49971A0W0' } },
  { id: 'circonita_cuadrada', codigo: '', nombre: 'Circonita cuadrada', grupo: 'Circonitas', fotos: { dorado: 'img/hombre/charms/circonita-cuadrada-dorado.jpg', plateado: 'img/hombre/charms/circonita-cuadrada-plateado.png' },
    colores: { dorado: 'XP49972D0W0', plateado: 'XP49972A0W0' } },
  { id: 'circonita_marquesa', codigo: '', nombre: 'Circonita marquesa', grupo: 'Circonitas', fotos: { dorado: 'img/hombre/charms/circonita-marquesa-dorado.jpg', plateado: 'img/hombre/charms/circonita-marquesa-plateado.png' },
    colores: { dorado: 'XP49973D0W0', plateado: 'XP49973A0W0' } },
  { id: 'circonita_ovalada', codigo: '', nombre: 'Circonita ovalada', grupo: 'Circonitas', fotos: { dorado: 'img/hombre/charms/circonita-ovalada-dorado.jpg', plateado: 'img/hombre/charms/circonita-ovalada-plateado.png' },
    colores: { dorado: 'XP49974D0W0', plateado: 'XP49974A0W0' } },
  { id: 'circonita_redonda', codigo: '', nombre: 'Circonita redonda', grupo: 'Circonitas', fotos: { dorado: 'img/hombre/charms/circonita-redonda-dorado.jpg', plateado: 'img/hombre/charms/circonita-redonda-plateado.png' },
    colores: { dorado: 'HZNP014-Gold Color', plateado: 'HZNP014-Silver Color' } },  // 6×6 mm (la XP49975 era de 4×4)
];
// Grupos de charms: todos plegados (se abren al tocar el título).
const GRUPOS_CHARM_PLEGADOS = ['Placas', 'Cruces', 'Símbolos', 'Números', 'Letras', 'Circonitas'];
// Orden de los grupos en la ficha (19/10/2026): cruces, símbolos, circonitas,
// placas y el resto. Un grupo que no esté aquí va al final.
const ORDEN_GRUPOS_CHARM = ['Cruces', 'Símbolos', 'Circonitas', 'Placas', 'Números', 'Letras'];
// FOTOS_CHARM (generado por scripts/charms-hombre.py)
// Cadena con el charm puesto, por acabado y en orden de variación.
const FOTOS_CHARM_HOMBRE = {
  hombre_collar_3: {
    oro_blanco: [{ charm: 'cruz_1', foto: 'img/hombre/collar-3-oro-blanco-charm-cruz-1.png' }, { charm: 'charm_1', foto: 'img/hombre/collar-3-oro-blanco-charm-charm-1.png' }, { charm: 'charm_2', foto: 'img/hombre/collar-3-oro-blanco-charm-charm-2.png' }, { charm: 'charm_3', foto: 'img/hombre/collar-3-oro-blanco-charm-charm-3.png' }, { charm: 'circonita_cuadrada', foto: 'img/hombre/collar-3-oro-blanco-charm-circonita-cuadrada.png' }, { charm: 'circonita_gota', foto: 'img/hombre/collar-3-oro-blanco-charm-circonita-gota.png' }, { charm: 'circonita_marquesa', foto: 'img/hombre/collar-3-oro-blanco-charm-circonita-marquesa.png' }, { charm: 'circonita_ovalada', foto: 'img/hombre/collar-3-oro-blanco-charm-circonita-ovalada.png' }, { charm: 'circonita_rectangular', foto: 'img/hombre/collar-3-oro-blanco-charm-circonita-rectangular.png' }, { charm: 'circonita_redonda', foto: 'img/hombre/collar-3-oro-blanco-charm-circonita-redonda.png' }],
    oro: [{ charm: 'simbolo_c', foto: 'img/hombre/collar-3-oro-charm-simbolo-c.png' }, { charm: 'cruz_2', foto: 'img/hombre/collar-3-oro-charm-cruz-2.png' }, { charm: 'charm_1', foto: 'img/hombre/collar-3-oro-charm-charm-1.png' }, { charm: 'charm_2', foto: 'img/hombre/collar-3-oro-charm-charm-2.png' }, { charm: 'charm_3', foto: 'img/hombre/collar-3-oro-charm-charm-3.png' }, { charm: 'circonita_cuadrada', foto: 'img/hombre/collar-3-oro-charm-circonita-cuadrada.png' }, { charm: 'circonita_gota', foto: 'img/hombre/collar-3-oro-charm-circonita-gota.png' }, { charm: 'circonita_marquesa', foto: 'img/hombre/collar-3-oro-charm-circonita-marquesa.png' }, { charm: 'circonita_ovalada', foto: 'img/hombre/collar-3-oro-charm-circonita-ovalada.png' }, { charm: 'circonita_rectangular', foto: 'img/hombre/collar-3-oro-charm-circonita-rectangular.png' }, { charm: 'circonita_redonda', foto: 'img/hombre/collar-3-oro-charm-circonita-redonda.png' }, { charm: 'cruz_1', foto: 'img/hombre/collar-3-oro-charm-cruz-1.png' }, { charm: 'cruz_3', foto: 'img/hombre/collar-3-oro-charm-cruz-3.png' }, { charm: 'cruz_5', foto: 'img/hombre/collar-3-oro-charm-cruz-5.png' }, { charm: 'simbolo_a', foto: 'img/hombre/collar-3-oro-charm-simbolo-a.png' }, { charm: 'simbolo_b', foto: 'img/hombre/collar-3-oro-charm-simbolo-b.png' }, { charm: 'simbolo_d', foto: 'img/hombre/collar-3-oro-charm-simbolo-d.png' }, { charm: 'simbolo_e', foto: 'img/hombre/collar-3-oro-charm-simbolo-e.png' }, { charm: 'simbolo_f', foto: 'img/hombre/collar-3-oro-charm-simbolo-f.png' }]
  },
  hombre_collar_4: {
    oro_blanco: [{ charm: 'charm_3', foto: 'img/hombre/collar-4-oro-blanco-charm-charm-3.png' }, { charm: 'charm_2', foto: 'img/hombre/collar-4-oro-blanco-charm-charm-2.png' }, { charm: 'charm_1', foto: 'img/hombre/collar-4-oro-blanco-charm-charm-1.png' }, { charm: 'circonita_cuadrada', foto: 'img/hombre/collar-4-oro-blanco-charm-circonita-cuadrada.png' }, { charm: 'circonita_gota', foto: 'img/hombre/collar-4-oro-blanco-charm-circonita-gota.png' }, { charm: 'circonita_marquesa', foto: 'img/hombre/collar-4-oro-blanco-charm-circonita-marquesa.png' }, { charm: 'circonita_ovalada', foto: 'img/hombre/collar-4-oro-blanco-charm-circonita-ovalada.png' }, { charm: 'circonita_rectangular', foto: 'img/hombre/collar-4-oro-blanco-charm-circonita-rectangular.png' }, { charm: 'circonita_redonda', foto: 'img/hombre/collar-4-oro-blanco-charm-circonita-redonda.png' }, { charm: 'cruz_1', foto: 'img/hombre/collar-4-oro-blanco-charm-cruz-1.png' }],
    oro: [{ charm: 'simbolo_d', foto: 'img/hombre/collar-4-oro-charm-simbolo-d.png' }, { charm: 'charm_3', foto: 'img/hombre/collar-4-oro-charm-charm-3.png' }, { charm: 'charm_1', foto: 'img/hombre/collar-4-oro-charm-charm-1.png' }, { charm: 'charm_2', foto: 'img/hombre/collar-4-oro-charm-charm-2.png' }, { charm: 'circonita_cuadrada', foto: 'img/hombre/collar-4-oro-charm-circonita-cuadrada.png' }, { charm: 'circonita_gota', foto: 'img/hombre/collar-4-oro-charm-circonita-gota.png' }, { charm: 'circonita_marquesa', foto: 'img/hombre/collar-4-oro-charm-circonita-marquesa.png' }, { charm: 'circonita_ovalada', foto: 'img/hombre/collar-4-oro-charm-circonita-ovalada.png' }, { charm: 'circonita_rectangular', foto: 'img/hombre/collar-4-oro-charm-circonita-rectangular.png' }, { charm: 'circonita_redonda', foto: 'img/hombre/collar-4-oro-charm-circonita-redonda.png' }, { charm: 'cruz_1', foto: 'img/hombre/collar-4-oro-charm-cruz-1.png' }, { charm: 'cruz_2', foto: 'img/hombre/collar-4-oro-charm-cruz-2.png' }, { charm: 'cruz_3', foto: 'img/hombre/collar-4-oro-charm-cruz-3.png' }, { charm: 'cruz_5', foto: 'img/hombre/collar-4-oro-charm-cruz-5.png' }, { charm: 'simbolo_a', foto: 'img/hombre/collar-4-oro-charm-simbolo-a.png' }, { charm: 'simbolo_b', foto: 'img/hombre/collar-4-oro-charm-simbolo-b.png' }, { charm: 'simbolo_c', foto: 'img/hombre/collar-4-oro-charm-simbolo-c.png' }, { charm: 'simbolo_e', foto: 'img/hombre/collar-4-oro-charm-simbolo-e.png' }, { charm: 'simbolo_f', foto: 'img/hombre/collar-4-oro-charm-simbolo-f.png' }]
  },
  hombre_collar_6: {
    oro_blanco: [{ charm: 'charm_1', foto: 'img/hombre/collar-6-oro-blanco-charm-charm-1.png' }, { charm: 'charm_3', foto: 'img/hombre/collar-6-oro-blanco-charm-charm-3.png' }, { charm: 'charm_2', foto: 'img/hombre/collar-6-oro-blanco-charm-charm-2.png' }, { charm: 'circonita_cuadrada', foto: 'img/hombre/collar-6-oro-blanco-charm-circonita-cuadrada.png' }, { charm: 'circonita_gota', foto: 'img/hombre/collar-6-oro-blanco-charm-circonita-gota.png' }, { charm: 'circonita_marquesa', foto: 'img/hombre/collar-6-oro-blanco-charm-circonita-marquesa.png' }, { charm: 'circonita_ovalada', foto: 'img/hombre/collar-6-oro-blanco-charm-circonita-ovalada.png' }, { charm: 'circonita_rectangular', foto: 'img/hombre/collar-6-oro-blanco-charm-circonita-rectangular.png' }, { charm: 'circonita_redonda', foto: 'img/hombre/collar-6-oro-blanco-charm-circonita-redonda.png' }, { charm: 'cruz_1', foto: 'img/hombre/collar-6-oro-blanco-charm-cruz-1.png' }],
    oro: [{ charm: 'simbolo_e', foto: 'img/hombre/collar-6-oro-charm-simbolo-e.png' }, { charm: 'cruz_3', foto: 'img/hombre/collar-6-oro-charm-cruz-3.png' }, { charm: 'charm_1', foto: 'img/hombre/collar-6-oro-charm-charm-1.png' }, { charm: 'charm_2', foto: 'img/hombre/collar-6-oro-charm-charm-2.png' }, { charm: 'charm_3', foto: 'img/hombre/collar-6-oro-charm-charm-3.png' }, { charm: 'circonita_cuadrada', foto: 'img/hombre/collar-6-oro-charm-circonita-cuadrada.png' }, { charm: 'circonita_gota', foto: 'img/hombre/collar-6-oro-charm-circonita-gota.png' }, { charm: 'circonita_marquesa', foto: 'img/hombre/collar-6-oro-charm-circonita-marquesa.png' }, { charm: 'circonita_ovalada', foto: 'img/hombre/collar-6-oro-charm-circonita-ovalada.png' }, { charm: 'circonita_rectangular', foto: 'img/hombre/collar-6-oro-charm-circonita-rectangular.png' }, { charm: 'circonita_redonda', foto: 'img/hombre/collar-6-oro-charm-circonita-redonda.png' }, { charm: 'cruz_1', foto: 'img/hombre/collar-6-oro-charm-cruz-1.png' }, { charm: 'cruz_2', foto: 'img/hombre/collar-6-oro-charm-cruz-2.png' }, { charm: 'cruz_5', foto: 'img/hombre/collar-6-oro-charm-cruz-5.png' }, { charm: 'simbolo_a', foto: 'img/hombre/collar-6-oro-charm-simbolo-a.png' }, { charm: 'simbolo_b', foto: 'img/hombre/collar-6-oro-charm-simbolo-b.png' }, { charm: 'simbolo_c', foto: 'img/hombre/collar-6-oro-charm-simbolo-c.png' }, { charm: 'simbolo_d', foto: 'img/hombre/collar-6-oro-charm-simbolo-d.png' }, { charm: 'simbolo_f', foto: 'img/hombre/collar-6-oro-charm-simbolo-f.png' }]
  },
  hombre_collar_8: {
    oro_blanco: [{ charm: 'charm_3', foto: 'img/hombre/collar-8-oro-blanco-charm-charm-3.png' }, { charm: 'charm_1', foto: 'img/hombre/collar-8-oro-blanco-charm-charm-1.png' }, { charm: 'charm_2', foto: 'img/hombre/collar-8-oro-blanco-charm-charm-2.png' }, { charm: 'circonita_cuadrada', foto: 'img/hombre/collar-8-oro-blanco-charm-circonita-cuadrada.png' }, { charm: 'circonita_gota', foto: 'img/hombre/collar-8-oro-blanco-charm-circonita-gota.png' }, { charm: 'circonita_marquesa', foto: 'img/hombre/collar-8-oro-blanco-charm-circonita-marquesa.png' }, { charm: 'circonita_ovalada', foto: 'img/hombre/collar-8-oro-blanco-charm-circonita-ovalada.png' }, { charm: 'circonita_rectangular', foto: 'img/hombre/collar-8-oro-blanco-charm-circonita-rectangular.png' }, { charm: 'circonita_redonda', foto: 'img/hombre/collar-8-oro-blanco-charm-circonita-redonda.png' }, { charm: 'cruz_1', foto: 'img/hombre/collar-8-oro-blanco-charm-cruz-1.png' }],
    oro: [{ charm: 'cruz_5', foto: 'img/hombre/collar-8-oro-charm-cruz-5.png' }, { charm: 'simbolo_a', foto: 'img/hombre/collar-8-oro-charm-simbolo-a.png' }, { charm: 'charm_1', foto: 'img/hombre/collar-8-oro-charm-charm-1.png' }, { charm: 'charm_2', foto: 'img/hombre/collar-8-oro-charm-charm-2.png' }, { charm: 'charm_3', foto: 'img/hombre/collar-8-oro-charm-charm-3.png' }, { charm: 'circonita_cuadrada', foto: 'img/hombre/collar-8-oro-charm-circonita-cuadrada.png' }, { charm: 'circonita_gota', foto: 'img/hombre/collar-8-oro-charm-circonita-gota.png' }, { charm: 'circonita_marquesa', foto: 'img/hombre/collar-8-oro-charm-circonita-marquesa.png' }, { charm: 'circonita_ovalada', foto: 'img/hombre/collar-8-oro-charm-circonita-ovalada.png' }, { charm: 'circonita_rectangular', foto: 'img/hombre/collar-8-oro-charm-circonita-rectangular.png' }, { charm: 'circonita_redonda', foto: 'img/hombre/collar-8-oro-charm-circonita-redonda.png' }, { charm: 'cruz_1', foto: 'img/hombre/collar-8-oro-charm-cruz-1.png' }, { charm: 'cruz_2', foto: 'img/hombre/collar-8-oro-charm-cruz-2.png' }, { charm: 'cruz_3', foto: 'img/hombre/collar-8-oro-charm-cruz-3.png' }, { charm: 'simbolo_b', foto: 'img/hombre/collar-8-oro-charm-simbolo-b.png' }, { charm: 'simbolo_c', foto: 'img/hombre/collar-8-oro-charm-simbolo-c.png' }, { charm: 'simbolo_d', foto: 'img/hombre/collar-8-oro-charm-simbolo-d.png' }, { charm: 'simbolo_e', foto: 'img/hombre/collar-8-oro-charm-simbolo-e.png' }, { charm: 'simbolo_f', foto: 'img/hombre/collar-8-oro-charm-simbolo-f.png' }]
  },
};
// FIN_FOTOS_CHARM

// Color con el que sale la pieza en el Shop, la portada y "más piezas"
// si no es el que tocaría por turno.
const ACABADO_INICIAL_HOMBRE = { hombre_collar_7: 'oro_blanco', hombre_collar_3: 'oro', hombre_collar_6: 'oro', hombre_collar_8: 'oro_blanco' };

// Opciones que el cliente escoge en la ficha (talla, largo, grosor, ancho),
// con la referencia del proveedor de cada una (skus-hombre.md), y la
// medida fija de las piezas que solo vienen en una.
const LARGO_PULSERA = { nombre: 'Largo', nota: '+ 2 cm de alargador', valores: [
  { id: '15', texto: '15 cm' }, { id: '18', texto: '18 cm' }, { id: '20', texto: '20 cm' }] };
const TALLA_ANILLO = { nombre: 'Talla', nota: 'Contorno interior del anillo', valores: [
  { id: '7', texto: 'US 7', sub: '54 mm' }, { id: '8', texto: 'US 8', sub: '57 mm' }, { id: '9', texto: 'US 9', sub: '59 mm' }] };
// Anillos de los catálogos TR: tallas US 7 a 11 (algunos sin la 7 o sin la 11).
const TALLAS_US = { '7': '54 mm', '8': '57 mm', '9': '59 mm', '10': '62 mm', '11': '65 mm' };
const tallasAnillo = (desde, hasta, ref) => ({ nombre: 'Talla', nota: 'Contorno interior del anillo',
  valores: Object.keys(TALLAS_US).filter(t => +t >= desde && +t <= hasta).map(t => ({ id: t, texto: 'US ' + t, sub: TALLAS_US[t], ref })) });
const conRef = (op, refs) => ({ ...op, valores: op.valores.map((v, i) => ({ ...v, ref: refs[i] })) });
const OPCIONES_HOMBRE = {
  hombre_collar_7: { nombre: 'Grosor', valores: [{ id: '4', texto: '4 mm', ref: 'YX44953' }, { id: '5', texto: '5 mm', ref: 'YX44951' }] },
  hombre_pulsera_1: conRef(LARGO_PULSERA, ['YS44931', 'YS44932', 'YS44933']),
  hombre_pulsera_2: conRef(LARGO_PULSERA, ['YS44926', 'YS44927', 'YS44928']),
  hombre_pulsera_3: conRef(LARGO_PULSERA, ['YS44936', 'YS44937', 'YS44938']),
  hombre_pulsera_4: conRef(LARGO_PULSERA, ['YS44918', 'YS44919', 'YS44920']),
  hombre_pulsera_5: conRef(LARGO_PULSERA, ['YS44922', 'YS44923', 'YS44924']),
  hombre_brazalete_1: { nombre: 'Ancho', valores: [{ id: '3.5', texto: '3,5 mm', ref: 'YZ44947' }, { id: '5', texto: '5 mm', ref: 'YZ44948' }] },
  hombre_anillo_1: conRef(TALLA_ANILLO, ['YJ44953', 'YJ44953', 'YJ44953']),
  hombre_anillo_2: conRef(TALLA_ANILLO, ['YJ44954', 'YJ44954', 'YJ44954']),
  hombre_anillo_3: conRef(TALLA_ANILLO, ['YJ44955', 'YJ44955', 'YJ44955']),
  // Nuevas del catálogo
  hombre_pulsera_6: conRef(LARGO_PULSERA, ['YS48446', 'YS48447', 'YS48448']),
  hombre_anillo_4: [
    { nombre: 'Ancho', valores: [{ id: '4', texto: '4 mm', ref: 'YJ44943' }, { id: '5', texto: '5 mm', ref: 'YJ44944' }] },
    TALLA_ANILLO,
  ],
  hombre_anillo_5: conRef(TALLA_ANILLO, ['YJ44946', 'YJ44946', 'YJ44946']),
  hombre_anillo_6: conRef(TALLA_ANILLO, ['YJ44945', 'YJ44945', 'YJ44945']),
  hombre_anillo_7: tallasAnillo(7, 11, 'TR24065'),
  hombre_anillo_8: tallasAnillo(8, 11, 'TR24155'),
  hombre_anillo_9: tallasAnillo(7, 11, 'TR24157'),
  hombre_anillo_10: tallasAnillo(8, 11, 'TR24152'),
  hombre_anillo_11: tallasAnillo(7, 11, 'TR24149'),
  hombre_anillo_12: tallasAnillo(7, 10, 'TR24167'),
  hombre_anillo_13: tallasAnillo(7, 11, 'TR24174'),
};
const MEDIDAS_HOMBRE = {
  hombre_collar_1: 'Largo 55 cm · cadena 2,5 mm',
  hombre_collar_2: 'Largo 55 cm · cadena cubana 1,8 mm',
  hombre_collar_3: 'Largo 55 cm · cadena 2 mm',
  hombre_collar_4: 'Largo 55 cm · cadena 1,3 mm',
  hombre_collar_6: 'Largo 55 cm · cadena 1,5 mm',
  hombre_collar_7: 'Largo 55 cm · cadena cubana',
  hombre_collar_8: 'Largo 55 cm · cadena de caja 1,5 mm',
  hombre_colgante_1: 'Largo 58 cm · cadena cubana 1 mm · barra 13 × 3,5 mm',
  hombre_colgante_2: 'Largo 58 cm · cadena 1 mm · barra 13 × 3,5 mm',
  hombre_colgante_3: 'Largo 58 cm · cadena de caja 1 mm · barra 13 × 3,5 mm',
  hombre_brazalete_1: 'Abierto, talla única',
  hombre_brazalete_2: 'Abierto, talla única · ancho 3 mm · interior 6,5 cm',
  hombre_brazalete_3: 'Abierto, talla única · ancho 6 mm',
  hombre_brazalete_4: 'Abierto, talla única · ancho 5 mm',
  hombre_anillo_1: 'Ancho 7,5 mm',
  hombre_anillo_2: 'Ancho 6 mm',
  hombre_anillo_3: 'Ancho 2 mm',
  // Nuevas del catálogo
  hombre_pulsera_6: 'Cadena clip 2 mm · chapa 10 × 4 mm',
  hombre_pulsera_7: 'Largo 22 cm · ancho 6 mm',
  hombre_pulsera_8: 'Largo 23 cm · ancho 7 mm',
  hombre_pulsera_9: 'Largo 22 cm · ancho 6 mm',
  hombre_pulsera_10: 'Largo 21 cm · ancho 6 mm',
  hombre_pulsera_11: 'Largo 22 cm · ancho 11 mm',
  hombre_pulsera_12: 'Largo 22 cm · ancho 8 mm',
  hombre_pulsera_13: 'Largo 22 cm · ancho 10 mm',
  hombre_pulsera_14: 'Largo 20 cm · ancho 5 mm',
  hombre_pulsera_15: 'Largo 18 cm + 3 cm de alargador · ancho 5 mm',
  hombre_pulsera_16: 'Largo 22 cm · ancho 10 mm',
  hombre_pulsera_17: 'Largo 22 cm · ancho 8 mm',
  hombre_pulsera_18: 'Largo 22 cm · ancho 7 mm',
  hombre_pulsera_19: 'Largo 22 cm · ancho 5 mm',
  hombre_anillo_4: 'Abierto',
  hombre_anillo_5: 'Sello abierto · ancho 5 mm',
  hombre_anillo_6: 'Abierto · ancho 8 mm',
  hombre_anillo_7: 'Frente 14 mm',
  hombre_anillo_8: 'Frente 15 mm',
  hombre_anillo_9: 'Frente 25 mm',
  hombre_anillo_10: 'Frente 16 mm',
  hombre_anillo_11: 'Frente 21 mm',
  hombre_anillo_12: 'Frente 19 mm',
  hombre_anillo_13: 'Frente 16 mm',
};

// Charm con el que sale cada cadena en su tarjeta (si no está, la primera
// foto con charm de FOTOS_CHARM_HOMBRE).
const PORTADA_CHARM_HOMBRE = {
  hombre_collar_3: { oro: 'cruz_2', oro_blanco: 'cruz_1' },  // Mezcal, con cruz
  hombre_collar_6: { oro: 'cruz_3', oro_blanco: 'cruz_1' },  // Cacao, con cruz
  hombre_collar_4: { oro: 'circonita_ovalada', oro_blanco: 'circonita_ovalada' },  // Guajillo: circonita ovalada
  hombre_collar_8: { oro: 'simbolo_a', oro_blanco: 'cruz_1' },  // Obsidiana: triángulo / cruz plateada
};

// Piezas que ya llevan colgante: no se les ofrece charm.
const CON_COLGANTE_HOMBRE = ['hombre_colgante_1', 'hombre_colgante_2', 'hombre_colgante_3'];
// Cadenas que tampoco llevan charm (Pulque, Holbox y Copal).
const SIN_CHARM_HOMBRE = ['hombre_collar_2', 'hombre_collar_1', 'hombre_collar_7'];

// Foto propia para el círculo de color (un trozo de la pieza de cerca).
// Si una pieza no tiene, se hace zoom sobre su foto de producto.
const MINIATURAS_HOMBRE = {
  hombre_colgante_2: { oro: 'img/hombre/colgante-2-oro-mini.jpg', oro_blanco: 'img/hombre/colgante-2-oro-blanco-mini.png' },
  hombre_colgante_3: { oro: 'img/hombre/colgante-3-oro-mini.jpg', oro_blanco: 'img/hombre/colgante-3-oro-blanco-mini.png' },
};

// Orden en la web (Shop, portada y "más piezas"): collares (con charm:
// Mezcal, Guajillo, Cacao, Obsidiana), cadenas (sin charm: Holbox, Pulque,
// Copal) y colgantes (Alma Caribeña, Pacífico, Mazunte).
// Las piezas que no estén en la lista van detrás, en su orden.
const ORDEN_HOMBRE = [
  'hombre_collar_3', 'hombre_collar_4', 'hombre_collar_6', 'hombre_collar_8',
  'hombre_collar_1', 'hombre_collar_2', 'hombre_collar_7',
  'hombre_colgante_1', 'hombre_colgante_2', 'hombre_colgante_3',
];
COLECCION_HOMBRE.sort((a, b) => {
  const pos = (p) => { const i = ORDEN_HOMBRE.indexOf(p.id); return i < 0 ? ORDEN_HOMBRE.length : i; };
  return pos(a) - pos(b);
});

// Fotos macro reales (cadena y cierre) por pieza y material. Se usan en el
// visor de la lupa de las tarjetas y en la galería de la pieza. Si una pieza
// o material no está aquí, su tarjeta no muestra lupa. Para añadir una:
// copiar las fotos a img/hombre/ y poner aquí su ruta en el material.
const CERCA_HOMBRE = {
  hombre_pulsera_6: { oro_blanco: ['img/hombre/pulsera-6-oro-blanco-cerca-1.png'] },
  hombre_pulsera_7: { oro: ['img/hombre/pulsera-7-oro-cerca-1.png'] },
  hombre_pulsera_8: { oro: ['img/hombre/pulsera-8-oro-cerca-1.png'] },
  hombre_pulsera_9: { plata: ['img/hombre/pulsera-9-plata-cerca-1.png'] },
  hombre_pulsera_10: { plata: ['img/hombre/pulsera-10-plata-cerca-1.png'] },
  hombre_pulsera_11: { plata: ['img/hombre/pulsera-11-plata-cerca-1.png'] },
  hombre_pulsera_12: { plata: ['img/hombre/pulsera-12-plata-cerca-1.png'] },
  hombre_pulsera_13: { plata: ['img/hombre/pulsera-13-plata-cerca-1.png'] },
  hombre_pulsera_14: { plata: ['img/hombre/pulsera-14-plata-cerca-1.png'] },
  hombre_pulsera_15: { plata: ['img/hombre/pulsera-15-plata-cerca-1.png'] },
  hombre_pulsera_16: { negro: ['img/hombre/pulsera-16-negro-cerca-1.png'] },
  hombre_pulsera_17: { negro: ['img/hombre/pulsera-17-negro-cerca-1.png'] },
  hombre_pulsera_18: { negro: ['img/hombre/pulsera-18-negro-cerca-1.png'] },
  hombre_pulsera_19: { negro: ['img/hombre/pulsera-19-negro-cerca-1.png'] },
  hombre_colgante_2: { oro: ['img/hombre/colgante-2-oro-cerca-1.webp', 'img/hombre/colgante-2-oro-cerca-2.png'], oro_blanco: ['img/hombre/colgante-2-oro-blanco-cerca-1.png', 'img/hombre/colgante-2-oro-blanco-cerca-2.png'] },
  hombre_colgante_3: { oro: ['img/hombre/colgante-3-oro-cerca-1.webp', 'img/hombre/colgante-3-oro-cerca-2.png'], oro_blanco: ['img/hombre/colgante-3-oro-blanco-cerca-1.png', 'img/hombre/colgante-3-oro-blanco-cerca-2.png'] },
  hombre_colgante_1: { oro: ['img/hombre/colgante-1-oro-cerca-1.webp', 'img/hombre/colgante-1-oro-cerca-2.png'], oro_blanco: ['img/hombre/colgante-1-oro-blanco-cerca-1.png', 'img/hombre/colgante-1-oro-blanco-cerca-2.png'] },
  hombre_pulsera_4: { oro: ['img/hombre/pulsera-4-oro-cerca-1.png', 'img/hombre/pulsera-4-oro-cerca-2.png'], oro_blanco: ['img/hombre/pulsera-4-oro-blanco-cerca-1.jpg', 'img/hombre/pulsera-4-oro-blanco-cerca-2.jpg'] },
  hombre_pulsera_5: { oro: ['img/hombre/pulsera-5-oro-cerca-1.png', 'img/hombre/pulsera-5-oro-cerca-2.png'], oro_blanco: ['img/hombre/pulsera-5-oro-blanco-cerca-1.png', 'img/hombre/pulsera-5-oro-blanco-cerca-2.png'] },
  hombre_pulsera_2: { oro: ['img/hombre/pulsera-2-oro-cerca-1.png', 'img/hombre/pulsera-2-oro-cerca-2.png'], oro_blanco: ['img/hombre/pulsera-2-oro-blanco-cerca-1.png', 'img/hombre/pulsera-2-oro-blanco-cerca-2.png'] },
  hombre_pulsera_1: { oro: ['img/hombre/pulsera-1-oro-cerca-1.png', 'img/hombre/pulsera-1-oro-cerca-2.png'], oro_blanco: ['img/hombre/pulsera-1-oro-blanco-cerca-1.png', 'img/hombre/pulsera-1-oro-blanco-cerca-2.png'] },
  hombre_pulsera_3: { oro: ['img/hombre/pulsera-3-oro-cerca-1.jpg', 'img/hombre/pulsera-3-oro-cerca-2.png'], oro_blanco: ['img/hombre/pulsera-3-oro-blanco-cerca-1.png', 'img/hombre/pulsera-3-oro-blanco-cerca-2.png'] },
  hombre_collar_6: { oro: ['img/hombre/collar-6-oro-cerca-1.jpg', 'img/hombre/collar-6-oro-cerca-2.png'], oro_blanco: ['img/hombre/collar-6-oro-blanco-cerca-1.png', 'img/hombre/collar-6-oro-blanco-cerca-2.png'] },
  hombre_collar_2: { oro: ['img/hombre/collar-2-oro-cerca-1.jpg', 'img/hombre/collar-2-oro-cerca-2.png'], oro_blanco: ['img/hombre/collar-2-oro-blanco-cerca-1.png', 'img/hombre/collar-2-oro-blanco-cerca-2.png'] },
  hombre_collar_8: { oro: ['img/hombre/collar-8-oro-cerca-1.jpg', 'img/hombre/collar-8-oro-cerca-2.png'], oro_blanco: ['img/hombre/collar-8-oro-blanco-cerca-1.png', 'img/hombre/collar-8-oro-blanco-cerca-2.png'] },
  hombre_collar_4: { oro: ['img/hombre/collar-4-oro-cerca-1.png', 'img/hombre/collar-4-oro-cerca-2.png'], oro_blanco: ['img/hombre/collar-4-oro-blanco-cerca-1.png', 'img/hombre/collar-4-oro-blanco-cerca-2.png'] },
  hombre_collar_3: { oro: ['img/hombre/collar-3-oro-cerca-1.png', 'img/hombre/collar-3-oro-cerca-2.png'], oro_blanco: ['img/hombre/collar-3-oro-blanco-cerca-1.jpg', 'img/hombre/collar-3-oro-blanco-cerca-2.png'] },
};
