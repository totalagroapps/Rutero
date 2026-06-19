const PedidoPdf = {
    productos: [],
    lastPdfBlob: null,

    init() {
        if (this.productos.length === 0) {
            this.addRow();
        }
        this.populateClientSelect();
    },

    populateClientSelect() {
        const select = document.getElementById('pdf-cliente-select');
        if (!select) return;
        
        while (select.options.length > 1) {
            select.remove(1);
        }

        if (window.App && window.App.state && window.App.state.clientes) {
            window.App.state.clientes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.text = c.nombre + ' (' + c.codigo_pdv + ')';
                opt.dataset.nombre = c.nombre;
                opt.dataset.direccion = c.direccion;
                opt.dataset.nit = c.codigo_pdv;
                select.add(opt);
            });
        }
    },

    onClienteSelect() {
        const select = document.getElementById('pdf-cliente-select');
        if (!select) return;

        const opt = select.options[select.selectedIndex];
        
        if (opt.value) {
            document.getElementById('pdf-nombre-cliente').value = opt.dataset.nombre || '';
            document.getElementById('pdf-nit').value = opt.dataset.nit || '';
            document.getElementById('pdf-direccion').value = opt.dataset.direccion || '';
        } else {
            document.getElementById('pdf-nombre-cliente').value = '';
            document.getElementById('pdf-nit').value = '';
            document.getElementById('pdf-direccion').value = '';
        }
    },

    addRow() {
        const id = Date.now().toString() + Math.floor(Math.random()*1000);
        this.productos.push({
            id: id,
            codigo: '',
            descripcion: '',
            cantidad: 1,
            precio_unitario: 0,
            subtotal: 0
        });
        this.renderTable();
    },

    removeRow(id) {
        this.productos = this.productos.filter(p => p.id !== id);
        this.renderTable();
        this.calculateTotals();
    },

    updateRow(id, field, value) {
        const p = this.productos.find(p => p.id === id);
        if (p) {
            p[field] = field === 'cantidad' || field === 'precio_unitario' ? Number(value) : value;
            if (field === 'cantidad' || field === 'precio_unitario') {
                p.subtotal = p.cantidad * p.precio_unitario;
            }
            const tr = document.getElementById('pdf-row-' + id);
            if (tr) {
                const subEl = tr.querySelector('.row-subtotal');
                if (subEl) subEl.innerText = '$' + p.subtotal.toLocaleString();
            }
            this.calculateTotals();
        }
    },

    renderTable() {
        const tbody = document.querySelector('#pdf-productos-table tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        this.productos.forEach(p => {
            const tr = document.createElement('tr');
            tr.id = 'pdf-row-' + p.id;
            tr.innerHTML = 
                <td><input type="text" class="sam-input" placeholder="Cód" value="" oninput="PedidoPdf.updateRow('', 'codigo', this.value)"></td>
                <td><input type="text" class="sam-input" placeholder="Descripción" value="" oninput="PedidoPdf.updateRow('', 'descripcion', this.value)"></td>
                <td><input type="number" class="sam-input" value="" min="1" oninput="PedidoPdf.updateRow('', 'cantidad', this.value)"></td>
                <td><input type="number" class="sam-input" value="" min="0" oninput="PedidoPdf.updateRow('', 'precio_unitario', this.value)"></td>
                <td class="row-subtotal">$\</td>
                <td><button type="button" class="sam-btn btn-secondary" style="padding:5px; background:var(--danger-color); color:white;" onclick="PedidoPdf.removeRow('')">X</button></td>
            ;
            tbody.appendChild(tr);
        });
        this.calculateTotals();
    },

    calculateTotals() {
        const subtotal = this.productos.reduce((sum, p) => sum + p.subtotal, 0);
        const descInput = document.getElementById('pdf-val-descuento');
        const ivaInput = document.getElementById('pdf-val-iva');
        
        const descuento = descInput ? Number(descInput.value) : 0;
        const ivaPorcentaje = ivaInput ? Number(ivaInput.value) : 19;

        const baseImponible = subtotal - descuento;
        const ivaMonto = baseImponible * (ivaPorcentaje / 100);
        const total = baseImponible + ivaMonto;

        this.currentTotals = {
            subtotal, descuento, ivaMonto, total
        };

        const lblSubtotal = document.getElementById('pdf-lbl-subtotal');
        const lblTotal = document.getElementById('pdf-lbl-total');
        if (lblSubtotal) lblSubtotal.innerText = '$' + subtotal.toLocaleString();
        if (lblTotal) lblTotal.innerText = '$' + total.toLocaleString();
    },

    async submitForm(e) {
        e.preventDefault();
        
        if (this.productos.length === 0 || this.productos.every(p => p.codigo === '' && p.descripcion === '')) {
            alert("Agrega al menos un producto válido al pedido.");
            return;
        }

        const btn = document.getElementById('pdf-btn-submit');
        const btnD = document.getElementById('pdf-btn-download');
        btn.disabled = true;
        btn.innerHTML = 'Generando...';

        try {
            const cliente_id = document.getElementById('pdf-cliente-select').value || null;
            
            const payload = {
                uuid_dispositivo: 'pdf_' + Date.now() + '_' + Math.random(),
                vendedor_id: window.App && window.App.state && window.App.state.vendedor ? window.App.state.vendedor.id : 1,
                vendedor_nombre: window.App && window.App.state && window.App.state.vendedor ? window.App.state.vendedor.nombre : 'Vendedor',
                cliente_id: cliente_id ? parseInt(cliente_id) : null,
                nombre_cliente: document.getElementById('pdf-nombre-cliente').value,
                nit_cedula: document.getElementById('pdf-nit').value,
                direccion: document.getElementById('pdf-direccion').value,
                ciudad: document.getElementById('pdf-ciudad').value,
                telefono: document.getElementById('pdf-telefono').value,
                correo: document.getElementById('pdf-correo').value,
                productos: this.productos.filter(p => p.codigo || p.descripcion).map(p => ({
                    codigo: p.codigo || 'S/N',
                    descripcion: p.descripcion || 'Sin descripción',
                    cantidad: p.cantidad,
                    precio_unitario: p.precio_unitario,
                    subtotal: p.subtotal
                })),
                subtotal: this.currentTotals.subtotal,
                iva: this.currentTotals.ivaMonto,
                descuento: this.currentTotals.descuento,
                total: this.currentTotals.total,
                forma_pago: document.getElementById('pdf-forma-pago').value,
                condiciones_entrega: document.getElementById('pdf-condiciones').value,
                fecha_estimada_entrega: document.getElementById('pdf-fecha-entrega').value || null
            };

            const response = await fetch(API_URL + '/pedidos/pdf-confirmado', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error("Error en servidor: " + err);
            }

            const blob = await response.blob();
            this.lastPdfBlob = blob;
            
            this.downloadLastPdf(payload.nombre_cliente);
            btnD.classList.remove('hidden');
            alert("Pedido confirmado y PDF generado correctamente.");
        } catch (error) {
            console.error("Error PDF:", error);
            alert("Error al generar PDF: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="file-down"></i> Confirmar y Generar Comprobante';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    },

    downloadLastPdf(clientName = 'Cliente') {
        if (!this.lastPdfBlob) return;
        const url = window.URL.createObjectURL(this.lastPdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "Pedido_" + clientName.replace(/\s+/g, '_') + ".pdf";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }
};
