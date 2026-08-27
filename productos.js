/* =========================================================
   COZUMEL · catálogo — edición de lanzamiento
   Este es el ÚNICO sitio donde se tocan los productos.
   Para cambiar nombres, textos, precios o campos de grabado,
   se edita aquí y se refleja en todas las páginas.

   IMPORTANTE: si cambias un "id", hay que actualizar también la
   política de seguridad en Supabase (ver supabase-migracion-v2.sql),
   o la base de datos rechazará las reservas de ese producto.

   precio: null  → muestra "pendiente de confirmar"
   precio: 39.9  → muestra "39,90 €"

   campos: []  → producto sin personalizar, no pide nada
   campos admitidos: 'nombre', 'fecha', 'mensaje', 'mes'

   Campos OPCIONALES de ficha (si no están, no se pinta nada):
     parrafos:       ['...', '...']   texto largo bajo el precio
     caracteristicas:['...', '...']   lista con viñetas
     cierre:         '...'            frase final destacada
     oferta:         '...'            reclamo destacado (ej. descuento de kit)
     fotos:          ['img/a.png', ...]  galería de la ficha, en orden.
                     La primera es la que se ve al entrar. Se pasan con
                     scroll lateral. Sin espacios ni acentos en los nombres.
     foto:           'img/archivo.png'  forma antigua, una sola foto. Sigue
                     funcionando, pero para piezas nuevas usar "fotos".
                     Si no hay ninguna de las dos, se muestra el degradado
                     con el aviso "imagen pendiente".

   forma admitida: 'cadena', 'circulos', 'placa', 'brazalete', 'flor'
   ========================================================= */

