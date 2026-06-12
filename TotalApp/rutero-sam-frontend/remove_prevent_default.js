const fs = require('fs');
let txt = fs.readFileSync('js/app.js', 'utf8');
txt = txt.replace(/e\.preventDefault\(\);\s*this\.deferredInstallPrompt = e;/g, "this.deferredInstallPrompt = e;");
fs.writeFileSync('js/app.js', txt, 'utf8');
