const fs = require('fs');
let sw = fs.readFileSync('sw.js', 'utf8');
sw = sw.replace(/if \(networkResponse\.ok\) {/g, "if (networkResponse.ok && event.request.method === 'GET') {");
fs.writeFileSync('sw.js', sw, 'utf8');
