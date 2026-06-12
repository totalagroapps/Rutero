// Leaflet map controller for Rutero SAM
const MapController = {
    map: null,
    markers: {},
    routeLine: null,
    userMarker: null,
    
    // Default center in Santiago, Chile
    defaultLat: -33.4350,
    defaultLng: -70.6200,

    init(mapId) {
        if (this.map) return;

        // Initialize Leaflet map
        this.map = L.map(mapId, {
            zoomControl: true,
            maxZoom: 18,
            minZoom: 10
        }).setView([this.defaultLat, this.defaultLng], 14);

        // Add Light Voyager TileLayer from CartoDB (looks extremely clean and premium!)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);

        console.log("Map initialized successfully");
    },

    // Render client pins on the map
    renderRoute(clientes, visitStates = {}) {
        if (!this.map) return;

        // Clear existing markers
        Object.keys(this.markers).forEach(key => {
            this.map.removeLayer(this.markers[key]);
        });
        this.markers = {};

        if (this.routeLine) {
            this.map.removeLayer(this.routeLine);
            this.routeLine = null;
        }

        if (clientes.length === 0) return;

        const points = [];
        
        clientes.forEach(cliente => {
            if (cliente.latitud && cliente.longitud) {
                const lat = cliente.latitud;
                const lng = cliente.longitud;
                
                points.push([lat, lng]);

                // Determine pin color based on status
                const visitState = visitStates[cliente.id] || 'pending'; // pending, visited, no-sale
                const color = this.getMarkerColor(visitState, cliente.secuencia_ruta);
                
                // Create custom circular marker SVG
                const customIcon = L.divIcon({
                    html: `
                        <div class="custom-marker" style="background: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.5); width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.75rem;">
                            ${cliente.secuencia_ruta}
                        </div>
                    `,
                    className: 'custom-leaflet-marker',
                    iconSize: [26, 26],
                    iconAnchor: [13, 13]
                });

                // Create marker and bind popup
                const marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
                
                const popupContent = `
                    <div style="padding: 4px;">
                        <h4 style="margin:0 0 4px 0; color: #ffffff;">${cliente.nombre}</h4>
                        <p style="margin:0 0 4px 0; color: #9ca3af; font-size: 0.75rem;"><b>PDV:</b> ${cliente.codigo_pdv}</p>
                        <p style="margin:0 0 8px 0; color: #9ca3af; font-size: 0.75rem;"><b>Dirección:</b> ${cliente.direccion}</p>
                        <button onclick="window.App.startVisit(${cliente.id})" class="btn btn-primary btn-xs" style="width: 100%; border-radius: 4px;">
                            Iniciar Visita
                        </button>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                this.markers[cliente.id] = marker;
            }
        });

        // Draw polyline connecting route order sequence
        if (points.length > 1) {
            this.routeLine = L.polyline(points, {
                color: '#3b82f6',
                weight: 4,
                opacity: 0.6,
                dashArray: '8, 8',
                lineJoin: 'round'
            }).addTo(this.map);
        }

        // Fit map bounds to show all markers
        const group = new L.featureGroup(Object.values(this.markers));
        if (Object.keys(this.markers).length > 0) {
            this.map.fitBounds(group.getBounds().pad(0.15));
        }
    },

    // User location marker
    setUserLocation(lat, lng) {
        if (!this.map) return;

        if (this.userMarker) {
            this.userMarker.setLatLng([lat, lng]);
        } else {
            const userIcon = L.divIcon({
                html: `
                    <div class="user-pulse-marker" style="position: relative; width: 16px; height: 16px;">
                        <div style="background: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>
                        <div style="position: absolute; top: -4px; left: -4px; width: 24px; height: 24px; border-radius: 50%; border: 2px solid #3b82f6; opacity: 0.6; animation: markerPulse 1.5s infinite ease-out;"></div>
                    </div>
                `,
                className: 'user-leaflet-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            this.userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(this.map);
        }
    },

    getMarkerColor(state, sequence) {
        if (state === 'visited') return '#10b981'; // Green (Success/Visited)
        if (state === 'no-sale') return '#f59e0b'; // Amber (No Sale logged)
        if (sequence === 1 && state === 'pending') return '#3b82f6'; // Blue (First pending)
        return '#6b7280'; // Gray (Other pending)
    },

    // Refresh map render to fix sizing issue when tab changes
    invalidateSize() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }
};

// Leaflet map controller for Admin Route Tracking
const AdminMapController = {
    map: null,
    markers: {},
    routeLine: null,
    
    defaultLat: -33.4350,
    defaultLng: -70.6200,

    init(mapId) {
        if (this.map) {
            this.invalidateSize();
            return;
        }

        this.map = L.map(mapId, {
            zoomControl: true,
            maxZoom: 18,
            minZoom: 10
        }).setView([this.defaultLat, this.defaultLng], 13);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);

        console.log("Admin Map initialized successfully");
    },

    renderRoute(clientes, visitStates = {}) {
        if (!this.map) return;

        // Clear existing markers
        Object.keys(this.markers).forEach(key => {
            this.map.removeLayer(this.markers[key]);
        });
        this.markers = {};

        if (this.routeLine) {
            this.map.removeLayer(this.routeLine);
            this.routeLine = null;
        }

        if (clientes.length === 0) return;

        const points = [];
        
        clientes.forEach(cliente => {
            if (cliente.latitud && cliente.longitud) {
                const lat = cliente.latitud;
                const lng = cliente.longitud;
                
                points.push([lat, lng]);
                
                // Determine pin color based on status
                const visitState = visitStates[cliente.id] || 'pending'; // pending, visited, no-sale
                let color = '#6b7280'; // Gray (pending)
                if (visitState === 'visited') color = '#10b981'; // Green (sale)
                else if (visitState === 'no-sale') color = '#f59e0b'; // Amber (no-sale)
                
                const customIcon = L.divIcon({
                    html: `
                        <div class="custom-marker" style="background: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.5); width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.75rem;">
                            ${cliente.secuencia_ruta}
                        </div>
                    `,
                    className: 'custom-leaflet-marker',
                    iconSize: [26, 26],
                    iconAnchor: [13, 13]
                });

                const marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
                
                const popupContent = `
                    <div style="padding: 4px; color: #1f2937;">
                        <h4 style="margin:0 0 4px 0;">${cliente.nombre}</h4>
                        <p style="margin:0 0 4px 0; font-size: 0.75rem;"><b>PDV:</b> ${cliente.codigo_pdv}</p>
                        <p style="margin:0 0 4px 0; font-size: 0.75rem;"><b>Dirección:</b> ${cliente.direccion}</p>
                        <p style="margin:0 0 4px 0; font-size: 0.75rem;"><b>Frecuencia:</b> ${cliente.frecuencia}</p>
                        <p style="margin:0; font-size: 0.75rem;"><b>Secuencia:</b> ${cliente.secuencia_ruta}</p>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                this.markers[cliente.id] = marker;
            }
        });

        // Draw polyline connecting route order sequence
        if (points.length > 1) {
            this.routeLine = L.polyline(points, {
                color: '#6366f1',
                weight: 4,
                opacity: 0.7,
                dashArray: '8, 8',
                lineJoin: 'round'
            }).addTo(this.map);
        }

        // Fit map bounds to show all markers
        if (Object.keys(this.markers).length > 0) {
            const group = new L.featureGroup(Object.values(this.markers));
            this.map.fitBounds(group.getBounds().pad(0.15));
        }
    },

    invalidateSize() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }
};

