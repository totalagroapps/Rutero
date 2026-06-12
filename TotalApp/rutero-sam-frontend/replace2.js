const fs = require('fs');
let text = fs.readFileSync('index.html', 'utf8');

text = text.replace(/sesi(?:ÃƒÂ³|a)n/g, 'sesión');
text = text.replace(/cat(?:ÃƒÂ¡|a)logo/g, 'catálogo');
text = text.replace(/(?:ÃƒÂº|a)ltimos/g, 'Últimos');
text = text.replace(/Contrase(?:ÃƒÂ±|a)a/g, 'Contraseña');
text = text.replace(/P(?:ÃƒÂ©|a)rez/g, 'Pérez');
text = text.replace(/r(?:ÃƒÂ¡|a)pidas/g, 'rápidas');
text = text.replace(/qu(?:ÃƒÂ©|a)/g, 'qué');
text = text.replace(/realiz(?:ÃƒÂ³|a)/g, 'realizó');
text = text.replace(/Fotograf(?:ÃƒÂ|a)a/g, 'Fotografía');
text = text.replace(/Noved(?:ÃƒÂ|a)d/g, 'Novedad');

fs.writeFileSync('index.html', text, 'utf8');
