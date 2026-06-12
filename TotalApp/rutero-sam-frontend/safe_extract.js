const fs = require('fs');

const appTxt = fs.readFileSync('js/app.js', 'utf8');
const startMatch = '    initClientInventory() {';
const endMatch = '    // ==================== GLOBAL HELPER LOGICS ====================';

const startIndex = appTxt.indexOf(startMatch);
const endIndex = appTxt.indexOf(endMatch);

if (startIndex !== -1 && endIndex !== -1) {
    let block = appTxt.substring(startIndex, endIndex);
    
    // Replace this. with App. inside the block
    let clienteCode = block.replace(/this\.state/g, 'App.state').replace(/this\.([a-zA-Z0-9_]+)/g, 'App.$1');
    
    // Wrap in object
    let finalClienteCode = `const ClienteController = {\n\n${clienteCode}\n};\n`;
    
    fs.writeFileSync('js/cliente.js', finalClienteCode, 'utf8');
    
    // Remove from app.js
    let newAppTxt = appTxt.substring(0, startIndex) + appTxt.substring(endIndex);
    fs.writeFileSync('js/app.js', newAppTxt, 'utf8');
    console.log("Successfully extracted exact block!");
} else {
    console.log("Could not find boundaries.");
}
