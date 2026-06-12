const fs = require('fs');
let txt = fs.readFileSync('TotalApp/rutero-sam-frontend/js/app.js', 'utf8');

const regexOldTabs = /\/\/ Toggle subviews in Route[\s\S]*?document\.getElementById\('btn-show-list'\)\.addEventListener\('click'[\s\S]*?\}\);/i;

const newLogic = `// UX Phase 2: Bottom Sheet Toggle Logic
        const bottomSheetHandle = document.getElementById('bottom-sheet-handle');
        if (bottomSheetHandle) {
            bottomSheetHandle.addEventListener('click', () => {
                const sheet = document.getElementById('route-list-container');
                sheet.classList.toggle('expanded');
                setTimeout(() => {
                    if(typeof MapController !== 'undefined' && MapController.invalidateSize) {
                        MapController.invalidateSize();
                    }
                }, 300);
            });
        }`;

if(txt.match(regexOldTabs)) {
    txt = txt.replace(regexOldTabs, newLogic);
    fs.writeFileSync('TotalApp/rutero-sam-frontend/js/app.js', txt, 'utf8');
    console.log("JS tab logic replaced with bottom sheet logic.");
} else {
    console.log("Could not find old tab logic in app.js.");
}
