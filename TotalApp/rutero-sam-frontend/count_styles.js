const fs=require('fs');
const path=require('path');
const files=fs.readdirSync('js').map(f=>path.join('js',f));
let styles={};
files.forEach(f=>{
    if(!f.endsWith('.js')) return;
    const txt=fs.readFileSync(f,'utf8');
    const matches=txt.match(/style=\"([^\"]+)\"/g);
    if(matches) {
        matches.forEach(m=>{
            const s=m.substring(7, m.length-1);
            styles[s]=(styles[s]||0)+1;
        });
    }
});
console.log(Object.entries(styles).sort((a,b)=>b[1]-a[1]).slice(0,25).map(x=>x[1]+' : '+x[0]).join('\n'));
