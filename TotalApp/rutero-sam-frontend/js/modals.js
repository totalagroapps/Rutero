const AppModals = {

  'modal-confirm-checkout': 
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
  ,

  'modal-abono': <div id="modal-abono" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Registrar Pago / Abono</h3>
                <button class="btn-close-modal" onclick="App.closeAbonoModal()">×</button>
            </div>
            <form id="form-abono" onsubmit="App.handleSaveAbono(event)" style="padding-top: 12px; display:flex; flex-direction:column; gap:12px;">
                <div class="form-group">
                    <label for="abono-factura" style="font-size:0.72rem; font-weight:700;">Factura *</label>
                    <select id="abono-factura" required style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                        <!-- Loaded dynamically based on active client -->
                    </select>
                </div>
                <div class="form-group">
                    <label for="abono-monto" style="font-size:0.72rem; font-weight:700;">Monto a Pagar ($) *</label>
                    <input type="number" id="abono-monto" required min="1" step="0.01" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                </div>
                <div class="form-group">
                    <label for="abono-metodo" style="font-size:0.72rem; font-weight:700;">Método de Pago *</label>
                    <select id="abono-metodo" required style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="TARJETA">Tarjeta / POS</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="abono-notas" style="font-size:0.72rem; font-weight:700;">Notas Adicionales</label>
                    <textarea id="abono-notas" rows="2" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;"></textarea>
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 8px;">Registrar Pago</button>
            </form>
        </div>
    </div>,
  'modal-order-details': <div id="modal-order-details" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-order-code">Detalle del Pedido</h3>
                <button class="btn-close-modal" onclick="App.closeOrderModal()">×</button>
            </div>
            <div id="modal-order-body">
                <!-- Loaded dynamically -->
            </div>
        </div>
    </div>,
  'modal-admin-vendedor': <div id="modal-admin-vendedor" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-vendedor-title">Nuevo Vendedor</h3>
                <button class="btn-close-modal" onclick="App.closeVendedorModal()">×</button>
            </div>
            <form id="form-admin-vendedor" onsubmit="App.handleSaveVendedor(event)" style="padding-top: 12px;">
                <input type="hidden" id="admin-vendedor-id">
                <div class="form-group" style="margin-bottom:14px;">
                    <label for="admin-vendedor-nombre" style="font-size:0.75rem; font-weight:700;">Nombre Completo *</label>
                    <input type="text" id="admin-vendedor-nombre" required placeholder="Ej. Juan Pérez" style="width:100%; padding:10px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.85rem; margin-top:4px;">
                </div>
                <div class="form-group" style="margin-bottom:14px;">
                    <label for="admin-vendedor-zona" style="font-size:0.75rem; font-weight:700;">Zona de Cobertura *</label>
                    <input type="text" id="admin-vendedor-zona" required placeholder="Ej. Santiago Oriente" style="width:100%; padding:10px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.85rem; margin-top:4px;">
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 16px; background:#6366f1;">Guardar Vendedor</button>
            </form>
        </div>
    </div>,
  'modal-admin-cliente': <div id="modal-admin-cliente" class="modal-overlay hidden">
        <div class="modal-content" style="max-height:85vh;">
            <div class="modal-header">
                <h3 id="modal-cliente-admin-title">Nuevo Comercio</h3>
                <button class="btn-close-modal" onclick="App.closeClienteAdminModal()">×</button>
            </div>
            <form id="form-admin-cliente" onsubmit="App.handleSaveClienteAdmin(event)" style="padding-top: 12px; display:flex; flex-direction:column; gap:12px;">
                <input type="hidden" id="admin-cliente-id">
                <input type="hidden" id="admin-cliente-uuid">
                
                <div class="form-group">
                    <label for="admin-cliente-codigo" style="font-size:0.72rem; font-weight:700;">Código PDV *</label>
                    <input type="text" id="admin-cliente-codigo" required placeholder="Ej. PDV007" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                </div>
                <div class="form-group">
                    <label for="admin-cliente-nombre" style="font-size:0.72rem; font-weight:700;">Nombre del Comercio *</label>
                    <input type="text" id="admin-cliente-nombre" required placeholder="Ej. Minimarket Don Lucho" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                </div>
                <div class="form-group">
                    <label for="admin-cliente-encargado" style="font-size:0.72rem; font-weight:700;">Nombre del Encargado</label>
                    <input type="text" id="admin-cliente-encargado" placeholder="Ej. Luis Pérez" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                </div>
                <div class="form-group" style="position: relative;">
                    <label for="admin-cliente-direccion" style="font-size:0.72rem; font-weight:700;">Dirección Completa *</label>
                    <input type="text" id="admin-cliente-direccion" required placeholder="Ej. Av. Providencia 1250" autocomplete="off" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                    <ul id="admin-cliente-direccion-suggestions" class="autocomplete-suggestions hidden"></ul>
                </div>
                <div class="form-group-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label for="admin-cliente-lat" style="font-size:0.72rem; font-weight:700;">Latitud</label>
                        <input type="number" step="any" id="admin-cliente-lat" placeholder="-33.43" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                    </div>
                    <div class="form-group">
                        <label for="admin-cliente-lng" style="font-size:0.72rem; font-weight:700;">Longitud</label>
                        <input type="number" step="any" id="admin-cliente-lng" placeholder="-70.62" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                    </div>
                </div>

                <div class="form-group">
                    <label style="font-size:0.72rem; font-weight:700;">Seleccionar en Mapa</label>
                    <div id="admin-cliente-picker-map" style="height: 180px; width: 100%; border-radius: var(--border-radius-sm); border: 1px solid rgba(0,0,0,0.1); z-index: 1; margin-top: 4px;"></div>
                </div>

                <div class="form-group-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label for="admin-cliente-frecuencia" style="font-size:0.72rem; font-weight:700;">Frecuencia</label>
                        <select id="admin-cliente-frecuencia" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                            <option value="Semanal">Semanal</option>
                            <option value="Quincenal">Quincenal</option>
                            <option value="Mensual">Mensual</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="admin-cliente-secuencia" style="font-size:0.72rem; font-weight:700;">Secuencia</label>
                        <input type="number" id="admin-cliente-secuencia" required value="1" min="1" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                    </div>
                </div>
                <div class="form-group">
                    <label for="admin-cliente-vendedor" style="font-size:0.72rem; font-weight:700;">Vendedor Asignado</label>
                    <select id="admin-cliente-vendedor" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                        <!-- Loaded dynamically -->
                    </select>
                </div>
                <div class="form-group">
                    <label for="admin-cliente-tipo" style="font-size:0.72rem; font-weight:700;">Modalidad de Venta</label>
                    <select id="admin-cliente-tipo" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                        <option value="directo">Cliente Directo</option>
                        <option value="distribuidor">Distribuidor</option>
                    </select>
                </div>
                <div class="form-group-switch" style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
                    <span style="font-size:0.72rem; font-weight:700;">Comercio Activo</span>
                    <label class="switch">
                        <input type="checkbox" id="admin-cliente-activo" checked>
                        <span class="slider round"></span>
                    </label>
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 8px; background:#6366f1;">Guardar Comercio</button>
            </form>
        </div>
    </div>,
  'modal-admin-producto': <div id="modal-admin-producto" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-producto-title">Nuevo Producto</h3>
                <button class="btn-close-modal" onclick="App.closeProductoModal()">×</button>
            </div>
            <form id="form-admin-producto" onsubmit="App.handleSaveProducto(event)" style="padding-top: 12px; display:flex; flex-direction:column; gap:12px;">
                <input type="hidden" id="admin-producto-id">
                <div class="form-group">
                    <label for="admin-producto-sku" style="font-size:0.72rem; font-weight:700;">SKU *</label>
                    <input type="text" id="admin-producto-sku" required placeholder="Ej. PROD007" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                </div>
                <div class="form-group">
                    <label for="admin-producto-nombre" style="font-size:0.72rem; font-weight:700;">Nombre del Producto *</label>
                    <input type="text" id="admin-producto-nombre" required placeholder="Ej. Fanta 1.5L" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                </div>
                <div class="form-group-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label for="admin-producto-precio-directo" style="font-size:0.72rem; font-weight:700;">Precio Directo ($) *</label>
                        <input type="number" step="0.01" id="admin-producto-precio-directo" required placeholder="1200" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                    </div>
                </div>
                <div class="form-group-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label for="admin-producto-precio-distribuidor" style="font-size:0.72rem; font-weight:700;">Precio Dist. ($)</label>
                        <input type="number" step="0.01" id="admin-producto-precio-distribuidor" placeholder="1000" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                    </div>
                    <div class="form-group">
                        <label for="admin-producto-stock" style="font-size:0.72rem; font-weight:700;">Inventario Fábrica</label>
                        <input type="number" id="admin-producto-stock" value="100" min="0" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                    </div>
                </div>
                <div class="form-group-switch" style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
                    <span style="font-size:0.72rem; font-weight:700;">Disponible en Catálogo</span>
                    <label class="switch">
                        <input type="checkbox" id="admin-producto-activo" checked>
                        <span class="slider round"></span>
                    </label>
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 8px; background:#6366f1;">Guardar Producto</button>
            </form>
        </div>
    </div>,
  'modal-change-password': <div id="modal-change-password" class="modal-overlay hidden" style="z-index: 9999; backdrop-filter: blur(10px);">
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
                    <input type="password" id="change-password-nueva" required placeholder="Mínimo 8 caracteres con números o símbolos" style="width:100%; padding:10px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.85rem; margin-top:4px;">
                </div>
                <div class="form-group">
                    <label for="change-password-confirmar" style="font-size: 0.75rem; font-weight: 700;">Confirmar Nueva Contraseña *</label>
                    <input type="password" id="change-password-confirmar" required placeholder="Repite la contraseña" style="width:100%; padding:10px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.85rem; margin-top:4px;">
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 8px; background: #d97706; border-color: #d97706;">
                    Actualizar Contraseña
                </button>
            </form>
        </div>
    </div>,
  'modal-certificar-pedido': <div id="modal-certificar-pedido" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Certificar Despacho</h3>
                <button class="btn-close-modal" onclick="App.closeCertificarModal()">×</button>
            </div>
            <form id="form-certificar-pedido" onsubmit="App.handleSaveCertificacion(event)" style="padding-top: 12px; display:flex; flex-direction:column; gap:12px;">
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
    </div>,
  'modal-admin-usuario': <div id="modal-admin-usuario" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-usuario-title">Nuevo Usuario</h3>
                <button class="btn-close-modal" onclick="App.closeUsuarioModal()">×</button>
            </div>
            <form id="form-admin-usuario" onsubmit="App.handleSaveUsuario(event)" style="padding-top: 12px; display:flex; flex-direction:column; gap:12px;">
                <input type="hidden" id="admin-usuario-id">
                <div class="form-group">
                    <label for="admin-usuario-username" style="font-size:0.72rem; font-weight:700;">Nombre de Usuario (Username) *</label>
                    <input type="text" id="admin-usuario-username" required placeholder="Ej. vendedor1" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                </div>
                <div class="form-group" id="admin-usuario-password-group">
                    <label for="admin-usuario-password" style="font-size:0.72rem; font-weight:700;">Contraseña *</label>
                    <input type="password" id="admin-usuario-password" placeholder="Establecer contraseña" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                    <p class="help-text" id="admin-usuario-password-help" style="font-size:0.7rem; color:var(--text-secondary); margin-top:2px;">Dejar vacío para mantener contraseña actual.</p>
                </div>
                <div class="form-group">
                    <label for="admin-usuario-rol" style="font-size:0.72rem; font-weight:700;">Rol del Sistema *</label>
                    <select id="admin-usuario-rol" required onchange="App.handleUserRolChange()" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                        <option value="vendedor">Vendedor</option>
                        <option value="despacho">Despacho / Bodega</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
                <div class="form-group" id="admin-usuario-vendedor-group">
                    <label for="admin-usuario-vendedor" style="font-size:0.72rem; font-weight:700;">Vendedor Asociado</label>
                    <select id="admin-usuario-vendedor" style="width:100%; padding:8px; border-radius:var(--border-radius-sm); border:1px solid rgba(0,0,0,0.1); font-family:var(--font-body); font-size:0.8rem; margin-top:4px;">
                        <!-- Loaded dynamically -->
                    </select>
                </div>
                <div class="form-group-switch" style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
                    <span style="font-size:0.72rem; font-weight:700;">Fuerza Cambio de Clave</span>
                    <label class="switch">
                        <input type="checkbox" id="admin-usuario-debe-cambiar" checked>
                        <span class="slider round"></span>
                    </label>
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 8px; background:#6366f1;">Guardar Usuario</button>
            </form>
        </div>
    </div>,
  'modal-cartera-detalle': <div id="modal-cartera-detalle" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-cartera-title">Estado de Cartera</h3>
                <button class="btn-close-modal" onclick="document.getElementById('modal-cartera-detalle').classList.add('hidden')">×</button>
            </div>
            <div style="padding-top: 12px; display:flex; flex-direction:column; gap:12px;">
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
    </div>,

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
