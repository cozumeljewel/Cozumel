/* =========================================================
   COLECCIÓN MEN (rediseño 10/2026)
   Solo para mostrar en el Shop (pestaña MEN). Todavía sin ficha ni
   compra: faltan nombre, precios y SKU de cada collar.
   acabados: en el orden en que salen los circulitos. Cada acabado lleva
   [foto de producto (portada), foto puesto (al pasar el cursor)].
   ========================================================= */
const COLECCION_HOMBRE = [
  { id: 'hombre_collar_1', nombre: 'Collar 01', acabados: {
      oro:        ['img/hombre/collar-1-oro-producto.png', 'img/hombre/collar-1-oro-puesto.png'],
      oro_blanco: ['img/hombre/collar-1-oro-blanco-producto.png', 'img/hombre/collar-1-oro-blanco-puesto.png'],
      negro:      ['img/hombre/collar-1-negro-producto.jpg', 'img/hombre/collar-1-negro-puesto.png'],
  } },
  { id: 'hombre_collar_2', nombre: 'Collar 02', acabados: {
      oro:        ['img/hombre/collar-2-oro-producto.jpg', 'img/hombre/collar-2-oro-puesto.png'],
      oro_blanco: ['img/hombre/collar-2-oro-blanco-producto.png', 'img/hombre/collar-2-oro-blanco-puesto.png'],
  } },
  { id: 'hombre_collar_3', nombre: 'Collar 03', acabados: {
      oro:        ['img/hombre/collar-3-oro-producto.jpg', 'img/hombre/collar-3-oro-puesto.png'],
      oro_blanco: ['img/hombre/collar-3-oro-blanco-producto.png', 'img/hombre/collar-3-oro-blanco-puesto.jpg'],
  } },
  { id: 'hombre_collar_4', nombre: 'Collar 04', acabados: {
      oro:        ['img/hombre/collar-4-oro-producto.jpg', 'img/hombre/collar-4-oro-puesto.jpg'],
      oro_blanco: ['img/hombre/collar-4-oro-blanco-producto.png', 'img/hombre/collar-4-oro-blanco-puesto.png'],
  } },
  { id: 'hombre_collar_5', nombre: 'Collar 05', acabados: {
      oro:        ['img/hombre/collar-5-oro-producto.jpg', 'img/hombre/collar-5-oro-puesto.png'],
      oro_blanco: ['img/hombre/collar-5-oro-blanco-producto.png', 'img/hombre/collar-5-oro-blanco-puesto.jpg'],
  } },
];
const NOMBRE_ACABADO_HOMBRE = { oro: 'Oro', oro_blanco: 'Oro blanco', negro: 'Negro' };
