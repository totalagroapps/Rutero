const fs = require('fs');

let txt = fs.readFileSync('js/app.js', 'utf8');

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

for (let m of adminMethods) txt = txt.replace(new RegExp(`this\\.${m}\\(`, 'g'), `AdminController.${m}(`);
for (let m of despachoMethods) txt = txt.replace(new RegExp(`this\\.${m}\\(`, 'g'), `DespachoController.${m}(`);
for (let m of informesMethods) txt = txt.replace(new RegExp(`this\\.${m}\\(`, 'g'), `InformesController.${m}(`);

fs.writeFileSync('js/app.js', txt, 'utf8');
console.log("Updated internal 'this.' calls to controller names.");
