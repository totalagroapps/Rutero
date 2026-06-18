import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm

def generar_pdf_pedido(datos_pedido: dict) -> io.BytesIO:
    buffer = io.BytesIO()
    
    # 20mm margins
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            rightMargin=20*mm, leftMargin=20*mm,
                            topMargin=20*mm, bottomMargin=20*mm)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Title style
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=10,
        alignment=1 # Center
    )
    
    # Text styles
    normal_style = styles['Normal']
    bold_style = ParagraphStyle('Bold', parent=normal_style, fontName='Helvetica-Bold')

    # ENCABEZADO
    header_data = [
        [
            Paragraph("<b>Empresa S.A.S</b><br/>NIT: 900.123.456-7<br/>Calle Falsa 123, Bogotá<br/>Tel: +57 300 123 4567<br/>ventas@empresasas.com", normal_style),
            Paragraph(f"<font size='14'><b>COMPROBANTE DE PEDIDO</b></font><br/><br/><b>N°:</b> {datos_pedido.get('numero_pedido')}<br/><b>Fecha:</b> {datos_pedido.get('fecha_hora')}<br/><b>Vendedor:</b> {datos_pedido.get('vendedor_nombre', 'Vendedor')}", normal_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[100*mm, 70*mm])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 10*mm))

    # DATOS DEL CLIENTE
    elements.append(Paragraph("<b>DATOS DEL CLIENTE</b>", bold_style))
    cliente_data = [
        ["Nombre / Razón Social:", datos_pedido.get("nombre_cliente", ""), "NIT / Cédula:", datos_pedido.get("nit_cedula", "")],
        ["Dirección:", datos_pedido.get("direccion", ""), "Ciudad:", datos_pedido.get("ciudad", "")],
        ["Teléfono:", datos_pedido.get("telefono", ""), "Correo:", datos_pedido.get("correo", "")]
    ]
    cliente_table = Table(cliente_data, colWidths=[40*mm, 50*mm, 30*mm, 50*mm])
    cliente_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f4f4f4")),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.black),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOX', (0,0), (-1,-1), 1, colors.lightgrey),
    ]))
    elements.append(cliente_table)
    elements.append(Spacer(1, 10*mm))

    # PRODUCTOS
    elements.append(Paragraph("<b>PRODUCTOS</b>", bold_style))
    prod_header = ["Código", "Descripción", "Cant", "V.Unitario", "Subtotal"]
    prod_data = [prod_header]
    
    for p in datos_pedido.get("productos", []):
        row = [
            p.get("codigo", ""),
            p.get("descripcion", ""),
            str(p.get("cantidad", 0)),
            f"",
            f""
        ]
        prod_data.append(row)

    prod_table = Table(prod_data, colWidths=[25*mm, 70*mm, 15*mm, 30*mm, 30*mm])
    prod_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e0e0e0")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.black),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('ALIGN', (1,1), (1,-1), 'LEFT'),
        ('ALIGN', (3,1), (4,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 1, colors.lightgrey),
    ]))
    elements.append(prod_table)
    elements.append(Spacer(1, 5*mm))

    # TOTALES
    totales_data = [
        ["Subtotal:", f""],
        ["Descuento:", f""],
        ["IVA:", f""],
        ["TOTAL A PAGAR:", f""]
    ]
    totales_table = Table(totales_data, colWidths=[130*mm, 40*mm])
    totales_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,-1), 'RIGHT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0,-1), (-1,-1), colors.green),
    ]))
    elements.append(totales_table)
    elements.append(Spacer(1, 10*mm))

    # OBSERVACIONES
    elements.append(Paragraph("<b>OBSERVACIONES Y CONDICIONES</b>", bold_style))
    obs_data = [
        ["Forma de Pago:", datos_pedido.get("forma_pago", "")],
        ["Condiciones Entrega:", datos_pedido.get("condiciones_entrega", "")],
        ["Fecha Estimada Entrega:", datos_pedido.get("fecha_estimada_entrega", "")]
    ]
    obs_table = Table(obs_data, colWidths=[40*mm, 130*mm])
    obs_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(obs_table)

    doc.build(elements)
    buffer.seek(0)
    return buffer
