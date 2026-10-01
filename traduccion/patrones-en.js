// Textos con números, precios o nombres dentro, que script.js compone al
// vuelo. Cada patrón: [expresión regular sobre el texto español, cómo se
// escribe en inglés]. T(x) traduce un trozo (p.ej. el nombre de la pieza)
// con el diccionario de en.txt. Lo genera scripts/generar-idioma.py.
(T) => [
  [/^Ampliar foto: (.+), imagen (\d+) de (\d+)$/, (m, p, a, b) => `Enlarge photo: ${T(p)}, image ${a} of ${b}`],
  [/^Ver imagen (\d+) de (\d+)$/, 'View image $1 of $2'],
  [/^(.+), imagen (\d+) de (\d+)$/, (m, p, a, b) => `${T(p)}, image ${a} of ${b}`],
  [/^Ahorras (.+?) \((.+?) %\): por separado, las dos piezas cuestan (.+)$/, 'You save $1 ($2%): bought separately, the two pieces cost $3'],
  [/^Ahorras (.+)$/, 'You save $1'],
  [/^Quitar (.+) del carrito$/, (m, p) => `Remove ${T(p)} from cart`],
  [/^Son (\d+) caracteres\. Es posible que no quepan en la placa: si hace falta ajustarlo, te escribimos antes de grabar\.$/,
    "That's $1 characters. They may not fit on the plate: if it needs adjusting, we'll write to you before engraving."],
  [/^(.+) en (oro|plata) \+ (.+) en (oro|plata)(?: · Ahorras (.+) frente a comprarlas por separado \((.+)\))?$/,
    (m, p1, m1, p2, m2, ah, su) => `${T(p1)} in ${m1 === 'oro' ? 'gold' : 'silver'} + ${T(p2)} in ${m2 === 'oro' ? 'gold' : 'silver'}`
      + (ah ? ` · You save ${ah} compared with buying them separately (${su})` : '')],
  [/^Ir a pagar · (.+)$/, 'Checkout · $1'],
]
