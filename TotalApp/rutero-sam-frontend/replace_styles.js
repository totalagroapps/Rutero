const fs=require('fs');
const path=require('path');
const files=fs.readdirSync('js').map(f=>path.join('js',f));

const replacements = [
    { pattern: /style="width:100%; padding:8px; border-radius:var\(--border-radius-sm\); border:1px solid rgba\(0,0,0,0\.1\); font-family:var\(--font-body\); font-size:0\.8rem; margin-top:4px;"/g, replace: 'class="admin-input"' },
    { pattern: /style="width:100%; padding:10px; border-radius:var\(--border-radius-sm\); border:1px solid rgba\(0,0,0,0\.1\); font-family:var\(--font-body\); font-size:0\.85rem; margin-top:4px;"/g, replace: 'class="admin-input-lg"' },
    { pattern: /style="text-align:center; padding:20px; color:var\(--text-secondary\);"/g, replace: 'class="empty-state-text"' },
    { pattern: /style="padding:\s*14px 16px;"/g, replace: '' },
    { pattern: /style="padding:\s*14px 16px; font-weight:500;"/g, replace: 'class="td-medium"' },
    { pattern: /style="padding:\s*14px 16px; font-weight:700;"/g, replace: 'class="td-bold"' },
    { pattern: /style="padding:\s*14px 16px; text-align: right;"/g, replace: 'class="td-right"' },
    { pattern: /style="padding:\s*14px 16px; color:var\(--text-secondary\);"/g, replace: 'class="td-muted"' },
    { pattern: /style="padding:\s*14px 16px; text-align: right; white-space:nowrap;"/g, replace: 'class="td-right td-nowrap"' },
    { pattern: /style="font-size:0\.72rem; font-weight:700;"/g, replace: 'class="text-sm-bold"' },
    { pattern: /style="font-size:0\.75rem; color:var\(--text-muted\);"/g, replace: 'class="text-xs-muted"' },
    { pattern: /style="color:var\(--danger-color\);"/g, replace: 'class="text-danger"' },
    { pattern: /style="font-weight:600; color:var\(--text-primary\);"/g, replace: 'class="text-primary-bold"' }
];

files.forEach(f=>{
    if(!f.endsWith('.js')) return;
    let txt=fs.readFileSync(f,'utf8');
    let original = txt;
    
    replacements.forEach(r => {
        txt = txt.replace(r.pattern, r.replace);
    });
    
    // Cleanup empty class attributes if any
    txt = txt.replace(/ class=""/g, '');
    
    if (txt !== original) {
        fs.writeFileSync(f, txt, 'utf8');
        console.log("Updated styles in " + f);
    }
});
