const fs = require('fs');
let txt = fs.readFileSync('TotalApp/rutero-sam-frontend/index.html', 'utf8');

const regex = /<section id="view-ruta" class="app-view">[\s\S]*?(<div id="admin-route-map-container")/i;

const newHTML = `<section id="view-ruta" class="app-view">
            <!-- Fullscreen Map Container -->
            <div id="route-map-container" class="map-fullscreen">
                <div id="map" style="width: 100%; height: 100%;"></div>
            </div>

            <!-- Bottom Sheet for Client List -->
            <div id="route-list-container" class="bottom-sheet">
                <div class="drag-handle-container" id="bottom-sheet-handle">
                    <div class="drag-handle"></div>
                </div>
                
                <div class="route-header">
                    <span>Lista de Clientes</span>
                    <div style="display: flex; gap: 8px;">
                        <button id="btn-optimize" class="btn btn-secondary btn-sm" title="Reordenar ruta por distancia">
                            <i data-lucide="sparkles"></i> Optimizar
                        </button>
                        <button id="btn-add-client-trigger" class="btn btn-primary btn-sm" title="Agregar nuevo cliente" onclick="App.openAddClientView()">
                            <i data-lucide="plus"></i> Nuevo
                        </button>
                    </div>
                </div>

                <div class="bottom-sheet-content">
                    <div id="client-list"></div>
                </div>
            </div>
            
            $1`;

if(txt.match(regex)) {
    txt = txt.replace(regex, newHTML);
    fs.writeFileSync('TotalApp/rutero-sam-frontend/index.html', txt, 'utf8');
    console.log("HTML replaced successfully.");
} else {
    console.log("Regex did not match view-ruta.");
}
