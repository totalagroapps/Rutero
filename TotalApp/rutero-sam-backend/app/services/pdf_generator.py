import io

from datetime import datetime

from reportlab.lib.pagesizes import letter

from reportlab.lib import colors

from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, Image

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

    import os

    logo_path = os.path.join(os.path.dirname(__file__), 'logo.png')

    

    if os.path.exists(logo_path):

        logo_img = Image(logo_path, width=66*mm, height=20*mm)

    else:

        logo_img = Paragraph("<b>TOTAL AGRO</b>", title_style)



    header_data = [

        [

            logo_img,

            Paragraph("<b>TOTAL AGRO / RUTERO SAM</b><br/>NIT: 901538496-8<br/>Oficina Principal, Colombia<br/>Tel: +57 300 000 0000<br/>ventas@totalagro.com", normal_style),

            Paragraph(f"<font size='14'><b>COMPROBANTE DE PEDIDO</b></font><br/><br/><b>N°:</b> {datos_pedido.get('numero_pedido')}<br/><b>Fecha:</b> {datos_pedido.get('fecha_hora')}<br/><b>Vendedor:</b> {datos_pedido.get('vendedor_nombre', 'Vendedor')}", normal_style)

        ]

    ]

    header_table = Table(header_data, colWidths=[45*mm, 65*mm, 60*mm])

    header_table.setStyle(TableStyle([

        ('ALIGN', (0,0), (0,0), 'LEFT'),

        ('ALIGN', (1,0), (1,0), 'LEFT'),

        ('ALIGN', (2,0), (2,0), 'RIGHT'),

        ('VALIGN', (0,0), (-1,-1), 'TOP'),

        ('BOTTOMPADDING', (0,0), (-1,-1), 10),

    ]))

    elements.append(header_table)

    elements.append(Spacer(1, 10*mm))



    # DATOS DEL CLIENTE

    elements.append(Paragraph("<b>DATOS DEL CLIENTE</b>", bold_style))

    cliente_data = [

        ["Nombre / Razón Social:", Paragraph(datos_pedido.get("nombre_cliente", ""), normal_style), "NIT / Cédula:", Paragraph(datos_pedido.get("nit_cedula", ""), normal_style)],

        ["Dirección:", Paragraph(datos_pedido.get("direccion", ""), normal_style), "Ciudad:", Paragraph(datos_pedido.get("ciudad", ""), normal_style)],

        ["Teléfono:", Paragraph(datos_pedido.get("telefono", ""), normal_style), "Correo:", Paragraph(datos_pedido.get("correo", ""), normal_style)]

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

    prod_header = ["CÃ³digo", "DescripciÃ³n", "Cant", "V.Unitario", "Subtotal"]

    prod_data = [prod_header]

    

    for p in datos_pedido.get("productos", []):

        row = [

            p.get("codigo", ""),

            p.get("descripcion", ""),

            str(p.get("cantidad", 0)),

            f"${float(p.get('precio_unitario', 0)):,.0f}",

            f"${float(p.get('subtotal', 0)):,.0f}"

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

        ["Subtotal:", f"${float(datos_pedido.get('subtotal', 0)):,.0f}"],

        ["Descuento:", f"${float(datos_pedido.get('descuento', 0)):,.0f}"],

        ["IVA:", f"${float(datos_pedido.get('iva', 0)):,.0f}"],

        ["TOTAL A PAGAR:", f"${float(datos_pedido.get('total', 0)):,.0f}"]

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

