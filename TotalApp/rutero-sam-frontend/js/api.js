// API communication client for Rutero SAM
const ApiClient = {
    // Default to local or production depending on window.location
    baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:8001'
        : 'https://rutero-sam-backend-production.up.railway.app',
    
    // Set custom API base URL
    setBaseUrl(url) {
        this.baseUrl = url.trim().replace(/\/$/, '');
    },

    // Check if the server is reachable
    async checkConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const response = await fetch(`${this.baseUrl}/docs`, { 
                method: 'HEAD', 
                signal: controller.signal 
            });
            clearTimeout(timeoutId);
            return response.ok;
        } catch (e) {
            console.warn("API Connection check failed", e);
            return false;
        }
    },

    async fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem('sam_access_token');
        if (!options.headers) {
            options.headers = {};
        }
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(url, options);
        
        if (response.status === 401) {
            console.warn("Unauthorized access detected. Token might be expired.");
            if (typeof App !== 'undefined' && App.logout) {
                App.logout();
            }
        }
        
        return response;
    },

    // Fetch vendor route: GET /api/v1/ruta/{vendedor_id}
    async getRuta(vendedorId) {
        try {
            const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/ruta/${vendedorId}`);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching getRuta:", error);
            throw error;
        }
    },

    async getVendedorStats(vendedorId) {
        try {
            const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/pedidos/vendedor/${vendedorId}/stats`);
            if (!response.ok) return { pendientes: 0, despachados: 0, cancelados: 0 };
            return await response.json();
        } catch (error) {
            return { pendientes: 0, despachados: 0, cancelados: 0 };
        }
    },

    // Fetch product catalog: GET /api/v1/catalogo
    async getCatalogo() {
        try {
            const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/catalogo`);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return await response.json();
        } catch (e) {
            console.warn("Error fetching catalog from server, using local fallback if available", e);
            throw e;
        }
    },

    // Sync orders in batch: POST /api/v1/pedidos/sync
    async syncPedidos(pedidos) {
        if (!pedidos || pedidos.length === 0) return { total_recibidos: 0, total_insertados: 0, pedidos: [] };
        
        try {
            const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/pedidos/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pedidos: pedidos })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP al sincronizar pedidos: ${response.status}`);
            }

            return await response.json();
        } catch (e) {
            console.error("Error sending orders to server", e);
            throw e;
        }
    },

    // Sync new clients: POST /api/v1/clientes/sync
    async syncClientes(clientes) {
        if (!clientes || clientes.length === 0) return { total_recibidos: 0, total_insertados: 0, clientes: [] };
        
        try {
            const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/clientes/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ clientes: clientes })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP al sincronizar clientes: ${response.status}`);
            }

            return await response.json();
        } catch (e) {
            console.error("Error sending clients to server", e);
            throw e;
        }
    },

    // Get orders of a client: GET /api/v1/pedidos/cliente/{cliente_id}
    async getClientPedidos(clienteId) {
        try {
            const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/pedidos/cliente/${clienteId}`);
            if (!response.ok) {
                throw new Error(`Error HTTP al consultar pedidos del cliente: ${response.status}`);
            }
            return await response.json();
        } catch (e) {
            console.error("Error querying client orders", e);
            throw e;
        }
    },

    // Get all orders of a vendor: GET /api/v1/pedidos/vendedor/{vendedor_id}
    async getPedidosByVendedor(vendedorId) {
        try {
            const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/pedidos/vendedor/${vendedorId}`);
            if (!response.ok) {
                throw new Error(`Error HTTP al consultar pedidos del vendedor: ${response.status}`);
            }
            return await response.json();
        } catch (e) {
            console.error("Error querying vendor orders", e);
            throw e;
        }
    },

    // Update order status: PUT /api/v1/pedidos/{pedido_id}/estado?nuevo_estado={status}
    async updatePedidoStatus(pedidoId, status) {
        try {
            const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/pedidos/${pedidoId}/estado?nuevo_estado=${status}`, {
                method: 'PUT'
            });
            if (!response.ok) {
                throw new Error(`Error HTTP al actualizar estado del pedido: ${response.status}`);
            }
            return await response.json();
        } catch (e) {
            console.error("Error updating order status", e);
            throw e;
        }
    },

    // Administrative Stats
    async getAdminStats() {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/admin/stats`);
        if (!response.ok) throw new Error("Error fetching admin stats");
        return await response.json();
    },

    // Administrative Vendedores CRUD
    async getAdminVendedores() {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/admin/vendedores`);
        if (!response.ok) throw new Error("Error fetching vendedores");
        return await response.json();
    },

    async getVendedorById(vendedorId) {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/admin/vendedores/${vendedorId}`);
        if (!response.ok) throw new Error("Error fetching vendedor");
        return await response.json();
    },

    async saveAdminVendedor(vendedor) {
        const url = vendedor.id 
            ? `${this.baseUrl}/api/v1/admin/vendedores/${vendedor.id}` 
            : `${this.baseUrl}/api/v1/admin/vendedores`;
        const method = vendedor.id ? 'PUT' : 'POST';
        const response = await this.fetchWithAuth(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vendedor)
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Error saving vendedor");
        }
        return await response.json();
    },

    async deleteAdminVendedor(vendedorId) {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/admin/vendedores/${vendedorId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Error deleting vendedor");
        }
        return true;
    },

    // Administrative Clientes CRUD
    async getAdminClientes() {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/admin/clientes`);
        if (!response.ok) throw new Error("Error fetching admin clientes");
        return await response.json();
    },

    async saveAdminCliente(cliente) {
        const url = cliente.id 
            ? `${this.baseUrl}/api/v1/admin/clientes/${cliente.id}` 
            : `${this.baseUrl}/api/v1/admin/clientes`;
        const method = cliente.id ? 'PUT' : 'POST';
        const response = await this.fetchWithAuth(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cliente)
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Error saving cliente");
        }
        return await response.json();
    },

    async reordenarRuta(ordenList) {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/admin/clientes/reordenar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientes: ordenList })
        });
        if (!response.ok) {
            throw new Error(`Error HTTP al reordenar ruta: ${response.status}`);
        }
        return await response.json();
    },

    async deleteAdminCliente(clienteId) {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/admin/clientes/${clienteId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error("Error deleting cliente");
        return true;
    },

    // Administrative Productos CRUD
    async getAdminProductos() {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/admin/productos`);
        if (!response.ok) throw new Error("Error fetching admin productos");
        return await response.json();
    },

    async saveAdminProducto(producto) {
        const url = producto.id 
            ? `${this.baseUrl}/api/v1/admin/productos/${producto.id}` 
            : `${this.baseUrl}/api/v1/admin/productos`;
        const method = producto.id ? 'PUT' : 'POST';
        const response = await this.fetchWithAuth(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(producto)
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Error saving product");
        }
        return await response.json();
    },

    async deleteAdminProducto(productoId) {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/admin/productos/${productoId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error("Error deleting product");
        return true;
    },

    // Administrative Orders list
    async getAdminPedidos() {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/admin/pedidos`);
        if (!response.ok) throw new Error("Error fetching admin orders");
        return await response.json();
    },

    // Auth
    async login(username, password) {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Error al iniciar sesión");
        }
        return await response.json();
    },

    async changePassword(passwordNueva) {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/auth/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password_nueva: passwordNueva
            })
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Error al cambiar la contraseña");
        }
        return await response.json();
    },

    // Despacho
    async getDespachoPedidos() {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/despacho/pedidos`);
        if (!response.ok) throw new Error("Error al obtener pedidos para despacho");
        return await response.json();
    },

    async certificarPedido(pedidoId, certificacion) {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/despacho/pedidos/${pedidoId}/certificar?certificacion=${encodeURIComponent(certificacion)}`, {
            method: 'PUT'
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Error al certificar pedido");
        }
        return await response.json();
    },

    async updateProductoStock(productoId, stock) {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/despacho/productos/${productoId}/stock?stock=${stock}`, {
            method: 'PUT'
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Error al actualizar stock");
        }
        return await response.json();
    },

    // Admin Usuarios CRUD
    async getAdminUsuarios() {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/admin/usuarios`);
        if (!response.ok) throw new Error("Error al obtener usuarios");
        return await response.json();
    },

    async saveAdminUsuario(usuario) {
        const url = usuario.id 
            ? `${this.baseUrl}/api/v1/admin/usuarios/${usuario.id}` 
            : `${this.baseUrl}/api/v1/admin/usuarios`;
        const method = usuario.id ? 'PUT' : 'POST';
        const response = await this.fetchWithAuth(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuario)
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Error al guardar el usuario");
        }
        return await response.json();
    },

    async deleteAdminUsuario(usuarioId) {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/admin/usuarios/${usuarioId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Error al eliminar el usuario");
        }
        return true;
    },

    async generarInformeAvanzado(tipo, periodo, desde, hasta, vendedor) {
        let url = `${this.baseUrl}/api/v1/admin/informes/generar?tipo=${tipo}`;
        
        if (periodo !== 'rango') {
            const now = new Date();
            let d = new Date(0);
            if (periodo === 'hoy') { d.setHours(0,0,0,0); d = new Date(); }
            else if (periodo === 'semana') { d = new Date(now.setDate(now.getDate() - 7)); }
            else if (periodo === 'mes') { d = new Date(now.setDate(now.getDate() - 30)); }
            
            if (periodo !== 'rango' && periodo !== 'siempre') {
                url += `&fecha_desde=${d.toISOString()}`;
            }
        } else {
            if (desde) url += `&fecha_desde=${desde}T00:00:00Z`;
            if (hasta) url += `&fecha_hasta=${hasta}T23:59:59Z`;
        }

        if (vendedor && vendedor !== 'todos') {
            url += `&vendedor_id=${vendedor}`;
        }

        const response = await this.fetchWithAuth(url);
        if (!response.ok) {
            throw new Error("Error generando el informe avanzado");
        }
        return await response.json();
    },

    async getCarteraCliente(clienteId) {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/cartera/cliente/${clienteId}`);
        if (!response.ok) {
            if (response.status === 404) {
                return { facturas: [], total_adeudado: 0, total_vencido: 0 };
            }
            throw new Error("Error obteniendo cartera");
        }
        return await response.json();
    },

    async registrarAbono(facturaId, vendedorId, monto, metodoPago, notas) {
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/cartera/abonos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                factura_id: facturaId,
                vendedor_id: vendedorId,
                monto: monto,
                metodo_pago: metodoPago,
                notas: notas
            })
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Error registrando abono");
        }
        return await response.json();
    },

    async uploadAdminClientesExcel(file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/admin/upload-clientes`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Error subiendo clientes");
        }
        return await response.json();
    },

    async uploadAdminProductosExcel(file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/admin/upload-productos`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Error subiendo productos");
        }
        return await response.json();
    },

    async uploadAdminVendedoresExcel(file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/admin/upload-vendedores`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Error subiendo vendedores");
        }
        return await response.json();
    }
};
