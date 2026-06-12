const fs = require('fs');
let txt = fs.readFileSync('sw.js', 'utf8');
txt = txt.replace(/sam-rutero-cache-v9/g, "sam-rutero-cache-v10");
fs.writeFileSync('sw.js', txt, 'utf8');
