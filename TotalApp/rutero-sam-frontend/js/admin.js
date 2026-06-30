const AdminController = {

    async loadAdminData() {
        try {
            App.state.adminVendedores = await ApiClient.getAdminVendedores();
            App.state.adminClientes = await ApiClient.getAdminClientes();
            App.state.adminProductos = await ApiClient.getAdminProductos();
            App.state.adminPedidos = await ApiClient.getAdminPedidos();
            
            // Populate vendedor selector in route map view and clients modal
            AdminController.populateAdminRouteVendedoresSelector();
            AdminController.populateAdminClientVendedoresSelector();
        } catch (e) {
            console.error("Error loading admin data", e);
            App.showToast("Error al cargar datos del servidor.", true);
        }
    },



    async loadAdminStats() {
        try {
            const stats = await ApiClient.getAdminStats();
            
            const atv = document.getElementById('admin-total-ventas'); if(atv) atv.innerText = `$${parseFloat(stats.total_ventas).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
            const apd = document.getElementById('admin-pedidos-despachados'); if(apd) apd.innerText = stats.pedidos_despachados;
            const app = document.getElementById('admin-pedidos-pendientes'); if(app) app.innerText = stats.pedidos_pendientes;
            const atve = document.getElementById('admin-total-vendedores'); if(atve) atve.innerText = stats.total_vendedores;

            AdminController.renderAdminStatsChart(stats);
        } catch (e) {
            console.error("Error loading admin stats", e);
        }
    },



    renderAdminStatsChart(stats) {
        const canvas = document.getElementById('chart-pedidos-estado');
        if (!canvas) return;

        if (App.state.adminChart) {
            App.state.adminChart.destroy();
        }

        App.state.adminChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Pendientes', 'Despachados', 'Cancelados'],
                datasets: [{
                    data: [stats.pedidos_pendientes, stats.pedidos_despachados, stats.pedidos_cancelados],
                    backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { family: 'Plus Jakarta Sans', size: 11 }
                        }
                    }
                }
            }
        });
    },


    renderAdminVendedores() {
        const tbody = document.getElementById('tbody-vendedores');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!App.state.adminVendedores || App.state.adminVendedores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state-text">No hay vendedores registrados.</td></tr>';
            return;
        }

        App.state.adminVendedores.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td ><b>${v.id}</b></td>
                <td class="td-medium">${App.escapeHtml(v.nombre)}</td>
                <td class="td-muted">${App.escapeHtml(v.zona)}</td>
                <td class="td-right">
                    <button class="admin-action-btn" onclick="AdminController.openVendedorModal(${JSON.stringify(v).replace(/"/g, '&quot;')})">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="admin-action-btn delete" onclick="AdminController.deleteVendedor(${v.id})">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        App.refreshIcons();
    },


    renderAdminClientes() {
        const tbody = document.getElementById('tbody-clientes');
        if (!tbody) return;
        tbody.innerHTML = '';

        const searchQuery = (document.getElementById('admin-cliente-search')?.value || '').toLowerCase().trim();

        const filtered = App.state.adminClientes.filter(c => {
            const matchesSearch = c.nombre.toLowerCase().includes(searchQuery) || 
                                  c.codigo_pdv.toLowerCase().includes(searchQuery) ||
                                  (c.encargado && c.encargado.toLowerCase().includes(searchQuery));
            return matchesSearch;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state-text">No se encontraron comercios.</td></tr>';
            return;
        }

        filtered.forEach(c => {
            const vendedor = App.state.adminVendedores.find(v => v.id === c.vendedor_id);
            const vendedorNombre = vendedor ? vendedor.nombre : '<span class="text-danger">Sin asignar</span>';
            const estadoBadge = c.activo 
                ? '<span class="status-badge dispatched">Activo</span>' 
                : '<span class="status-badge inactive">Inactivo</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td >
                    <div class="text-primary-bold">${App.escapeHtml(c.nombre)}</div>
                    <div class="text-xs-muted">${App.escapeHtml(c.codigo_pdv)} · ${c.encargado || 'Sin encargado'}</div>
                </td>
                <td style="padding: 14px 16px; max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-secondary);">${App.escapeHtml(c.direccion)}</td>
                <td class="td-medium">${vendedorNombre}</td>
                <td class="td-bold">#${c.secuencia_ruta}</td>
                <td >${estadoBadge}</td>
                <td class="td-right td-nowrap">
                    <button class="admin-action-btn" onclick="AdminController.openClienteAdminModal(${JSON.stringify(c).replace(/"/g, '&quot;')})">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="admin-action-btn delete" onclick="AdminController.deleteClienteAdmin(${c.id})">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Add search event listener once
        const searchInput = document.getElementById('admin-cliente-search');
        if (searchInput && !searchInput.dataset.hasListener) {
            searchInput.dataset.hasListener = 'true';
            searchInput.addEventListener('input', () => AdminController.renderAdminClientes());
        }
        App.refreshIcons();
    },


    renderAdminProductos() {
        const tbody = document.getElementById('tbody-productos');
        if (!tbody) return;
        tbody.innerHTML = '';

        const searchQuery = (document.getElementById('admin-producto-search')?.value || '').toLowerCase().trim();

        const filtered = App.state.adminProductos.filter(p => {
            return p.nombre.toLowerCase().includes(searchQuery) || p.sku.toLowerCase().includes(searchQuery);
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state-text">No se encontraron productos.</td></tr>';
            return;
        }

        filtered.forEach(p => {
            const estadoBadge = p.activo 
                ? '<span class="status-badge dispatched">Disponible</span>' 
                : '<span class="status-badge inactive">Oculto</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td ><code>${App.escapeHtml(p.sku)}</code></td>
                <td class="td-medium">${App.escapeHtml(p.nombre)}</td>
                <td style="padding:12px 16px;">$${parseFloat(p.precio_directo).toLocaleString('es-CO')}</td>
                <td style="padding:12px 16px;">${p.precio_distribuidor ? '$' + parseFloat(p.precio_distribuidor).toLocaleString('es-CO') : '-'}</td>
                <td style="padding:12px 16px;">${p.inventario_disponible}</td>
                <td >${estadoBadge}</td>
                <td class="td-right">
                    <button class="admin-action-btn" onclick="AdminController.openProductoModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="admin-action-btn delete" onclick="AdminController.deleteAdminProducto(${p.id})">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        const searchInput = document.getElementById('admin-producto-search');
        if (searchInput && !searchInput.dataset.hasListener) {
            searchInput.dataset.hasListener = 'true';
            searchInput.addEventListener('input', () => AdminController.renderAdminProductos());
        }
        App.refreshIcons();
    },


    renderAdminPedidos() {
        const tbody = document.getElementById('tbody-pedidos');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!App.state.adminPedidos || App.state.adminPedidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state-text">No se han tomado pedidos todavía.</td></tr>';
            return;
        }

        App.state.adminPedidos.forEach(p => {
            const cliente = App.state.adminClientes.find(c => c.id === p.cliente_id);
            const vendedor = App.state.adminVendedores.find(v => v.id === p.vendedor_id);
            
            const clienteNombre = cliente ? cliente.nombre : `Comercio #${p.cliente_id}`;
            const vendedorNombre = vendedor ? vendedor.nombre : `Vendedor #${p.vendedor_id}`;
            const fecha = new Date(p.fecha_hora).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

            let estadoClass = 'pending';
            if (p.estado_sincronizacion === 'DESPACHADO') estadoClass = 'dispatched';
            if (p.estado_sincronizacion === 'CANCELADO') estadoClass = 'canceled';

            let actionButtons = '';
            if (p.estado_sincronizacion === 'PENDIENTE') {
                actionButtons = `
                    <button class="btn btn-success btn-xs" onclick="AdminController.updatePedidoStatusAdmin(${p.id}, 'DESPACHADO')" style="font-size:0.65rem; padding:4px 8px; margin-right:4px;">Despachar</button>
                    <button class="btn btn-danger btn-xs" onclick="AdminController.updatePedidoStatusAdmin(${p.id}, 'CANCELADO')" style="font-size:0.65rem; padding:4px 8px;">Cancelar</button>
                `;
            } else {
                actionButtons = `<span style="font-size:0.72rem; color:var(--text-muted);">Sin acciones</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td >
                    <div class="text-primary-bold">#${p.id}</div>
                    <div class="text-xs-muted">${fecha}</div>
                </td>
                <td class="td-medium">${clienteNombre}</td>
                <td class="td-muted">${vendedorNombre}</td>
                <td style="padding: 14px 16px; font-weight:700; color:var(--text-primary);">$${parseFloat(p.total).toLocaleString('es-CO')}</td>
                <td ><span class="status-badge ${estadoClass}">${p.estado_sincronizacion}</span></td>
                <td class="td-right td-nowrap">
                    ${actionButtons}
                </td>
            `;
            tbody.appendChild(tr);
        });
        App.refreshIcons();
    },


    async updatePedidoStatusAdmin(pedidoId, nuevoEstado) {
        const action = nuevoEstado === 'DESPACHADO' ? 'despachar' : 'cancelar';
        if (!confirm(`¿Estás seguro de ${action} este pedido?`)) return;

        App.showToast(`Actualizando pedido #${pedidoId}...`);

        try {
            await ApiClient.updatePedidoStatus(pedidoId, nuevoEstado);
            App.showToast(`Pedido ${nuevoEstado === 'DESPACHADO' ? 'despachado' : 'cancelado'} con éxito.`);
            await AdminController.loadAdminData();
            AdminController.renderAdminPedidos();
        } catch (err) {
            App.showToast(err.message || 'Error al actualizar el pedido.', true);
        }
    },


    populateAdminRouteVendedoresSelector() {
        const select = document.getElementById('admin-select-vendedor-ruta');
        if (!select) return;
        
        const currentVal = select.value;
        select.innerHTML = '';

        if (!App.state.adminVendedores || App.state.adminVendedores.length === 0) {
            select.innerHTML = '<option value="">No hay vendedores</option>';
            return;
        }

        App.state.adminVendedores.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.innerText = `${App.escapeHtml(v.nombre)} (${App.escapeHtml(v.zona)})`;
            select.appendChild(opt);
        });

        if (currentVal && [...select.options].some(o => o.value === currentVal)) {
            select.value = currentVal;
        }
    },



    populateAdminClientVendedoresSelector() {
        const select = document.getElementById('admin-cliente-vendedor');
        if (!select) return;
        select.innerHTML = '<option value="">Sin vendedor asignado</option>';

        if (App.state.adminVendedores) {
            App.state.adminVendedores.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.id;
                opt.innerText = `${App.escapeHtml(v.nombre)} (${App.escapeHtml(v.zona)})`;
                select.appendChild(opt);
            });
        }
    },


    loadAdminRouteOnMap() {
        const select = document.getElementById('admin-select-vendedor-ruta');
        if (!select || !select.value) return;

        const vendedorId = parseInt(select.value, 10);
        
        // Filter clients assigned to this seller
        const clientsForSeller = App.state.adminClientes
            .filter(c => c.vendedor_id === vendedorId && c.activo)
            .sort((a, b) => a.secuencia_ruta - b.secuencia_ruta);

        // Fetch visit states if available (simulated or real from pending orders)
        const visitStates = {};
        if (App.state.adminPedidos) {
            App.state.adminPedidos.forEach(p => {
                if (p.vendedor_id === vendedorId) {
                    const client = App.state.clientes.find(c => c.id === p.cliente_id);
                    if (client) visitStates[client.codigo_pdv] = p.estado_sincronizacion === 'CANCELADO' ? 'no-sale' : 'visited';
                }
            });
        }

        AdminMapController.renderRoute(clientsForSeller, visitStates);
    },


    openVendedorModal(vendedor = null) {
        AppModals.inject('modal-admin-vendedor');
        document.getElementById('form-admin-vendedor').reset();
        document.getElementById('admin-vendedor-id').value = '';
        
        if (vendedor) {
            AppModals.inject('modal-vendedor-title'); document.getElementById('modal-vendedor-title').innerText = "Editar Vendedor";
            document.getElementById('admin-vendedor-id').value = vendedor.id;
            document.getElementById('admin-vendedor-nombre').value = vendedor.nombre;
            document.getElementById('admin-vendedor-zona').value = vendedor.zona;
        } else {
            AppModals.inject('modal-vendedor-title'); document.getElementById('modal-vendedor-title').innerText = "Nuevo Vendedor";
        }
        
        AppModals.inject('modal-admin-vendedor');
AppModals.inject('modal-admin-vendedor'); document.getElementById('modal-admin-vendedor').classList.remove('hidden');
    },



    closeVendedorModal() {
        AppModals.inject('modal-admin-vendedor'); document.getElementById('modal-admin-vendedor').classList.add('hidden');
    },



    async handleSaveVendedor(e) {
        e.preventDefault();
        const id = document.getElementById('admin-vendedor-id').value;
        const vendedor = {
            nombre: document.getElementById('admin-vendedor-nombre').value.trim(),
            zona: document.getElementById('admin-vendedor-zona').value.trim()
        };
        if (id) vendedor.id = parseInt(id, 10);

        try {
            await ApiClient.saveAdminVendedor(vendedor);
            App.showToast("Vendedor guardado con éxito.");
            AdminController.closeVendedorModal();
            await AdminController.loadAdminData();
            AdminController.renderAdminVendedores();
        } catch (err) {
            App.showToast(err.message, true);
        }
    },



    async deleteVendedor(id) {
        if (!confirm("¿Estás seguro de eliminar este vendedor?")) return;

        try {
            await ApiClient.deleteAdminVendedor(id);
            App.showToast("Vendedor eliminado.");
            await AdminController.loadAdminData();
            AdminController.renderAdminVendedores();
        } catch (err) {
            App.showToast(err.message, true);
        }
    },


    async importClientesExcel(event) {
        const file = event.target.files[0];
        if (!file) return;

        App.showToast("Subiendo y procesando Excel...");
        try {
            const result = await ApiClient.uploadAdminClientesExcel(file);
            App.showToast(result.message || "Clientes importados correctamente");
            App.loadAdminView('clientes');
        } catch (err) {
            console.error(err);
            App.showToast(err.message, true);
        }
        event.target.value = ''; // Reset input
    },



    openClienteAdminModal(cliente = null) {
        AppModals.inject('modal-admin-cliente');
        AdminController.populateAdminClientVendedoresSelector();
        document.getElementById('form-admin-cliente').reset();
        document.getElementById('admin-cliente-id').value = '';
        document.getElementById('admin-cliente-uuid').value = '';
        document.getElementById('admin-cliente-activo').checked = true;

        if (cliente) {
            AppModals.inject('modal-cliente-admin-title'); document.getElementById('modal-cliente-admin-title').innerText = "Editar Comercio";
            document.getElementById('admin-cliente-id').value = cliente.id;
            document.getElementById('admin-cliente-uuid').value = cliente.uuid_dispositivo || '';
            document.getElementById('admin-cliente-codigo').value = cliente.codigo_pdv;
            document.getElementById('admin-cliente-nombre').value = cliente.nombre;
            document.getElementById('admin-cliente-encargado').value = cliente.encargado || '';
            document.getElementById('admin-cliente-direccion').value = cliente.direccion;
            document.getElementById('admin-cliente-lat').value = cliente.latitud || '';
            document.getElementById('admin-cliente-lng').value = cliente.longitud || '';
            document.getElementById('admin-cliente-secuencia').value = cliente.secuencia_ruta;
            document.getElementById('admin-cliente-vendedor').value = cliente.vendedor_id || '';
            document.getElementById('admin-cliente-activo').checked = cliente.activo;
            document.getElementById('admin-cliente-tipo').value = cliente.tipo_cliente || 'directo';
            
            setTimeout(() => {
                PickerMapController.init('admin-cliente-picker-map', 'admin-cliente-lat', 'admin-cliente-lng', 'admin-cliente-direccion');
                if (cliente.latitud && cliente.longitud) {
                    PickerMapController.setCenter('admin-cliente-picker-map', cliente.latitud, cliente.longitud);
                }
            }, 300);
        } else {
            AppModals.inject('modal-cliente-admin-title'); document.getElementById('modal-cliente-admin-title').innerText = "Nuevo Comercio";
            document.getElementById('admin-cliente-secuencia').value = App.state.adminClientes.length + 1;
            document.getElementById('admin-cliente-codigo').value = `PDV${String(App.state.adminClientes.length + 1).padStart(3, '0')}`;
            
            setTimeout(() => {
                PickerMapController.init('admin-cliente-picker-map', 'admin-cliente-lat', 'admin-cliente-lng', 'admin-cliente-direccion');
            }, 300);
        }

        AppModals.inject('modal-admin-cliente');
AppModals.inject('modal-admin-cliente'); document.getElementById('modal-admin-cliente').classList.remove('hidden');
    },



    closeClienteAdminModal() {
        AppModals.inject('modal-admin-cliente'); document.getElementById('modal-admin-cliente').classList.add('hidden');
    },



    async handleSaveClienteAdmin(e) {
        e.preventDefault();
        const id = document.getElementById('admin-cliente-id').value;
        
        const latVal = document.getElementById('admin-cliente-lat').value;
        const lngVal = document.getElementById('admin-cliente-lng').value;
        const vendVal = document.getElementById('admin-cliente-vendedor').value;

        const cliente = {
            codigo_pdv: document.getElementById('admin-cliente-codigo').value.trim(),
            nombre: document.getElementById('admin-cliente-nombre').value.trim(),
            encargado: document.getElementById('admin-cliente-encargado').value.trim() || null,
            direccion: document.getElementById('admin-cliente-direccion').value.trim(),
            latitud: latVal ? parseFloat(latVal) : null,
            longitud: lngVal ? parseFloat(lngVal) : null,
            frecuencia: document.getElementById('admin-cliente-frecuencia').value,
            secuencia_ruta: parseInt(document.getElementById('admin-cliente-secuencia').value, 10),
            vendedor_id: vendVal ? parseInt(vendVal, 10) : null,
            activo: document.getElementById('admin-cliente-activo').checked,
            uuid_dispositivo: document.getElementById('admin-cliente-uuid').value || App.generateUUID(),
            tipo_cliente: document.getElementById('admin-cliente-tipo').value
        };
        if (id) cliente.id = parseInt(id, 10);

        try {
            await ApiClient.saveAdminCliente(cliente);
            App.showToast("Comercio guardado con éxito.");
            AdminController.closeClienteAdminModal();
            await AdminController.loadAdminData();
            AdminController.renderAdminClientes();
        } catch (err) {
            App.showToast(err.message, true);
        }
    },



    async deleteClienteAdmin(id) {
        if (!confirm("¿Estás seguro de desactivar este comercio?")) return;

        try {
            await ApiClient.deleteAdminCliente(id);
            App.showToast("Comercio desactivado.");
            await AdminController.loadAdminData();
            AdminController.renderAdminClientes();
        } catch (err) {
            App.showToast(err.message, true);
        }
    },


    openProductoModal(prod = null) {
        AppModals.inject('modal-admin-producto');
        document.getElementById('form-admin-producto').reset();
        document.getElementById('admin-producto-id').value = prod ? prod.id : '';
        document.getElementById('admin-producto-sku').value = prod ? prod.sku : '';
        document.getElementById('admin-producto-nombre').value = prod ? prod.nombre : '';
        document.getElementById('admin-producto-precio-directo').value = prod ? prod.precio_directo : '';
        document.getElementById('admin-producto-precio-distribuidor').value = prod ? (prod.precio_distribuidor || '') : '';
        document.getElementById('admin-producto-stock').value = prod ? prod.inventario_disponible : 0;
        document.getElementById('admin-producto-activo').checked = prod ? prod.activo : true;

        if (prod) {
            AppModals.inject('modal-producto-title'); document.getElementById('modal-producto-title').innerText = "Editar Producto";
        } else {
            AppModals.inject('modal-producto-title'); document.getElementById('modal-producto-title').innerText = "Nuevo Producto";
        }

        AppModals.inject('modal-admin-producto');
AppModals.inject('modal-admin-producto'); document.getElementById('modal-admin-producto').classList.remove('hidden');
    },



    closeProductoModal() {
        AppModals.inject('modal-admin-producto'); document.getElementById('modal-admin-producto').classList.add('hidden');
    },



    async handleSaveProducto(e) {
        e.preventDefault();
        const id = document.getElementById('admin-producto-id').value;
        const pd = parseFloat(document.getElementById('admin-producto-precio-directo').value);
        const pdistRaw = document.getElementById('admin-producto-precio-distribuidor').value;
        const pdist = pdistRaw ? parseFloat(pdistRaw) : null;
        
        const producto = {
            sku: document.getElementById('admin-producto-sku').value.trim(),
            nombre: document.getElementById('admin-producto-nombre').value.trim(),
            precio_directo: pd,
            precio_distribuidor: pdist,
            inventario_disponible: parseInt(document.getElementById('admin-producto-stock').value, 10),
            activo: document.getElementById('admin-producto-activo').checked
        };
        if (id) producto.id = parseInt(id, 10);

        try {
            await ApiClient.saveAdminProducto(producto);
            App.showToast("Producto guardado con éxito.");
            AdminController.closeProductoModal();
            await AdminController.loadAdminData();
            AdminController.renderAdminProductos();
        } catch (err) {
            App.showToast(err.message, true);
        }
    },



    async deleteAdminProducto(id) {
        if (!confirm("¿Estás seguro de ocultar/desactivar este producto?")) return;

        try {
            await ApiClient.deleteAdminProducto(id);
            App.showToast("Producto desactivado.");
            await AdminController.loadAdminData();
            AdminController.renderAdminProductos();
        } catch (err) {
            App.showToast(err.message, true);
        }
    },


    async renderAdminUsuarios() {
        const tbody = document.getElementById('tbody-usuarios');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Cargando usuarios...</td></tr>';

        try {
            const list = await ApiClient.getAdminUsuarios();
            App.state.adminUsuarios = list;
            tbody.innerHTML = '';

            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="empty-state-text">No hay usuarios de acceso registrados.</td></tr>';
                return;
            }

            list.forEach(u => {
                const vendedor = App.state.adminVendedores.find(v => v.id === u.vendedor_id);
                const vendedorNombre = vendedor ? vendedor.nombre : '<span style="color:var(--text-muted);">Ninguno</span>';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="td-bold">${App.escapeHtml(u.username)}</td>
                    <td ><span class="status-badge" style="background:#e0e7ff; color:#4338ca;">${u.rol.toUpperCase()}</span></td>
                    <td >${vendedorNombre}</td>
                    <td >
                        ${u.debe_cambiar_clave 
                            ? '<span class="status-badge critical" style="font-size:0.65rem;">SÍ (Pendiente)</span>' 
                            : '<span class="status-badge dispatched" style="font-size:0.65rem;">NO (Cambiada)</span>'}
                    </td>
                    <td class="td-right">
                        <button class="admin-action-btn" onclick="AdminController.openUsuarioModal(${JSON.stringify(u).replace(/"/g, '&quot;')})">
                            <i data-lucide="edit-2"></i>
                        </button>
                        <button class="admin-action-btn delete" onclick="AdminController.deleteUsuario(${u.id})">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            App.refreshIcons();
        } catch (e) {
            console.error("Error loading users", e);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--danger-color);">Error al cargar usuarios de acceso.</td></tr>';
        }
    },



    openUsuarioModal(usuario = null) {
        AppModals.inject('modal-admin-usuario');
        document.getElementById('form-admin-usuario').reset();
        document.getElementById('admin-usuario-id').value = '';
        document.getElementById('admin-usuario-debe-cambiar').checked = true;

        const selectVendedor = document.getElementById('admin-usuario-vendedor');
        selectVendedor.innerHTML = '<option value="">Selecciona un vendedor</option>';
        if (App.state.adminVendedores) {
            App.state.adminVendedores.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.id;
                opt.innerText = v.nombre;
                selectVendedor.appendChild(opt);
            });
        }

        const passInput = document.getElementById('admin-usuario-password');
        const passHelp = document.getElementById('admin-usuario-password-help');

        if (usuario) {
            AppModals.inject('modal-usuario-title'); document.getElementById('modal-usuario-title').innerText = "Editar Usuario";
            document.getElementById('admin-usuario-id').value = usuario.id;
            document.getElementById('admin-usuario-username').value = usuario.username;
            document.getElementById('admin-usuario-rol').value = usuario.rol;
            document.getElementById('admin-usuario-vendedor').value = usuario.vendedor_id || '';
            document.getElementById('admin-usuario-debe-cambiar').checked = usuario.debe_cambiar_clave;
            
            passInput.required = false;
            if (passHelp) passHelp.style.display = 'block';
        } else {
            AppModals.inject('modal-usuario-title'); document.getElementById('modal-usuario-title').innerText = "Nuevo Usuario";
            passInput.required = true;
            if (passHelp) passHelp.style.display = 'none';
        }

        AdminController.handleUserRolChange();
        AppModals.inject('modal-admin-usuario');
