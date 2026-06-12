const fs = require('fs');
let text = fs.readFileSync('index.html', 'utf8');

text = text.replace(/<p>Inicia.*?continuar<\/p>/g, '<p>Inicia sesión para continuar</p>');
text = text.replace(/<label for="login-password">.*?<\/label>/g, '<label for="login-password">Contraseña</label>');
text = text.replace(/<p class="empty-state-subtitle">Sincroniza.*?pedidos<\/p>/g, '<p class="empty-state-subtitle">Sincroniza tus clientes para ver el catálogo y crear pedidos</p>');
text = text.replace(/<p>.*?ltimos Pedidos<\/p>/g, '<p>Últimos Pedidos</p>');
text = text.replace(/<h3 id="vendedor-welcome-title">Hola, Samuel.*?<\/h3>/g, '<h3 id="vendedor-welcome-title">Hola, Samuel Pérez</h3>');
text = text.replace(/<h2>Acciones r.*?pidas<\/h2>/g, '<h2>Acciones rápidas</h2>');

fs.writeFileSync('index.html', text, 'utf8');
