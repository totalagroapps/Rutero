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
            if (typeof lucide !== 'undefined') {
                this.refreshIcons();
            }
        }, 50);
    },

    // Initialize application
    async init() {
        console.log("Starting TotalAPP / Rutero SAM...");
        
        // 1. Load config settings from localStorage
        this.loadSettings();

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

        // 7. Load local cached data & fetch latest from backend
        this.loadCachedData();
        await this.syncWithBackend();

        // Populate client dropdown for login
        this.populateClientLoginSelector();

        // 8. Register UI events
        this.initUIEventListeners();

        // Show role selection screen initially unless already logged in
        this.checkLoginState();

        // Initialize Lucide icons
        this.refreshIcons();
    },

    // Check if user was already logged in
    checkLoginState() {
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
            this.logout();
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
            
            AppModals.inject('modal-cartera-total-adeudado'); document.getElementById('modal-cartera-total-adeudado').innerText = `$${cartera.total_adeudado.toLocaleString('es-CO')}`;
            AppModals.inject('modal-cartera-total-vencido'); document.getElementById('modal-cartera-total-vencido').innerText = `$${cartera.total_vencido.toLocaleString('es-CO')}`;
            
            AppModals.inject('modal-cartera-facturas');
        AppModals.inject('modal-cartera-facturas'); const listContainer = document.getElementById('modal-cartera-facturas');
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
                                <span>Total: $${f.monto_total.toLocaleString('es-CO')}</span>
                                <strong class="text-danger">Saldo: $${f.saldo_pendiente.toLocaleString('es-CO')}</strong>
                            </div>
                        </div>
                    `;
                });
            } else {
                listContainer.innerHTML = '<p style="text-align:center; color:var(--text-secondary); font-size:0.9rem; padding:10px;">No hay facturas pendientes.</p>';
            }
            
            AppModals.inject('modal-cartera-detalle');
AppModals.inject('modal-cartera-detalle'); document.getElementById('modal-cartera-detalle').classList.remove('hidden');
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

    logout() {
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
        
        this.showToast("Sesión cerrada.");
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
    captureClientGps() {
        const badge = document.getElementById('gps-capture-badge');
        badge.className = 'status-badge pending';
        badge.innerText = 'Obteniendo…';
        this.showToast("Solicitando ubicación GPS...");

        const setCoords = (lat, lng) => {
            document.getElementById('new-client-lat').value = lat.toFixed(6);
            document.getElementById('new-client-lng').value = lng.toFixed(6);
            badge.className = 'status-badge dispatched';
            badge.innerText = 'Ubicación Capturada ✓';
            this.showToast("Coordenadas GPS capturadas.");
        };

        if (!navigator.geolocation) {
            this.showToast("Tu navegador no soporta GPS.", true);
            badge.className = 'status-badge critical';
            badge.innerText = 'No soportado';
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords(pos.coords.latitude, pos.coords.longitude);
            },
            (err) => {
                console.warn("GPS error:", err);
                badge.className = 'status-badge critical';
                badge.innerText = 'Sin permiso';
                if (err.code === 1) {
                    this.showToast("Permiso de ubicación denegado. Activa el GPS en el navegador.", true);
                } else if (err.code === 2) {
                    this.showToast("No se pudo determinar la ubicación. Intenta al aire libre.", true);
                } else {
                    this.showToast("GPS agotado. Intenta de nuevo.", true);
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    },

    // Handle new client save
    async handleSaveCliente(e) {
        e.preventDefault();

        const nombre = document.getElementById('new-client-name').value.trim();
        const encargado = document.getElementById('new-client-encargado').value.trim();
        const direccion = document.getElementById('new-client-direccion').value.trim();
        const codigo = document.getElementById('new-client-codigo').value.trim();
        const frecuencia = document.getElementById('new-client-frecuencia').value;
        const secuencia = document.getElementById('new-client-secuencia').value;
        const lat = document.getElementById('new-client-lat').value;
        const lng = document.getElementById('new-client-lng').value;

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

        const newClient = {
            uuid_dispositivo: this.generateUUID(),
            codigo_pdv: codigo,
            nombre: nombre,
            encargado: encargado || null,
            direccion: direccion,
            latitud: parseFloat(lat),
            longitud: parseFloat(lng),
            frecuencia: frecuencia,
            secuencia_ruta: parseInt(secuencia, 10),
            activo: true
        };

        // Save local
        this.state.clientes.push(newClient);
        localStorage.setItem('sam_cache_clientes', JSON.stringify(this.state.clientes));

        this.state.unsyncedClientes.push(newClient);
        localStorage.setItem('sam_unsynced_clientes', JSON.stringify(this.state.unsyncedClientes));

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

    // Load state from local storage cache
    loadCachedData() {
        const cachedClientes = localStorage.getItem('sam_cache_clientes');
        if (cachedClientes) {
            this.state.clientes = JSON.parse(cachedClientes);
        }

        const cachedCatalogo = localStorage.getItem('sam_cache_catalogo');
        if (cachedCatalogo) {
            this.state.catalogo = JSON.parse(cachedCatalogo);
        }

        const cachedVisitStates = localStorage.getItem('sam_visit_states');
        if (cachedVisitStates) {
            this.state.visitStates = JSON.parse(cachedVisitStates);
        }

        const cachedUnsynced = localStorage.getItem('sam_unsynced_orders');
        if (cachedUnsynced) {
            this.state.unsyncedOrders = JSON.parse(cachedUnsynced);
        }

        const cachedUnsyncedClientes = localStorage.getItem('sam_unsynced_clientes');
        if (cachedUnsyncedClientes) {
            this.state.unsyncedClientes = JSON.parse(cachedUnsyncedClientes);
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
            // 1. Sync any pending offline orders
            if (this.state.unsyncedOrders.length > 0) {
                this.showToast(`Sincronizando ${this.state.unsyncedOrders.length} pedido(s)...`);
                const syncResult = await ApiClient.syncPedidos(this.state.unsyncedOrders);
                
                if (syncResult.total_insertados > 0 || syncResult.total_duplicados > 0) {
                    this.state.unsyncedOrders = [];
                    localStorage.setItem('sam_unsynced_orders', JSON.stringify([]));
                    this.updateSyncBadge();
                    this.showToast("Pedidos sincronizados con éxito!");
                }
            }

            // 1.5 Sync any pending offline clients
            if (this.state.unsyncedClientes && this.state.unsyncedClientes.length > 0) {
                this.showToast(`Sincronizando ${this.state.unsyncedClientes.length} comercio(s)...`);
                const syncResult = await ApiClient.syncClientes(this.state.unsyncedClientes);
                
                if (syncResult.total_insertados > 0 || syncResult.total_duplicados > 0) {
                    this.state.unsyncedClientes = [];
                    localStorage.setItem('sam_unsynced_clientes', JSON.stringify([]));
                    this.updateSyncBadge();
                    this.showToast("Comercios sincronizados con éxito!");
                }
            }

            // 2. Fetch fresh routes & catalog
            const vid = (this.state.user && this.state.user.vendedor_id) ? this.state.user.vendedor_id : 1;
            const vendedorRuta = await ApiClient.getRuta(vid);
            this.state.clientes = vendedorRuta;
            localStorage.setItem('sam_cache_clientes', JSON.stringify(vendedorRuta));

            const catalogoData = await ApiClient.getCatalogo();
            this.state.catalogo = catalogoData;
            localStorage.setItem('sam_cache_catalogo', JSON.stringify(catalogoData));

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

    startVisit(clientId) {
        const client = this.state.clientes.find(c => c.id === clientId);
        if (!client) return;

        this.state.activeVisit = client;
        this.state.cart = {};

        document.getElementById('visit-client-name').innerText = client.nombre;
        document.getElementById('visit-client-code').innerText = client.codigo_pdv;

        document.getElementById('no-sale-notes').value = '';
        this.clearSignature();
        this.removePhoto();

        this.setVisitStep('order');
        this.renderVisitProducts();
        document.getElementById('visit-tipo-cliente').value = 'directo';
        this.state.tipoCliente = 'directo';
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
            let item = this.state.cart[pId];
            let subtotal = item.qty * item.precio;
            total += subtotal;
            html += `
                <li style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <div>
                        <div style="font-weight: 500;">${this.escapeHtml(item.nombre)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Cant: ${item.qty} x $${item.precio.toLocaleString()}</div>
                    </div>
                    <div style="font-weight: 600;">$${subtotal.toLocaleString()}</div>
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
            item.className = 'order-select-card';
            item.innerHTML = `
                <div class="order-select-info">
                    <span class="name">${prod.nombre}</span>
                    <div class="price">$${precioActual.toLocaleString('es-CL')} <span style="font-size:0.6rem; color:#888;">(${this.state.tipoCliente})</span></div>
                </div>
                <div class="order-qty-control">
                    <button type="button" class="qty-btn" onclick="App.updateCartQty(${prod.id}, -1)" ${qty === 0 ? 'disabled' : ''}>-</button>
                    <span class="qty-val">${qty}</span>
                    <button type="button" class="qty-btn" onclick="App.updateCartQty(${prod.id}, 1)">+</button>
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
            localStorage.setItem('sam_unsynced_orders', JSON.stringify(this.state.unsyncedOrders));
            this.updateSyncBadge();
        }

        this.state.visitStates[client.codigo_pdv] = status;
        localStorage.setItem('sam_visit_states', JSON.stringify(this.state.visitStates));

        this.showToast(`Visita registrada.`);
        this.state.activeVisit = null;
        this.state.cart = {};

        this.navigateToView('ruta');
        this.renderRutaView();

        this.syncWithBackend();
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
    initClientInventory() {
        const key = `sam_inventory_${this.state.activeClient.id}`;
        const cached = localStorage.getItem(key);
        if (cached) {
            this.state.clienteInventory = JSON.parse(cached);
        } else {
            // Seed a default inventory stock level for demonstration
            const mockInv = {};
            this.state.catalogo.forEach((p, idx) => {
                const stockLevels = [25, 4, 15, 8, 30, 2];
                mockInv[p.id] = stockLevels[idx % stockLevels.length];
            });
            this.state.clienteInventory = mockInv;
            localStorage.setItem(key, JSON.stringify(mockInv));
        }
    },

    saveClientInventory() {
        const key = `sam_inventory_${this.state.activeClient.id}`;
        localStorage.setItem(key, JSON.stringify(this.state.clienteInventory));
    },

    // Initialize client local sales
    initClientSales() {
        const key = `sam_sales_${this.state.activeClient.id}`;
        const cached = localStorage.getItem(key);
        if (cached) {
            this.state.clienteSales = JSON.parse(cached);
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
            this.state.clienteSales = mockSales;
            localStorage.setItem(key, JSON.stringify(mockSales));
        }
    },

    saveClientSales() {
        const key = `sam_sales_${this.state.activeClient.id}`;
        localStorage.setItem(key, JSON.stringify(this.state.clienteSales));
    },

    // Render Cliente Dashboard
    renderClienteDashboard() {
        document.getElementById('cliente-welcome-title').innerText = `Hola, ${this.state.activeClient.nombre}`;
        
        // Count totals
        // 1. Incoming pending orders
        const pendingCount = this.state.clientOrders.filter(o => o.estado_sincronizacion === 'PENDIENTE').length;
        document.getElementById('cliente-incoming-count').innerText = pendingCount.toString();

        // 2. Inventory total items
        const totalItems = Object.values(this.state.clienteInventory).reduce((sum, qty) => sum + qty, 0);
        document.getElementById('cliente-inventory-count').innerText = totalItems.toString();

        // 3. Low stock count (less than 10 units)
        const lowStockCount = Object.keys(this.state.clienteInventory).filter(prodId => this.state.clienteInventory[prodId] < 10).length;
        document.getElementById('cliente-low-stock-count').innerText = lowStockCount.toString();

        // 4. Sales recorded today
        const today = new Date().toDateString();
        const todaySales = this.state.clienteSales.filter(s => new Date(s.fecha).toDateString() === today);
        const totalSalesToday = todaySales.reduce((sum, s) => sum + parseFloat(s.total), 0);
        document.getElementById('cliente-sales-count').innerText = `$${totalSalesToday.toLocaleString('es-CL')}`;

        // Periodically fetch pending orders in background to keep dashboard fresh
        this.fetchClientOrdersBackground();
    },

    async fetchClientOrdersBackground() {
        try {
            const list = await ApiClient.getClientPedidos(this.state.activeClient.id);
            this.state.clientOrders = list;
            
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
            const list = await ApiClient.getClientPedidos(this.state.activeClient.id);
            this.state.clientOrders = list;
            
            this.renderClientePedidosList();
        } catch(e) {
            console.warn("Could not load live client orders, rendering cached local ones", e);
            this.renderClientePedidosList();
        }
    },

    renderClientePedidosList() {
        const container = document.getElementById('cliente-pedidos-list-container');
        container.innerHTML = '';

        const filter = this.state.clientePedidosFilter; // PENDIENTE (Por recibir), DESPACHADO/RECIBIDO (Recibidos)
        
        let filtered = [];
        if (filter === 'PENDIENTE') {
            filtered = this.state.clientOrders.filter(o => o.estado_sincronizacion === 'PENDIENTE');
        } else {
            filtered = this.state.clientOrders.filter(o => o.estado_sincronizacion === 'DESPACHADO' || o.estado_sincronizacion === 'RECIBIDO');
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
            card.onclick = () => this.openOrderModal(o);
            card.innerHTML = `
                <div class="order-history-header">
                    <span class="order-code">#PED-${o.id}</span>
                    <span class="order-status ${o.estado_sincronizacion.toLowerCase()}">${o.estado_sincronizacion === 'PENDIENTE' ? 'Por recibir' : 'Recibido'}</span>
                </div>
                <div class="order-history-details">
                    <span>Vendedor: <span class="client-name">${this.state.vendedor ? this.state.vendedor.nombre : (this.state.user ? this.state.user.username : 'Asignado')}</span></span>
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

        const filtered = this.state.catalogo.filter(prod => {
            const query = filterText.toLowerCase();
            return prod.nombre.toLowerCase().includes(query) || prod.sku.toLowerCase().includes(query);
        });

        filtered.forEach(prod => {
            const stock = this.state.clienteInventory[prod.id] || 0;
            
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
        this.renderClienteVentaProducts();
    },

    renderClienteVentaProducts(filterText = '') {
        const container = document.getElementById('cliente-sale-products-list');
        container.innerHTML = '';

        // Only list products that have stock > 0 in the client's shop!
        const availableProducts = this.state.catalogo.filter(prod => {
            const stock = this.state.clienteInventory[prod.id] || 0;
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
            const qty = this.state.cart[prod.id] || 0;
            const stock = this.state.clienteInventory[prod.id];
            
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

        this.calculateOrderTotals();
    },

    completeClienteSale() {
        const cartKeys = Object.keys(this.state.cart);
        if (cartKeys.length === 0) {
            this.showToast("Agrega productos a la venta.", true);
            return;
        }

        let total = 0;
        const details = [];

        // Deduct stock and compile details
        for (let prodId of cartKeys) {
            const prod = this.state.catalogo.find(p => p.id === parseInt(prodId, 10));
            const qty = this.state.cart[prodId];
            if (prod) {
                const currentStock = this.state.clienteInventory[prod.id] || 0;
                if (qty > currentStock) {
                    this.showToast(`Stock insuficiente para ${prod.nombre}`, true);
                    return;
                }
                
                // Subtract stock
                this.state.clienteInventory[prod.id] = currentStock - qty;
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
        this.saveClientInventory();

        // Create sale record
        const newSale = {
            id: this.state.clienteSales.length + 100,
            fecha: new Date().toISOString(),
            total: total,
            detalles: details
        };

        this.state.clienteSales.push(newSale);
        this.saveClientSales();

        this.showToast("Venta finalizada con éxito.");
        this.state.cart = {};
        
        this.navigateToView('cliente-dashboard');
    },

    // Cliente - Sales History list
    renderClientSalesHistorial(filter = 'hoy') {
        const container = document.getElementById('cliente-ventas-list-container');
        container.innerHTML = '';

        let list = [...this.state.clienteSales];
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
        this.renderClientSalesHistorial(filter);
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
        
        const client = this.state.clientes.find(c => c.id === order.cliente_id) || { nombre: 'Cliente' };
        const formattedDate = new Date(order.fecha_hora).toLocaleDateString('es-CL', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        let detailsHtml = '<p style="text-align:center; padding:10px;">Cargando artículos...</p>';
        
        // Compile items list from order details
        if (order.detalles && order.detalles.length > 0) {
            let itemsRows = '';
            order.detalles.forEach(d => {
                const prod = this.state.catalogo.find(p => p.id === d.producto_id) || { nombre: 'Producto General' };
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
            App.currentViewedSeller = this.state.user ? this.state.user.username : (this.state.vendedor ? this.state.vendedor.nombre : 'Administrador');

            let actionBtnHtml = `
                <button class="btn btn-outline btn-block" style="margin-top:12px; display:flex; align-items:center; justify-content:center; gap:8px; border-color:var(--primary-color); color:var(--primary-color);" onclick="PdfGenerator.generateOrderReceipt(App.currentViewedOrder, App.currentViewedClient, App.currentViewedSeller)">
                    <i data-lucide="file-text"></i> Descargar Comprobante PDF
                </button>
            `;

            if (this.state.isLoggedIn && this.state.activeRole === 'cliente' && order.estado_sincronizacion === 'PENDIENTE') {
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
        this.refreshIcons();
    },

    closeOrderModal() {
        AppModals.inject('modal-order-details'); document.getElementById('modal-order-details').classList.add('hidden');
    },

    async receiveOrderAction(pedidoId) {
        const order = this.state.clientOrders.find(o => o.id === pedidoId);
        if (!order) return;

        this.showToast("Procesando pedido...");

        try {
            // Update status on database to 'DESPACHADO' (meaning received by merchant)
            await ApiClient.updatePedidoStatus(pedidoId, 'DESPACHADO');
            
            // Loop items and add to local stock inventory
            order.detalles.forEach(d => {
                const currentStock = this.state.clienteInventory[d.producto_id] || 0;
                this.state.clienteInventory[d.producto_id] = currentStock + d.cantidad;
            });

            this.saveClientInventory();
            this.closeOrderModal();
            this.showToast("¡Pedido recibido con éxito!");

            // Refresh view
            this.fetchAndRenderClientePedidos();
            this.renderClienteDashboard();
        } catch (e) {
            console.error(e);
            this.showToast("No se pudo actualizar el estado del pedido.", true);
        }
    },


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

        document.getElementById('btn-clear-signature').addEventListener('click', () => this.clearSignature());
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
        document.getElementById('sync-button').addEventListener('click', () => this.syncWithBackend());

        // Toggle subviews in Route
        document.getElementById('btn-show-map').addEventListener('click', () => {
            document.getElementById('btn-show-map').classList.add('active');
            document.getElementById('btn-show-list').classList.remove('active');
            document.getElementById('route-map-container').classList.add('active');
            document.getElementById('route-list-container').classList.remove('active');
            MapController.invalidateSize();
        });

        document.getElementById('btn-show-list').addEventListener('click', () => {
            document.getElementById('btn-show-map').classList.remove('active');
            document.getElementById('btn-show-list').classList.add('active');
            document.getElementById('route-map-container').classList.remove('active');
            document.getElementById('route-list-container').classList.add('active');
        });

        document.getElementById('btn-optimize').addEventListener('click', () => this.optimizeRouteByDistance());

        // Settings Buttons
        document.getElementById('btn-reset-cache').addEventListener('click', () => {
            if (confirm("¿Seguro que deseas limpiar la base de datos local y cerrar sesión?")) {
                localStorage.clear();
                this.state.visitStates = {};
                this.state.unsyncedOrders = [];
                this.loadCachedData();
                this.logout();
            }
        });

        document.getElementById('btn-download-report').addEventListener('click', () => this.downloadLocalReport());

        // Visit steps navigation tabs
        const stepButtons = document.querySelectorAll('.visit-tab-btn');
        stepButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetStep = btn.getAttribute('data-step');
                this.setVisitStep(targetStep);
            });
        });

        // Cancel active visit
        document.getElementById('btn-cancel-visit').addEventListener('click', () => {
            if (confirm("¿Seguro que deseas salir del registro de visita?")) {
                this.state.activeVisit = null;
                this.state.cart = {};
                this.navigateToView('ruta');
            }
        });

        document.getElementById('btn-complete-visit').addEventListener('click', () => this.completeVisit());



        document.getElementById('photo-upload-trigger').addEventListener('click', (e) => {
            if (e.target.id !== 'btn-remove-photo' && e.target.id !== 'real-photo-input') {
                const realInput = document.getElementById('real-photo-input');
                if (realInput) realInput.click();
            }
        });

        const realPhotoInput = document.getElementById('real-photo-input');
        if (realPhotoInput) {
            realPhotoInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
        }

        document.getElementById('btn-remove-photo').addEventListener('click', (e) => {
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
                if (err.code === 1) {
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
        localStorage.setItem('sam_cache_clientes', JSON.stringify(this.state.clientes));
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
            e.preventDefault();
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

    };

// Global hook for events
window.App = App;

// Run app init when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
App.registerServiceWorker();
