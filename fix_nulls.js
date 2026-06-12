const fs = require('fs');

// Fix app.js
let appTxt = fs.readFileSync('TotalApp/rutero-sam-frontend/js/app.js', 'utf8');

appTxt = appTxt.replace(/document\.getElementById\('btn-optimize'\)\.addEventListener/g, "const btnOpt = document.getElementById('btn-optimize'); if(btnOpt) btnOpt.addEventListener");
appTxt = appTxt.replace(/document\.getElementById\('btn-reset-cache'\)\.addEventListener/g, "const btnRes = document.getElementById('btn-reset-cache'); if(btnRes) btnRes.addEventListener");
appTxt = appTxt.replace(/document\.getElementById\('btn-download-report'\)\.addEventListener/g, "const btnRep = document.getElementById('btn-download-report'); if(btnRep) btnRep.addEventListener");

fs.writeFileSync('TotalApp/rutero-sam-frontend/js/app.js', appTxt, 'utf8');

// Fix admin.js
let adminTxt = fs.readFileSync('TotalApp/rutero-sam-frontend/js/admin.js', 'utf8');

adminTxt = adminTxt.replace(/document\.getElementById\('admin-total-ventas'\)\.innerText\s*=\s*(.*?);/g, "const atv = document.getElementById('admin-total-ventas'); if(atv) atv.innerText = $1;");
adminTxt = adminTxt.replace(/document\.getElementById\('admin-pedidos-despachados'\)\.innerText\s*=\s*(.*?);/g, "const apd = document.getElementById('admin-pedidos-despachados'); if(apd) apd.innerText = $1;");
adminTxt = adminTxt.replace(/document\.getElementById\('admin-pedidos-pendientes'\)\.innerText\s*=\s*(.*?);/g, "const app = document.getElementById('admin-pedidos-pendientes'); if(app) app.innerText = $1;");
adminTxt = adminTxt.replace(/document\.getElementById\('admin-total-vendedores'\)\.innerText\s*=\s*(.*?);/g, "const atve = document.getElementById('admin-total-vendedores'); if(atve) atve.innerText = $1;");

fs.writeFileSync('TotalApp/rutero-sam-frontend/js/admin.js', adminTxt, 'utf8');

console.log("Fixed null references.");
