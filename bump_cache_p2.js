const fs = require('fs');
let txt = fs.readFileSync('TotalApp/rutero-sam-frontend/sw.js', 'utf8');
txt = txt.replace(/sam-rutero-cache-v11/g, "sam-rutero-cache-v12");
fs.writeFileSync('TotalApp/rutero-sam-frontend/sw.js', txt, 'utf8');
