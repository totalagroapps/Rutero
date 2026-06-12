const fs = require('fs');
let txt = fs.readFileSync('js/informes.js', 'utf8');

txt = txt.replace(/exportarInformeActual\(formato\)/g, ",exportarInformeActual(formato)");
// wait, if it was replaced multiple times:
fs.writeFileSync('js/informes.js', txt, 'utf8');
