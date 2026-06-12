const fs = require('fs');
let txt = fs.readFileSync('js/modals.js', 'utf8');

// The keys are 'modal-something': <div...
// We want to add \ before <div and \ after </div> (before the comma or at the end)
txt = txt.replace(/:\s*<div/g, ': \n<div');
txt = txt.replace(/<\/div>\s*,/g, '</div>\n,');
txt = txt.replace(/<\/div>\s*(?=\s*inject\()/g, '</div>\n,\n\n');

fs.writeFileSync('js/modals.js', txt, 'utf8');
