const fs = require('fs');
let txt = fs.readFileSync('TotalApp/rutero-sam-frontend/sw.js', 'utf8');
txt = txt.replace(/sam-rutero-cache-v9/g, "sam-rutero-cache-v10");
fs.writeFileSync('TotalApp/rutero-sam-frontend/sw.js', txt, 'utf8');
