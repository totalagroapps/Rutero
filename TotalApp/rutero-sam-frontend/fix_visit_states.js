const fs = require('fs');

// Fix app.js
let appJs = fs.readFileSync('js/app.js', 'utf8');

// Line 11: visitStates: {}, // client_id -> 'pending' -> Change comment
appJs = appJs.replace(/visitStates: \{\}, \/\/ client_id ->/g, "visitStates: {}, // codigo_pdv ->");

// Line 832: const visitState = this.state.visitStates[cliente.id] || 'pending';
appJs = appJs.replace(/this\.state\.visitStates\[cliente\.id\]/g, "this.state.visitStates[cliente.codigo_pdv]");

// Line 1132: this.state.visitStates[client.id] = status;
appJs = appJs.replace(/this\.state\.visitStates\[client\.id\] = status;/g, "this.state.visitStates[client.codigo_pdv] = status;");

// Line 2652: visitStates[p.cliente_id] = ...
appJs = appJs.replace(/visitStates\[p\.cliente_id\] = p\.estado_sincronizacion/g, `
                    const client = this.state.clientes.find(c => c.id === p.cliente_id);
                    if (client) visitStates[client.codigo_pdv] = p.estado_sincronizacion
`.trim());

fs.writeFileSync('js/app.js', appJs, 'utf8');


// Fix map.js
let mapJs = fs.readFileSync('js/map.js', 'utf8');
mapJs = mapJs.replace(/visitStates\[cliente\.id\]/g, "visitStates[cliente.codigo_pdv]");
fs.writeFileSync('js/map.js', mapJs, 'utf8');

