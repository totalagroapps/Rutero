const fs = require('fs');
let txt = fs.readFileSync('js/app.js', 'utf8');

const oldRender = `            const item = document.createElement('div');
            item.className = 'order-select-card';
            item.innerHTML = \`
                <div class="order-select-info">
                    <span class="name">\${prod.nombre}</span>
                    <div class="price">$\${precioActual.toLocaleString('es-CL')} <span style="font-size:0.6rem; color:#888;">(\${this.state.tipoCliente})</span></div>
                </div>
                <div class="order-qty-control">
                    <button type="button" class="qty-btn" onclick="App.updateCartQty(\${prod.id}, -1)" \${qty === 0 ? 'disabled' : ''}>-</button>
                    <span class="qty-val">\${qty}</span>
                    <button type="button" class="qty-btn" onclick="App.updateCartQty(\${prod.id}, 1)">+</button>
                </div>
            \`;
            container.appendChild(item);`;

const newRender = `            const item = document.createElement('div');
            item.className = 'product-card';
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

if(txt.includes(oldRender)) {
    txt = txt.replace(oldRender, newRender);
    fs.writeFileSync('js/app.js', txt, 'utf8');
    console.log("HTML replaced successfully in app.js");
} else {
    console.log("Could not find the exact string to replace in app.js");
}
