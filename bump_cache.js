const fs = require('fs');
let txt = fs.readFileSync('TotalApp/rutero-sam-frontend/sw.js', 'utf8');
let currentVersion = txt.match(/sam-rutero-cache-v(\d+)/)[1];
let nextVersion = parseInt(currentVersion) + 1;
txt = txt.replace(new RegExp(`sam-rutero-cache-v${currentVersion}`, 'g'), `sam-rutero-cache-v${nextVersion}`);
fs.writeFileSync('TotalApp/rutero-sam-frontend/sw.js', txt, 'utf8');
