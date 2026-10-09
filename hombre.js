/* =========================================================
   COLECCIÓN MEN (rediseño 10/2026)
   Solo para mostrar en el Shop (pestaña MEN). Todavía sin ficha ni
   compra: faltan nombre, precios y SKU de cada pieza.
   tipo: colgantes | pulseras (pulseras y brazaletes) | anillos.
   acabados: en el orden en que salen los circulitos. Cada acabado lleva
   [foto de producto (portada), foto puesto, otra foto puesta]. El packaging se añade
   siempre como última foto.
   ========================================================= */
const TIPOS_HOMBRE = [
  { clave: 'colgantes', nombre: 'Colgantes' },
  { clave: 'pulseras',  nombre: 'Pulseras / Brazaletes' },
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
  { id: 'hombre_collar_5', tipo: 'colgantes', nombre: 'Alma Caribeña', acabados: {
      oro:        ['img/hombre/collar-5-oro-producto.jpg', 'img/hombre/collar-5-oro-puesto.png', 'img/hombre/collar-5-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/collar-5-oro-blanco-producto.png', 'img/hombre/collar-5-oro-blanco-puesto.jpg', 'img/hombre/collar-5-oro-blanco-puesto-2.png'],
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
  { id: 'hombre_pulsera_1', tipo: 'pulseras', nombre: 'Maya', acabados: {
      oro:        ['img/hombre/pulsera-1-oro-producto.jpg', 'img/hombre/pulsera-1-oro-puesto.jpg', 'img/hombre/pulsera-1-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/pulsera-1-oro-blanco-producto.png', 'img/hombre/pulsera-1-oro-blanco-puesto.png', 'img/hombre/pulsera-1-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_2', tipo: 'pulseras', nombre: 'Coyote', acabados: {
      oro:        ['img/hombre/pulsera-2-oro-producto.jpg', 'img/hombre/pulsera-2-oro-puesto.jpg', 'img/hombre/pulsera-2-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/pulsera-2-oro-blanco-producto.png', 'img/hombre/pulsera-2-oro-blanco-puesto.png', 'img/hombre/pulsera-2-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_pulsera_3', tipo: 'pulseras', nombre: 'Sisal', acabados: {
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
  { id: 'hombre_brazalete_1', tipo: 'pulseras', nombre: 'Jaguar', acabados: {
      oro:        ['img/hombre/brazalete-1-oro-producto.jpg', 'img/hombre/brazalete-1-oro-puesto.png', 'img/hombre/brazalete-1-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/brazalete-1-oro-blanco-producto.png', 'img/hombre/brazalete-1-oro-blanco-puesto.png', 'img/hombre/brazalete-1-oro-blanco-puesto-2.png'],
  } },
  { id: 'hombre_brazalete_2', tipo: 'pulseras', nombre: 'Agave', acabados: {
      oro:        ['img/hombre/brazalete-2-oro-producto.jpg', 'img/hombre/brazalete-2-oro-puesto.png', 'img/hombre/brazalete-2-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/brazalete-2-oro-blanco-producto.png', 'img/hombre/brazalete-2-oro-blanco-puesto.png', 'img/hombre/brazalete-2-oro-blanco-puesto-2.png'],
      negro:      ['img/hombre/brazalete-2-negro-producto.png', 'img/hombre/brazalete-2-negro-puesto.png', 'img/hombre/brazalete-2-negro-puesto-2.png'],
  } },
  { id: 'hombre_brazalete_3', tipo: 'pulseras', nombre: 'Bacalar', acabados: {
      oro:        ['img/hombre/brazalete-3-oro-producto.jpg', 'img/hombre/brazalete-3-oro-puesto.png', 'img/hombre/brazalete-3-oro-puesto-2.png'],
      oro_blanco: ['img/hombre/brazalete-3-oro-blanco-producto.png', 'img/hombre/brazalete-3-oro-blanco-puesto.jpg', 'img/hombre/brazalete-3-oro-blanco-puesto-2.png'],
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
];
const NOMBRE_ACABADO_HOMBRE = { oro: 'Oro', oro_blanco: 'Oro blanco', negro: 'Negro' };
