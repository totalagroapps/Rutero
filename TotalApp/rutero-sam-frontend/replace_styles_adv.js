const fs=require('fs');
const path=require('path');
const files=fs.readdirSync('js').map(f=>path.join('js',f));

const replacements = [
    { pattern: /style="text-align:center;\s*padding:\s*20px;\s*color:var\(--text-secondary\);"/g, replace: 'class="empty-state-text"' },
    { pattern: /style="padding-top:\s*12px;\s*display:flex;\s*flex-direction:column;\s*gap:12px;"/g, replace: 'class="flex-col-gap"' },
    { pattern: /style="display:\s*grid;\s*grid-template-columns:\s*1fr 1fr;\s*gap:\s*12px;"/g, replace: 'class="grid-2-cols"' },
    { pattern: /style="display:flex;\s*justify-content:space-between;\s*align-items:center;\s*margin-top:6px;"/g, replace: 'class="flex-between"' }
];

files.forEach(f=>{
    if(!f.endsWith('.js')) return;
    let txt=fs.readFileSync(f,'utf8');
    let original = txt;
    
    replacements.forEach(r => {
        txt = txt.replace(r.pattern, r.replace);
    });
    
    // fix `<td class="something" class="td-bold">` duplicate class attribute
    // wait, I replaced `style=` with `class=`, so if the element already had a class, it now has two `class=` attributes.
    // e.g. <td class="admin-table" class="td-bold"> => <td class="admin-table td-bold">
    txt = txt.replace(/class="([^"]+)"\s+class="([^"]+)"/g, 'class="$1 $2"');
    
    if (txt !== original) {
        fs.writeFileSync(f, txt, 'utf8');
        console.log("Updated advanced styles in " + f);
    }
});
