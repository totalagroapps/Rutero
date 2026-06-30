import re

with open("TotalApp/rutero-sam-frontend/js/app.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add unsyncedTracking to state
content = content.replace(
    "unsyncedAbonos: [], // Abonos offline",
    "unsyncedAbonos: [], // Abonos offline\n        unsyncedTracking: [], // Puntos de rastreo offline"
)

# Load from cache
load_cache_pattern = r"(this\.state\.unsyncedAbonos = JSON\.parse\(localStorage\.getItem\(this\.getDbPrefix\(\) \+ 'sam_unsynced_abonos'\)\) \|\| \[\];)"
new_load = r"\1\n        this.state.unsyncedTracking = JSON.parse(localStorage.getItem(this.getDbPrefix() + 'sam_unsynced_tracking')) || [];"
content = re.sub(load_cache_pattern, new_load, content)

# Background Tracking Logic in login success or after load if logged in.
# Let's add a method startTracking() and call it in setRole/login
tracking_logic = """
    // --- TRACKING LOGIC ---
    startTracking() {
        if (this.state.activeRole !== 'VENDEDOR') return;
        if (this._trackingInterval) clearInterval(this._trackingInterval);
        
        // Every 3 minutes (180000 ms)
        this._trackingInterval = setInterval(() => {
            this.captureTrackingPoint();
        }, 180000);
        
        // Capture one immediately
        setTimeout(() => this.captureTrackingPoint(), 5000);
    },
    
    stopTracking() {
        if (this._trackingInterval) clearInterval(this._trackingInterval);
    },
    
    async captureTrackingPoint() {
        if (!navigator.geolocation) return;
        
        navigator.geolocation.getCurrentPosition(async (position) => {
            const pt = {
                uuid_dispositivo: this.generateUUID(),
                latitud: position.coords.latitude,
                longitud: position.coords.longitude,
                fecha_hora: new Date().toISOString(),
                bateria: null
            };
            
            // Try to get battery
            if (navigator.getBattery) {
                try {
                    const battery = await navigator.getBattery();
                    pt.bateria = Math.round(battery.level * 100);
                } catch(e) {}
            }
            
            if (!this.state.unsyncedTracking) this.state.unsyncedTracking = [];
            this.state.unsyncedTracking.push(pt);
            localStorage.setItem(this.getDbPrefix() + 'sam_unsynced_tracking', JSON.stringify(this.state.unsyncedTracking));
            
            // Attempt to sync tracking silently if online
            if (await ApiClient.checkConnection()) {
                this.syncTrackingSilently();
            }
        }, (error) => {
            console.log("GPS no disponible para rastreo de fondo", error);
        }, { enableHighAccuracy: true });
    },
    
    async syncTrackingSilently() {
        if (!this.state.unsyncedTracking || this.state.unsyncedTracking.length === 0) return;
        if (!this.state.vendedor) return;
        
        try {
            const syncResult = await ApiClient.syncTracking(this.state.vendedor.id, this.state.unsyncedTracking);
            if (syncResult.total_insertados > 0 || syncResult.total_duplicados > 0) {
                this.state.unsyncedTracking = [];
                localStorage.setItem(this.getDbPrefix() + 'sam_unsynced_tracking', JSON.stringify([]));
            }
        } catch(e) {
            console.error("Fallo sync de tracking en background", e);
        }
    },
"""
if "startTracking" not in content:
    idx = content.rfind("};")
    if idx != -1:
        content = content[:idx] + tracking_logic + content[idx:]

# Call startTracking in updateConnectionUI or init
init_pattern = r"(this\.updateConnectionUI\(isOnline\);)"
content = re.sub(init_pattern, r"\1\n        if (this.state.activeRole === 'VENDEDOR') this.startTracking();", content)

# In handleLogin
login_pattern = r"(this\.state\.activeRole = role;\s+this\.showRoleView\(\);)"
content = re.sub(login_pattern, r"\1\n                if (role === 'VENDEDOR') this.startTracking();", content)

# In logout
logout_pattern = r"(this\.state\.activeRole = null;)"
content = re.sub(logout_pattern, r"this.stopTracking();\n        \1", content)

# Also add tracking to the main syncWithBackend function
sync_abonos_pattern = r"(if \(this\.state\.unsyncedAbonos[\s\S]*?Recaudos sincronizados con éxito!\"\);\s+\}\s+\})"
sync_tracking = """
            // 1.7 Sync tracking
            if (this.state.unsyncedTracking && this.state.unsyncedTracking.length > 0 && this.state.vendedor) {
                const syncResult = await ApiClient.syncTracking(this.state.vendedor.id, this.state.unsyncedTracking);
                if (syncResult.total_insertados > 0 || syncResult.total_duplicados > 0) {
                    this.state.unsyncedTracking = [];
                    localStorage.setItem(this.getDbPrefix() + 'sam_unsynced_tracking', JSON.stringify([]));
                }
            }
"""
content = re.sub(sync_abonos_pattern, r"\1\n" + sync_tracking, content)

with open("TotalApp/rutero-sam-frontend/js/app.js", "w", encoding="utf-8") as f:
    f.write(content)
