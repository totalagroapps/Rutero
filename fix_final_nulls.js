const fs = require('fs');
let appTxt = fs.readFileSync('TotalApp/rutero-sam-frontend/js/app.js', 'utf8');

appTxt = appTxt.replace(/document\.getElementById\('btn-clear-signature'\)\.addEventListener/g, "const btnCSig = document.getElementById('btn-clear-signature'); if(btnCSig) btnCSig.addEventListener");
appTxt = appTxt.replace(/document\.getElementById\('sync-button'\)\.addEventListener/g, "const btnSync = document.getElementById('sync-button'); if(btnSync) btnSync.addEventListener");
appTxt = appTxt.replace(/document\.getElementById\('btn-remove-photo'\)\.addEventListener/g, "const btnRPh = document.getElementById('btn-remove-photo'); if(btnRPh) btnRPh.addEventListener");

fs.writeFileSync('TotalApp/rutero-sam-frontend/js/app.js', appTxt, 'utf8');