const PRODUCTOS = [
  {
    id: 'collar_esencial',
    slug: 'collar-esencial',
    nombre: 'Collar Esencia',
    resumen: 'Doble cadena con placa grabable',
    descripcion: 'Dos cadenas que caen juntas: una fina, casi invisible, y otra con una placa esperando lo que tengas que decirle. Su nombre. La fecha en que todo empezó. Esas tres palabras que nunca dices en voz alta',
    parrafos: [
      'Hay cosas que no salen bien dichas en voz alta, pero caben enteras en unas letras grabadas. Ella lo va a llevar puesto un martes cualquiera, sin ocasión, y lo va a tocar sin darse cuenta mientras piensa en otra cosa. Ahí es donde vive un buen regalo: en los días normales',
    ],
    caracteristicas: [
      'Acero inoxidable, no se oxida ni pierde color con el uso diario',
      'Doble cadena: fina + placa grabable',
      'Grabado a mano, personalizable con nombre, fecha o mensaje corto',
    ],
    cierre: 'Para que lleve puesto un pedacito de ti',
    precio: null,
    forma: 'placa',
    campos: ['nombre', 'fecha', 'mensaje'],
    destacado: false,
  },
  {
    id: 'pulsera_vinculo',
    slug: 'pulsera-vinculo',
    nombre: 'Pulsera Dos Almas',
    resumen: 'Dos círculos, uno para cada una',
    descripcion: 'Dos círculos enlazados que no se sueltan ni se confunden el uno con el otro. Es la pieza que eliges cuando lo que quieres decir no necesita explicarse, porque ya se nota',
    parrafos: [
      'No lleva grabado y no le hace falta. Un aro sujeta al otro sin apretarlo, que es más o menos lo que hacen dos personas cuando la cosa va bien. Ella lo va a entender en cuanto la vea, sin que tengas que decir nada',
    ],
    caracteristicas: [
      'Acero inoxidable, no se oxida ni pierde color con el uso diario',
      'Cadena fina, cierre ajustable',
      'Dos círculos entrelazados como símbolo de unión',
    ],
    cierre: 'Lo que no se dice, pero se lleva puesto',
    precio: null,
    forma: 'circulos',
    campos: [],
    destacado: false,
  },
  {
    id: 'pulsera_nombre',
    slug: 'pulsera-nombre',
    nombre: 'Pulsera Mi Cielo',
    resumen: 'Un cielo que solo tú conoces',
    descripcion: 'Una placa pequeña en la muñeca para guardar el sitio exacto donde pasó: unas coordenadas, la fecha de aquella noche, la frase que se les quedó de un viaje',
    parrafos: [
      'Lo bueno de grabar un lugar es que solo funciona para ustedes dos. Cualquiera que la vea leerá unos números sueltos; ella va a ver la playa, el bar, la calle a las cuatro de la mañana. Un código privado que se lleva puesto',
    ],
    caracteristicas: [
      'Acero inoxidable, no se oxida ni pierde color con el uso diario',
      'Cadena fina con placa, cierre ajustable',
      'Grabado a mano: frase, fecha o coordenadas',
    ],
    cierre: 'Un sitio que solo ustedes dos saben leer',
    precio: null,
    forma: 'placa',
    campos: ['grabado'],
    destacado: true,
  },
  {
    id: 'brazalete_mensaje',
    slug: 'brazalete-mensaje',
    nombre: 'Brazalete Eterno',
    resumen: 'Un lugar, una fecha, unas palabras',
    descripcion: 'Un brazalete rígido, ancho y limpio, del tipo que se pone una vez y ya no se quita. Grabado con lo que tú decidas: una fecha, un nombre, una frase corta que no necesite contexto',
    parrafos: [
      'Es la pieza más rotunda de la colección: se ve desde lejos y se nota al abrazar. Si buscas un regalo que no pase desapercibido, que le pregunten por él y ella tenga algo que contar, es este',
    ],
    caracteristicas: [
      'Acero inoxidable, no se oxida ni pierde color con el uso diario',
      'Cuff ajustable, diseño minimalista',
      'Grabado a mano: frase, fecha o coordenadas',
    ],
    cierre: 'Se ve desde lejos y se recuerda de cerca',
    precio: null,
    forma: 'brazalete',
    campos: ['grabado'],
    destacado: false,
  },
  {
    id: 'collar_flor_natal',
    slug: 'collar-flor-natal',
    nombre: 'Collar Destino',
    resumen: 'Su mes, su piedra',
    descripcion: 'Cada mes tiene su piedra y su flor. Eliges el de ella y el collar deja de ser un collar cualquiera: es el suyo, con el color exacto del mes en que nació',
    parrafos: [
      'Es el regalo fácil de acertar y difícil de olvidar: no hace falta saber su talla, ni su estilo, ni qué joyas tiene ya. Solo su cumpleaños. Y si te lo sabes, ya llevas media conversación ganada',
    ],
    caracteristicas: [
      'Acero inoxidable, no se oxida ni pierde color con el uso diario',
      'Cadena fina tipo eslabón, largo ajustable',
      'Piedra y flor según el mes de nacimiento',
    ],
    cierre: 'Su mes, su piedra, su collar',
    foto: 'img/collar-destino.png',
    precio: null,
    forma: 'flor',
    campos: ['mes'],
    destacado: false,
  },
  {
    id: 'kit_pedacito_nosotros',
    slug: 'kit-pedacito-nosotros',
    nombre: 'Kit El Pedacito de Nosotros',
    resumen: 'Collar Esencia + Pulsera Dos Almas',
    descripcion: 'El Collar Esencia y la Pulsera Dos Almas juntos, que es como mejor funcionan: uno guarda lo que le escribes, la otra dice lo que no hace falta escribir',
    parrafos: [
      'Es el regalo de las fechas que importan: un aniversario, un cumpleaños redondo, el día que decidiste dejar de improvisar. Llega en una sola caja y se abre una sola vez, así que conviene que sea el día bueno',
      'Ella se queda con las dos piezas, o te quedas tú con una. Eso ya lo deciden ustedes. Lo que no cambia es que las dos salen del mismo sitio y cuentan la misma historia',
    ],
    caracteristicas: [
      'Collar Esencia: doble cadena con placa grabable a mano',
      'Pulsera Dos Almas: dos círculos entrelazados, símbolo de unión',
      'Acero inoxidable, no se oxida ni pierde color con el uso diario',
    ],
    oferta: '10% de descuento al llevar el kit completo',
    cierre: 'Porque el amor también se lleva puesto',
    precio: null,
    forma: 'placa',
    campos: ['nombre', 'fecha', 'mensaje'],
    destacado: false,
  },
  {
    id: 'kit_mi_consentida',
    slug: 'kit-mi-consentida',
    nombre: 'Kit Mi Consentida',
    resumen: 'Collar Destino + Pulsera Mi Cielo',
    descripcion: 'Hay una mujer que te lo dio todo sin pedir nada a cambio, o una que llegó y te cambió el rumbo. No importa si es tu mamá, tu hermana, tu novia o esa amiga que ya es familia: hay alguien que merece llevar puesto un pedacito de lo que sientes, aunque nunca se lo hayas dicho en voz alta',
    parrafos: [
      'Collar Destino, con su piedra y su flor, elegidas por el mes en que llegó al mundo, porque ella también tiene su propio cielo. Pulsera Mi Cielo, grabada con lo que quieras decirle: una fecha, un lugar, una frase que solo ustedes dos entienden',
    ],
    caracteristicas: [
      'Collar Destino: piedra y flor según el mes de nacimiento',
      'Pulsera Mi Cielo: placa grabable con fecha, lugar o frase',
      'Acero inoxidable, no se oxida ni pierde color con el uso diario',
      'Envío en caja especial de regalo',
    ],
    cierre: 'Un pedacito de lo que regalamos',
    precio: null,
    forma: 'flor',
    campos: ['mes', 'grabado'],
    destacado: false,
  },
];

