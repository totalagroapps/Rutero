const ClienteController = {

    initClientInventory() {
        const key = `sam_inventory_${App.state.activeClient.id}`;
        const cached = localStorage.getItem(key);
        if (cached) {
            App.state.clienteInventory = JSON.parse(cached);
        } else {
            // Seed a default inventory stock level for demonstration
            const mockInv = {};
            App.state.catalogo.forEach((p, idx) => {
                const stockLevels = [25, 4, 15, 8, 30, 2];
                mockInv[p.id] = stockLevels[idx % stockLevels.length];
            });
            App.state.clienteInventory = mockInv;
            localStorage.setItem(key, JSON.stringify(mockInv));
        }
    },

    saveClientInventory() {
        const key = `sam_inventory_${App.state.activeClient.id}`;
        localStorage.setItem(key, JSON.stringify(App.state.clienteInventory));
    },

    // Initialize client local sales
    initClientSales() {
        const key = `sam_sales_${App.state.activeClient.id}`;
        const cached = localStorage.getItem(key);
        if (cached) {
            App.state.clienteSales = JSON.parse(cached);
        } else {
            const mockSales = [
                {
                    id: 28,
                    fecha: new Date().toISOString(),
                    total: 5200,
                    detalles: [
                        { producto_id: 1, nombre: "Coca Cola 1.5L", cantidad: 2, precio_unitario: 1500 },
                        { producto_id: 2, nombre: "Papa Frita Lay's Familiar", cantidad: 1, precio_unitario: 2200 }
                    ]
                }
            ];
            App.state.clienteSales = mockSales;
            localStorage.setItem(key, JSON.stringify(mockSales));
        }
    },

    saveClientSales() {
        const key = `sam_sales_${App.state.activeClient.id}`;
        localStorage.setItem(key, JSON.stringify(App.state.clienteSales));
    },

    // Render Cliente Dashboard
    renderClienteDashboard() {
        document.getElementById('cliente-welcome-title').innerText = `Hola, ${App.state.activeClient.nombre}`;
        
        // Count totals
        // 1. Incoming pending orders
        const pendingCount = App.state.clientOrders.filter(o => o.estado_sincronizacion === 'PENDIENTE').length;
        document.getElementById('cliente-incoming-count').innerText = pendingCount.toString();

        // 2. Inventory total items
        const totalItems = Object.values(App.state.clienteInventory).reduce((sum, qty) => sum + qty, 0);
        document.getElementById('cliente-inventory-count').innerText = totalItems.toString();

        // 3. Low stock count (less than 10 units)
        const lowStockCount = Object.keys(App.state.clienteInventory).filter(prodId => App.state.clienteInventory[prodId] < 10).length;
        document.getElementById('cliente-low-stock-count').innerText = lowStockCount.toString();

        // 4. Sales recorded today
        const today = new Date().toDateString();
        const todaySales = App.state.clienteSales.filter(s => new Date(s.fecha).toDateString() === today);
        const totalSalesToday = todaySales.reduce((sum, s) => sum + parseFloat(s.total), 0);
        document.getElementById('cliente-sales-count').innerText = `$${totalSalesToday.toLocaleString('es-CL')}`;

        // Periodically fetch pending orders in background to keep dashboard fresh
        App.fetchClientOrdersBackground();
    },

    async fetchClientOrdersBackground() {
        try {
            const list = await ApiClient.getClientPedidos(App.state.activeClient.id);
            App.state.clientOrders = list;
            
            // Update UI widgets
            const pendingCount = list.filter(o => o.estado_sincronizacion === 'PENDIENTE').length;
            document.getElementById('cliente-incoming-count').innerText = pendingCount.toString();
        } catch(e) {
            console.log("Offline or server down, skipping background orders fetch.");
        }
    },

    // Fetch and render incoming salesperson orders for the client
    async fetchAndRenderClientePedidos() {
        const container = document.getElementById('cliente-pedidos-list-container');
        container.innerHTML = '<p style="text-align:center; padding: 20px;">Buscando pedidos en Railway...</p>';

        try {
            const list = await ApiClient.getClientPedidos(App.state.activeClient.id);
            App.state.clientOrders = list;
            
            App.renderClientePedidosList();
        } catch(e) {
            console.warn("Could not load live client orders, rendering cached local ones", e);
            App.renderClientePedidosList();
        }
    },

    renderClientePedidosList() {
        const container = document.getElementById('cliente-pedidos-list-container');
        container.innerHTML = '';

        const filter = App.state.clientePedidosFilter; // PENDIENTE (Por recibir), DESPACHADO/RECIBIDO (Recibidos)
        
        let filtered = [];
        if (filter === 'PENDIENTE') {
            filtered = App.state.clientOrders.filter(o => o.estado_sincronizacion === 'PENDIENTE');
        } else {
            filtered = App.state.clientOrders.filter(o => o.estado_sincronizacion === 'DESPACHADO' || o.estado_sincronizacion === 'RECIBIDO');
        }

        if (filtered.length === 0) {
            container.innerHTML = `<p class="empty-state-text">No hay pedidos en esta sección.</p>`;
            return;
        }

        filtered.forEach(o => {
            const formattedDate = new Date(o.fecha_hora).toLocaleDateString('es-CL', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            const card = document.createElement('div');
            card.className = 'order-history-card';
            card.onclick = () => App.openOrderModal(o);
            card.innerHTML = `
                <div class="order-history-header">
                    <span class="order-code">#PED-${o.id}</span>
                    <span class="order-status ${o.estado_sincronizacion.toLowerCase()}">${o.estado_sincronizacion === 'PENDIENTE' ? 'Por recibir' : 'Recibido'}</span>
                </div>
                <div class="order-history-details">
                    <span>Vendedor: <span class="client-name">${App.state.vendedor ? App.state.vendedor.nombre : (App.state.user ? App.state.user.username : 'Asignado')}</span></span>
                    <span>${formattedDate}</span>
                </div>
                <div class="order-history-footer">
                    <span>Total pedido</span>
                    <span class="price">$${parseFloat(o.total).toLocaleString('es-CL')}</span>
                </div>
            `;
            container.appendChild(card);
        });
    },

    // Cliente - Inventario view
    renderClienteInventario(filterText = '') {
        const container = document.getElementById('cliente-inventario-container');
        container.innerHTML = '';

        const filtered = App.state.catalogo.filter(prod => {
            const query = filterText.toLowerCase();
            return prod.nombre.toLowerCase().includes(query) || prod.sku.toLowerCase().includes(query);
        });

        filtered.forEach(prod => {
            const stock = App.state.clienteInventory[prod.id] || 0;
            
            let badgeClass = 'normal';
            let badgeText = 'Normal';
            if (stock < 5) {
                badgeClass = 'critical';
                badgeText = 'Crítico';
            } else if (stock < 15) {
                badgeClass = 'low';
                badgeText = 'Bajo';
            }

            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-details">
                    <span class="product-sku">${prod.sku}</span>
                    <h4 class="product-name">${prod.nombre}</h4>
                    <span class="product-price">$${parseFloat(prod.precio).toLocaleString('es-CL')}</span>
                </div>
                <div style="text-align: right; display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                    <span class="product-stock" style="font-weight: 700; color: var(--text-primary);">Stock: ${stock} u</span>
                    <span class="status-badge ${badgeClass}">${badgeText}</span>
                </div>
            `;
            container.appendChild(card);
        });
    },

    // Cliente - New local sale form
    renderClienteVentaForm() {
        App.renderClienteVentaProducts();
    },

    renderClienteVentaProducts(filterText = '') {
        const container = document.getElementById('cliente-sale-products-list');
        container.innerHTML = '';

        // Only list products that have stock > 0 in the client's shop!
        const availableProducts = App.state.catalogo.filter(prod => {
            const stock = App.state.clienteInventory[prod.id] || 0;
            return stock > 0;
        });

        const filtered = availableProducts.filter(prod => {
            const query = filterText.toLowerCase();
            return prod.nombre.toLowerCase().includes(query) || prod.sku.toLowerCase().includes(query);
        });

        if (filtered.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-muted);">No hay productos con stock disponible.</p>';
            return;
        }

        filtered.forEach(prod => {
            const qty = App.state.cart[prod.id] || 0;
            const stock = App.state.clienteInventory[prod.id];
            
            const item = document.createElement('div');
            item.className = 'order-select-card';
            item.innerHTML = `
                <div class="order-select-info">
                    <span class="name">${prod.nombre}</span>
                    <div class="price">$${parseFloat(prod.precio).toLocaleString('es-CL')} <span style="font-size:0.65rem; color:var(--text-secondary); font-weight:normal;">(Stock: ${stock})</span></div>
                </div>
                <div class="order-qty-control">
                    <button type="button" class="qty-btn" onclick="App.updateCartQty(${prod.id}, -1)" ${qty === 0 ? 'disabled' : ''}>-</button>
                    <span class="qty-val">${qty}</span>
                    <button type="button" class="qty-btn" onclick="App.updateCartQty(${prod.id}, 1)" ${qty >= stock ? 'disabled' : ''}>+</button>
                </div>
            `;
            container.appendChild(item);
        });

        App.calculateOrderTotals();
    },

    completeClienteSale() {
        const cartKeys = Object.keys(App.state.cart);
        if (cartKeys.length === 0) {
            App.showToast("Agrega productos a la venta.", true);
            return;
        }

        let total = 0;
        const details = [];

        // Deduct stock and compile details
        for (let prodId of cartKeys) {
            const prod = App.state.catalogo.find(p => p.id === parseInt(prodId, 10));
            const qty = App.state.cart[prodId];
            if (prod) {
                const currentStock = App.state.clienteInventory[prod.id] || 0;
                if (qty > currentStock) {
                    App.showToast(`Stock insuficiente para ${prod.nombre}`, true);
                    return;
                }
                
                // Subtract stock
                App.state.clienteInventory[prod.id] = currentStock - qty;
                total += qty * parseFloat(prod.precio);
                details.push({
                    producto_id: prod.id,
                    nombre: prod.nombre,
                    cantidad: qty,
                    precio_unitario: parseFloat(prod.precio)
                });
            }
        }

        // Save inventory changes
        App.saveClientInventory();

        // Create sale record
        const newSale = {
            id: App.state.clienteSales.length + 100,
            fecha: new Date().toISOString(),
            total: total,
            detalles: details
        };

        App.state.clienteSales.push(newSale);
        App.saveClientSales();

        App.showToast("Venta finalizada con éxito.");
        App.state.cart = {};
        
        App.navigateToView('cliente-dashboard');
    },

    // Cliente - Sales History list
    renderClientSalesHistorial(filter = 'hoy') {
        const container = document.getElementById('cliente-ventas-list-container');
        container.innerHTML = '';

        let list = [...App.state.clienteSales];
        list.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

        // Apply date filtering
        const today = new Date().toDateString();
        const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
        const oneMonthAgo = new Date(Date.now() - 30 * 86400000);

        const filtered = list.filter(s => {
            const sDate = new Date(s.fecha);
            if (filter === 'hoy') {
                return sDate.toDateString() === today;
            } else if (filter === 'semana') {
                return sDate >= oneWeekAgo;
            } else {
                return sDate >= oneMonthAgo;
            }
        });

        if (filtered.length === 0) {
            container.innerHTML = `<p class="empty-state-text">No hay ventas registradas en esta fecha.</p>`;
            return;
        }

        filtered.forEach(s => {
            const formattedDate = new Date(s.fecha).toLocaleDateString('es-CL', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            // Count items
            const qty = s.detalles.reduce((sum, item) => sum + item.cantidad, 0);

            const card = document.createElement('div');
            card.className = 'order-history-card';
            card.innerHTML = `
                <div class="order-history-header">
                    <span class="order-code" style="color:var(--success-color);">#VEN-${s.id}</span>
                    <span class="order-status" style="background:#e6fcf5; color:#0c8599;">Vendido</span>
                </div>
                <div class="order-history-details">
                    <span>Artículos vendidos: <b>${qty} u</b></span>
                    <span>${formattedDate}</span>
                </div>
                <div class="order-history-footer">
                    <span>Total venta</span>
                    <span class="price" style="color:var(--success-color);">$${parseFloat(s.total).toLocaleString('es-CL')}</span>
                </div>
            `;
            container.appendChild(card);
        });
    },

    filterVentasList(filter) {
        document.querySelectorAll('#view-cliente-ventas-historial .view-switcher .switch-btn').forEach(btn => {
            if (btn.getAttribute('data-ventas-filter') === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        App.renderClientSalesHistorial(filter);
    },


    // ==================== ORDER DETAIL MODALS ====================
    openOrderModal(order) {
        AppModals.inject('modal-order-details');
        AppModals.inject('modal-order-details');
        AppModals.inject('modal-order-details'); const modal = document.getElementById('modal-order-details');
        AppModals.inject('modal-order-code');
        AppModals.inject('modal-order-code'); const codeEl = document.getElementById('modal-order-code');
        AppModals.inject('modal-order-body');
        AppModals.inject('modal-order-body'); const bodyEl = document.getElementById('modal-order-body');

        codeEl.innerText = `Pedido #PED-${order.id || 'PENDIENTE'}`;
        
        const client = App.state.clientes.find(c => c.id === order.cliente_id) || { nombre: 'Cliente' };
        const formattedDate = new Date(order.fecha_hora).toLocaleDateString('es-CL', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        let detailsHtml = '<p style="text-align:center; padding:10px;">Cargando artículos...</p>';
        
        // Compile items list from order details
        if (order.detalles && order.detalles.length > 0) {
            let itemsRows = '';
            order.detalles.forEach(d => {
                const prod = App.state.catalogo.find(p => p.id === d.producto_id) || { nombre: 'Producto General' };
                const totalRow = d.cantidad * parseFloat(d.precio_unitario);
                itemsRows += `
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.03);">
                        <div style="flex:1;">
                            <b>${prod.nombre}</b><br>
                            <span style="color:var(--text-secondary); font-size:0.75rem;">$${parseFloat(d.precio_unitario).toLocaleString('es-CL')} x ${d.cantidad} u</span>
                        </div>
                        <div style="font-weight:700; color:var(--text-primary);">$${totalRow.toLocaleString('es-CL')}</div>
                    </div>
                `;
            });

            // Save to App context for PDF generation
            App.currentViewedOrder = order;
            App.currentViewedClient = client;
            App.currentViewedSeller = App.state.user ? App.state.user.username : (App.state.vendedor ? App.state.vendedor.nombre : 'Administrador');

            let actionBtnHtml = `
                <button class="btn btn-outline btn-block" style="margin-top:12px; display:flex; align-items:center; justify-content:center; gap:8px; border-color:var(--primary-color); color:var(--primary-color);" onclick="PdfGenerator.generateOrderReceipt(App.currentViewedOrder, App.currentViewedClient, App.currentViewedSeller)">
                    <i data-lucide="file-text"></i> Descargar Comprobante PDF
                </button>
            `;

            if (App.state.isLoggedIn && App.state.activeRole === 'cliente' && order.estado_sincronizacion === 'PENDIENTE') {
                actionBtnHtml += `
                    <button class="btn btn-success btn-block" style="margin-top:10px; background:linear-gradient(135deg, #10b981 0%, #059669 100%);" onclick="App.receiveOrderAction(${order.id})">
                        <i data-lucide="check-circle"></i> Confirmar Recepción de Pedido
                    </button>
                    <p style="font-size:0.65rem; color:var(--text-secondary); text-align:center; margin-top:6px;">
                        Al recibir, se actualizará el estado de la orden y se agregará el stock al inventario de tu negocio.
                    </p>
                `;
            }

            detailsHtml = `
                <div style="margin-bottom:16px;">
                    <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:12px;">
                        <b>Cliente:</b> ${client.nombre}<br>
                        <b>Fecha:</b> ${formattedDate}<br>
                        <b>Estado:</b> <span class="order-status ${order.estado_sincronizacion.toLowerCase()}">${order.estado_sincronizacion}</span>
                    </div>
                    
                    <div style="font-weight:700; font-size:0.85rem; border-bottom:2px solid rgba(0,0,0,0.05); padding-bottom:6px; margin-bottom:8px;">
                        Artículos del pedido
                    </div>
                    
                    <div style="max-height:200px; overflow-y:auto; margin-bottom:12px;">
                        ${itemsRows}
                    </div>

                    <div style="display:flex; justify-content:space-between; padding:12px 0; border-top:1.5px solid rgba(0,0,0,0.08); font-size:0.95rem; font-weight:700;">
                        <span>TOTAL PEDIDO:</span>
                        <span style="color:var(--success-color); font-size:1.05rem;">$${parseFloat(order.total).toLocaleString('es-CL')}</span>
                    </div>

                    ${actionBtnHtml}
                </div>
            `;
        } else {
            detailsHtml = `
                <div style="text-align:center; padding:10px;">
                    <p>No se encontraron detalles del pedido.</p>
                </div>
            `;
        }

        bodyEl.innerHTML = detailsHtml;
        modal.classList.remove('hidden');
        App.refreshIcons();
    },

    closeOrderModal() {
        AppModals.inject('modal-order-details'); document.getElementById('modal-order-details').classList.add('hidden');
    },

    async receiveOrderAction(pedidoId) {
        const order = App.state.clientOrders.find(o => o.id === pedidoId);
        if (!order) return;

        App.showToast("Procesando pedido...");

        try {
            // Update status on database to 'DESPACHADO' (meaning received by merchant)
            await ApiClient.updatePedidoStatus(pedidoId, 'DESPACHADO');
            
            // Loop items and add to local stock inventory
            order.detalles.forEach(d => {
                const currentStock = App.state.clienteInventory[d.producto_id] || 0;
                App.state.clienteInventory[d.producto_id] = currentStock + d.cantidad;
            });

            App.saveClientInventory();
            App.closeOrderModal();
            App.showToast("¡Pedido recibido con éxito!");

            // Refresh view
            App.fetchAndRenderClientePedidos();
            App.renderClienteDashboard();
        } catch (e) {
            console.error(e);
            App.showToast("No se pudo actualizar el estado del pedido.", true);
        }
    },



};
