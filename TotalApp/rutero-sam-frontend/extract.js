const fs = require('fs');
const content = fs.readFileSync('js/app.js', 'utf8');

function extractFunction(name) {
    const startRegex = new RegExp('^\\s*' + name + '\\s*\\([^)]*\\)\\s*\\{', 'm');
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
        // Also grab trailing comma if exists
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

function replaceThisWithApp(code) {
    // Replace this.state with App.state
    let modified = code.replace(/this\.state/g, 'App.state');
    // Replace this.something() with App.something()
    modified = modified.replace(/this\.([a-zA-Z0-9_]+)/g, 'App.$1');
    return modified;
}

const adminFuncs = [
    'renderAdminStatsChart', 'renderAdminVendedores', 'renderAdminClientes', 
    'renderAdminProductos', 'renderAdminPedidos', 'populateAdminRouteVendedoresSelector', 
    'populateAdminClientVendedoresSelector', 'loadAdminRouteOnMap', 'openVendedorModal', 
    'closeVendedorModal', 'saveVendedor', 'deleteVendedor', 'openClienteAdminModal', 
    'closeClienteAdminModal', 'saveClienteAdmin', 'deleteClienteAdmin', 'openProductoModal', 
    'closeProductoModal', 'saveAdminProducto', 'deleteAdminProducto', 'openUsuarioModal', 
    'closeUsuarioModal', 'saveUsuario', 'deleteUsuario', 'handleUserRolChange'
];

const despachoFuncs = [
    'renderDespachoDashboard', 'renderDespachoInventario', 'searchDespachoInventario', 
    'renderDespachoCertificar', 'searchDespachoPedidos', 'openCertificarModal', 
    'closeCertificarModal', 'certificarPedido'
];

const informesFuncs = [
    'toggleRangoFechas', 'generarInformeAdmin', 'renderResultadosInforme', 'exportarInformeActual'
];

let remainingContent = content;

function processCategory(name, funcs) {
    let controllerCode = 'const ' + name + ' = {\n';
    
    for (let fName of funcs) {
        let f = extractFunction(fName);
        if (f) {
            let modCode = replaceThisWithApp(f.code);
            // ensure it ends with a comma
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

const adminStr = processCategory('AdminController', adminFuncs);
const despachoStr = processCategory('DespachoController', despachoFuncs);
const informesStr = processCategory('InformesController', informesFuncs);

// Save new controllers
fs.writeFileSync('js/admin.js', adminStr, 'utf8');
fs.writeFileSync('js/despacho.js', despachoStr, 'utf8');
fs.writeFileSync('js/informes.js', informesStr, 'utf8');

// Update app.js
fs.writeFileSync('js/app.js', remainingContent, 'utf8');
console.log("Extraction complete.");
