const fs = require('fs');
let content = fs.readFileSync('js/app.js', 'utf8');
// add a dummy end to make parsing easier if the last function lacks trailing stuff
content += '\n\n dummyFunc() { }\n';

function extractFunction(name) {
    const startRegex = new RegExp('^\\s*(?:async\\s+)?' + name + '\\s*\\([^)]*\\)\\s*\\{', 'm');
    const match = content.match(startRegex);
    if (!match) return null;
    
    let startIndex = match.index;
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    let endIndex = -1;
    
    for (let i = startIndex + match[0].length - 1; i < content.length; i++) {
        let char = content[i];
        
        if (inString) {
            if (char === stringChar && content[i-1] !== '\\') {
                inString = false;
            }
        } else {
            if (char === "'" || char === '"' || char === '`') {
                inString = true;
                stringChar = char;
            } else if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                    endIndex = i + 1;
                    break;
                }
            }
        }
    }
    
    if (endIndex !== -1) {
        let after = content.substring(endIndex).trimLeft();
        if (after.startsWith(',')) {
            endIndex = content.indexOf(',', endIndex) + 1;
        }
        return {
            name: name,
            code: content.substring(startIndex, endIndex),
            start: startIndex,
            end: endIndex
        };
    }
    return null;
}

const clienteFuncs = [
    'initClientInventory', 'saveClientInventory', 'initClientSales', 'saveClientSales',
    'renderClienteDashboard', 'fetchClientOrdersBackground', 'fetchAndRenderClientePedidos',
    'renderClientePedidosList', 'renderClienteInventario', 'renderClienteVentaForm',
    'renderClienteVentaProducts', 'completeClienteSale', 'renderClientSalesHistorial',
    'filterVentasList', 'receiveOrderAction', 'openClientCarteraDemo', 'renderMainCartera'
];

let remainingContent = content;

function processCategory(name, funcs) {
    let controllerCode = 'const ' + name + ' = {\n';
    
    for (let fName of funcs) {
        let f = extractFunction(fName);
        if (f) {
            let modCode = f.code.replace(/this\.state/g, 'App.state').replace(/this\.([a-zA-Z0-9_]+)/g, 'App.$1');
            if (!modCode.trim().endsWith(',')) {
                modCode = modCode + ',';
            }
            controllerCode += modCode + '\n\n';
            remainingContent = remainingContent.replace(f.code, '');
        } else {
            console.log("Could not extract: " + fName);
        }
    }
    
    controllerCode += '};\n';
    return controllerCode;
}

const clienteStr = processCategory('ClienteController', clienteFuncs);

fs.writeFileSync('js/cliente.js', clienteStr, 'utf8');

remainingContent = remainingContent.replace('\n\n dummyFunc() { }\n', '');
// Fix any remaining references if needed, but since it's dead code, we don't need to replace them.
fs.writeFileSync('js/app.js', remainingContent, 'utf8');
console.log("Extraction complete.");
