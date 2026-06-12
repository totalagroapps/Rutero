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

function replaceThisWithApp(code) {
    let modified = code.replace(/this\.state/g, 'App.state');
    modified = modified.replace(/this\.([a-zA-Z0-9_]+)/g, 'App.$1');
    return modified;
}

const adminFuncs = [
    'loadAdminData', 'loadAdminStats', 'renderAdminStatsChart', 'renderAdminVendedores', 
    'renderAdminClientes', 'renderAdminProductos', 'renderAdminPedidos', 'updatePedidoStatusAdmin',
    'populateAdminRouteVendedoresSelector', 'populateAdminClientVendedoresSelector', 
    'loadAdminRouteOnMap', 'openVendedorModal', 'closeVendedorModal', 'handleSaveVendedor', 
    'deleteVendedor', 'importClientesExcel', 'openClienteAdminModal', 'closeClienteAdminModal', 'handleSaveClienteAdmin', 
    'deleteClienteAdmin', 'openProductoModal', 'closeProductoModal', 'handleSaveProducto', 
    'deleteAdminProducto', 'renderAdminUsuarios', 'openUsuarioModal', 'closeUsuarioModal', 
    'handleUserRolChange', 'handleSaveUsuario', 'deleteUsuario'
];

const despachoFuncs = [
    'loadDespachoData', 'renderDespachoDashboard', 'renderDespachoInventario', 'handleUpdateStock', 
    'renderDespachoCertificar', 'openCertificarModal', 'closeCertificarModal', 'handleSaveCertificacion'
];

const informesFuncs = [
    'renderAdminInformes', 'toggleRangoFechas', 'generarInformeAdmin', 'exportarInformeActual'
];

let remainingContent = content;

function processCategory(name, funcs) {
    let controllerCode = 'const ' + name + ' = {\n';
    
    for (let fName of funcs) {
        let f = extractFunction(fName);
        if (f) {
            let modCode = replaceThisWithApp(f.code);
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

fs.writeFileSync('js/admin.js', adminStr, 'utf8');
fs.writeFileSync('js/despacho.js', despachoStr, 'utf8');
fs.writeFileSync('js/informes.js', informesStr, 'utf8');

remainingContent = remainingContent.replace('\n\n dummyFunc() { }\n', '');
fs.writeFileSync('js/app.js', remainingContent, 'utf8');
console.log("Extraction complete.");
