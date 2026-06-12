const fs = require('fs');

const css = `
/* ==================== BOTTOM SHEET (UX PHASE 2) ==================== */
.map-fullscreen {
  position: absolute !important;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100vh - 60px); /* Adjust for navbar */
  z-index: 1;
  display: block !important;
  border-radius: 0 !important;
}

.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -4px 16px rgba(0,0,0,0.15);
  z-index: 1000;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(calc(100% - 220px)); 
  height: 85vh;
  display: flex;
  flex-direction: column;
}

.bottom-sheet.expanded {
  transform: translateY(0);
}

.drag-handle-container {
  padding: 12px 0 4px 0;
  cursor: pointer;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.drag-handle {
  width: 40px;
  height: 5px;
  background: #cbd5e1;
  border-radius: 3px;
}

.bottom-sheet .route-header {
  padding: 8px 16px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.bottom-sheet-content {
  overflow-y: auto;
  flex: 1;
  padding: 0;
}
`;

fs.appendFileSync('TotalApp/rutero-sam-frontend/css/styles.css', "\n" + css);
console.log("CSS added successfully.");
