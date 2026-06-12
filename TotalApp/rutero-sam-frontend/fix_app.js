const fs = require('fs');
let txt = fs.readFileSync('js/app.js', 'utf8');

txt = txt.replace(/openVendedorModal\(vendedor = null\) \{/g, "openVendedorModal(vendedor = null) {\n        AppModals.inject('modal-admin-vendedor');");
txt = txt.replace(/openClienteAdminModal\(cliente = null\) \{/g, "openClienteAdminModal(cliente = null) {\n        AppModals.inject('modal-admin-cliente');");
txt = txt.replace(/openProductoModal\(prod = null\) \{/g, "openProductoModal(prod = null) {\n        AppModals.inject('modal-admin-producto');");
txt = txt.replace(/openCertificarModal\(pedidoId, clienteNombre\) \{/g, "openCertificarModal(pedidoId, clienteNombre) {\n        AppModals.inject('modal-certificar-pedido');");
txt = txt.replace(/openUsuarioModal\(usuario = null\) \{/g, "openUsuarioModal(usuario = null) {\n        AppModals.inject('modal-admin-usuario');");
txt = txt.replace(/openAbonoModal\(\) \{/g, "openAbonoModal() {\n        AppModals.inject('modal-abono');");
txt = txt.replace(/openOrderModal\(order\) \{/g, "openOrderModal(order) {\n        AppModals.inject('modal-order-details');");

fs.writeFileSync('js/app.js', txt, 'utf8');
