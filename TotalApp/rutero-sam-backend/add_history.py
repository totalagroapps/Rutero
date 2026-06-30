with open("TotalApp/rutero-sam-backend/app/api/v1/endpoints/tracking.py", "r", encoding="utf-8") as f:
    content = f.read()

history_endpoint = """
@router.get("/history/{vendedor_id}", response_model=List[VendedorTrackingOut])
def obtener_historial_vendedor(vendedor_id: int, db: DbSession):
    # Only today's records
    today = datetime.utcnow().date()
    
    stmt = (
        select(SeguimientoVendedor, Vendedor.nombre)
        .join(Vendedor, Vendedor.id == SeguimientoVendedor.vendedor_id)
        .where(SeguimientoVendedor.vendedor_id == vendedor_id)
        .where(func.date(SeguimientoVendedor.fecha_hora) == today)
        .order_by(SeguimientoVendedor.fecha_hora.asc())
    )
    
    resultados = db.execute(stmt).all()
    
    respuesta = []
    for seguimiento, nombre_vendedor in resultados:
        respuesta.append(VendedorTrackingOut(
            vendedor_id=seguimiento.vendedor_id,
            nombre=nombre_vendedor,
            latitud=seguimiento.latitud,
            longitud=seguimiento.longitud,
            fecha_hora=seguimiento.fecha_hora,
            bateria=seguimiento.bateria
        ))
        
    return respuesta
"""

if "obtener_historial_vendedor" not in content:
    content += "\n" + history_endpoint

with open("TotalApp/rutero-sam-backend/app/api/v1/endpoints/tracking.py", "w", encoding="utf-8") as f:
    f.write(content)
