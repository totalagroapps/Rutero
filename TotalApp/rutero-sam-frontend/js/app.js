// Main Application Controller for TotalAPP (Rutero SAM Revamp)
const App = {
    // Application state
    state: {
        activeRole: null, // 'vendedor' | 'despacho' | 'administrador' | null
        isLoggedIn: false,
        vendedor: { id: 1, nombre: 'Juan Pérez', zona: 'Zona Central' },
        user: null, // Logged in user details: { id, username, rol, debe_cambiar_clave, vendedor_id }
        clientes: [],
        catalogo: [],
        visitStates: {}, // codigo_pdv -> 'pending' | 'visited' | 'no-sale'
        cart: {},        // product_id -> quantity (used for orders)
        tipoCliente: 'directo', // 'directo' | 'distribuidor'
        activeVisit: null, // client object currently being visited by Vendedor
        unsyncedOrders: [], // Vendedor orders taken offline/pending sync
        unsyncedClientes: [], // Vendedor new clients registered offline/pending sync
        gpsSimulated: true,
        userCoords: { lat: 4.7110, lng: -74.0721 }, // Default Bogotá, Colombia
        pedidosListFilter: 'PENDIENTE', // Vendedor orders list filter
        
        // Despacho specific state
        despachoPedidos: []
    },

    // UI elements
    signaturePad: {
        canvas: null,
        ctx: null,
        isDrawing: false,
        lastX: 0,
        lastY: 0
    },

    
    escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    },

    
    refreshIcons() {
        if (this._iconTimeout) clearTimeout(this._iconTimeout);
        this._iconTimeout = setTimeout(() => {
            if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
                lucide.createIcons();
            }
        }, 50);
    },

    // Initialize application
    async init() {
        console.log("Starting TotalAPP / Rutero SAM...");
        
        // 1. Load config settings from localStorage
        this.loadSettings();

        // Restore active visit state if any
        try {
            const savedVisit = localStorage.getItem('rutero_active_visit');
            const savedCart = localStorage.getItem('rutero_cart');
            if (savedVisit && savedVisit !== 'null') {
                this.state.activeVisit = JSON.parse(savedVisit);
                this.state.cart = savedCart ? JSON.parse(savedCart) : {};
                // We will navigate to it after other async init finishes
                setTimeout(() => {
                    if (this.state.activeVisit) {
                        this.renderVisitView();
                        this.navigateToView('visita');
                    }
                }, 800);
            }
        } catch(e) { console.error("Error restoring visit state", e); }

        // 2. Initialize router tabs
        this.initRouter();

        // 3. Initialize signature canvas
        this.initSignatureCanvas();

        // 4. Initialize search filters
        this.initFilters();

        // 5. Connect connection status monitor
        this.initConnectionMonitor();

        // 6. Set initial coordinates
        this.updateUserCoords();

        // 7. Check login state
        await this.checkLoginState();

        if (this.state.isLoggedIn && this.state.activeRole === 'vendedor') {
            await this.loadCachedData();
            await this.syncWithBackend();
        }

        // Populate client dropdown for login
        this.populateClientLoginSelector();

        // 8. Register UI events
        this.initUIEventListeners();

        // Initialize Lucide icons
        this.refreshIcons();
    },

    // Check if user was already logged in
    async checkLoginState() {
        const savedRole = localStorage.getItem('sam_active_role');
        const savedIsLoggedIn = localStorage.getItem('sam_is_logged_in') === 'true';
        const savedUser = localStorage.getItem('sam_logged_user');
        const savedVendedor = localStorage.getItem('sam_vendedor');

        if (savedIsLoggedIn && savedRole && savedUser) {
            this.state.activeRole = savedRole;
            this.state.isLoggedIn = true;
            this.state.user = JSON.parse(savedUser);
            
            if (savedRole === 'vendedor' && savedVendedor) {
                this.state.vendedor = JSON.parse(savedVendedor);
            } else if (savedRole === 'vendedor') {
                this.state.vendedor = { 
                    id: this.state.user.vendedor_id || 1, 
                    nombre: 'Vendedor ' + this.state.user.username, 
                    zona: 'Zona Asignada' 
                };
            }
            
            this.showAppMain();
        } else {
            this.logout({ silent: true });
        }
    },

    // Navigation and tabs controller
    initRouter() {
        const navItems = document.querySelectorAll('.app-navbar .nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetView = item.getAttribute('data-view');
                this.navigateToView(targetView);
            });
        });
    },

    navigateToView(viewName) {
        const views = document.querySelectorAll('.app-main .app-view');
        const navItems = document.querySelectorAll('.app-navbar .nav-item');

        // Deactivate all views and tabs
        views.forEach(v => v.classList.remove('active'));
        navItems.forEach(n => n.classList.remove('active'));

        // Activate target view
        const targetViewEl = document.getElementById(`view-${viewName}`);
        if (targetViewEl) {
            targetViewEl.classList.add('active');
        }

        // Activate target navbar item
        navItems.forEach(n => {
            if (n.getAttribute('data-view') === viewName) {
                n.classList.add('active');
            }
        });

        // Trigger hooks based on view opened
        if (viewName === 'ruta') {
            MapController.init('map');
            this.renderRutaView();
        } else if (viewName === 'catalogo') {
            this.renderCatalog();
        } else if (viewName === 'dashboard') {
            this.renderDashboard();
        } else if (viewName === 'pedidos') {
            this.renderPedidosHistoryList();
        } else if (viewName === 'config') {
            this.loadSettings();
        } else if (viewName === 'despacho-dashboard') {
            DespachoController.loadDespachoData();
        } else if (viewName === 'despacho-inventario') {
            DespachoController.renderDespachoInventario();
        } else if (viewName === 'despacho-certificar') {
            DespachoController.renderDespachoCertificar();
        } else if (viewName === 'admin-dashboard') {
            AdminController.loadAdminStats();
        } else if (viewName === 'admin-vendedores') {
            AdminController.renderAdminVendedores();
        } else if (viewName === 'admin-clientes') {
            AdminController.renderAdminClientes();
        } else if (viewName === 'admin-rutas') {
            AdminMapController.init('admin-map');
            AdminController.populateAdminRouteVendedoresSelector();
            AdminController.loadAdminRouteOnMap();
        } else if (viewName === 'admin-productos') {
            AdminController.renderAdminProductos();
        } else if (viewName === 'admin-pedidos') {
            AdminController.renderAdminPedidos();
        } else if (viewName === 'admin-usuarios') {
            AdminController.renderAdminUsuarios();
        } else if (viewName === 'cartera') {
            this.renderMainCartera();
        } else if (viewName === 'admin-informes') {
            InformesController.renderAdminInformes('mes');
        }

        this.refreshIcons();
    },

    async renderMainCartera() {
        const container = document.getElementById('cartera-main-list');
        const searchVal = document.getElementById('cartera-main-search').value.toLowerCase();
        
        container.innerHTML = '<p style="text-align:center;">Cargando...</p>';

        try {
            // Reusing admin clientes just for listing in this demo, usually would be a specific endpoint
            const clientes = await ApiClient.getAdminClientes();
            
            let html = '';
            clientes.filter(c => c.nombre.toLowerCase().includes(searchVal) || c.codigo_pdv.toLowerCase().includes(searchVal)).forEach(c => {
                html += `
                    <div class="summary-card" style="padding:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;" onclick="App.openClientCarteraDemo(${c.id})">
                        <div>
                            <strong style="display:block;">${this.escapeHtml(c.nombre)}</strong>
                            <span style="font-size:0.75rem; color:var(--text-secondary);">${this.escapeHtml(c.codigo_pdv)}</span>
                        </div>
                        <i data-lucide="chevron-right" style="color:var(--primary-color);"></i>
                    </div>
                `;
            });
            
            container.innerHTML = html || '<p style="text-align:center;">No se encontraron clientes.</p>';
            this.refreshIcons();
        } catch (err) {
            console.error(err);
            container.innerHTML = '<p style="text-align:center; color:red;">Error al cargar cartera.</p>';
        }
    },

    async openClientCarteraDemo(clientId) {
        this.showToast("Cargando estado de cuenta...");
        try {
            const cartera = await ApiClient.getCarteraCliente(clientId);
            
            // Inyectar el modal base PRIMERO
            AppModals.inject('modal-cartera-detalle');
            
            document.getElementById('modal-cartera-total-adeudado').innerText = `${cartera.total_adeudado.toLocaleString('es-CO')}`;
            document.getElementById('modal-cartera-total-vencido').innerText = `${cartera.total_vencido.toLocaleString('es-CO')}`;
            
            const listContainer = document.getElementById('modal-cartera-facturas');
            listContainer.innerHTML = '';
            
            if (cartera.facturas && cartera.facturas.length > 0) {
                cartera.facturas.forEach(f => {
                    const badge = f.estado === 'VENCIDA' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
                    listContainer.innerHTML += `
                        <div class="summary-card" style="padding:10px; margin-bottom:8px; font-size:0.85rem;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                <strong>Factura ${f.numero_factura}</strong>
                                <span style="font-size:0.7rem; padding:2px 6px; border-radius:10px; font-weight:600;" class="${badge}">${f.estado}</span>
                            </div>
                            <div style="color:var(--text-secondary); margin-bottom:4px;">Vence: ${new Date(f.fecha_vencimiento).toLocaleDateString('es-CO')}</div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>Total: ${f.monto_total.toLocaleString('es-CO')}</span>
                                <strong class="text-danger">Saldo: ${f.saldo_pendiente.toLocaleString('es-CO')}</strong>
                            </div>
                        </div>
                    `;
                });
            } else {
                listContainer.innerHTML = '<p style="text-align:center; color:var(--text-secondary); font-size:0.9rem; padding:10px;">No hay facturas pendientes.</p>';
            }
            
            document.getElementById('modal-cartera-detalle').classList.remove('hidden');
        } catch (err) {
            console.error(err);
            this.showToast("Error al cargar la cartera", true);
        }
    },

    // Role Selection
    selectRole(role) {
        this.state.activeRole = role;
        
        // Hide landing, show login card
        document.getElementById('view-role-selection').classList.add('hidden');
        const loginView = document.getElementById('view-login');
        loginView.classList.remove('hidden');

        const roleIcon = document.getElementById('login-role-icon');
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');

        usernameInput.value = '';
        passwordInput.value = '';

        if (role === 'vendedor') {
            roleIcon.setAttribute('data-lucide', 'user');
            usernameInput.placeholder = "Nombre de usuario (ej. vendedor1)";
        } else if (role === 'administrador') {
            roleIcon.setAttribute('data-lucide', 'shield-alert');
            usernameInput.placeholder = "Nombre de usuario (ej. admin)";
        } else if (role === 'despacho') {
            roleIcon.setAttribute('data-lucide', 'truck');
            usernameInput.placeholder = "Nombre de usuario (ej. despacho1)";
        }
        this.refreshIcons();
    },

    backToRoleSelection() {
        this.state.activeRole = null;
        document.getElementById('view-login').classList.add('hidden');
        document.getElementById('view-role-selection').classList.remove('hidden');
    },

    populateClientLoginSelector() {
        // Obsolete
    },

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!username || !password) {
            this.showToast("Por favor ingresa usuario y contraseña.", true);
            return;
        }

        this.showToast("Iniciando sesión...");

        try {
            const userData = await ApiClient.login(username, password);
            
            // Validate role matches
            const selectedRole = this.state.activeRole;
            const userRol = userData.rol;
            
            const matches = (selectedRole === 'vendedor' && userRol === 'vendedor') ||
                            (selectedRole === 'administrador' && userRol === 'admin') ||
                            (selectedRole === 'despacho' && userRol === 'despacho');
            
            if (!matches) {
                this.showToast(`El usuario '${username}' no tiene rol de ${selectedRole === 'administrador' ? 'administrador' : selectedRole}.`, true);
                return;
            }

            this.state.user = userData;
            localStorage.setItem('sam_logged_user', JSON.stringify(userData));
            if (userData.access_token) {
                localStorage.setItem('sam_access_token', userData.access_token);
            }

            if (userData.debe_cambiar_clave) {
                this.openChangePasswordModal();
            } else {
                this.state.isLoggedIn = true;
                if (userData.rol === 'vendedor' && userData.vendedor_id) {
                    try {
                        const vendedorData = await ApiClient.getVendedorById(userData.vendedor_id);
                        this.state.vendedor = vendedorData;
                        localStorage.setItem('sam_vendedor', JSON.stringify(vendedorData));
                    } catch (e) {
                        console.warn("Could not fetch vendedor data", e);
                        this.state.vendedor = { 
                            id: userData.vendedor_id || 1, 
                            nombre: 'Vendedor ' + userData.username, 
                            zona: 'Zona Asignada' 
                        };
                    }
                }
                this.showAppMain();
            }
        } catch (err) {
            this.showToast(err.message || "Error al iniciar sesión", true);
        }
    },

    openChangePasswordModal() {
        AppModals.inject('modal-change-password');
        AppModals.inject('modal-change-password'); const modal = document.getElementById('modal-change-password');
        modal.classList.remove('hidden');
        document.getElementById('change-password-nueva').value = '';
        document.getElementById('change-password-confirmar').value = '';
    },

    async handleChangePassword(e) {
        e.preventDefault();
        const nueva = document.getElementById('change-password-nueva').value;
        const confirmar = document.getElementById('change-password-confirmar').value;

        const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(nueva);
        if (nueva.length < 8 || !hasNumberOrSymbol) {
            this.showToast("La contraseña debe tener al menos 8 caracteres y contener al menos un número o símbolo.", true);
            return;
        }

        if (nueva !== confirmar) {
            this.showToast("Las contraseñas no coinciden.", true);
            return;
        }

        this.showToast("Cambiando contraseña...");

        try {
            await ApiClient.changePassword(nueva);
            
            this.showToast("Contraseña cambiada con éxito.");
            AppModals.inject('modal-change-password'); document.getElementById('modal-change-password').classList.add('hidden');
            
            this.state.user.debe_cambiar_clave = false;
            localStorage.setItem('sam_logged_user', JSON.stringify(this.state.user));
            
            this.state.isLoggedIn = true;
            if (this.state.user.rol === 'vendedor') {
                this.state.vendedor = { 
                    id: this.state.user.vendedor_id || 1, 
                    nombre: 'Vendedor ' + this.state.user.username, 
                    zona: 'Zona Asignada' 
                };
                await this.loadCachedData();
                await this.syncWithBackend();
            }
            this.showAppMain();
        } catch (err) {
            this.showToast(err.message || "Error al cambiar la contraseña", true);
        }
    },

    showAppMain() {
        document.getElementById('view-login').classList.add('hidden');
        document.getElementById('view-role-selection').classList.add('hidden');
        
        document.querySelector('.app-header').classList.remove('hidden');
        document.querySelector('.app-main').classList.remove('hidden');
        document.querySelector('.app-navbar').classList.remove('hidden');

        document.body.className = `role-${this.state.activeRole}`;
        
        localStorage.setItem('sam_active_role', this.state.activeRole);
        localStorage.setItem('sam_is_logged_in', 'true');

        this.applyTheme(this.state.activeRole);

        if (this.state.activeRole === 'vendedor') {
            document.getElementById('header-title').innerText = "TotalAPP Vendedor";
            const nameStr = this.state.user ? 'Vendedor ' + this.state.user.username : 'Samuel Vendedor';
            document.getElementById('vendedor-nombre').innerText = `${nameStr} · TotalAPP`;
            this.navigateToView('dashboard');
        } else if (this.state.activeRole === 'administrador') {
            document.getElementById('header-title').innerText = "TotalAPP Admin";
            document.getElementById('vendedor-nombre').innerText = "Administrador del Sistema";
            this.navigateToView('admin-dashboard');
            AdminController.loadAdminData();
        } else if (this.state.activeRole === 'despacho') {
            document.getElementById('header-title').innerText = "TotalAPP Despacho";
            document.getElementById('vendedor-nombre').innerText = "Bodega y Logística";
            this.navigateToView('despacho-dashboard');
        }
    },

    applyTheme(role) {
        const root = document.documentElement;
        // Apply Total Agro branding across all roles
        if (role === 'vendedor') {
            root.style.setProperty('--primary-color', '#2c5f2e');
            root.style.setProperty('--primary-hover', '#1e4221');
            root.style.setProperty('--primary-gradient', 'linear-gradient(135deg, #2c5f2e 0%, #1a3d1b 100%)');
            root.style.setProperty('--card-border-active', 'rgba(44, 95, 46, 0.4)');
            document.querySelector('meta[name="theme-color"]').setAttribute('content', '#2c5f2e');
        } else if (role === 'administrador') {
            root.style.setProperty('--primary-color', '#1a3d1b'); // Slightly darker green for admin
            root.style.setProperty('--primary-hover', '#0f2910');
            root.style.setProperty('--primary-gradient', 'linear-gradient(135deg, #1a3d1b 0%, #0a1f0a 100%)');
            root.style.setProperty('--card-border-active', 'rgba(26, 61, 27, 0.4)');
            document.querySelector('meta[name="theme-color"]').setAttribute('content', '#1a3d1b');
        } else if (role === 'despacho') {
            root.style.setProperty('--primary-color', '#4CAF50'); // Lighter, energetic green for dispatch
            root.style.setProperty('--primary-hover', '#388e3c');
            root.style.setProperty('--primary-gradient', 'linear-gradient(135deg, #4CAF50 0%, #2e7d32 100%)');
            root.style.setProperty('--card-border-active', 'rgba(76, 175, 80, 0.4)');
            document.querySelector('meta[name="theme-color"]').setAttribute('content', '#4CAF50');
        }
    },

    logout(options = {}) {
        this.state.isLoggedIn = false;
        this.state.activeRole = null;
        this.state.user = null;

        localStorage.removeItem('sam_active_role');
        localStorage.removeItem('sam_is_logged_in');
        localStorage.removeItem('sam_logged_user');
        localStorage.removeItem('sam_access_token');

        document.querySelector('.app-header').classList.add('hidden');
        document.querySelector('.app-main').classList.add('hidden');
        document.querySelector('.app-navbar').classList.add('hidden');
        
        document.getElementById('view-login').classList.add('hidden');
        document.getElementById('view-role-selection').classList.remove('hidden');
        document.body.className = '';
        
        if (!options.silent) {
            this.showToast("Sesión cerrada.");
        }
    },

    // Open add client registration view
    openAddClientView() {
        // Suggested sequence: length + 1
        const seq = this.state.clientes.length + 1;
        document.getElementById('new-client-secuencia').value = seq;

        // Auto code generation PDV00X
        const maxId = this.state.clientes.reduce((max, c) => {
            const num = parseInt(c.codigo_pdv.replace(/\D/g, ''), 10);
            return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        const nextCode = `PDV${String(maxId + 1).padStart(3, '0')}`;
        document.getElementById('new-client-codigo').value = nextCode;

        // Reset inputs
        document.getElementById('new-client-name').value = '';
        document.getElementById('new-client-encargado').value = '';
        document.getElementById('new-client-direccion').value = '';
        document.getElementById('new-client-lat').value = '';
        document.getElementById('new-client-lng').value = '';

        // GPS status reset
        const badge = document.getElementById('gps-capture-badge');
        badge.className = 'status-badge critical';
        badge.innerText = 'Sin ubicar';

        this.navigateToView('agregar-cliente');
        
        // Initialize Picker Map
        setTimeout(() => {
            PickerMapController.init('new-client-picker-map', 'new-client-lat', 'new-client-lng', 'new-client-direccion');
            if (this.state.userCoords && this.state.userCoords.lat) {
                PickerMapController.setCenter('new-client-picker-map', this.state.userCoords.lat, this.state.userCoords.lng);
            }
        }, 300);
    },

    // Capture device coordinates using native browser GPS


    // Handle new client save
    async handleSaveCliente(e) {
        e.preventDefault();

        const nombre = document.getElementById('new-client-name').value.trim();
        const encargado = document.getElementById('new-client-encargado').value.trim();
        const direccion = document.getElementById('new-client-direccion').value.trim();
        const codigo = document.getElementById('new-client-codigo').value.trim();
        const frecuencia = document.getElementById('new-client-frecuencia').value;
        const secuencia = document.getElementById('new-client-secuencia').value;


        if (!nombre || !direccion || !codigo) {
            this.showToast("Por favor completa los campos obligatorios.", true);
            return;
        }

        if (!lat || !lng) {
            this.showToast("Por favor captura las coordenadas GPS antes de guardar.", true);
            return;
        }

        // Check if code already exists
        const codeExists = this.state.clientes.some(c => c.codigo_pdv.toLowerCase() === codigo.toLowerCase());
        if (codeExists) {
            this.showToast("El código PDV ya está registrado.", true);
            return;
        }

        const municipio = document.getElementById('new-client-municipio').value.trim();
        const referencia = document.getElementById('new-client-referencia').value.trim();
        
        const newClient = {
            uuid_dispositivo: this.generateUUID(),
            codigo_pdv: codigo,
            nombre: nombre,
            encargado: encargado || null,
            direccion: direccion,
            municipio: municipio,
            referencia: referencia || null,
            latitud: null,
            longitud: null,
            frecuencia: frecuencia,
            secuencia_ruta: parseInt(secuencia, 10),
            activo: true
        };

        // Save local
        this.state.clientes.push(newClient);
        OfflineStore.setItem(this.getDbPrefix() + 'clientes', this.state.clientes);

        this.state.unsyncedClientes.push(newClient);
        OfflineStore.setItem(this.getDbPrefix() + 'unsynced_clientes', this.state.unsyncedClientes);

        this.updateSyncBadge();
        this.showToast("Comercio registrado localmente.");

        // Redirect back and refresh route list/map
        this.navigateToView('ruta');
        this.renderRutaView();

        // Populate logins
        this.populateClientLoginSelector();

        // Trigger sync background
        this.syncWithBackend();
    },

    // Update settings view
    loadSettings() {
        const usernameEl = document.getElementById('settings-username');
        const roleEl = document.getElementById('settings-role');
        if (usernameEl) {
            usernameEl.innerText = this.state.user ? this.state.user.username : 'Invitado';
        }
        if (roleEl) {
            roleEl.innerText = this.state.activeRole || 'Ninguno';
        }
    },

    // Prefix helper
    getDbPrefix() {
        const uId = this.state.user ? this.state.user.id : 'anon';
        const vId = this.state.vendedor ? this.state.vendedor.id : 'anon';
        return `u${uId}_v${vId}_`;
    },

    // Load state from local storage cache
    async loadCachedData() {
        const prefix = this.getDbPrefix();

        const cachedClientes = await OfflineStore.getItem(prefix + 'clientes');
        if (cachedClientes) {
            this.state.clientes = cachedClientes;
        }

        const cachedCatalogo = await OfflineStore.getItem(prefix + 'catalogo');
        if (cachedCatalogo) {
            this.state.catalogo = cachedCatalogo;
        }

        const cachedVisitStates = await OfflineStore.getItem(prefix + 'visit_states');
        if (cachedVisitStates) {
            this.state.visitStates = cachedVisitStates;
        }

        const cachedUnsynced = await OfflineStore.getItem(prefix + 'unsynced_orders');
        if (cachedUnsynced) {
            this.state.unsyncedOrders = cachedUnsynced;
        }

        const cachedUnsyncedClientes = await OfflineStore.getItem(prefix + 'unsynced_clientes');
        if (cachedUnsyncedClientes) {
            this.state.unsyncedClientes = cachedUnsyncedClientes;
        }
        
        this.updateSyncBadge();
    },

    // Synchronize latest state with FastAPI backend
    async syncWithBackend() {
        const syncBtn = document.getElementById('sync-button');
        syncBtn.classList.add('spinning');
        
        const isOnline = await ApiClient.checkConnection();
        this.updateConnectionUI(isOnline);

        if (!isOnline) {
            console.log("Offline mode: Skipping server data fetch.");
            syncBtn.classList.remove('spinning');
            
            if (this.state.clientes.length === 0) {
                this.loadMockDataFallback();
            }
            return;
        }

        try {
            // 1. Sync any pending offline clients FIRST
            if (this.state.unsyncedClientes && this.state.unsyncedClientes.length > 0) {
                this.showToast(`Sincronizando ${this.state.unsyncedClientes.length} comercio(s)...`);
                const syncResult = await ApiClient.syncClientes(this.state.unsyncedClientes);
                
                if (syncResult.total_insertados > 0 || syncResult.total_duplicados > 0) {
                    // Update offline orders that reference these temporary client IDs
                    if (syncResult.clientes && this.state.unsyncedOrders.length > 0) {
                        syncResult.clientes.forEach(serverClient => {
                            // Find the old client to get its temporary ID
                            const oldClient = this.state.unsyncedClientes.find(c => c.uuid_dispositivo === serverClient.uuid_dispositivo);
                            if (oldClient) {
                                // Update any unsynced order that used this temporary ID
                                this.state.unsyncedOrders.forEach(order => {
                                    if (order.cliente_id === oldClient.id) {
                                        order.cliente_id = serverClient.cliente_id;
                                    }
                                });
                            }
                        });
                        // Save updated orders back to storage
                        OfflineStore.setItem(this.getDbPrefix() + 'unsynced_orders', this.state.unsyncedOrders);
                    }
                    
                    this.state.unsyncedClientes = [];
                    OfflineStore.setItem(this.getDbPrefix() + 'unsynced_clientes', []);
                    this.updateSyncBadge();
                    this.showToast("Comercios sincronizados con éxito!");
                }
            }

            // 1.5 Sync any pending offline orders
            if (this.state.unsyncedOrders.length > 0) {
                this.showToast(`Sincronizando ${this.state.unsyncedOrders.length} pedido(s)...`);
                const syncResult = await ApiClient.syncPedidos(this.state.unsyncedOrders);
                
                if (syncResult.total_insertados > 0 || syncResult.total_duplicados > 0) {
                    this.state.unsyncedOrders = [];
                    OfflineStore.setItem(this.getDbPrefix() + 'unsynced_orders', []);
                    this.updateSyncBadge();
                    this.showToast("Pedidos sincronizados con éxito!");
                }
            }

            // 2. Fetch fresh routes & catalog
            const vid = (this.state.user && this.state.user.vendedor_id) ? this.state.user.vendedor_id : 1;
            const vendedorRuta = await ApiClient.getRuta(vid);
            this.state.clientes = vendedorRuta;
            OfflineStore.setItem(this.getDbPrefix() + 'clientes', vendedorRuta);

            const catalogoData = await ApiClient.getCatalogo();
            this.state.catalogo = catalogoData;
            OfflineStore.setItem(this.getDbPrefix() + 'catalogo', catalogoData);

            // Record last successful sync timestamp
            localStorage.setItem('sam_last_sync', new Date().toLocaleString());
            this.updateSyncBadge();

            this.populateClientLoginSelector();

            // Refresh header welcome text if seller is logged in
            if (this.state.isLoggedIn && this.state.activeRole === 'vendedor') {
                document.getElementById('vendedor-nombre').innerText = `${this.state.vendedor.nombre} · ${this.state.vendedor.zona}`;
            }

            this.showToast("Datos sincronizados con Railway.");
        } catch (e) {
            console.error("Sync error:", e);
            this.showToast("Error de sincronización con servidor.", true);
            
            if (this.state.clientes.length === 0) {
                this.loadMockDataFallback();
            }
        } finally {
            syncBtn.classList.remove('spinning');
            
            if (this.state.isLoggedIn) {
                if (this.state.activeRole === 'vendedor') {
                    this.renderDashboard();
                }
                // Other roles (despacho, administrador) load their data on navigateToView
            }
        }
    },

    loadMockDataFallback() {
        console.log("Loading offline fallback...");
        this.state.clientes = [
            { id: 1, codigo_pdv: 'PDV001', nombre: 'Tienda Don Carlos', encargado: 'Carlos Gómez', direccion: 'Cra. 7 #32-16, Bogotá', latitud: 4.7200, longitud: -74.0650, secuencia_ruta: 1, frecuencia: 'Semanal', activo: true },
            { id: 2, codigo_pdv: 'PDV002', nombre: 'Minimercado La Esperanza', encargado: 'María López', direccion: 'Av. El Dorado #68-85, Bogotá', latitud: 4.6980, longitud: -74.1020, secuencia_ruta: 2, frecuencia: 'Semanal', activo: true },
            { id: 3, codigo_pdv: 'PDV003', nombre: 'Miscelánea San Pablo', encargado: 'Jorge Vargas', direccion: 'Calle 80 #56-20, Bogotá', latitud: 4.7380, longitud: -74.0780, secuencia_ruta: 3, frecuencia: 'Quincenal', activo: true },
            { id: 4, codigo_pdv: 'PDV004', nombre: 'Supermercado Express', encargado: 'Ana Torres', direccion: 'Cra. 15 #93-47, Bogotá', latitud: 4.6760, longitud: -74.0490, secuencia_ruta: 4, frecuencia: 'Semanal', activo: true },
            { id: 5, codigo_pdv: 'PDV005', nombre: 'Droguería El Norte', encargado: 'Pedro Herrera', direccion: 'Calle 127 #13-25, Bogotá', latitud: 4.7530, longitud: -74.0480, secuencia_ruta: 5, frecuencia: 'Mensual', activo: true },
            { id: 6, codigo_pdv: 'PDV006', nombre: 'Panadería La Candelaria', encargado: 'Rosa Nieto', direccion: 'Cra. 3 #11-57, La Candelaria, Bogotá', latitud: 4.5980, longitud: -74.0740, secuencia_ruta: 6, frecuencia: 'Semanal', activo: true }
        ];
        
        this.state.catalogo = [
            { id: 1, sku: 'PROD001', nombre: 'Coca Cola 1.5L', precio: 1500, inventario_disponible: 120, activo: true },
            { id: 2, sku: 'PROD002', nombre: 'Papa Frita Lay\'s Familiar', precio: 2200, inventario_disponible: 80, activo: true },
            { id: 3, sku: 'PROD003', nombre: 'Galletas Club Social', precio: 600, inventario_disponible: 200, activo: true },
            { id: 4, sku: 'PROD004', nombre: 'Jugo Watt\'s Naranja 1L', precio: 1200, inventario_disponible: 150, activo: true },
            { id: 5, sku: 'PROD005', nombre: 'Chocolate Sahne-Nuss', precio: 3500, inventario_disponible: 50, activo: true },
            { id: 6, sku: 'PROD006', nombre: 'Leche Soprole Entera 1L', precio: 950, inventario_disponible: 300, activo: true }
        ];
        this.populateClientLoginSelector();
    },

    // ==================== FLUX: VENDEDOR LOGIC ====================
    renderDashboard() {
        document.getElementById('vendedor-welcome-title').innerText = `Hola, ${this.state.vendedor.nombre}`;
        
        // Visited stats today
        const totalVisits = this.state.clientes.length;
        const completedVisits = Object.values(this.state.visitStates).filter(state => state !== 'pending').length;
        document.getElementById('vendedor-visited-count').innerText = `${completedVisits}/${totalVisits}`;

        // Simulated stats count from database / local storage
        let pending = 0;

        // Count Vendedor orders stored locally
        this.state.unsyncedOrders.forEach(o => {
            pending++;
        });

        // Set initial local counts
        document.getElementById('vendedor-pending-count').innerText = pending.toString();
        document.getElementById('vendedor-dispatched-count').innerText = '0';
        document.getElementById('vendedor-canceled-count').innerText = '0';

        // Fetch real counts from backend
        if (this.state.vendedor && this.state.vendedor.id) {
            ApiClient.getVendedorStats(this.state.vendedor.id).then(stats => {
                const totalPending = pending + stats.pendientes;
                document.getElementById('vendedor-pending-count').innerText = totalPending.toString();
                document.getElementById('vendedor-dispatched-count').innerText = stats.despachados.toString();
                document.getElementById('vendedor-canceled-count').innerText = stats.cancelados.toString();
            }).catch(e => console.warn("Error loading real vendor stats:", e));
        }
    },

    renderRutaView() {
        const clientsContainer = document.getElementById('route-clients-list');
        clientsContainer.innerHTML = '';

        if (this.state.clientes.length === 0) {
            clientsContainer.innerHTML = '<p class="empty-state-text">No hay clientes cargados.</p>';
            return;
        }

        this.state.clientes.forEach(cliente => {
            const visitState = this.state.visitStates[cliente.codigo_pdv] || 'pending';
            
            let badgeText = 'Pendiente';
            let badgeClass = 'pending';
            if (visitState === 'visited') {
                badgeText = 'Vendido';
                badgeClass = 'dispatched';
            } else if (visitState === 'no-sale') {
                badgeText = 'No Venta';
                badgeClass = 'canceled';
            }

            const card = document.createElement('div');
            card.className = `client-card ${visitState === 'pending' ? 'highlight' : ''}`;
            card.innerHTML = `
                <div class="client-card-info" onclick="App.startVisit(${cliente.id})">
                    <div class="client-card-avatar">
                        <i data-lucide="store"></i>
                    </div>
                    <div class="client-card-details">
                        <h3>${cliente.nombre}</h3>
                        <p>${cliente.direccion}</p>
                        <div style="margin-top: 4px; display:flex; align-items:center; gap: 8px;">
                            <span class="order-status ${badgeClass}" style="font-size: 0.6rem;">${badgeText}</span>
                            <span style="font-size: 0.65rem; color: var(--text-muted);">Secuencia: ${cliente.secuencia_ruta}</span>
                        </div>
                    </div>
                </div>
                <div class="client-card-arrow" onclick="App.startVisit(${cliente.id})">
                    <i data-lucide="chevron-right"></i>
                </div>
            `;
            clientsContainer.appendChild(card);
        });

        MapController.renderRoute(this.state.clientes, this.state.visitStates);
        MapController.setUserLocation(this.state.userCoords.lat, this.state.userCoords.lng);
        this.refreshIcons();
    },

    renderCatalog(filterText = '') {
        const container = document.getElementById('catalog-items-container');
        container.innerHTML = '';

        const filtered = this.state.catalogo.filter(prod => {
            const query = filterText.toLowerCase();
            return prod.nombre.toLowerCase().includes(query) || prod.sku.toLowerCase().includes(query);
        });

        filtered.forEach(prod => {
            let badgeClass = 'normal';
            let badgeText = 'Normal';
            if (prod.inventario_disponible < 10) {
                badgeClass = 'critical';
                badgeText = 'Crítico';
            } else if (prod.inventario_disponible < 40) {
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
                    <span class="product-stock" style="font-size: 0.75rem;">Disponibilidad: ${prod.inventario_disponible}</span>
                    <span class="status-badge ${badgeClass}">${badgeText}</span>
                </div>
            `;
            container.appendChild(card);
        });
    },

    saveVisitState() {
        OfflineStore.setItem(this.getDbPrefix() + 'active_visit', this.state.activeVisit);
        OfflineStore.setItem(this.getDbPrefix() + 'cart', this.state.cart);
        OfflineStore.setItem(this.getDbPrefix() + 'tipo_cliente', this.state.tipoCliente);
    },

    startVisit(clientId) {
        const client = this.state.clientes.find(c => c.id === clientId);
        if (!client) return;

        this.state.activeVisit = client;
        this.state.cart = {};
        this.saveVisitState();

        document.getElementById('visit-client-name').innerText = client.nombre;
        document.getElementById('visit-client-code').innerText = client.codigo_pdv;

        document.getElementById('no-sale-notes').value = '';
        this.clearSignature();
        this.removePhoto();

        this.setVisitStep('order');
        this.renderVisitProducts();
        const tipo = client.tipo_cliente || 'directo';
        const tipoSelect = document.getElementById('visit-tipo-cliente');
        if (tipoSelect) tipoSelect.value = tipo;
        this.state.tipoCliente = tipo;
        this.navigateToView('visita');
    },

    handleTipoClienteChange(val) {
        this.state.tipoCliente = val;
        this.renderVisitProducts();
        this.calculateOrderTotals();
    },

    
    confirmVisitCheckout() {
        if (Object.keys(this.state.cart).length === 0) {
            this.showToast("El carrito est vaco", "error");
            return;
        }

        AppModals.inject('modal-confirm-checkout');
        
        let html = '';
        let total = 0;
        
        for (let pId in this.state.cart) {
            let qty = this.state.cart[pId];
            let prod = this.state.catalogo.find(p => p.id === parseInt(pId, 10));
            if (!prod) continue;

            const precioActual = this.state.tipoCliente === 'distribuidor' && prod.precio_distribuidor !== null 
                                ? parseFloat(prod.precio_distribuidor) 
                                : parseFloat(prod.precio_directo);

            let subtotal = qty * precioActual;
            total += subtotal;
            html += `
                <li style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <div>
                        <div style="font-weight: 500;">${this.escapeHtml(prod.nombre)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Cant: ${qty} x ${precioActual.toLocaleString()}</div>
                    </div>
                    <div style="font-weight: 600;">${subtotal.toLocaleString()}</div>
                </li>
            `;
        }
        
        document.getElementById('confirm-checkout-items').innerHTML = html;
        document.getElementById('confirm-checkout-total').innerText = '$' + total.toLocaleString();
        
        document.getElementById('modal-confirm-checkout').classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    proceedToCheckout() {
        document.getElementById('modal-confirm-checkout').classList.add('hidden');
        this.setVisitStep('checkout');
    },

    setVisitStep(step) {
        document.querySelectorAll('.visit-tab-btn').forEach(btn => {
            if (btn.getAttribute('data-step') === step) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        document.querySelectorAll('.visit-content-step').forEach(content => {
            if (content.id === `step-${step}`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        if (step === 'checkout') {
            setTimeout(() => this.resizeSignatureCanvas(), 100);
        }
    },

    renderVisitProducts(filterText = '') {
        const container = document.getElementById('visit-products-list');
        container.innerHTML = '';

        const filtered = this.state.catalogo.filter(prod => {
            const query = filterText.toLowerCase();
            return prod.nombre.toLowerCase().includes(query) || prod.sku.toLowerCase().includes(query);
        });

        filtered.forEach(prod => {
            const qty = this.state.cart[prod.id] || 0;
            const precioActual = this.state.tipoCliente === 'distribuidor' && prod.precio_distribuidor !== null 
                                ? parseFloat(prod.precio_distribuidor) 
                                : parseFloat(prod.precio_directo);

            const item = document.createElement('div');
            item.className = 'product-card';
            item.innerHTML = `
                <div class="product-info">
                    <span class="product-sku">${prod.sku || 'SKU-N/A'}</span>
                    <h3 class="product-title">${this.escapeHtml(prod.nombre)}</h3>
                    <div class="product-meta">
                        <span class="product-price">${precioActual.toLocaleString('es-CL')}</span>
                        <span class="product-type">(${this.state.tipoCliente})</span>
                    </div>
                </div>
                <div class="product-action">
                    <div class="stepper-input">
                        <button type="button" class="btn-stepper minus" onclick="App.updateCartQty(${prod.id}, -1)" ${qty === 0 ? 'disabled' : ''}>-</button>
                        <span class="qty-val">${qty}</span>
                        <button type="button" class="btn-stepper plus" onclick="App.updateCartQty(${prod.id}, 1)">+</button>
                    </div>
                </div>
            `;
            container.appendChild(item);
        });

        this.calculateOrderTotals();
    },

    updateCartQty(productId, amount) {
        const currentQty = this.state.cart[productId] || 0;
        const newQty = Math.max(0, currentQty + amount);

        if (newQty === 0) {
            delete this.state.cart[productId];
        } else {
            this.state.cart[productId] = newQty;
        }

        // Re-render
        if (this.state.activeRole === 'vendedor') {
            this.renderVisitProducts(document.getElementById('visit-product-search').value);
        } else {
            this.renderClienteVentaProducts(document.getElementById('cliente-sale-product-search').value);
        }
    },

    calculateOrderTotals() {
        let totalItems = 0;
        let totalAmount = 0;

        Object.keys(this.state.cart).forEach(prodId => {
            const prod = this.state.catalogo.find(p => p.id === parseInt(prodId, 10));
            const qty = this.state.cart[prodId];
            if (prod) {
                totalItems += qty;
                const precioActual = this.state.tipoCliente === 'distribuidor' && prod.precio_distribuidor !== null 
                                ? parseFloat(prod.precio_distribuidor) 
                                : parseFloat(prod.precio_directo);
                totalAmount += qty * precioActual;
            }
        });

        if (this.state.activeRole === 'vendedor') {
            document.getElementById('order-qty-count').innerText = totalItems.toString();
            document.getElementById('order-total-amount').innerText = `$${totalAmount.toLocaleString('es-CO')}`;
        } else {
            document.getElementById('cliente-sale-total-amount').innerText = `$${totalAmount.toLocaleString('es-CO')}`;
        }
    },

    async completeVisit() {
        if (!this.state.activeVisit) return;
        
        const client = this.state.activeVisit;
        const activeTab = document.querySelector('.visit-tab-btn.active').getAttribute('data-step');
        let status = 'pending';

        if (activeTab === 'order') {
            const cartKeys = Object.keys(this.state.cart);
            if (cartKeys.length === 0) {
                this.showToast("Agrega productos al pedido.", true);
                return;
            }
            status = 'visited';
        } else if (activeTab === 'no-sale') {
            status = 'no-sale';
        } else {
            const cartKeys = Object.keys(this.state.cart);
            status = cartKeys.length > 0 ? 'visited' : 'no-sale';
        }

        if (status === 'visited') {
            let total = 0;
            const details = [];

            Object.keys(this.state.cart).forEach(prodId => {
                const prod = this.state.catalogo.find(p => p.id === parseInt(prodId, 10));
                const qty = this.state.cart[prodId];
                if (prod) {
                    const precioActual = this.state.tipoCliente === 'distribuidor' && prod.precio_distribuidor !== null 
                                ? parseFloat(prod.precio_distribuidor) 
                                : parseFloat(prod.precio_directo);
                    total += qty * precioActual;
                    details.push({
                        producto_id: prod.id,
                        cantidad: qty,
                        precio_unitario: precioActual
                    });
                }
            });

            // Status PENDIENTE initially, to allow client to accept it
            const newOrder = {
                uuid_dispositivo: this.generateUUID(),
                cliente_id: client.id,
                vendedor_id: this.state.vendedor.id,
                latitud_captura: this.state.userCoords.lat,
                longitud_captura: this.state.userCoords.lng,
                fecha_hora: new Date().toISOString(),
                total: total,
                tipo_cliente: this.state.tipoCliente,
                detalles: details
            };

            this.state.unsyncedOrders.push(newOrder);
            OfflineStore.setItem(this.getDbPrefix() + 'unsynced_orders', this.state.unsyncedOrders);
            this.updateSyncBadge();
            
            // Trigger PDF Download
            if (confirm("Venta registrada exitosamente.\n¿Desea descargar el comprobante PDF del pedido?")) {
                this.downloadReceiptPdf(newOrder, client);
            }
        }

        this.state.visitStates[client.codigo_pdv] = status;
        OfflineStore.setItem(this.getDbPrefix() + 'visit_states', this.state.visitStates);

        this.showToast(`Visita registrada.`);
        this.state.activeVisit = null;
        this.state.cart = {};
        this.saveVisitState();

        this.navigateToView('ruta');
        this.renderRutaView();

        this.syncWithBackend();
    },

    openOrderModal(order) {
        let details = 'Sin detalles';
        if (order.detalles && order.detalles.length > 0) {
            details = order.detalles.map(d => `${d.cantidad}x ${d.codigo || 'Prod'} - $${(d.precio_unitario * d.cantidad).toLocaleString()}`).join('\n');
        } else if (order.productos) {
            // Offline format
            details = order.productos.map(d => `${d.cantidad}x ${d.codigo || 'Prod'} - $${(d.subtotal).toLocaleString()}`).join('\n');
        }
        
        alert(`Pedido: #PED-${order.id || 'NUEVO'}
Estado: ${order.estado_sincronizacion}
Total: $${(order.total || 0).toLocaleString()}

Detalles:
${details}`);
    },

    // Vendedor Pedidos list view
    async renderPedidosHistoryList() {
        const container = document.getElementById('pedidos-list-container');
        container.innerHTML = '<p style="text-align:center; padding:20px;">Cargando pedidos de Railway...</p>';

        try {
            // Retrieve all orders from backend for Vendedor ID 1 (Juan Pérez)
            // Since we don't have a Vendedor ID specific GET route, we can fetch client specific orders
            // or merge our local pending orders with a mock history for a robust dashboard display.
            const filter = this.state.pedidosListFilter; // PENDIENTE, DESPACHADO, CANCELADO
            
            // Build full array
            let list = [];

            // Add local unsynced orders
            this.state.unsyncedOrders.forEach(o => {
                list.push({
                    id: 0,
                    uuid_dispositivo: o.uuid_dispositivo,
                    cliente_id: o.cliente_id,
                    fecha_hora: o.fecha_hora,
                    total: o.total,
                    estado_sincronizacion: 'PENDIENTE'
                });
            });

            // Fetch live vendor orders and merge
            try {
                const vendorOrders = await ApiClient.getPedidosByVendedor(this.state.vendedor.id);
                vendorOrders.forEach(o => {
                    // Check duplicates
                    if (!list.some(x => x.id === o.id || x.uuid_dispositivo === o.uuid_dispositivo)) {
                        list.push(o);
                    }
                });
            } catch(err) {
                console.warn("Could not load database orders for vendor:", this.state.vendedor.id);
            }

            // Fallback mock list if empty
            if (list.length === 0) {
                list = [
                    { id: 101, uuid_dispositivo: 'mock-uuid-1', cliente_id: 1, fecha_hora: new Date(Date.now() - 3600000).toISOString(), total: 4200, estado_sincronizacion: 'PENDIENTE' },
                    { id: 102, uuid_dispositivo: 'mock-uuid-2', cliente_id: 2, fecha_hora: new Date(Date.now() - 7200000).toISOString(), total: 9500, estado_sincronizacion: 'DESPACHADO' },
                    { id: 103, uuid_dispositivo: 'mock-uuid-3', cliente_id: 3, fecha_hora: new Date(Date.now() - 86400000).toISOString(), total: 1500, estado_sincronizacion: 'CANCELADO' }
                ];
            }

            // Sort
            list.sort((a,b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));

            // Filter
            const filtered = list.filter(o => o.estado_sincronizacion.toUpperCase() === filter.toUpperCase());

            container.innerHTML = '';
            if (filtered.length === 0) {
                container.innerHTML = `<p class="empty-state-text">No hay pedidos en estado ${filter.toLowerCase()}.</p>`;
                return;
            }

            filtered.forEach(o => {
                const client = this.state.clientes.find(c => c.id === o.cliente_id) || { nombre: 'Cliente General' };
                const formattedDate = new Date(o.fecha_hora).toLocaleDateString('es-CO', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                
                const card = document.createElement('div');
                card.className = 'order-history-card';
                card.onclick = () => this.openOrderModal(o);
                card.innerHTML = `
                    <div class="order-history-header">
                        <span class="order-code">#PED-${o.id || 'NUEVO'}</span>
                        <span class="order-status ${o.estado_sincronizacion.toLowerCase()}">${o.estado_sincronizacion}</span>
                    </div>
                    <div class="order-history-details">
                        <span>Cliente: <span class="client-name">${client.nombre}</span></span>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="order-history-footer">
                        <span>Total pedido</span>
                        <span class="price">$${parseFloat(o.total).toLocaleString('es-CL')}</span>
                    </div>
                `;
                container.appendChild(card);
            });

        } catch (e) {
            console.error(e);
            container.innerHTML = '<p style="text-align:center; padding:20px; color:var(--danger-color);">Error al cargar historial.</p>';
        }
    },

    filterPedidosList(status) {
        this.state.pedidosListFilter = status;
        document.querySelectorAll('#view-pedidos .view-switcher .switch-btn').forEach(btn => {
            if (btn.getAttribute('data-status-filter') === status) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        this.renderPedidosHistoryList();
    },


    // ==================== FLUX: CLIENTE LOGIC ====================
    
    // Initialize client local inventory
    // ==================== GLOBAL HELPER LOGICS ====================
    
    // Canvas signature pad
    initSignatureCanvas() {
        const canvas = document.getElementById('signature-canvas');
        if (!canvas) return;

        this.signaturePad.canvas = canvas;
        this.signaturePad.ctx = canvas.getContext('2d');

        canvas.addEventListener('mousedown', (e) => {
            this.signaturePad.isDrawing = true;
            const pos = this.getCanvasPos(e);
            this.signaturePad.lastX = pos.x;
            this.signaturePad.lastY = pos.y;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!this.signaturePad.isDrawing) return;
            const pos = this.getCanvasPos(e);
            this.drawSignatureLine(pos.x, pos.y);
        });

        canvas.addEventListener('mouseup', () => this.signaturePad.isDrawing = false);
        canvas.addEventListener('mouseout', () => this.signaturePad.isDrawing = false);

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.signaturePad.isDrawing = true;
            const pos = this.getCanvasPos(e.touches[0]);
            this.signaturePad.lastX = pos.x;
            this.signaturePad.lastY = pos.y;
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.signaturePad.isDrawing) return;
            const pos = this.getCanvasPos(e.touches[0]);
            this.drawSignatureLine(pos.x, pos.y);
        }, { passive: false });

        canvas.addEventListener('touchend', () => this.signaturePad.isDrawing = false);

        const btnCSig = document.getElementById('btn-clear-signature'); if(btnCSig) btnCSig.addEventListener('click', () => this.clearSignature());
    },

    getCanvasPos(evt) {
        const rect = this.signaturePad.canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    },

    drawSignatureLine(x, y) {
        const ctx = this.signaturePad.ctx;
        ctx.beginPath();
        ctx.moveTo(this.signaturePad.lastX, this.signaturePad.lastY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        this.signaturePad.lastX = x;
        this.signaturePad.lastY = y;
    },

    resizeSignatureCanvas() {
        const canvas = this.signaturePad.canvas;
        const rect = canvas.getBoundingClientRect();
        
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
            this.clearSignature();
        }
    },

    clearSignature() {
        const canvas = this.signaturePad.canvas;
        const ctx = this.signaturePad.ctx;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '12px Plus Jakarta Sans';
        ctx.fillStyle = '#9ca3af';
        ctx.textAlign = 'center';
        ctx.fillText('Firme aquí con el dedo o puntero', canvas.width / 2, canvas.height / 2 + 5);
    },

    isSignatureEmpty() {
        const canvas = this.signaturePad.canvas;
        const buffer = new Uint32Array(
            this.signaturePad.ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
        );
        return !buffer.some(color => color !== 0);
    },

    handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const status = document.getElementById('photo-status');
            const previewCont = document.getElementById('photo-preview-container');
            const preview = document.getElementById('photo-preview');

            preview.src = e.target.result;
            previewCont.classList.remove('hidden');
            status.style.display = 'none';

            this.showToast("Fotografía capturada exitosamente.");
        };
        reader.readAsDataURL(file);
    },

    removePhoto() {
        const status = document.getElementById('photo-status');
        const previewCont = document.getElementById('photo-preview-container');
        const preview = document.getElementById('photo-preview');
        
        preview.src = '';
        previewCont.classList.add('hidden');
        status.style.display = 'block';
    },

    initUIEventListeners() {
        this.initAddressAutocomplete();
        const btnSync = document.getElementById('sync-button'); if(btnSync) btnSync.addEventListener('click', () => this.syncWithBackend());

        // UX Phase 2: Bottom Sheet Toggle Logic
        const bottomSheetHandle = document.getElementById('bottom-sheet-handle');
        if (bottomSheetHandle) {
            const toggleSheet = () => {
                const sheet = document.getElementById('route-list-container');
                sheet.classList.toggle('expanded');
                setTimeout(() => {
                    if(typeof MapController !== 'undefined' && MapController.invalidateSize) {
                        MapController.invalidateSize();
                    }
                }, 300);
            };

            bottomSheetHandle.addEventListener('click', toggleSheet);

            let touchStartY = 0;
            const routeHeader = document.querySelector('#route-list-container .route-header');
            const handleTouchStart = (e) => {
                touchStartY = e.changedTouches[0].screenY;
            };
            const handleTouchEnd = (e) => {
                const touchEndY = e.changedTouches[0].screenY;
                const deltaY = touchEndY - touchStartY;
                const sheet = document.getElementById('route-list-container');
                const isExpanded = sheet.classList.contains('expanded');
                
                if (deltaY < -30 && !isExpanded) {
                    toggleSheet();
                } else if (deltaY > 30 && isExpanded) {
                    toggleSheet();
                }
            };

            bottomSheetHandle.addEventListener('touchstart', handleTouchStart, { passive: true });
            bottomSheetHandle.addEventListener('touchend', handleTouchEnd, { passive: true });
            
            // Allow dragging from the header area too!
            if (routeHeader) {
                routeHeader.addEventListener('touchstart', handleTouchStart, { passive: true });
                routeHeader.addEventListener('touchend', handleTouchEnd, { passive: true });
            }
        }

        const btnOpt = document.getElementById('btn-optimize'); if(btnOpt) btnOpt.addEventListener('click', () => this.optimizeRouteByDistance());

        // Settings Buttons
        const btnRes = document.getElementById('btn-reset-cache'); if(btnRes) btnRes.addEventListener('click', () => {
            if (confirm("¿Seguro que deseas limpiar la base de datos local y cerrar sesión?")) {
                localStorage.clear();
                this.state.visitStates = {};
                this.state.unsyncedOrders = [];
                this.loadCachedData();
                this.logout();
            }
        });

        const btnRep = document.getElementById('btn-download-report'); if(btnRep) btnRep.addEventListener('click', () => this.downloadLocalReport());

        // Visit steps navigation tabs
        const stepButtons = document.querySelectorAll('.visit-tab-btn');
        stepButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetStep = btn.getAttribute('data-step');
                this.setVisitStep(targetStep);
            });
        });

        // Cancel active visit
        const btnCanc = document.getElementById('btn-cancel-visit'); if(btnCanc) btnCanc.addEventListener('click', () => {
            if (confirm("¿Seguro que deseas salir del registro de visita?")) {
                this.state.activeVisit = null;
                this.state.cart = {};
                this.saveVisitState();
                this.navigateToView('ruta');
            }
        });

        const btnComp = document.getElementById('btn-complete-visit'); if(btnComp) btnComp.addEventListener('click', () => this.completeVisit());



        const pUpTr = document.getElementById('photo-upload-trigger'); if(pUpTr) pUpTr.addEventListener('click', (e) => {
            if (e.target.id !== 'btn-remove-photo' && e.target.id !== 'real-photo-input') {
                const realInput = document.getElementById('real-photo-input');
                if (realInput) realInput.click();
            }
        });

        const realPhotoInput = document.getElementById('real-photo-input');
        if (realPhotoInput) {
            realPhotoInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
        }

        const btnRPh = document.getElementById('btn-remove-photo'); if(btnRPh) btnRPh.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removePhoto();
        });

        // iOS details
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        
        if (isIOS && !isStandalone) {
            const iosInstructions = document.getElementById('ios-install-instructions');
            if (iosInstructions) {
                iosInstructions.classList.remove('hidden');
            }
        }

        // Cliente pending/incoming orders view switchers (guarded for backward compatibility)
        const btnShowPendingRecibir = document.getElementById('btn-show-pending-recibir');
        const btnShowCompletedRecibir = document.getElementById('btn-show-completed-recibir');
        if (btnShowPendingRecibir) {
            btnShowPendingRecibir.addEventListener('click', () => {
                btnShowPendingRecibir.classList.add('active');
                if (btnShowCompletedRecibir) btnShowCompletedRecibir.classList.remove('active');
                this.state.clientePedidosFilter = 'PENDIENTE';
                if (typeof this.renderClientePedidosList === 'function') this.renderClientePedidosList();
            });
        }
        if (btnShowCompletedRecibir) {
            btnShowCompletedRecibir.addEventListener('click', () => {
                if (btnShowPendingRecibir) btnShowPendingRecibir.classList.remove('active');
                btnShowCompletedRecibir.classList.add('active');
                this.state.clientePedidosFilter = 'DESPACHADO';
                if (typeof this.renderClientePedidosList === 'function') this.renderClientePedidosList();
            });
        }
    },

    // Initialize Address Autocomplete using OpenStreetMap Nominatim
    initAddressAutocomplete() {
        const setupAutocomplete = (inputId, latId, lngId, suggestionsId) => {
            const inputEl = document.getElementById(inputId);
            const suggestionsEl = document.getElementById(suggestionsId);
            const latEl = document.getElementById(latId);
            const lngEl = document.getElementById(lngId);

            if (!inputEl || !suggestionsEl) return;

            let timeoutId;

            inputEl.addEventListener('input', (e) => {
                clearTimeout(timeoutId);
                const query = e.target.value.trim();

                if (query.length < 4) {
                    suggestionsEl.classList.add('hidden');
                    suggestionsEl.innerHTML = '';
                    return;
                }

                timeoutId = setTimeout(async () => {
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=co`);
                        const results = await response.json();

                        suggestionsEl.innerHTML = '';
                        if (results.length > 0) {
                            results.forEach(place => {
                                const li = document.createElement('li');
                                li.innerText = place.display_name;
                                li.addEventListener('click', () => {
                                    inputEl.value = place.display_name;
                                    if (latEl) latEl.value = parseFloat(place.lat).toFixed(6);
                                    if (lngEl) lngEl.value = parseFloat(place.lon).toFixed(6);
                                    
                                    // Visual feedback and map sync
                                    if (inputId === 'new-client-direccion') {
                                        const badge = document.getElementById('gps-capture-badge');
                                        if (badge) {
                                            badge.className = 'status-badge dispatched';
                                            badge.innerText = 'Ubicación de Mapa ✓';
                                        }
                                        if (typeof PickerMapController !== 'undefined') {
                                            PickerMapController.setCenter('new-client-picker-map', place.lat, place.lon);
                                        }
                                    } else if (inputId === 'admin-cliente-direccion') {
                                        if (typeof PickerMapController !== 'undefined') {
                                            PickerMapController.setCenter('admin-cliente-picker-map', place.lat, place.lon);
                                        }
                                    }
                                    
                                    suggestionsEl.classList.add('hidden');
                                });
                                suggestionsEl.appendChild(li);
                            });
                            suggestionsEl.classList.remove('hidden');
                        } else {
                            suggestionsEl.classList.add('hidden');
                        }
                    } catch (err) {
                        console.error('Autocomplete error:', err);
                        suggestionsEl.classList.add('hidden');
                    }
                }, 500); // 500ms debounce
            });

            // Hide suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (e.target !== inputEl && e.target !== suggestionsEl) {
                    suggestionsEl.classList.add('hidden');
                }
            });
        };

        // Setup for Vendedor "Add Client" view
        setupAutocomplete('new-client-direccion', 'new-client-lat', 'new-client-lng', 'new-client-direccion-suggestions');
        
        // Setup for Admin "Add Client" modal
        setupAutocomplete('admin-cliente-direccion', 'admin-cliente-lat', 'admin-cliente-lng', 'admin-cliente-direccion-suggestions');
    },

    initFilters() {
        // Vendedor catalog search
        const catSearchInput = document.getElementById('catalog-search');
        if (catSearchInput) {
            catSearchInput.addEventListener('input', (e) => {
                this.renderCatalog(e.target.value);
            });
        }

        // Minified catalog search
        const visitSearchInput = document.getElementById('visit-product-search');
        if (visitSearchInput) {
            visitSearchInput.addEventListener('input', (e) => {
                this.renderVisitProducts(e.target.value);
            });
        }

        // Despacho stock search
        const despStockSearch = document.getElementById('despacho-stock-search');
        if (despStockSearch) {
            despStockSearch.addEventListener('input', (e) => {
                DespachoController.renderDespachoInventario(e.target.value);
            });
        }

        // Despacho orders search
        const despPedidosSearch = document.getElementById('despacho-pedidos-search');
        if (despPedidosSearch) {
            despPedidosSearch.addEventListener('input', (e) => {
                DespachoController.renderDespachoCertificar(e.target.value);
            });
        }
    },

    initConnectionMonitor() {
        window.addEventListener('online', () => this.syncWithBackend());
        window.addEventListener('offline', () => this.updateConnectionUI(false));

        setInterval(async () => {
            const isOnline = await ApiClient.checkConnection();
            this.updateConnectionUI(isOnline);
        }, 12000);
    },

    updateConnectionUI(isOnline) {
        const ind = document.getElementById('connection-status');
        const text = ind.querySelector('.status-text');
        
        if (isOnline) {
            ind.className = 'status-indicator online';
            text.innerText = 'Online';
        } else {
            ind.className = 'status-indicator offline';
            text.innerText = 'Offline';
        }
    },

    updateSyncBadge() {
        const orderCount = this.state.unsyncedOrders ? this.state.unsyncedOrders.length : 0;
        const clientCount = this.state.unsyncedClientes ? this.state.unsyncedClientes.length : 0;
        const count = orderCount + clientCount;
        const badge = document.getElementById('sync-badge');
        const syncBtn = document.getElementById('sync-button');

        if (count > 0) {
            badge.innerText = count.toString();
            badge.classList.add('show');
        } else {
            badge.classList.remove('show');
        }

        const lastSync = localStorage.getItem('sam_last_sync');
        if (syncBtn) {
            syncBtn.title = lastSync ? `Última sincronización: ${lastSync} | Pendientes: ${count}` : `Sincronizar (Pendientes: ${count})`;
        }
    },

    // Request and update the user's real location via browser GPS
    updateUserCoords() {
        if (!navigator.geolocation) {
            console.warn("Geolocation not supported by this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                this.state.userCoords = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                MapController.setUserLocation(this.state.userCoords.lat, this.state.userCoords.lng);
                if (this.state.clientes.length > 0 && document.getElementById('view-ruta').classList.contains('active')) {
                    this.renderRutaView();
                }
            },
            (err) => {
                // Permission denied or unavailable — silently keep last known coords
                console.warn("GPS unavailable:", err.message);
                if (err.code === 1 && this.state.isLoggedIn) {
                    this.showToast("⚠️ Activa el permiso de ubicación en tu navegador para ver tu posición en el mapa.", true);
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );
    },

    optimizeRouteByDistance() {
        if (this.state.clientes.length === 0) return;
        
        this.showToast("Optimizando ruta...");
        
        let unvisited = [...this.state.clientes];
        let currentPos = { ...this.state.userCoords };
        let optimized = [];
        let seq = 1;

        while (unvisited.length > 0) {
            let closestIdx = 0;
            let minDist = Infinity;

            for (let i = 0; i < unvisited.length; i++) {
                const client = unvisited[i];
                if (client.latitud && client.longitud) {
                    const dist = this.calculateDistance(
                        currentPos.lat, currentPos.lng,
                        client.latitud, client.longitud
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        closestIdx = i;
                    }
                }
            }

            const closestClient = unvisited[closestIdx];
            closestClient.secuencia_ruta = seq++;
            optimized.push(closestClient);

            currentPos = {
                lat: closestClient.latitud,
                lng: closestClient.longitud
            };

            unvisited.splice(closestIdx, 1);
        }

        this.state.clientes = optimized;
        OfflineStore.setItem(this.getDbPrefix() + 'clientes', this.state.clientes);
        this.renderRutaView();

        // Sync reordered route with backend
        const ordenList = optimized.map(c => ({ id: c.id, secuencia_ruta: c.secuencia_ruta }));
        ApiClient.reordenarRuta(ordenList).then(() => {
            this.showToast("Ruta optimizada y guardada en el servidor.");
        }).catch(err => {
            console.error(err);
            this.showToast("Ruta optimizada localmente (sin conexión).");
        });
    },

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    downloadLocalReport() {
        const report = {
            activeRole: this.state.activeRole,
            vendedor: this.state.vendedor,
            activeClient: this.state.activeClient,
            visitas: this.state.visitStates,
            pedidos_pendientes_sync: this.state.unsyncedOrders,
            inventario_comercio: this.state.activeClient ? this.state.clienteInventory : null,
            ventas_comercio: this.state.activeClient ? this.state.clienteSales : null,
            timestamp: new Date().toISOString()
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `Reporte_TotalAPP_${this.state.activeRole}_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        
        this.showToast("Reporte descargado.");
    },

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    showToast(message, isError = false) {
        const toast = document.getElementById('toast-notification');
        const toastMsg = document.getElementById('toast-message');
        const toastIcon = document.getElementById('toast-icon');

        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }

        toastMsg.innerText = message;
        
        if (isError) {
            toast.style.background = '#f03e3e';
            toastIcon.setAttribute('data-lucide', 'alert-triangle');
        } else {
            // Updated to use the Total Agro primary green color instead of a hardcoded generic green
            toast.style.background = 'var(--primary-color, #2c5f2e)';
            toastIcon.setAttribute('data-lucide', 'check');
        }

        this.refreshIcons();
        toast.classList.add('show');

        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    },

    // PWA Service worker registration
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then((reg) => {
                        console.log('[PWA] Service Worker registrado. Scope:', reg.scope);
                    })
                    .catch((err) => {
                        console.error('[PWA] Error en Service Worker:', err);
                    });
            });
        }

        // Handle Android/Chrome Install Prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            this.deferredInstallPrompt = e;
            
            const installBtn = document.getElementById('btn-install-pwa');
            if (installBtn) {
                installBtn.style.display = 'block';
                installBtn.addEventListener('click', async () => {
                    this.deferredInstallPrompt.prompt();
                    const { outcome } = await this.deferredInstallPrompt.userChoice;
                    console.log(`[PWA] Install outcome: ${outcome}`);
                    this.deferredInstallPrompt = null;
                    installBtn.style.display = 'none';
                });
            }
        });
    },

    // ==================== ADMIN METHODS ====================

    // Load admin tables and stats




    // Render Vendedores list


    // Render Clientes list


    // Render Productos catalog


    // Render global Pedidos list


    // Admin: Update order status (dispatch or cancel)


    // Populate sellers selectors in admin forms



    // Render seller route on admin map view


    // Vendedores Modals & CRUD





    // Clientes Modals & CRUD






    // Productos Modals & CRUD





    // ==================== DESPACHO / BODEGA METHODS ====================









    // ==================== ADMIN USUARIOS CRUD ====================







    // ==================== ADMIN INFORMES ====================




    
    async downloadReceiptPdf(order, client) {
        try {
            this.showToast("Generando comprobante PDF...", false);
            
            // Reconstruir productos con descripciones
            const productosPdf = order.detalles.map(d => {
                const prod = this.state.catalogo.find(p => p.id === d.producto_id);
                return {
                    codigo: prod ? prod.codigo : d.producto_id.toString(),
                    descripcion: prod ? prod.descripcion : 'Producto ID ' + d.producto_id,
                    cantidad: d.cantidad,
                    precio_unitario: d.precio_unitario,
                    subtotal: d.cantidad * d.precio_unitario
                };
            });

            const payload = {
                uuid_dispositivo: order.uuid_dispositivo,
                vendedor_id: order.vendedor_id,
                vendedor_nombre: this.state.user ? this.state.user.username : 'Vendedor',
                cliente_id: client.id,
                nombre_cliente: client.nombre,
                nit_cedula: client.codigo_pdv,
                direccion: client.direccion,
                ciudad: 'Ciudad',
                telefono: '',
                correo: '',
                productos: productosPdf,
                subtotal: order.total,
                iva: 0,
                descuento: 0,
                total: order.total,
                forma_pago: 'Contado',
                condiciones_entrega: '',
                fecha_estimada_entrega: null
            };

            const response = await fetch(API.baseURL + '/pedidos/generar_pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Error en el servidor");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "Comprobante_" + client.nombre.replace(/\s+/g, '_') + ".pdf";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            
            this.showToast("PDF descargado correctamente.");
        } catch(e) {
            console.error(e);
            this.showToast("Error al generar PDF: " + e.message, true);
        }
    }
};

// Global hook for events
window.App = App;

// Run app init when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
App.registerServiceWorker();
