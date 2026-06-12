const fs = require('fs');
let txt = fs.readFileSync('index.html', 'utf8');

txt = txt.replace('<meta name="apple-mobile-web-app-capable" content="yes">', '<meta name="apple-mobile-web-app-capable" content="yes">\n    <meta name="mobile-web-app-capable" content="yes">');

fs.writeFileSync('index.html', txt, 'utf8');