// Add styles for CSS animations on marker pulse
const style = document.createElement('style');
style.innerHTML = `
@keyframes markerPulse {
    0% { transform: scale(0.6); opacity: 0.9; }
    100% { transform: scale(1.5); opacity: 0; }
}
`;
document.head.appendChild(style);

// Location Picker Map Controller
const PickerMapController = {
    maps: {},
    markers: {},

    init(mapId, latInputId, lngInputId, addressInputId) {
        if (this.maps[mapId]) {
            this.maps[mapId].remove();
        }

        const mapEl = document.getElementById(mapId);
        if (!mapEl) return;

        const defaultLat = 4.7110; // Bogota
        const defaultLng = -74.0721;

        const map = L.map(mapId).setView([defaultLat, defaultLng], 12);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        const customIcon = L.divIcon({
            html: `<div style="background:#ef4444; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>`,
            className: 'picker-marker',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        const marker = L.marker([defaultLat, defaultLng], { icon: customIcon, draggable: true }).addTo(map);

        this.maps[mapId] = map;
        this.markers[mapId] = marker;

        const updateInputs = async (lat, lng) => {
            const latEl = document.getElementById(latInputId);
            const lngEl = document.getElementById(lngInputId);
            if (latEl) latEl.value = lat.toFixed(6);
            if (lngEl) lngEl.value = lng.toFixed(6);

            // Trigger visual feedback if on vendor screen
            const badge = document.getElementById('gps-capture-badge');
            if (badge && mapId === 'new-client-picker-map') {
                badge.className = 'status-badge dispatched';
                badge.innerText = 'Ubicación de Mapa ✓';
            }

            // Reverse Geocoding
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                const data = await response.json();
                if (data && data.display_name) {
                    const addressEl = document.getElementById(addressInputId);
                    if (addressEl && !addressEl.value.trim()) {
                        addressEl.value = data.display_name.split(',')[0] + ', ' + (data.address.city || data.address.town || data.address.village || '');
                    }
                }
            } catch (e) {
                console.error("Reverse geocoding failed", e);
            }
        };

        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            updateInputs(lat, lng);
        });

        marker.on('dragend', () => {
            const { lat, lng } = marker.getLatLng();
            updateInputs(lat, lng);
        });

        // Trigger resize when modal opens
        setTimeout(() => map.invalidateSize(), 200);
    },

    setCenter(mapId, lat, lng) {
        if (this.maps[mapId] && this.markers[mapId] && lat && lng) {
            this.maps[mapId].setView([lat, lng], 16);
            this.markers[mapId].setLatLng([lat, lng]);
            setTimeout(() => this.maps[mapId].invalidateSize(), 100);
        }
    },

    invalidateSize(mapId) {
        if (this.maps[mapId]) {
            setTimeout(() => this.maps[mapId].invalidateSize(), 100);
        }
    }
};
