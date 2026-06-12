const fs = require('fs');
let text = fs.readFileSync('index.html', 'utf8');

text = text.replace('Inicia sesian para continuar', 'Inicia sesión para continuar');
text = text.replace('catalogo', 'catálogo');
text = text.replace('altimos Pedidos', 'Últimos Pedidos');
text = text.replace('Inicia sesiÃƒÂ³n', 'Inicia sesión');
text = text.replace('ContraseÃƒÂ±a', 'Contraseña');
text = text.replace('catÃƒÂ¡logo', 'catálogo');
text = text.replace('ÃƒÂºltimos', 'Últimos');

fs.writeFileSync('index.html', text, 'utf8');
