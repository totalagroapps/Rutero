const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace(/^\uFEFF/, ''); // Remove BOM if exists
fs.writeFileSync('index.html', content, 'utf8');
