const fs = require('fs');
let txt = fs.readFileSync('js/modals.js', 'utf8');

txt = txt.replace(/':\s*<div/g, "': `\n<div");
txt = txt.replace(/<\/div>\s*,/g, "</div>\n`,");
txt = txt.replace(/<\/div>\s*inject\(/g, "</div>\n`,\n  inject(");

fs.writeFileSync('js/modals.js', txt, 'utf8');
