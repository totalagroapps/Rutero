const fs = require('fs');

let index = fs.readFileSync('index.html', 'utf8');

// Insert scripts
let scriptsInsert = `<script src="js/admin.js"></script>\n    <script src="js/despacho.js"></script>\n    <script src="js/informes.js"></script>\n    <script src="js/app.js"></script>`;
index = index.replace('<script src="js/app.js"></script>', scriptsInsert);

// Replace onclick handlers for AdminController
const adminMethods = ['openVendedorModal', 'openClienteAdminModal', 'openProductoModal', 'openUsuarioModal'];
for (let m of adminMethods) {
    let re = new RegExp(`App\\.${m}\\(`, 'g');
    index = index.replace(re, `AdminController.${m}(`);
}

// Replace onclick handlers for InformesController
const informesMethods = ['generarInformeAdmin', 'exportarInformeActual', 'toggleRangoFechas'];
for (let m of informesMethods) {
    let re = new RegExp(`App\\.${m}\\(`, 'g');
    index = index.replace(re, `InformesController.${m}(`);
}

// Replace onclick handlers for DespachoController
const despachoMethods = ['openCertificarModal', 'handleSaveCertificacion', 'handleUpdateStock'];
for (let m of despachoMethods) {
    let re = new RegExp(`App\\.${m}\\(`, 'g');
    index = index.replace(re, `DespachoController.${m}(`);
}

fs.writeFileSync('index.html', index, 'utf8');

// Also update js/app.js, js/map.js and js/modals.js for any inline onClick strings!
const filesToUpdate = ['js/app.js', 'js/map.js', 'js/modals.js'];
for (let file of filesToUpdate) {
    let text = fs.readFileSync(file, 'utf8');
    for (let m of adminMethods) text = text.replace(new RegExp(`App\\.${m}\\(`, 'g'), `AdminController.${m}(`);
    for (let m of informesMethods) text = text.replace(new RegExp(`App\\.${m}\\(`, 'g'), `InformesController.${m}(`);
    for (let m of despachoMethods) text = text.replace(new RegExp(`App\\.${m}\\(`, 'g'), `DespachoController.${m}(`);
    
    // extra admin methods dynamically called
    let extraAdmin = ['deleteVendedor', 'deleteClienteAdmin', 'deleteAdminProducto', 'deleteUsuario', 'handleUserRolChange', 'updatePedidoStatusAdmin', 'handleSaveVendedor', 'handleSaveClienteAdmin', 'handleSaveProducto', 'handleSaveUsuario'];
    for (let m of extraAdmin) text = text.replace(new RegExp(`App\\.${m}\\(`, 'g'), `AdminController.${m}(`);
    
    fs.writeFileSync(file, text, 'utf8');
}
console.log("Updated HTML and JS references successfully.");
