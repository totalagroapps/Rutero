const fs = require('fs');

// Fix modals.js
let modals = fs.readFileSync('js/modals.js', 'utf8');
modals = modals.replace(/'modal-confirm-checkout':\s*<div/, "'modal-confirm-checkout': \\n    <div");
modals = modals.replace(/<\/div>\s*};/, "</div>\n    \\n};");
fs.writeFileSync('js/modals.js', modals, 'utf8');

// Fix sw.js
let sw = fs.readFileSync('sw.js', 'utf8');
sw = sw.replace(/if \(response.ok\) {/g, "if (response.ok && event.request.method === 'GET') {");
fs.writeFileSync('sw.js', sw, 'utf8');
