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
      oro_blanco: ['img/hombre/colgante-1-oro-blanco-producto.png', 'img/hombre/colgante-1-oro-blanco-puesto.jpg', 'img/hombre/colgante-1-oro-blanco-puesto-2.png'],
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
  { id: 'hombre_brazalete_4', tipo: 'pulseras', nombre: 'Ajolote', acabados: {
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
];
const NOMBRE_ACABADO_HOMBRE = { oro: 'Oro', oro_blanco: 'Oro blanco', negro: 'Negro' };

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
];
// Piezas que ya llevan colgante: no se les ofrece charm.
const CON_COLGANTE_HOMBRE = ['hombre_colgante_1', 'hombre_colgante_2', 'hombre_colgante_3'];

// Foto propia para el círculo de color (un trozo de la pieza de cerca).
// Si una pieza no tiene, se hace zoom sobre su foto de producto.
const MINIATURAS_HOMBRE = {
  hombre_colgante_2: { oro: 'img/hombre/colgante-2-oro-mini.jpg', oro_blanco: 'img/hombre/colgante-2-oro-blanco-mini.png' },
  hombre_colgante_3: { oro: 'img/hombre/colgante-3-oro-mini.jpg', oro_blanco: 'img/hombre/colgante-3-oro-blanco-mini.png' },
};

// Orden en la web (Shop, portada y "más piezas"): primero las cadenas,
// después Holbox y Copal (las de negro) y al final los colgantes de barra.
// Las piezas que no estén en la lista van detrás, en su orden.
const ORDEN_HOMBRE = [
  'hombre_collar_2', 'hombre_collar_3', 'hombre_collar_4', 'hombre_collar_6', 'hombre_collar_8',
  'hombre_collar_1', 'hombre_collar_7',
  'hombre_colgante_1', 'hombre_colgante_2', 'hombre_colgante_3',
];
COLECCION_HOMBRE.sort((a, b) => {
  const pos = (p) => { const i = ORDEN_HOMBRE.indexOf(p.id); return i < 0 ? ORDEN_HOMBRE.length : i; };
  return pos(a) - pos(b);
});

// Fotos de cerca (cadena y cierre) para la galería de la pieza, detrás de
// las fotos puestas y antes de la caja. Del catálogo eManco.
const CERCA_HOMBRE = {
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