AppModals.inject('modal-admin-usuario'); document.getElementById('modal-admin-usuario').classList.remove('hidden');
    },



    closeUsuarioModal() {
        AppModals.inject('modal-admin-usuario'); document.getElementById('modal-admin-usuario').classList.add('hidden');
    },



    handleUserRolChange() {
        const rolSelect = document.getElementById('admin-usuario-rol');
        const vendedorGroup = document.getElementById('admin-usuario-vendedor-group');
        const vendedorSelect = document.getElementById('admin-usuario-vendedor');

        if (rolSelect.value === 'vendedor') {
            vendedorGroup.style.display = 'block';
            vendedorSelect.required = true;
        } else {
            vendedorGroup.style.display = 'none';
            vendedorSelect.required = false;
            vendedorSelect.value = '';
        }
    },



    async handleSaveUsuario(e) {
        e.preventDefault();
        const id = document.getElementById('admin-usuario-id').value;
        const passVal = document.getElementById('admin-usuario-password').value;
        const vendVal = document.getElementById('admin-usuario-vendedor').value;

        const usuario = {
            username: document.getElementById('admin-usuario-username').value.trim(),
            rol: document.getElementById('admin-usuario-rol').value,
            vendedor_id: vendVal ? parseInt(vendVal, 10) : null,
            debe_cambiar_clave: document.getElementById('admin-usuario-debe-cambiar').checked
        };

        if (id) {
            usuario.id = parseInt(id, 10);
            if (passVal) usuario.password = passVal;
        } else {
            if (!passVal) {
                App.showToast("Por favor define la contraseña.", true);
                return;
            }
            usuario.password = passVal;
        }

        if (usuario.rol === 'vendedor' && !usuario.vendedor_id) {
            App.showToast("Los usuarios vendedores deben tener un vendedor_id asociado.", true);
            return;
        }

        try {
            await ApiClient.saveAdminUsuario(usuario);
            App.showToast("Usuario guardado con éxito.");
            AdminController.closeUsuarioModal();
            AdminController.renderAdminUsuarios();
        } catch (err) {
            App.showToast(err.message, true);
        }
    },



    async deleteUsuario(id) {
        if (!confirm("¿Estás seguro de eliminar este usuario de acceso?")) return;

        try {
            await ApiClient.deleteAdminUsuario(id);
            App.showToast("Usuario eliminado.");
            AdminController.renderAdminUsuarios();
        } catch (err) {
            App.showToast(err.message, true);
        }
    },

    openPurgeModal() {
        const modal = document.getElementById('modal-purge-data');
        const input = document.getElementById('purge-confirmation-input');
        const btn = document.getElementById('btn-confirm-purge');
        
        input.value = '';
        btn.disabled = true;
        
        input.oninput = (e) => {
            btn.disabled = e.target.value !== 'PURGAR';
        };
        
        modal.style.display = 'flex';
    },
    
    closePurgeModal() {
        document.getElementById('modal-purge-data').style.display = 'none';
    },
    
    async executePurge() {
        const purgePedidos = document.getElementById('chk-purge-pedidos').checked;
        const purgeVisitas = document.getElementById('chk-purge-visitas').checked;
        const purgeClientes = document.getElementById('chk-purge-clientes').checked;
        
        if (!purgePedidos && !purgeVisitas && !purgeClientes) {
            App.showToast("Selecciona al menos una opción para purgar.", true);
            return;
        }

        const btn = document.getElementById('btn-confirm-purge');
        btn.disabled = true;
        btn.innerText = "Purgando...";

        try {
            await ApiClient.purgeData({
                purge_pedidos: purgePedidos,
                purge_visitas: purgeVisitas,
                purge_clientes: purgeClientes
            });
            App.showToast("¡Datos de prueba purgados exitosamente!");
            AdminController.closePurgeModal();
            AdminController.renderAdminDashboard(); // Refresh stats
        } catch (err) {
            App.showToast(err.message, true);
        } finally {
            btn.innerText = "Eliminar Datos";
        }
    },

    // --- RADAR LOGIC ---
    async initRadarMap() {
        if (!this.radarMap) {
            this.radarMap = L.map('radar-map').setView([4.7110, -74.0721], 6); // Default Colombia
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(this.radarMap);
            
            this.radarMarkers = {};
        }
        
        // Ensure map renders correctly if container was hidden
        setTimeout(() => this.radarMap.invalidateSize(), 300);
        
        await this.refreshRadarMap();
        
        // Auto refresh every 30 seconds while on this view
        if (this._radarInterval) clearInterval(this._radarInterval);
        this._radarInterval = setInterval(() => {
            if (document.getElementById('view-admin-radar').classList.contains('active')) {
                this.refreshRadarMap(true);
            }
        }, 30000);
    },
    
    async refreshRadarMap(silent = false) {
        if (!silent) App.showToast("Actualizando posiciones...");
        try {
            const data = await ApiClient.getLatestTracking();
            
            let bounds = [];
            data.forEach(vendedor => {
                const lat = parseFloat(vendedor.latitud);
                const lng = parseFloat(vendedor.longitud);
                if (isNaN(lat) || isNaN(lng)) return;
                
                const timeAgo = new Date(vendedor.fecha_hora).toLocaleTimeString();
                const batteryInfo = vendedor.bateria ? `🔋 ${vendedor.bateria}%` : '';
                
                const popupContent = `
                    <div style="font-family:var(--font-body); font-size:14px; text-align:center;">
                        <strong>${App.escapeHtml(vendedor.nombre)}</strong><br>
                        ⏱️ ${timeAgo} <br>
                        ${batteryInfo}
                    </div>
                `;
                
                if (this.radarMarkers[vendedor.vendedor_id]) {
                    this.radarMarkers[vendedor.vendedor_id].setLatLng([lat, lng]);
                    this.radarMarkers[vendedor.vendedor_id].getPopup().setContent(popupContent);
                } else {
                    const marker = L.marker([lat, lng]).addTo(this.radarMap)
                        .bindPopup(popupContent);
                    this.radarMarkers[vendedor.vendedor_id] = marker;
                }
                
                bounds.push([lat, lng]);
            });
            
            if (bounds.length > 0 && !silent) {
                this.radarMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
        } catch (e) {
            console.error("Error fetching radar:", e);
            if (!silent) App.showToast("Error cargando radar", true);
        }
    },
};

window.Admin = AdminController;
