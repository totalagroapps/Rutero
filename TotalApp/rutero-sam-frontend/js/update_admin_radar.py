with open("TotalApp/rutero-sam-frontend/js/admin.js", "r", encoding="utf-8") as f:
    content = f.read()

radar_logic = """
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
"""

if "initRadarMap" not in content:
    idx = content.rfind("};")
    if idx != -1:
        content = content[:idx] + radar_logic + content[idx:]
        with open("TotalApp/rutero-sam-frontend/js/admin.js", "w", encoding="utf-8") as f:
            f.write(content)
