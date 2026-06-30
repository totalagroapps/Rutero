from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from typing import List
from datetime import datetime

from app.dependencies import DbSession
from app.models.seguimiento import SeguimientoVendedor
from app.models.vendedor import Vendedor
from app.schemas.tracking import TrackingSyncBatchIn, TrackingSyncBatchOut, TrackingSyncItemOut, VendedorTrackingOut

router = APIRouter(prefix="/tracking", tags=["Tracking"])

@router.post("/sync", response_model=TrackingSyncBatchOut, status_code=status.HTTP_201_CREATED)
def sincronizar_tracking(payload: TrackingSyncBatchIn, db: DbSession) -> TrackingSyncBatchOut:
    puntos_respuesta: List[TrackingSyncItemOut] = []
    total_insertados = 0

    for punto_in in payload.puntos:
        existente = db.scalar(select(SeguimientoVendedor).where(SeguimientoVendedor.uuid_dispositivo == punto_in.uuid_dispositivo))
        if existente:
            puntos_respuesta.append(
                TrackingSyncItemOut(
                    uuid_dispositivo=punto_in.uuid_dispositivo,
                    estado_sincronizacion="YA_SINCRONIZADO"
                )
            )
            continue
            
        nuevo_punto = SeguimientoVendedor(
            uuid_dispositivo=punto_in.uuid_dispositivo,
            vendedor_id=payload.vendedor_id,
            latitud=punto_in.latitud,
            longitud=punto_in.longitud,
            fecha_hora=punto_in.fecha_hora,
            bateria=punto_in.bateria
        )
        db.add(nuevo_punto)
        
        total_insertados += 1
        puntos_respuesta.append(
            TrackingSyncItemOut(
                uuid_dispositivo=punto_in.uuid_dispositivo,
                estado_sincronizacion="SINCRONIZADO"
            )
        )
        
    db.commit()
    return TrackingSyncBatchOut(
        total_recibidos=len(payload.puntos),
        total_insertados=total_insertados,
        puntos=puntos_respuesta
    )

@router.get("/latest", response_model=List[VendedorTrackingOut])
def obtener_ultima_ubicacion_vendedores(db: DbSession):
    # Fetch the latest location for each vendor
    # In PostgreSQL we can use DISTINCT ON (vendedor_id) ORDER BY vendedor_id, fecha_hora DESC
    # For cross-compatibility in SQLAlchemy, we can group by or use a subquery.
    from sqlalchemy import func
    
    subq = (
        select(
            SeguimientoVendedor.vendedor_id,
            func.max(SeguimientoVendedor.fecha_hora).label("max_fecha")
        )
        .group_by(SeguimientoVendedor.vendedor_id)
        .subquery()
    )
    
    stmt = (
        select(SeguimientoVendedor, Vendedor.nombre)
        .join(Vendedor, Vendedor.id == SeguimientoVendedor.vendedor_id)
        .join(subq, (SeguimientoVendedor.vendedor_id == subq.c.vendedor_id) & (SeguimientoVendedor.fecha_hora == subq.c.max_fecha))
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
