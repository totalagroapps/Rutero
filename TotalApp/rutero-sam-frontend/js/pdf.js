// Módulo de Generación de PDF para Comprobantes de Pedido
const PdfGenerator = {
    generateOrderReceipt(order, client, sellerName) {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            console.error("jsPDF library not loaded.");
            if (window.App) App.showToast("Error al cargar la librería de PDF.", true);
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a5' // A5 is good for receipts
        });

        // Branding Colors
        const primaryGreen = [44, 95, 46]; // #2c5f2e Total Agro

        // Helper variables
        const pageWidth = doc.internal.pageSize.getWidth();
        let cursorY = 15;

        // Header Background
        doc.setFillColor(...primaryGreen);
        doc.rect(0, 0, pageWidth, 25, 'F');

        // Header Text
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("TOTAL AGRO", pageWidth / 2, 13, { align: "center" });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Comprobante de Pedido", pageWidth / 2, 19, { align: "center" });

        // Reset Text Color for Body
        doc.setTextColor(50, 50, 50);
        cursorY = 35;

        // Order Info
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`Pedido No:`, 15, cursorY);
        doc.setFont("helvetica", "normal");
        doc.text(`${order.id || 'Pendiente de Sincronización'}`, 40, cursorY);
        
        cursorY += 6;
        const orderDate = order.fecha_hora ? new Date(order.fecha_hora) : new Date();
        doc.setFont("helvetica", "bold");
        doc.text(`Fecha:`, 15, cursorY);
        doc.setFont("helvetica", "normal");
        doc.text(`${orderDate.toLocaleString('es-CO')}`, 40, cursorY);
        
        cursorY += 6;
        doc.setFont("helvetica", "bold");
        doc.text(`Vendedor:`, 15, cursorY);
        doc.setFont("helvetica", "normal");
        doc.text(`${sellerName || 'N/A'}`, 40, cursorY);

        // Divider
        cursorY += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(15, cursorY, pageWidth - 15, cursorY);
        cursorY += 8;

        // Client Info
        doc.setFont("helvetica", "bold");
        doc.text(`Datos del Cliente`, 15, cursorY);
        cursorY += 6;
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`Nombre:`, 15, cursorY);
        doc.setFont("helvetica", "normal");
        doc.text(`${client.nombre || 'N/A'}`, 35, cursorY);
        
        cursorY += 5;
        doc.setFont("helvetica", "bold");
        doc.text(`Dirección:`, 15, cursorY);
        doc.setFont("helvetica", "normal");
        
        // Wrap address if it's too long
        const splitAddress = doc.splitTextToSize(client.direccion || 'N/A', pageWidth - 50);
        doc.text(splitAddress, 35, cursorY);
        cursorY += (splitAddress.length * 5) + 3;

        // Items Table
        const tableBody = [];
        let grandTotal = 0;

        if (order.detalles && order.detalles.length > 0) {
            order.detalles.forEach(item => {
                const totalItem = parseFloat(item.cantidad) * parseFloat(item.precio_unitario);
                grandTotal += totalItem;
                tableBody.push([
                    item.producto_nombre || `Prod ID: ${item.producto_id}`,
                    item.cantidad.toString(),
                    `$${parseFloat(item.precio_unitario).toLocaleString('es-CO')}`,
                    `$${totalItem.toLocaleString('es-CO')}`
                ]);
            });
        }

        doc.autoTable({
            startY: cursorY,
            head: [['Producto', 'Cant.', 'Precio Unit.', 'Subtotal']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: primaryGreen, textColor: 255, fontSize: 8 },
            bodyStyles: { fontSize: 8 },
            margin: { left: 15, right: 15 },
        });

        cursorY = doc.lastAutoTable.finalY + 10;

        // Grand Total
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryGreen);
        doc.text(`TOTAL: $${parseFloat(order.total || grandTotal).toLocaleString('es-CO')}`, pageWidth - 15, cursorY, { align: "right" });

        // Footer
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text("Este comprobante es generado automáticamente por TotalAPP.", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

        // Save PDF
        const fileName = `Comprobante_Pedido_${order.id || 'Local'}_${client.codigo_pdv || ''}.pdf`;
        doc.save(fileName);
        
        if (window.App) App.showToast("Comprobante PDF generado con éxito.");
    }
};

window.PdfGenerator = PdfGenerator;
