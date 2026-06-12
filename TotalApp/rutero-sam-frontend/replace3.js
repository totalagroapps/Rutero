const fs = require('fs');
let text = fs.readFileSync('index.html', 'utf8');

text = text.replace(/sesi\u01df\ufffdn/g, 'sesión');
text = text.replace(/cat\u01df\ufffdlogo/g, 'catálogo');
text = text.replace(/\u01df\ufffdltimos/g, 'Últimos');
text = text.replace(/Contrase\u01df\ufffda/g, 'Contraseña');
text = text.replace(/P\u01df\ufffdrez/g, 'Pérez');
text = text.replace(/r\u01df\ufffdpidas/g, 'rápidas');
text = text.replace(/qu\u01df\ufffd/g, 'qué');
text = text.replace(/realiz\u01df\ufffd/g, 'realizó');
text = text.replace(/Fotograf\u01df\ufffda/g, 'Fotografía');
text = text.replace(/Noved\u01df\ufffdd/g, 'Novedad');
text = text.replace(/sesi\u00e3\u00b3n/g, 'sesión');
text = text.replace(/Contrase\u00e3\u00b1a/g, 'Contraseña');

fs.writeFileSync('index.html', text, 'utf8');
