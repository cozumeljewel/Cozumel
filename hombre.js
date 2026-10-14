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
  // Números, letras y circonitas (Emanco Charms Catalog). De momento solo
  // con foto en oro: en las cadenas de plata no salen hasta tener su foto.
  { id: 'numero_0', codigo: '0', nombre: 'Número 0', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-0-dorado.png' },
    colores: { dorado: 'YP33055D0W0', plateado: 'YP33055A0W0' } },
  { id: 'numero_1', codigo: '1', nombre: 'Número 1', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-1-dorado.png' },
    colores: { dorado: 'YP33056D0W0', plateado: 'YP33056A0W0' } },
  { id: 'numero_2', codigo: '2', nombre: 'Número 2', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-2-dorado.png' },
    colores: { dorado: 'YP33057D0W0', plateado: 'YP33057A0W0' } },
  { id: 'numero_3', codigo: '3', nombre: 'Número 3', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-3-dorado.png' },
    colores: { dorado: 'YP33058D0W0', plateado: 'YP33058A0W0' } },
  { id: 'numero_4', codigo: '4', nombre: 'Número 4', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-4-dorado.png' },
    colores: { dorado: 'YP33059D0W0', plateado: 'YP33059A0W0' } },
  { id: 'numero_5', codigo: '5', nombre: 'Número 5', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-5-dorado.png' },
    colores: { dorado: 'YP33060D0W0', plateado: 'YP33060A0W0' } },
  { id: 'numero_6', codigo: '6', nombre: 'Número 6', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-6-dorado.png' },
    colores: { dorado: 'YP33061D0W0', plateado: 'YP33061A0W0' } },
  { id: 'numero_7', codigo: '7', nombre: 'Número 7', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-7-dorado.png' },
    colores: { dorado: 'YP33062D0W0', plateado: 'YP33062A0W0' } },
  { id: 'numero_8', codigo: '8', nombre: 'Número 8', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-8-dorado.png' },
    colores: { dorado: 'YP33063D0W0', plateado: 'YP33063A0W0' } },
  { id: 'numero_9', codigo: '9', nombre: 'Número 9', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-9-dorado.png' },
    colores: { dorado: 'YP33064D0W0', plateado: 'YP33064A0W0' } },
  { id: 'numero_10', codigo: '10', nombre: 'Número 10', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-10-dorado.png' },
    colores: { dorado: 'YP33065D0W0', plateado: 'YP33065A0W0' } },
  { id: 'numero_12', codigo: '12', nombre: 'Número 12', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-12-dorado.png' },
    colores: { dorado: 'YP33068D0W0', plateado: 'YP33068A0W0' } },
  { id: 'numero_13', codigo: '13', nombre: 'Número 13', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-13-dorado.png' },
    colores: { dorado: 'YP33066D0W0', plateado: 'YP33066A0W0' } },
  { id: 'numero_17', codigo: '17', nombre: 'Número 17', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-17-dorado.png' },
    colores: { dorado: 'YP33069D0W0', plateado: 'YP33069A0W0' } },
  { id: 'numero_21', codigo: '21', nombre: 'Número 21', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-21-dorado.png' },
    colores: { dorado: 'YP33067D0W0', plateado: 'YP33067A0W0' } },
  { id: 'numero_23', codigo: '23', nombre: 'Número 23', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-23-dorado.png' },
    colores: { dorado: 'YP33071D0W0', plateado: 'YP33071A0W0' } },
  { id: 'numero_24', codigo: '24', nombre: 'Número 24', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-24-dorado.png' },
    colores: { dorado: 'YP33072D0W0', plateado: 'YP33072A0W0' } },
  { id: 'numero_33', codigo: '33', nombre: 'Número 33', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-33-dorado.png' },
    colores: { dorado: 'YP33073D0W0', plateado: 'YP33073A0W0' } },
  { id: 'numero_34', codigo: '34', nombre: 'Número 34', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-34-dorado.png' },
    colores: { dorado: 'YP33074D0W0', plateado: 'YP33074A0W0' } },
  { id: 'numero_77', codigo: '77', nombre: 'Número 77', grupo: 'Números', fotos: { dorado: 'img/hombre/charms/numero-77-dorado.png' },
    colores: { dorado: 'YP33070D0W0', plateado: 'YP33070A0W0' } },
  { id: 'letra_a', codigo: 'a', nombre: 'Letra a', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-a-dorado.jpg' },
    colores: { dorado: 'XP49461A-2', plateado: 'XP49461A-1' } },
  { id: 'letra_b', codigo: 'b', nombre: 'Letra b', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-b-dorado.jpg' },
    colores: { dorado: 'XP49461B-2', plateado: 'XP49461B-1' } },
  { id: 'letra_c', codigo: 'c', nombre: 'Letra c', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-c-dorado.jpg' },
    colores: { dorado: 'XP49461C-2', plateado: 'XP49461C-1' } },
  { id: 'letra_d', codigo: 'd', nombre: 'Letra d', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-d-dorado.jpg' },
    colores: { dorado: 'XP49461D-2', plateado: 'XP49461D-1' } },
  { id: 'letra_e', codigo: 'e', nombre: 'Letra e', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-e-dorado.jpg' },
    colores: { dorado: 'XP49461E-2', plateado: 'XP49461E-1' } },
  { id: 'letra_f', codigo: 'f', nombre: 'Letra f', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-f-dorado.jpg' },
    colores: { dorado: 'XP49461F-2', plateado: 'XP49461F-1' } },
  { id: 'letra_g', codigo: 'g', nombre: 'Letra g', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-g-dorado.jpg' },
    colores: { dorado: 'XP49461G-2', plateado: 'XP49461G-1' } },
  { id: 'letra_h', codigo: 'h', nombre: 'Letra h', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-h-dorado.jpg' },
    colores: { dorado: 'XP49461H-2', plateado: 'XP49461H-1' } },
  { id: 'letra_i', codigo: 'i', nombre: 'Letra i', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-i-dorado.jpg' },
    colores: { dorado: 'XP49461I-2', plateado: 'XP49461I-1' } },
  { id: 'letra_j', codigo: 'j', nombre: 'Letra j', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-j-dorado.jpg' },
    colores: { dorado: 'XP49461J-2', plateado: 'XP49461J-1' } },
  { id: 'letra_k', codigo: 'k', nombre: 'Letra k', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-k-dorado.jpg' },
    colores: { dorado: 'XP49461K-2', plateado: 'XP49461K-1' } },
  { id: 'letra_l', codigo: 'l', nombre: 'Letra l', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-l-dorado.jpg' },
    colores: { dorado: 'XP49461L-2', plateado: 'XP49461L-1' } },
  { id: 'letra_m', codigo: 'm', nombre: 'Letra m', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-m-dorado.jpg' },
    colores: { dorado: 'XP49461M-2', plateado: 'XP49461M-1' } },
  { id: 'letra_n', codigo: 'n', nombre: 'Letra n', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-n-dorado.jpg' },
    colores: { dorado: 'XP49461N-2', plateado: 'XP49461N-1' } },
  { id: 'letra_o', codigo: 'o', nombre: 'Letra o', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-o-dorado.jpg' },
    colores: { dorado: 'XP49461O-2', plateado: 'XP49461O-1' } },
  { id: 'letra_p', codigo: 'p', nombre: 'Letra p', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-p-dorado.jpg' },
    colores: { dorado: 'XP49461P-2', plateado: 'XP49461P-1' } },
  { id: 'letra_q', codigo: 'q', nombre: 'Letra q', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-q-dorado.jpg' },
    colores: { dorado: 'XP49461Q-2', plateado: 'XP49461Q-1' } },
  { id: 'letra_r', codigo: 'r', nombre: 'Letra r', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-r-dorado.jpg' },
    colores: { dorado: 'XP49461R-2', plateado: 'XP49461R-1' } },
  { id: 'letra_s', codigo: 's', nombre: 'Letra s', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-s-dorado.jpg' },
    colores: { dorado: 'XP49461S-2', plateado: 'XP49461S-1' } },
  { id: 'letra_t', codigo: 't', nombre: 'Letra t', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-t-dorado.jpg' },
    colores: { dorado: 'XP49461T-2', plateado: 'XP49461T-1' } },
  { id: 'letra_u', codigo: 'u', nombre: 'Letra u', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-u-dorado.jpg' },
    colores: { dorado: 'XP49461U-2', plateado: 'XP49461U-1' } },
  { id: 'letra_v', codigo: 'v', nombre: 'Letra v', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-v-dorado.jpg' },
    colores: { dorado: 'XP49461V-2', plateado: 'XP49461V-1' } },
  { id: 'letra_w', codigo: 'w', nombre: 'Letra w', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-w-dorado.jpg' },
    colores: { dorado: 'XP49461W-2', plateado: 'XP49461W-1' } },
  { id: 'letra_x', codigo: 'x', nombre: 'Letra x', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-x-dorado.jpg' },
    colores: { dorado: 'XP49461X-2', plateado: 'XP49461X-1' } },
  { id: 'letra_y', codigo: 'y', nombre: 'Letra y', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-y-dorado.jpg' },
    colores: { dorado: 'XP49461Y-2', plateado: 'XP49461Y-1' } },
  { id: 'letra_z', codigo: 'z', nombre: 'Letra z', grupo: 'Letras', fotos: { dorado: 'img/hombre/charms/letra-z-dorado.jpg' },
    colores: { dorado: 'XP49461Z-2', plateado: 'XP49461Z-1' } },
  { id: 'gotica_a', codigo: 'A', nombre: 'Letra gótica A', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-a-dorado.jpg' },
    colores: { dorado: 'XP49548A-2', plateado: 'XP49548A-1' } },
  { id: 'gotica_b', codigo: 'B', nombre: 'Letra gótica B', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-b-dorado.jpg' },
    colores: { dorado: 'XP49548B-2', plateado: 'XP49548B-1' } },
  { id: 'gotica_c', codigo: 'C', nombre: 'Letra gótica C', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-c-dorado.jpg' },
    colores: { dorado: 'XP49548C-2', plateado: 'XP49548C-1' } },
  { id: 'gotica_d', codigo: 'D', nombre: 'Letra gótica D', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-d-dorado.jpg' },
    colores: { dorado: 'XP49548D-2', plateado: 'XP49548D-1' } },
  { id: 'gotica_e', codigo: 'E', nombre: 'Letra gótica E', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-e-dorado.jpg' },
    colores: { dorado: 'XP49548E-2', plateado: 'XP49548E-1' } },
  { id: 'gotica_f', codigo: 'F', nombre: 'Letra gótica F', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-f-dorado.jpg' },
    colores: { dorado: 'XP49548F-2', plateado: 'XP49548F-1' } },
  { id: 'gotica_g', codigo: 'G', nombre: 'Letra gótica G', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-g-dorado.jpg' },
    colores: { dorado: 'XP49548G-2', plateado: 'XP49548G-1' } },
  { id: 'gotica_h', codigo: 'H', nombre: 'Letra gótica H', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-h-dorado.jpg' },
    colores: { dorado: 'XP49548H-2', plateado: 'XP49548H-1' } },
  { id: 'gotica_i', codigo: 'I', nombre: 'Letra gótica I', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-i-dorado.jpg' },
    colores: { dorado: 'XP49548I-2', plateado: 'XP49548I-1' } },
  { id: 'gotica_j', codigo: 'J', nombre: 'Letra gótica J', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-j-dorado.jpg' },
    colores: { dorado: 'XP49548J-2', plateado: 'XP49548J-1' } },
  { id: 'gotica_k', codigo: 'K', nombre: 'Letra gótica K', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-k-dorado.jpg' },
    colores: { dorado: 'XP49548K-2', plateado: 'XP49548K-1' } },
  { id: 'gotica_l', codigo: 'L', nombre: 'Letra gótica L', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-l-dorado.jpg' },
    colores: { dorado: 'XP49548L-2', plateado: 'XP49548L-1' } },
  { id: 'gotica_m', codigo: 'M', nombre: 'Letra gótica M', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-m-dorado.jpg' },
    colores: { dorado: 'XP49548M-2', plateado: 'XP49548M-1' } },
  { id: 'gotica_n', codigo: 'N', nombre: 'Letra gótica N', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-n-dorado.jpg' },
    colores: { dorado: 'XP49548N-2', plateado: 'XP49548N-1' } },
  { id: 'gotica_o', codigo: 'O', nombre: 'Letra gótica O', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-o-dorado.png' },
    colores: { dorado: 'XP49548O-2', plateado: 'XP49548O-1' } },
  { id: 'gotica_p', codigo: 'P', nombre: 'Letra gótica P', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-p-dorado.jpg' },
    colores: { dorado: 'XP49548P-2', plateado: 'XP49548P-1' } },
  { id: 'gotica_q', codigo: 'Q', nombre: 'Letra gótica Q', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-q-dorado.jpg' },
    colores: { dorado: 'XP49548Q-2', plateado: 'XP49548Q-1' } },
  { id: 'gotica_r', codigo: 'R', nombre: 'Letra gótica R', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-r-dorado.jpg' },
    colores: { dorado: 'XP49548R-2', plateado: 'XP49548R-1' } },
  { id: 'gotica_s', codigo: 'S', nombre: 'Letra gótica S', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-s-dorado.jpg' },
    colores: { dorado: 'XP49548S-2', plateado: 'XP49548S-1' } },
  { id: 'gotica_t', codigo: 'T', nombre: 'Letra gótica T', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-t-dorado.jpg' },
    colores: { dorado: 'XP49548T-2', plateado: 'XP49548T-1' } },
  { id: 'gotica_u', codigo: 'U', nombre: 'Letra gótica U', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-u-dorado.jpg' },
    colores: { dorado: 'XP49548U-2', plateado: 'XP49548U-1' } },
  { id: 'gotica_v', codigo: 'V', nombre: 'Letra gótica V', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-v-dorado.jpg' },
    colores: { dorado: 'XP49548V-2', plateado: 'XP49548V-1' } },
  { id: 'gotica_w', codigo: 'W', nombre: 'Letra gótica W', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-w-dorado.jpg' },
    colores: { dorado: 'XP49548W-2', plateado: 'XP49548W-1' } },
  { id: 'gotica_x', codigo: 'X', nombre: 'Letra gótica X', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-x-dorado.jpg' },
    colores: { dorado: 'XP49548X-2', plateado: 'XP49548X-1' } },
  { id: 'gotica_y', codigo: 'Y', nombre: 'Letra gótica Y', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-y-dorado.jpg' },
    colores: { dorado: 'XP49548Y-2', plateado: 'XP49548Y-1' } },
  { id: 'gotica_z', codigo: 'Z', nombre: 'Letra gótica Z', grupo: 'Letras góticas', fotos: { dorado: 'img/hombre/charms/gotica-z-dorado.png' },
    colores: { dorado: 'XP49548Z-2', plateado: 'XP49548Z-1' } },
  { id: 'circonita_gota', codigo: '', nombre: 'Circonita gota', grupo: 'Circonitas', fotos: { dorado: 'img/hombre/charms/circonita-gota-dorado.jpg' },
    colores: { dorado: 'XP49970D0W0', plateado: 'XP49970A0W0' } },
  { id: 'circonita_rectangular', codigo: '', nombre: 'Circonita rectangular', grupo: 'Circonitas', fotos: { dorado: 'img/hombre/charms/circonita-rectangular-dorado.jpg' },
    colores: { dorado: 'XP49971D0W0', plateado: 'XP49971A0W0' } },
  { id: 'circonita_cuadrada', codigo: '', nombre: 'Circonita cuadrada', grupo: 'Circonitas', fotos: { dorado: 'img/hombre/charms/circonita-cuadrada-dorado.jpg' },
    colores: { dorado: 'XP49972D0W0', plateado: 'XP49972A0W0' } },
  { id: 'circonita_marquesa', codigo: '', nombre: 'Circonita marquesa', grupo: 'Circonitas', fotos: { dorado: 'img/hombre/charms/circonita-marquesa-dorado.jpg' },
    colores: { dorado: 'XP49973D0W0', plateado: 'XP49973A0W0' } },
  { id: 'circonita_ovalada', codigo: '', nombre: 'Circonita ovalada', grupo: 'Circonitas', fotos: { dorado: 'img/hombre/charms/circonita-ovalada-dorado.jpg' },
    colores: { dorado: 'XP49974D0W0', plateado: 'XP49974A0W0' } },
  { id: 'circonita_redonda', codigo: '', nombre: 'Circonita redonda', grupo: 'Circonitas', fotos: { dorado: 'img/hombre/charms/circonita-redonda-dorado.jpg' },
    colores: { dorado: 'XP49975D0W0', plateado: 'XP49975A0W0' } },
];
// Grupos de charms que salen plegados (se abren al tocar el título).
const GRUPOS_CHARM_PLEGADOS = ['Números', 'Letras', 'Letras góticas', 'Circonitas'];
// FOTOS_CHARM (generado por scripts/charms-hombre.py)
// Cadena con el charm puesto, por acabado y en orden de variación.
const FOTOS_CHARM_HOMBRE = {
  hombre_collar_1: {
    oro: [{ charm: 'simbolo_a', foto: 'img/hombre/collar-1-oro-charm-simbolo-a.png' }, { charm: 'cruz_1', foto: 'img/hombre/collar-1-oro-charm-cruz-1.png' }],
    oro_blanco: [{ charm: 'charm_1', foto: 'img/hombre/collar-1-oro-blanco-charm-charm-1.png' }, { charm: 'cruz_1', foto: 'img/hombre/collar-1-oro-blanco-charm-cruz-1.png' }]
  },
  hombre_collar_2: {
    oro_blanco: [{ charm: 'charm_2', foto: 'img/hombre/collar-2-oro-blanco-charm-charm-2.png' }, { charm: 'charm_3', foto: 'img/hombre/collar-2-oro-blanco-charm-charm-3.png' }],
    oro: [{ charm: 'simbolo_b', foto: 'img/hombre/collar-2-oro-charm-simbolo-b.png' }, { charm: 'charm_2', foto: 'img/hombre/collar-2-oro-charm-charm-2.png' }]
  },
  hombre_collar_3: {
    oro_blanco: [{ charm: 'cruz_1', foto: 'img/hombre/collar-3-oro-blanco-charm-cruz-1.png' }, { charm: 'charm_1', foto: 'img/hombre/collar-3-oro-blanco-charm-charm-1.png' }],
    oro: [{ charm: 'simbolo_c', foto: 'img/hombre/collar-3-oro-charm-simbolo-c.png' }, { charm: 'cruz_2', foto: 'img/hombre/collar-3-oro-charm-cruz-2.png' }]
  },
  hombre_collar_4: {
    oro_blanco: [{ charm: 'charm_3', foto: 'img/hombre/collar-4-oro-blanco-charm-charm-3.png' }, { charm: 'charm_2', foto: 'img/hombre/collar-4-oro-blanco-charm-charm-2.png' }],
    oro: [{ charm: 'simbolo_d', foto: 'img/hombre/collar-4-oro-charm-simbolo-d.png' }, { charm: 'charm_3', foto: 'img/hombre/collar-4-oro-charm-charm-3.png' }]
  },
  hombre_collar_6: {
    oro_blanco: [{ charm: 'charm_1', foto: 'img/hombre/collar-6-oro-blanco-charm-charm-1.png' }, { charm: 'charm_3', foto: 'img/hombre/collar-6-oro-blanco-charm-charm-3.png' }],
    oro: [{ charm: 'simbolo_e', foto: 'img/hombre/collar-6-oro-charm-simbolo-e.png' }, { charm: 'cruz_3', foto: 'img/hombre/collar-6-oro-charm-cruz-3.png' }]
  },
  hombre_collar_7: {
    oro_blanco: [{ charm: 'charm_2', foto: 'img/hombre/collar-7-oro-blanco-charm-charm-2.png' }, { charm: 'cruz_1', foto: 'img/hombre/collar-7-oro-blanco-charm-cruz-1.png' }],
    oro: [{ charm: 'simbolo_f', foto: 'img/hombre/collar-7-oro-charm-simbolo-f.png' }, { charm: 'charm_1', foto: 'img/hombre/collar-7-oro-charm-charm-1.png' }]
  },
  hombre_collar_8: {
    oro_blanco: [{ charm: 'charm_3', foto: 'img/hombre/collar-8-oro-blanco-charm-charm-3.png' }, { charm: 'charm_1', foto: 'img/hombre/collar-8-oro-blanco-charm-charm-1.png' }],
    oro: [{ charm: 'cruz_5', foto: 'img/hombre/collar-8-oro-charm-cruz-5.png' }, { charm: 'simbolo_a', foto: 'img/hombre/collar-8-oro-charm-simbolo-a.png' }]
  },
};
// FIN_FOTOS_CHARM

// Color con el que sale la pieza en el Shop, la portada y "más piezas"
// si no es el que tocaría por turno.
const ACABADO_INICIAL_HOMBRE = { hombre_collar_7: 'oro_blanco' };

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
