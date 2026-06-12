const fs = require('fs');

let informes = fs.readFileSync('js/informes.js', 'utf8');
let app = fs.readFileSync('js/app.js', 'utf8');

// The last function is exportarInformeActual
let startIndex = app.indexOf('exportarInformeActual(formato) {');
if (startIndex !== -1) {
    let endIndex = app.indexOf('};', startIndex);
    if (endIndex !== -1) {
        let funcCode = app.substring(startIndex, endIndex).trim();
        // apply replacements
        let modCode = funcCode.replace(/this\.state/g, 'App.state').replace(/this\.([a-zA-Z0-9_]+)/g, 'App.$1');
        
        // append to informes.js
        informes = informes.replace('};', modCode + '\n};\n');
        fs.writeFileSync('js/informes.js', informes, 'utf8');
        
        // remove from app.js
        app = app.substring(0, startIndex) + app.substring(endIndex);
        fs.writeFileSync('js/app.js', app, 'utf8');
        console.log("Successfully extracted exportarInformeActual");
    }
}
