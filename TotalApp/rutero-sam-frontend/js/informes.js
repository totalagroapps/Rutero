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
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state-text">Analizando datos...</td></tr>';
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
                tbodyHtml = `<tr><td colspan="${result.columnas.length}" class="empty-state-text">No hay datos para este informe en el período.</td></tr>`;
            } else {
                result.filas.forEach(fila => {
                    let hl = fila['_highlight'] ? 'font-weight:bold;color:#d9534f;' : '';
                    tbodyHtml += '<tr>';
                    result.columnas.forEach(col => {
                        let val = fila[col] !== undefined ? fila[col] : '-';
                        // keep inline style for dynamic highlight if it exists, otherwise just output cell
                        tbodyHtml += hl ? `<td style="${hl}">${val}</td>` : `<td>${val}</td>`;
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
            };

            App.refreshIcons();
        } catch (err) {
            console.error(err);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;">Error al procesar datos</td></tr>';
            resumen.innerText = "Error: " + err.message;
        }
    },

    exportarInformeActual(formato) {
        if (!App.state.informeActualData) {
            App.showToast("Primero debes generar un informe.", true);
            return;
        }

        const { result } = App.state.informeActualData;

        if (formato === 'pdf') {
            try {
                if (typeof jspdf === 'undefined') {
                    App.showToast("La librería de PDF no está cargada.", true);
                    return;
                }
                App.showToast("Generando PDF...");
                
                const { jsPDF } = jspdf;
                const doc = new jsPDF('p', 'pt', 'letter');
                
                // Título
                doc.setFontSize(18);
                doc.text(result.titulo || "Informe Administrativo", 40, 40);
                
                // Resumen Ejecutivo
                doc.setFontSize(11);
                doc.setTextColor(100);
                let splitResumen = doc.splitTextToSize(result.resumen || "", 530);
                doc.text(splitResumen, 40, 70);
                
                let yPos = 70 + (splitResumen.length * 15) + 20;

                // Preparar datos para autotable
                const head = [result.columnas];
                const body = result.filas ? result.filas.map(f => result.columnas.map(c => f[c] !== undefined ? f[c] : '')) : [];
                
                doc.autoTable({
                    startY: yPos,
                    head: head,
                    body: body,
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [26, 61, 27] } // Primary green
                });

                doc.save(`Informe_${Date.now()}.pdf`);
                App.showToast("¡PDF descargado con éxito!");
            } catch (err) {
                console.error("Error generando PDF", err);
                App.showToast("Error al generar PDF", true);
            }
        } else {
            // Excel / CSV
            
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
