const fs=require('fs');
const path=require('path');
const files=fs.readdirSync('js').map(f=>path.join('js',f));
let results=[];
files.forEach(f=>{
    if(!f.endsWith('.js')) return;
    const txt=fs.readFileSync(f,'utf8');
    const matches=txt.match(/<[^>]+style=\"[^\"]+\"[^>]*>/g);
    if(matches) results.push(...matches);
});
console.log([...new Set(results)].slice(0, 30).join('\n'));
