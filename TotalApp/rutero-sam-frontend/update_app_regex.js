const fs = require('fs');
let txt = fs.readFileSync('js/app.js', 'utf8');

const regex = /item\.className\s*=\s*['"]order-select-card['"];[\s\S]*?container\.appendChild\(item\);/g;

const newRender = `item.className = 'product-card';
            item.innerHTML = \`
                <div class="product-info">
                    <span class="product-sku">\${prod.sku || 'SKU-N/A'}</span>
                    <h3 class="product-title">\${this.escapeHtml(prod.nombre)}</h3>
                    <div class="product-meta">
                        <span class="product-price">$\${precioActual.toLocaleString('es-CL')}</span>
                        <span class="product-type">(\${this.state.tipoCliente})</span>
                    </div>
                </div>
                <div class="product-action">
                    <div class="stepper-input">
                        <button type="button" class="btn-stepper minus" onclick="App.updateCartQty(\${prod.id}, -1)" \${qty === 0 ? 'disabled' : ''}>-</button>
                        <span class="qty-val">\${qty}</span>
                        <button type="button" class="btn-stepper plus" onclick="App.updateCartQty(\${prod.id}, 1)">+</button>
                    </div>
                </div>
            \`;
            container.appendChild(item);`;

if(txt.match(regex)) {
    txt = txt.replace(regex, newRender);
    fs.writeFileSync('js/app.js', txt, 'utf8');
    console.log("HTML replaced successfully in app.js via regex");
} else {
    console.log("Regex did not match.");
}