/* Los 12 meses y su tono, con los nombres de piedra de las cartitas.
   Van SIEMPRE con "Color" delante ("Color granate", no "Granate"): la
   pieza es de acero, y sin esa palabra parecería que lleva la piedra de
   verdad. Es la única forma en que se nombran de cara al cliente.

   Los tonos de enero, junio y julio se ajustaron el 2026-08-26 al cambiar
   los nombres: antes eran los de otra piedra y el punto de color habría
   contradicho a la etiqueta.

   ⚠️ Ninguno de los 12 tonos está confirmado con EMANCO. Si no pueden
   fabricar alguno, se recorta la lista a los que sí, nada más. */
const MESES_NATAL = [
  { valor: 'enero',      mes: 'Enero',      piedra: 'Color granate',    color: '#8C2633' },
  { valor: 'febrero',    mes: 'Febrero',    piedra: 'Color amatista',   color: '#7B68B5' },
  { valor: 'marzo',      mes: 'Marzo',      piedra: 'Color aguamarina', color: '#A9C6E8' },
  { valor: 'abril',      mes: 'Abril',      piedra: 'Color diamante',   color: '#F2F5F7' },
  { valor: 'mayo',       mes: 'Mayo',       piedra: 'Color esmeralda',  color: '#3FAE72' },
  { valor: 'junio',      mes: 'Junio',      piedra: 'Color perla',      color: '#F1E7DA' },
  { valor: 'julio',      mes: 'Julio',      piedra: 'Color rubí',       color: '#B01E38' },
  { valor: 'agosto',     mes: 'Agosto',     piedra: 'Color peridoto',   color: '#B5CC5A' },
  { valor: 'septiembre', mes: 'Septiembre', piedra: 'Color zafiro',     color: '#3F6FB5' },
  { valor: 'octubre',    mes: 'Octubre',    piedra: 'Color ópalo',      color: '#F2C6D6' },
  { valor: 'noviembre',  mes: 'Noviembre',  piedra: 'Color topacio',    color: '#E8D45A' },
  { valor: 'diciembre',  mes: 'Diciembre',  piedra: 'Color turquesa',   color: '#7FCFC7' },
];

/* Las cartitas del Collar Destino: una por mes, la que se mete en la caja
   de regalo. En la web se enseña la del mes elegido, para que quien compra
   vea lo que va a recibir la persona.
   Texto acortado a partir del PDF del cliente (cozumel-cartitas).

   El nombre de la piedra NO se repite aquí: sale de MESES_NATAL, para que
   la etiqueta del selector y la de la cartita no puedan separarse nunca. */
