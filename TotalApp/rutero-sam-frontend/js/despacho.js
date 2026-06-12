const DespachoController = {

    async loadDespachoData() {
        try {
            App.showToast("Cargando datos de despacho...");
            const pedidos = await ApiClient.getDespachoPedidos();
            App.state.despachoPedidos = pedidos;

            const catalogo = await ApiClient.getCatalogo();
            App.state.catalogo = catalogo;
            localStorage.setItem('sam_cache_catalogo', JSON.stringify(catalogo));

            App.renderDespachoDashboard();
        } catch (e) {
            console.error("Error loading despacho data", e);
            App.showToast("Error al cargar datos del servidor.", true);
        }
    },



    renderDespachoDashboard() {
        if (!App.state.despachoPedidos) App.state.despachoPedidos = [];
        if (!App.state.catalogo) App.state.catalogo = [];

        const pendingCount = App.state.despachoPedidos.filter(o => o.estado_sincronizacion === 'PENDIENTE').length;
        document.getElementById('despacho-pending-count').innerText = pendingCount.toString();

        const lowStockCount = App.state.catalogo.filter(p => p.inventario_disponible < 20).length;
        document.getElementById('despacho-stock-alert-count').innerText = lowStockCount.toString();
    },



    renderDespachoInventario(filterText = '') {
        const tbody = document.getElementById('tbody-despacho-stock');
        if (!tbody) return;
        tbody.innerHTML = '';

        const query = filterText.toLowerCase().trim();
        const filtered = App.state.catalogo.filter(p => {
            return p.nombre.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state-text">No se encontraron productos.</td></tr>';
            return;
        }

        filtered.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td ><code>${App.escapeHtml(p.sku)}</code></td>
                <td class="td-medium">${App.escapeHtml(p.nombre)}</td>
                <td class="td-bold">
                    <input type="number" id="stock-input-${p.id}" value="${p.inventario_disponible}" min="0" style="width: 80px; padding: 6px; border: 1px solid rgba(0,0,0,0.1); border-radius: var(--border-radius-sm); font-weight:700; text-align:center;">
                </td>
                <td class="td-right">
                    <button class="btn btn-success btn-xs" onclick="App.handleUpdateStock(${p.id})" style="font-size:0.75rem; padding:6px 12px; background:#10b981; border-color:#10b981;">
                        <i data-lucide="save" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Guardar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        App.refreshIcons();
    },



    async handleUpdateStock(productoId) {
        const input = document.getElementById(`stock-input-${productoId}`);
        const stock = parseInt(input.value, 10);
        
        if (isNaN(stock) || stock < 0) {
            App.showToast("Ingresa un stock válido.", true);
            return;
        }

        App.showToast("Actualizando stock...");

        try {
            const updatedProd = await ApiClient.updateProductoStock(productoId, stock);
            
            const idx = App.state.catalogo.findIndex(p => p.id === productoId);
            if (idx !== -1) {
                App.state.catalogo[idx] = updatedProd;
                localStorage.setItem('sam_cache_catalogo', JSON.stringify(App.state.catalogo));
            }

            App.showToast("Stock actualizado con éxito.");
            App.renderDespachoDashboard();
            App.renderDespachoInventario(document.getElementById('despacho-stock-search').value);
        } catch (err) {
            App.showToast("Error al actualizar stock.", true);
        }
    },



    renderDespachoCertificar(filterText = '') {
        const tbody = document.getElementById('tbody-despacho-pedidos');
        if (!tbody) return;
        tbody.innerHTML = '';

        const query = filterText.toLowerCase().trim();
        const filtered = App.state.despachoPedidos.filter(p => {
            const cliente = App.state.clientes.find(c => c.id === p.cliente_id) || { nombre: '' };
            return cliente.nombre.toLowerCase().includes(query) || p.id.toString().includes(query);
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state-text">No se encontraron pedidos.</td></tr>';
            return;
        }

        filtered.forEach(p => {
            const cliente = App.state.clientes.find(c => c.id === p.cliente_id) || { nombre: `Comercio #${p.cliente_id}` };
            const fecha = new Date(p.fecha_hora).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
            
            let certHtml = '';
            let actionHtml = '';

            if (p.estado_sincronizacion === 'PENDIENTE') {
                certHtml = '<span style="color:var(--text-muted); font-style:italic;">Pendiente de certificar</span>';
                actionHtml = `
                    <button class="btn btn-primary btn-xs" onclick="App.openCertificarModal(${p.id}, '${cliente.nombre.replace(/'/g, "\\'")}')" style="font-size:0.75rem; padding:6px 12px; background:#3b82f6; border-color:#3b82f6;">
                        Certificar
                    </button>
                `;
            } else if (p.estado_sincronizacion === 'DESPACHADO') {
                certHtml = `<div style="max-width:180px; font-size:0.75rem; color:var(--text-secondary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="${p.certificacion_despacho || ''}"><b>Certificado:</b> ${p.certificacion_despacho || 'Despachado'}</div>`;
                actionHtml = '<span style="font-size:0.72rem; color:#10b981; font-weight:700; display:flex; align-items:center; gap:2px;"><i data-lucide="check-circle" style="width:12px; height:12px;"></i> Despachado</span>';
            } else {
                certHtml = `<span style="color:var(--danger-color); font-weight:600;">Cancelado</span>`;
                actionHtml = '<span style="font-size:0.72rem; color:var(--text-muted);">Sin acción</span>';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td ><b>#PED-${p.id}</b></td>
                <td class="td-medium">${cliente.nombre}</td>
                <td style="padding: 14px 16px; font-size:0.75rem; color:var(--text-secondary);">${fecha}</td>
                <td >${certHtml}</td>
                <td class="td-right">${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });
        App.refreshIcons();
    },



    openCertificarModal(pedidoId, clienteNombre) {
        AppModals.inject('modal-certificar-pedido');
        document.getElementById('certificar-pedido-id').value = pedidoId;
        document.getElementById('certificar-pedido-label').innerText = `#PED-${pedidoId}`;
        document.getElementById('certificar-cliente-label').innerText = clienteNombre;
        document.getElementById('certificar-texto').value = '';
        
        AppModals.inject('modal-certificar-pedido');
AppModals.inject('modal-certificar-pedido'); document.getElementById('modal-certificar-pedido').classList.remove('hidden');
    },



    closeCertificarModal() {
        AppModals.inject('modal-certificar-pedido'); document.getElementById('modal-certificar-pedido').classList.add('hidden');
    },



    async handleSaveCertificacion(e) {
        e.preventDefault();
        const pedidoId = parseInt(document.getElementById('certificar-pedido-id').value, 10);
        const certificacion = document.getElementById('certificar-texto').value.trim();

        if (!certificacion) {
            App.showToast("Ingresa los detalles de certificación.", true);
            return;
        }

        App.showToast("Guardando certificación...");

        try {
            const updatedOrder = await ApiClient.certificarPedido(pedidoId, certificacion);
            
            const idx = App.state.despachoPedidos.findIndex(o => o.id === pedidoId);
            if (idx !== -1) {
                App.state.despachoPedidos[idx] = updatedOrder;
            }

            App.showToast("Pedido certificado y despachado.");
            App.closeCertificarModal();
            App.renderDespachoDashboard();
            App.renderDespachoCertificar(document.getElementById('despacho-pedidos-search').value);
        } catch (err) {
            App.showToast("Error al guardar la certificación.", true);
        }
    },

};
