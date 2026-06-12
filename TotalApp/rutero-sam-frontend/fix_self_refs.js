const fs = require('fs');

const adminMethods = ['loadAdminData', 'loadAdminStats', 'renderAdminStatsChart', 'renderAdminVendedores', 
    'renderAdminClientes', 'renderAdminProductos', 'renderAdminPedidos', 'updatePedidoStatusAdmin',
    'populateAdminRouteVendedoresSelector', 'populateAdminClientVendedoresSelector', 
    'loadAdminRouteOnMap', 'openVendedorModal', 'closeVendedorModal', 'handleSaveVendedor', 
    'deleteVendedor', 'importClientesExcel', 'openClienteAdminModal', 'closeClienteAdminModal', 'handleSaveClienteAdmin', 
    'deleteClienteAdmin', 'openProductoModal', 'closeProductoModal', 'handleSaveProducto', 
    'deleteAdminProducto', 'renderAdminUsuarios', 'openUsuarioModal', 'closeUsuarioModal', 
    'handleUserRolChange', 'handleSaveUsuario', 'deleteUsuario'];

const despachoMethods = ['loadDespachoData', 'renderDespachoDashboard', 'renderDespachoInventario', 'handleUpdateStock', 
    'renderDespachoCertificar', 'openCertificarModal', 'closeCertificarModal', 'handleSaveCertificacion'];

const informesMethods = ['renderAdminInformes', 'toggleRangoFechas', 'generarInformeAdmin', 'exportarInformeActual'];

function fixFile(file, controllerName, methods) {
    let txt = fs.readFileSync(file, 'utf8');
    methods.forEach(m => {
        // App.methodName( -> ControllerName.methodName(
        let re = new RegExp(`App\\.${m}\\(`, 'g');
        txt = txt.replace(re, `${controllerName}.${m}(`);
    });
    fs.writeFileSync(file, txt, 'utf8');
}

fixFile('js/admin.js', 'AdminController', adminMethods);
fixFile('js/despacho.js', 'DespachoController', despachoMethods);
fixFile('js/informes.js', 'InformesController', informesMethods);

console.log("Fixed self-references in controllers.");
