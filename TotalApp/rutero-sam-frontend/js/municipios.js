// Lista básica de municipios principales de Colombia para el datalist
const MunicipiosColombia = [
    "Leticia, Amazonas", "Puerto Nariño, Amazonas",
    "Medellín, Antioquia", "Bello, Antioquia", "Itagüí, Antioquia", "Envigado, Antioquia", "Apartadó, Antioquia", "Rionegro, Antioquia",
    "Arauca, Arauca", "Arauquita, Arauca", "Saravena, Arauca",
    "Barranquilla, Atlántico", "Soledad, Atlántico", "Malambo, Atlántico", "Sabanagrande, Atlántico",
    "Bogotá, D.C.",
    "Cartagena, Bolívar", "Magangué, Bolívar", "Turbaco, Bolívar", "Arjona, Bolívar",
    "Tunja, Boyacá", "Duitama, Boyacá", "Sogamoso, Boyacá", "Chiquinquirá, Boyacá",
    "Manizales, Caldas", "La Dorada, Caldas", "Villamaría, Caldas", "Chinchiná, Caldas",
    "Florencia, Caquetá", "San Vicente del Caguán, Caquetá",
    "Yopal, Casanare", "Aguazul, Casanare", "Paz de Ariporo, Casanare",
    "Popayán, Cauca", "Santander de Quilichao, Cauca", "El Tambo, Cauca",
    "Valledupar, Cesar", "Aguachica, Cesar", "Agustín Codazzi, Cesar",
    "Quibdó, Chocó", "Istmina, Chocó",
    "Montería, Córdoba", "Lorica, Córdoba", "Cereté, Córdoba", "Sahagún, Córdoba",
    "Inírida, Guainía",
    "San José del Guaviare, Guaviare",
    "Neiva, Huila", "Pitalito, Huila", "Garzón, Huila", "La Plata, Huila",
    "Riohacha, La Guajira", "Maicao, La Guajira", "Uribia, La Guajira",
    "Santa Marta, Magdalena", "Ciénaga, Magdalena", "Fundación, Magdalena",
    "Villavicencio, Meta", "Acacías, Meta", "Granada, Meta",
    "Pasto, Nariño", "Tumaco, Nariño", "Ipiales, Nariño",
    "Cúcuta, Norte de Santander", "Ocaña, Norte de Santander", "Villa del Rosario, Norte de Santander",
    "Mocoa, Putumayo", "Puerto Asís, Putumayo",
    "Armenia, Quindío", "Calarcá, Quindío", "Quimbaya, Quindío",
    "Pereira, Risaralda", "Dosquebradas, Risaralda", "Santa Rosa de Cabal, Risaralda",
    "San Andrés, San Andrés y Providencia",
    "Bucaramanga, Santander", "Floridablanca, Santander", "Barrancabermeja, Santander", "Girón, Santander", "Piedecuesta, Santander",
    "Sincelejo, Sucre", "Corozal, Sucre", "San Marcos, Sucre",
    "Ibagué, Tolima", "Espinal, Tolima", "Melgar, Tolima", "Honda, Tolima",
    "Cali, Valle del Cauca", "Buenaventura, Valle del Cauca", "Palmira, Valle del Cauca", "Tuluá, Valle del Cauca", "Yumbo, Valle del Cauca", "Cartago, Valle del Cauca",
    "Mitú, Vaupés",
    "Puerto Carreño, Vichada"
];

// Función para poblar el datalist
function poblarMunicipios() {
    const datalist = document.getElementById('municipios-colombia');
    if (!datalist) return;
    
    // Solo poblar si está vacío
    if (datalist.options.length === 0) {
        const fragment = document.createDocumentFragment();
        MunicipiosColombia.forEach(municipio => {
            const option = document.createElement('option');
            option.value = municipio;
            fragment.appendChild(option);
        });
        datalist.appendChild(fragment);
    }
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', poblarMunicipios);
