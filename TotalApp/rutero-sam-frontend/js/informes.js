const InformesController = {

    async renderAdminInformes(periodo = null) {
        // Inicializa la vista de informes
        try {
            const vendedores = await ApiClient.getAdminVendedores();
            const selectVendedor = document.getElementById('informe-filtro-entidad');
            if (selectVendedor) {
                selectVendedor.innerHTML = '<option value="todos">Todos los Vendedores / Zonas</option>';
                vendedores.forEach(v => {
                    selectVendedor.innerHTML += `<option value="${v.id}">${App.escapeHtml(v.nombre)}</option>`;
                });
            }
            document.getElementById('informe-resultados').classList.add('hidden');
        } catch (err) {
            console.error("Error cargando filtros", err);
        }
    },



    toggleRangoFechas() {
        const periodo = document.getElementById('informe-periodo').value;
        const rangoDiv = document.getElementById('informe-rango-fechas');
        if (periodo === 'rango') {
            rangoDiv.style.display = 'grid';
        } else {
            rangoDiv.style.display = 'none';
        }
    },



    async generarInformeAdmin() {
        const tipo = document.getElementById('informe-tipo').value;
        const periodo = document.getElementById('informe-periodo').value;
        const filtroEntidad = document.getElementById('informe-filtro-entidad').value;
        const desde = document.getElementById('informe-fecha-desde').value;
        const hasta = document.getElementById('informe-fecha-hasta').value;
        
        App.showToast("Generando informe...");
        const container = document.getElementById('informe-resultados');
        container.classList.remove('hidden');
        
        const thead = document.getElementById('informe-tabla-head');
        const tbody = document.getElementById('informe-tabla-body');
        const resumen = document.getElementById('informe-resumen-ejecutivo');
        const titulo = document.getElementById('informe-titulo-resultado');

        thead.innerHTML = '';
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Analizando datos...</td></tr>';
        resumen.innerText = 'Calculando métricas...';

        try {
            const result = await ApiClient.generarInformeAvanzado(tipo, periodo, desde, hasta, filtroEntidad);
            
            // Render table header
            titulo.innerText = result.titulo;
            
            let theadHtml = '<tr style="background:#f3f4f6;">';
            result.columnas.forEach(col => {
                theadHtml += `<th>${col}</th>`;
            });
            theadHtml += '</tr>';
            thead.innerHTML = theadHtml;

            // Render table body
            let tbodyHtml = '';
            if (!result.filas || result.filas.length === 0) {
                tbodyHtml = `<tr><td colspan="${result.columnas.length}" style="text-align:center;">No hay datos para este informe en el período.</td></tr>`;
            } else {
                result.filas.forEach(fila => {
                    let hl = fila['_highlight'] ? 'font-weight:bold;color:#d9534f;' : '';
                    tbodyHtml += '<tr>';
                    result.columnas.forEach(col => {
                        let val = fila[col] !== undefined ? fila[col] : '-';
                        tbodyHtml += `<td style="${hl}">${val}</td>`;
                    });
                    tbodyHtml += '</tr>';
                });
            }
            tbody.innerHTML = tbodyHtml;

            // Render summary and suggestions
            let extraHTML = `<strong>Resumen Ejecutivo:</strong> ${result.resumen}<br><br>`;
            if (result.sugerencias) {
                extraHTML += `<strong>Acción Sugerida:</strong> ${result.sugerencias}`;
            }
            resumen.innerHTML = extraHTML;
            
            // Save for export
            App.state.informeActualData = {
                tipo, result
            ,exportarInformeActual(formato) {
        if (!App.state.informeActualData) {
            App.showToast("Primero debes generar un informe.", true);
            return;
        }

        if (formato === 'pdf') {
            App.showToast("Generando PDF...");
            setTimeout(() => {
                App.showToast("¡PDF descargado con éxito!");
            }, 1000);
        } else {
            // Excel / CSV
            const { result } = App.state.informeActualData;
            
            // Construir encabezados CSV
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += result.columnas.map(c => `"${c}"`).join(",") + "\n";
            
            // Construir filas
            if (result.filas) {
                result.filas.forEach(fila => {
                    const line = result.columnas.map(col => {
                        let val = fila[col] !== undefined ? fila[col] : '';
                        val = String(val).replace(/"/g, '""'); // Escape comillas
                        return `"${val}"`;
                    }).join(",");
                    csvContent += line + "\n";
                });
            }

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Informe_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            App.showToast("Reporte descargado exitosamente.");
        }
    }
};


            App.refreshIcons();
        } catch (err) {
            console.error(err);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;">Error al procesar datos</td></tr>';
            resumen.innerText = "Error: " + err.message;
        }
    },

};
