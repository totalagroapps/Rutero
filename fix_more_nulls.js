const fs = require('fs');

let appTxt = fs.readFileSync('TotalApp/rutero-sam-frontend/js/app.js', 'utf8');

appTxt = appTxt.replace(/document\.getElementById\('btn-cancel-visit'\)\.addEventListener/g, "const btnCanc = document.getElementById('btn-cancel-visit'); if(btnCanc) btnCanc.addEventListener");
appTxt = appTxt.replace(/document\.getElementById\('btn-complete-visit'\)\.addEventListener/g, "const btnComp = document.getElementById('btn-complete-visit'); if(btnComp) btnComp.addEventListener");
appTxt = appTxt.replace(/document\.getElementById\('photo-upload-trigger'\)\.addEventListener/g, "const pUpTr = document.getElementById('photo-upload-trigger'); if(pUpTr) pUpTr.addEventListener");

fs.writeFileSync('TotalApp/rutero-sam-frontend/js/app.js', appTxt, 'utf8');
