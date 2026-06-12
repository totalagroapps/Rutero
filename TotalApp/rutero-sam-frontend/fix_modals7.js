const fs = require('fs');
let txt = fs.readFileSync('js/modals.js', 'utf8');

const keys = [
  'modal-confirm-checkout',
  'modal-abono',
  'modal-pago',
  'modal-detalle-pedido',
  'modal-clientes-distribuidor',
  'modal-admin-abono',
  'modal-historial-abonos',
  'modal-admin-catalogo'
];

for (let key of keys) {
  let search = "'" + key + "': ";
  let index = txt.indexOf(search);
  if (index !== -1) {
    let divIndex = txt.indexOf('<div', index);
    if (divIndex !== -1 && divIndex < index + 50) {
       txt = txt.substring(0, divIndex) + '`' + txt.substring(divIndex);
    }
  }
}

// Now add closing backticks. They should be just before the comma separating the keys, or before inject(id)
txt = txt.replace(/<\/div>\s*,/g, '</div>`,');
txt = txt.replace(/<\/div>\s*inject\(/g, '</div>`,\n  inject(');

fs.writeFileSync('js/modals.js', txt, 'utf8');
