const fs = require('fs');
let txt = fs.readFileSync('css/styles.css', 'utf8');

const regex = /\.order-select-card[\s\S]*?\.qty-btn:active\s*\{[\s\S]*?\}/;
const newCss = `
/* ==================== MOBILE FIRST PRODUCT CARDS ==================== */
.product-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    border: 1px solid #e5e7eb;
    margin-bottom: 12px;
}

.product-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
}

.product-sku { 
    font-size: 0.75rem; 
    color: #6b7280; 
    text-transform: uppercase; 
}

.product-title { 
    font-size: 1rem; 
    font-weight: 700; 
    color: #111827; 
    margin: 0; 
    line-height: 1.2;
}

.product-meta { 
    display: flex; 
    gap: 8px; 
    align-items: center; 
    font-size: 0.85rem; 
}

.product-price {
    font-size: 0.9rem;
    color: var(--success-color);
    font-weight: 700;
}

.product-type {
    font-size: 0.65rem;
    color: #888;
}

.stepper-input {
    display: flex;
    align-items: center;
    background: #f3f4f6;
    border-radius: 8px;
    overflow: hidden;
    margin-left: 12px;
}

.btn-stepper {
    width: 44px;
    height: 44px;
    background: transparent;
    border: none;
    font-size: 1.5rem;
    color: #1a3d1b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.btn-stepper:active { 
    background: #e5e7eb; 
}

.btn-stepper:disabled {
    color: #9ca3af;
    cursor: not-allowed;
}

.stepper-input input.qty-val, .stepper-input span.qty-val {
    width: 32px;
    text-align: center;
    font-weight: 700;
    font-size: 1.1rem;
    background: transparent;
    border: none;
    pointer-events: none;
    display: inline-block;
}
`;

if(txt.match(regex)) {
    txt = txt.replace(regex, newCss);
    fs.writeFileSync('css/styles.css', txt, 'utf8');
    console.log("CSS Replaced Successfully");
} else {
    // If regex fails, just append it
    fs.appendFileSync('css/styles.css', "\n" + newCss);
    console.log("CSS Appended");
}
