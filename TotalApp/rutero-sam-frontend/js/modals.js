const AppModals = {

  'modal-confirm-checkout': `
<div id="modal-confirm-checkout" class="modal-overlay hidden">
        <div class="modal-content" style="max-width: 450px;">
            <div class="modal-header">
                <h2>Confirmar Pedido</h2>
                <button type="button" class="btn-close" onclick="document.getElementById('modal-confirm-checkout').classList.add('hidden')">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>Por favor revisa el resumen del pedido antes de continuar a la firma.</p>
                <div style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; margin: 15px 0;">
                    <ul id="confirm-checkout-items" style="list-style: none; padding: 0; margin: 0; max-height: 250px; overflow-y: auto;">
                        <!-- Items will be injected here -->
                    </ul>
                    <hr style="border: none; border-top: 1px dashed var(--border-color); margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 1.1rem;">
                        <span>Total:</span>
                        <span id="confirm-checkout-total"></span>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-confirm-checkout').classList.add('hidden')">Volver al carrito</button>
                <button type="button" class="btn btn-primary" onclick="App.proceedToCheckout()">Confirmar e ir a Firma</button>
            </div>
        </div>
    </div>
`,

  'modal-abono': `
<div id="modal-abono" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Registrar Pago / Abono</h3>
                <button class="btn-close-modal" onclick="App.closeAbonoModal()">×</button>
            </div>
            <form id="form-abono" onsubmit="App.handleSaveAbono(event)" class="flex-col-gap">
                <div class="form-group">
                    <label for="abono-factura" class="text-sm-bold">Factura *</label>
                    <select id="abono-factura" required class="admin-input">
                        <!-- Loaded dynamically based on active client -->
                    </select>
                </div>
                <div class="form-group">
                    <label for="abono-monto" class="text-sm-bold">Monto a Pagar ($) *</label>
                    <input type="number" id="abono-monto" required min="1" step="0.01" class="admin-input">
                </div>
                <div class="form-group">
                    <label for="abono-metodo" class="text-sm-bold">Método de Pago *</label>
                    <select id="abono-metodo" required class="admin-input">
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="TARJETA">Tarjeta / POS</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="abono-notas" class="text-sm-bold">Notas Adicionales</label>
                    <textarea id="abono-notas" rows="2" class="admin-input"></textarea>
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 8px;">Registrar Pago</button>
            </form>
        </div>
    </div>
`,
  'modal-order-details': `
<div id="modal-order-details" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-order-code">Detalle del Pedido</h3>
                <button class="btn-close-modal" onclick="App.closeOrderModal()">×</button>
            </div>
            <div id="modal-order-body">
                <!-- Loaded dynamically -->
            </div>
        </div>
    </div>
`,
  'modal-admin-vendedor': `
<div id="modal-admin-vendedor" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-vendedor-title">Nuevo Vendedor</h3>
                <button class="btn-close-modal" onclick="AdminController.closeVendedorModal()">×</button>
            </div>
            <form id="form-admin-vendedor" onsubmit="AdminController.handleSaveVendedor(event)" style="padding-top: 12px;">
                <input type="hidden" id="admin-vendedor-id">
                <div class="form-group" style="margin-bottom:14px;">
                    <label for="admin-vendedor-nombre" style="font-size:0.75rem; font-weight:700;">Nombre Completo *</label>
                    <input type="text" id="admin-vendedor-nombre" required placeholder="Ej. Juan Pérez" class="admin-input-lg">
                </div>
                <div class="form-group" style="margin-bottom:14px;">
                    <label for="admin-vendedor-zona" style="font-size:0.75rem; font-weight:700;">Zona de Cobertura *</label>
                    <input type="text" id="admin-vendedor-zona" required placeholder="Ej. Santiago Oriente" class="admin-input-lg">
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 16px; background:#6366f1;">Guardar Vendedor</button>
            </form>
        </div>
    </div>
`,
  'modal-admin-cliente': `
<div id="modal-admin-cliente" class="modal-overlay hidden">
        <div class="modal-content" style="max-height:85vh;">
            <div class="modal-header">
                <h3 id="modal-cliente-admin-title">Nuevo Comercio</h3>
                <button class="btn-close-modal" onclick="AdminController.closeClienteAdminModal()">×</button>
            </div>
            <form id="form-admin-cliente" onsubmit="AdminController.handleSaveClienteAdmin(event)" class="flex-col-gap">
                <input type="hidden" id="admin-cliente-id">
                <input type="hidden" id="admin-cliente-uuid">
                
                <div class="form-group">
                    <label for="admin-cliente-codigo" class="text-sm-bold">Código PDV *</label>
                    <input type="text" id="admin-cliente-codigo" required placeholder="Ej. PDV007" class="admin-input">
                </div>
                <div class="form-group">
                    <label for="admin-cliente-nombre" class="text-sm-bold">Nombre del Comercio *</label>
                    <input type="text" id="admin-cliente-nombre" required placeholder="Ej. Minimarket Don Lucho" class="admin-input">
                </div>
                <div class="form-group">
                    <label for="admin-cliente-encargado" class="text-sm-bold">Nombre del Encargado</label>
                    <input type="text" id="admin-cliente-encargado" placeholder="Ej. Luis Pérez" class="admin-input">
                </div>
                <div class="form-group" style="position: relative;">
                    <label for="admin-cliente-direccion" class="text-sm-bold">Dirección Completa *</label>
                    <input type="text" id="admin-cliente-direccion" required placeholder="Ej. Av. Providencia 1250" autocomplete="off" class="admin-input">
                    <ul id="admin-cliente-direccion-suggestions" class="autocomplete-suggestions hidden"></ul>
                </div>
                <div class="form-group-row grid-2-cols">
                    <div class="form-group">
                        <label for="admin-cliente-lat" class="text-sm-bold">Latitud</label>
                        <input type="number" step="any" id="admin-cliente-lat" placeholder="-33.43" class="admin-input">
                    </div>
                    <div class="form-group">
                        <label for="admin-cliente-lng" class="text-sm-bold">Longitud</label>
                        <input type="number" step="any" id="admin-cliente-lng" placeholder="-70.62" class="admin-input">
                    </div>
                </div>

                <div class="form-group">
                    <label class="text-sm-bold">Seleccionar en Mapa</label>
                    <div id="admin-cliente-picker-map" style="height: 180px; width: 100%; border-radius: var(--border-radius-sm); border: 1px solid rgba(0,0,0,0.1); z-index: 1; margin-top: 4px;"></div>
                </div>

                <div class="form-group-row grid-2-cols">
                    <div class="form-group">
                        <label for="admin-cliente-frecuencia" class="text-sm-bold">Frecuencia</label>
                        <select id="admin-cliente-frecuencia" class="admin-input">
                            <option value="Semanal">Semanal</option>
                            <option value="Quincenal">Quincenal</option>
                            <option value="Mensual">Mensual</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="admin-cliente-secuencia" class="text-sm-bold">Secuencia</label>
                        <input type="number" id="admin-cliente-secuencia" required value="1" min="1" class="admin-input">
                    </div>
                </div>
                <div class="form-group">
                    <label for="admin-cliente-vendedor" class="text-sm-bold">Vendedor Asignado</label>
                    <select id="admin-cliente-vendedor" class="admin-input">
                        <!-- Loaded dynamically -->
                    </select>
                </div>
                <div class="form-group">
                    <label for="admin-cliente-tipo" class="text-sm-bold">Modalidad de Venta</label>
                    <select id="admin-cliente-tipo" class="admin-input">
                        <option value="directo">Cliente Directo</option>
                        <option value="distribuidor">Distribuidor</option>
                    </select>
                </div>
                <div class="form-group-switch flex-between">
                    <span class="text-sm-bold">Comercio Activo</span>
                    <label class="switch">
                        <input type="checkbox" id="admin-cliente-activo" checked>
                        <span class="slider round"></span>
                    </label>
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 8px; background:#6366f1;">Guardar Comercio</button>
            </form>
        </div>
    </div>
`,
  'modal-admin-producto': `
<div id="modal-admin-producto" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-producto-title">Nuevo Producto</h3>
                <button class="btn-close-modal" onclick="AdminController.closeProductoModal()">×</button>
            </div>
            <form id="form-admin-producto" onsubmit="AdminController.handleSaveProducto(event)" class="flex-col-gap">
                <input type="hidden" id="admin-producto-id">
                <div class="form-group">
                    <label for="admin-producto-sku" class="text-sm-bold">SKU *</label>
                    <input type="text" id="admin-producto-sku" required placeholder="Ej. PROD007" class="admin-input">
                </div>
                <div class="form-group">
                    <label for="admin-producto-nombre" class="text-sm-bold">Nombre del Producto *</label>
                    <input type="text" id="admin-producto-nombre" required placeholder="Ej. Fanta 1.5L" class="admin-input">
                </div>
                <div class="form-group-row grid-2-cols">
                    <div class="form-group">
                        <label for="admin-producto-precio-directo" class="text-sm-bold">Precio Directo ($) *</label>
                        <input type="number" step="0.01" id="admin-producto-precio-directo" required placeholder="1200" class="admin-input">
                    </div>
                </div>
                <div class="form-group-row grid-2-cols">
                    <div class="form-group">
                        <label for="admin-producto-precio-distribuidor" class="text-sm-bold">Precio Dist. ($)</label>
                        <input type="number" step="0.01" id="admin-producto-precio-distribuidor" placeholder="1000" class="admin-input">
                    </div>
                    <div class="form-group">
                        <label for="admin-producto-stock" class="text-sm-bold">Inventario Fábrica</label>
                        <input type="number" id="admin-producto-stock" value="100" min="0" class="admin-input">
                    </div>
                </div>
                <div class="form-group-switch flex-between">
                    <span class="text-sm-bold">Disponible en Catálogo</span>
                    <label class="switch">
                        <input type="checkbox" id="admin-producto-activo" checked>
                        <span class="slider round"></span>
                    </label>
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 8px; background:#6366f1;">Guardar Producto</button>
            </form>
        </div>
    </div>
`,
  'modal-change-password': `
<div id="modal-change-password" class="modal-overlay hidden" style="z-index: 9999; backdrop-filter: blur(10px);">
        <div class="modal-content" style="max-width: 400px; transform: scale(1);">
            <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
                <h3 style="color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="key-round" style="color: #d97706;"></i>
                    Cambio de Clave Obligatorio
                </h3>
            </div>
            <div style="padding: 16px; font-size: 0.85rem; color: var(--text-secondary);">
                Por motivos de seguridad, debes cambiar tu contraseña inicial antes de continuar utilizando la aplicación.
            </div>
            <form id="form-change-password" onsubmit="App.handleChangePassword(event)" style="padding: 0 16px 20px 16px; display: flex; flex-direction: column; gap: 12px;">
                <div class="form-group">
                    <label for="change-password-nueva" style="font-size: 0.75rem; font-weight: 700;">Nueva Contraseña *</label>
                    <input type="password" id="change-password-nueva" required placeholder="Mínimo 8 caracteres con números o símbolos" class="admin-input-lg">
                </div>
                <div class="form-group">
                    <label for="change-password-confirmar" style="font-size: 0.75rem; font-weight: 700;">Confirmar Nueva Contraseña *</label>
                    <input type="password" id="change-password-confirmar" required placeholder="Repite la contraseña" class="admin-input-lg">
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 8px; background: #d97706; border-color: #d97706;">
                    Actualizar Contraseña
                </button>
            </form>
        </div>
    </div>
`,
  'modal-certificar-pedido': `
<div id="modal-certificar-pedido" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Certificar Despacho</h3>
                <button class="btn-close-modal" onclick="DespachoController.closeCertificarModal()">×</button>
            </div>
            <form id="form-certificar-pedido" onsubmit="DespachoController.handleSaveCertificacion(event)" class="flex-col-gap">
                <input type="hidden" id="certificar-pedido-id">
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">
                    <span style="font-weight:700;">Pedido ID:</span> <span id="certificar-pedido-label">#12</span><br>
                    <span style="font-weight:700;">Cliente/Comercio:</span> <span id="certificar-cliente-label">Don Lucho</span>
                </div>
                <div class="form-group">
                    <label for="certificar-texto" style="font-size:0.75rem; font-weight:700;">Detalles de Certificación (Seriales, Máquinas, Notas) *</label>
                    <textarea id="certificar-texto" required placeholder="Ej. Despachado máquina modelo X, Serial: MX-998822. Entregado en caja sellada." style="width:100%; height:100px; padding:10px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.85rem; margin-top:4px; resize: none;"></textarea>
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 8px; background:#10b981; border-color:#10b981;">
                    Certificar y Marcar como Despachado
                </button>
            </form>
        </div>
    </div>
`,
  'modal-admin-usuario': `
<div id="modal-admin-usuario" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-usuario-title">Nuevo Usuario</h3>
                <button class="btn-close-modal" onclick="AdminController.closeUsuarioModal()">×</button>
            </div>
            <form id="form-admin-usuario" onsubmit="AdminController.handleSaveUsuario(event)" class="flex-col-gap">
                <input type="hidden" id="admin-usuario-id">
                <div class="form-group">
                    <label for="admin-usuario-username" class="text-sm-bold">Nombre de Usuario (Username) *</label>
                    <input type="text" id="admin-usuario-username" required placeholder="Ej. vendedor1" class="admin-input">
                </div>
                <div class="form-group" id="admin-usuario-password-group">
                    <label for="admin-usuario-password" class="text-sm-bold">Contraseña *</label>
                    <input type="password" id="admin-usuario-password" placeholder="Establecer contraseña" class="admin-input">
                    <p class="help-text" id="admin-usuario-password-help" style="font-size:0.7rem; color:var(--text-secondary); margin-top:2px;">Dejar vacío para mantener contraseña actual.</p>
                </div>
                <div class="form-group">
                    <label for="admin-usuario-rol" class="text-sm-bold">Rol del Sistema *</label>
                    <select id="admin-usuario-rol" required onchange="AdminController.handleUserRolChange()" class="admin-input">
                        <option value="vendedor">Vendedor</option>
                        <option value="despacho">Despacho / Bodega</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
                <div class="form-group" id="admin-usuario-vendedor-group">
                    <label for="admin-usuario-vendedor" class="text-sm-bold">Vendedor Asociado</label>
                    <select id="admin-usuario-vendedor" class="admin-input">
                        <!-- Loaded dynamically -->
                    </select>
                </div>
                <div class="form-group-switch flex-between">
                    <span class="text-sm-bold">Fuerza Cambio de Clave</span>
                    <label class="switch">
                        <input type="checkbox" id="admin-usuario-debe-cambiar" checked>
                        <span class="slider round"></span>
                    </label>
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 8px; background:#6366f1;">Guardar Usuario</button>
            </form>
        </div>
    </div>
`,
  'modal-cartera-detalle': `
<div id="modal-cartera-detalle" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-cartera-title">Estado de Cartera</h3>
                <button class="btn-close-modal" onclick="document.getElementById('modal-cartera-detalle').classList.add('hidden')">×</button>
            </div>
            <div class="flex-col-gap">
                <div style="background:var(--bg-secondary); border-radius:var(--border-radius-md); padding:16px; text-align:left;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="font-size:0.85rem; color:var(--text-secondary);">Total Adeudado:</span>
                        <span id="modal-cartera-total-adeudado" style="font-weight:700; color:var(--danger-color);">$0</span>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span style="font-size:0.85rem; color:var(--text-secondary);">Vencido (>30d):</span>
                        <span id="modal-cartera-total-vencido" style="font-weight:700; color:var(--danger-color);">$0</span>
                    </div>
                </div>
                
                <button class="btn btn-outline btn-block" onclick="App.showAbonoModal()">Registrar Pago / Abono</button>
                
                <div id="modal-cartera-facturas" style="margin-top:10px; max-height:250px; overflow-y:auto; text-align:left;">
                    <!-- Cargado dinámicamente -->
                </div>
            </div>
        </div>
    </div>
`,

  inject(id) {
    if (!document.getElementById(id) && this[id]) {
      document.body.insertAdjacentHTML('beforeend', this[id]);
      // Optional: trigger lucide icon render for the newly injected modal
      if (typeof lucide !== 'undefined' && typeof App !== 'undefined' && App.refreshIcons) {
          App.refreshIcons();
      }
    }
  }
};
