const fs = require('fs');
let txt = fs.readFileSync('js/modals.js', 'utf8');

// Match any key that is followed by : <div or : \n <div
txt = txt.replace(/':\s*(?=<div)/g, "': `\n");

// Match </div> followed by comma or inject
txt = txt.replace(/<\/div>\s*,/g, "</div>\n`,");
txt = txt.replace(/<\/div>\s*(?=inject\()/g, "</div>\n`,\n  ");

fs.writeFileSync('js/modals.js', txt, 'utf8');