const CARTITAS = {
  enero: {
    flor: 'Clavel',
    texto: 'Naciste en el mes que empieza todo de nuevo, cuando el año todavía no sabe lo que va a ser y tú ya vas caminando con paso firme. El clavel florece aunque haga frío, aunque nadie lo esté mirando. El granate lleva tu color: profundo, callado, ardiendo por dentro',
  },
  febrero: {
    flor: 'Violeta',
    texto: 'Naciste entre el frío que se va y la primavera que todavía no llega, con la cabeza un poco en las nubes y el corazón puesto en quien lo merece. La violeta crece escondida, casi tímida, pero su color no se olvida jamás. La amatista es igual de discreta e igual de imposible de ignorar',
  },
  marzo: {
    flor: 'Narciso',
    texto: 'Naciste cuando el invierno todavía dudaba si irse, y tú llegaste sin miedo, de las primeras en atreverte. El narciso se atreve a florecer antes que las demás flores. El aguamarina tiene el color exacto de lo que ves cuando cierras los ojos y piensas en el mar',
  },
  abril: {
    flor: 'Margarita',
    texto: 'Naciste con las ganas de empezar de nuevo cada vez que hace falta, sin miedo a caerte porque sabes que te vas a levantar. La margarita parece simple, pero crece en cualquier lado y siempre encuentra el sol. El diamante es lo más duro que hay, y aun así, lo que más brilla',
  },
  mayo: {
    flor: 'Espino',
    texto: 'Naciste con raíces profundas y un cariño que no se anda con medias tintas, de las que protegen a quien aman con uñas y dientes si hace falta. El espino tiene espinas, sí, pero cuando florece lo hace entero, sin guardarse nada. La esmeralda es el verde más intenso que existe, como tu forma de querer',
  },
  junio: {
    flor: 'Rosa',
    texto: 'Naciste siendo dos cosas a la vez: curiosa e imposible de aburrir, dulce y con carácter. La rosa es la flor que todo el mundo reconoce, pero que nunca deja de sorprender. La perla se forma despacio, en silencio, hasta convertirse en algo que no tiene precio',
  },
  julio: {
    flor: 'Espuela de caballero',
    texto: 'Naciste sintiendo todo el doble, aunque por fuera parezcas tranquila. La espuela de caballero crece alta y esbelta, imposible de no ver. El rubí es el rojo más intenso que existe, como lo que sientes cuando de verdad quieres a alguien',
  },
  agosto: {
    flor: 'Amapola',
    texto: 'Naciste con luz propia, de las que entran a un lugar y todo cambia un poco. La amapola se abre entera al sol, sin guardarse nada. El peridoto tiene ese verde que solo se encuentra en las cosas que de verdad valen la pena',
  },
  septiembre: {
    flor: 'Aster',
    texto: 'Naciste queriendo en los detalles pequeños, esos que nadie más nota pero que lo dicen todo. Aster significa estrella, y así quieres tú: en silencio, iluminando todo lo que tocas sin hacer ruido. El zafiro tiene ese azul profundo de las noches donde de verdad se ven las estrellas',
  },
  octubre: {
    flor: 'Caléndula',
    texto: 'Naciste buscando el equilibrio, la armonía, la belleza en las cosas simples. La caléndula se abre con el sol y se cierra con la noche, fiel a su propio ritmo. El ópalo cambia de color según la luz, como tú, que sabes adaptarte sin dejar de ser tú',
  },
  noviembre: {
    flor: 'Crisantemo',
    texto: 'Naciste sintiendo todo profundo, sin medias tintas, de las que aman con una intensidad que a veces asusta a los demás pero que a ti te sale natural. El crisantemo florece cuando casi todo lo demás ya se marchitó: una lealtad que resiste al tiempo. El topacio guarda ese calor dorado que tú también llevas por dentro',
  },
  diciembre: {
    flor: 'Nochebuena',
    texto: 'Naciste para iluminar cualquier lugar donde estés, de las que hacen que diciembre se sienta especial aunque haga frío afuera. La nochebuena florece en pleno invierno, justo cuando menos se espera. La turquesa tiene ese color de mar que tú también llevas contigo, vayas donde vayas',
  },
};

/* La firma con la que cierran todas las cartitas */
const CARTITA_CIERRE = 'Este es tu pedacito de cielo. Llévalo contigo';

/* Etiquetas y ayudas de cada campo de grabado.
   tipo 'texto' → input de texto normal.
   tipo 'color' → selector de muestras (usa "opciones"). */
const CAMPOS_META = {
  nombre:  { tipo: 'texto', label: 'Nombre',  placeholder: 'Ej. Adri',        max: 16, opcional: false },
  fecha:   { tipo: 'texto', label: 'Fecha',   placeholder: 'Ej. 14.02.2024',  max: 12, opcional: true  },
  mensaje: { tipo: 'texto', label: 'Mensaje', placeholder: 'Ej. te elijo a ti', max: 28, opcional: false },
  // Una sola inscripción, pero libre: frase, fecha o coordenadas
  grabado: { tipo: 'texto', label: 'Grabado', placeholder: 'Una frase, una fecha o unas coordenadas', max: 30, opcional: false },
  mes:     { tipo: 'color', label: 'Mes de nacimiento', opciones: MESES_NATAL, opcional: false },
};

function getProductoPorSlug(slug) {
  return PRODUCTOS.find(p => p.slug === slug) || null;
}

function productoPorDefecto() {
  return PRODUCTOS.find(p => p.destacado) || PRODUCTOS[0];
}

function formatearPrecio(precio) {
  if (precio === null || precio === undefined) return null;
  return precio.toFixed(2).replace('.', ',') + ' €';
}
