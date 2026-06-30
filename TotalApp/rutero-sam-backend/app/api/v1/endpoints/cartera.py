from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, func
from typing import List
from datetime import datetime

from app.dependencies import DbSession
from app.models.cartera import FacturaPendiente, Abono
from app.models.cliente import Cliente
from app.schemas.cartera import FacturaPendienteOut, FacturaPendienteCreate, AbonoOut, AbonoCreate, CarteraClienteOut

router = APIRouter(prefix="/cartera", tags=["Cartera"])

@router.get("/cliente/{cliente_id}", response_model=CarteraClienteOut)
def obtener_cartera_cliente(cliente_id: int, db: DbSession) -> CarteraClienteOut:
    cliente = db.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    facturas = db.scalars(
        select(FacturaPendiente)
        .where(FacturaPendiente.cliente_id == cliente_id)
        .where(FacturaPendiente.estado.in_(["VIGENTE", "VENCIDA"]))
    ).all()

    total_adeudado = sum([f.saldo_pendiente for f in facturas])
    total_vencido = sum([f.saldo_pendiente for f in facturas if f.fecha_vencimiento < datetime.utcnow() and f.estado != "PAGADA"])

    # Update states just in case
    for f in facturas:
        if f.fecha_vencimiento < datetime.utcnow() and f.estado == "VIGENTE":
            f.estado = "VENCIDA"
            db.commit()

    return CarteraClienteOut(
        cliente_id=cliente_id,
        total_adeudado=total_adeudado,
        total_vencido=total_vencido,
        facturas=facturas
    )

@router.post("/facturas", response_model=FacturaPendienteOut)
def crear_factura(payload: FacturaPendienteCreate, db: DbSession) -> FacturaPendiente:
    factura = FacturaPendiente(**payload.model_dump())
    if factura.fecha_vencimiento < datetime.utcnow():
        factura.estado = "VENCIDA"
    db.add(factura)
    db.commit()
    db.refresh(factura)
    return factura

@router.post("/abonos", response_model=AbonoOut)
def registrar_abono(payload: AbonoCreate, db: DbSession) -> Abono:
    factura = db.get(FacturaPendiente, payload.factura_id)
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    if payload.monto <= 0:
        raise HTTPException(status_code=400, detail="Monto debe ser mayor a 0")
        
    if payload.monto > factura.saldo_pendiente:
        raise HTTPException(status_code=400, detail="Monto de abono supera el saldo pendiente")

    abono = Abono(**payload.model_dump())
    db.add(abono)

    factura.saldo_pendiente -= payload.monto
    if factura.saldo_pendiente <= 0:
        factura.saldo_pendiente = 0
        factura.estado = "PAGADA"
    
    db.commit()
    db.refresh(abono)
    return abono

@router.get("/abonos/vendedor/{vendedor_id}", response_model=List[AbonoOut])
def listar_abonos_vendedor(vendedor_id: int, db: DbSession) -> List[Abono]:
    stmt = select(Abono).where(Abono.vendedor_id == vendedor_id).order_by(Abono.fecha.desc())
    return list(db.scalars(stmt).all())

from app.schemas.cartera import AbonoSyncBatchIn, AbonoSyncBatchOut, AbonoSyncItemOut

@router.get("/vendedor/{vendedor_id}", response_model=List[FacturaPendienteOut])
def obtener_cartera_por_vendedor(vendedor_id: int, db: DbSession):
    # Obtain all active clients for the vendor (or unassigned if we want them to see all, but for cartera let's stick to their clients or all active like in ruta)
    # Following ruta logic: return all pending invoices for active clients
    stmt = (
        select(FacturaPendiente)
        .join(Cliente)
        .where(Cliente.activo.is_(True))
        .where(FacturaPendiente.estado.in_(["VIGENTE", "VENCIDA"]))
    )
    facturas = db.scalars(stmt).all()
    
    # Update vencidas
    for f in facturas:
        if f.fecha_vencimiento < datetime.utcnow() and f.estado == "VIGENTE":
            f.estado = "VENCIDA"
            db.commit()
            
    return facturas

@router.post("/abonos/sync", response_model=AbonoSyncBatchOut, status_code=status.HTTP_201_CREATED)
def sincronizar_abonos(payload: AbonoSyncBatchIn, db: DbSession) -> AbonoSyncBatchOut:
    abonos_respuesta: List[AbonoSyncItemOut] = []
    total_insertados = 0
    total_duplicados = 0

    for abono_in in payload.abonos:
        # Check if already synced
        existente = db.scalar(select(Abono).where(Abono.uuid_dispositivo == abono_in.uuid_dispositivo))
        if existente:
            total_duplicados += 1
            abonos_respuesta.append(
                AbonoSyncItemOut(
                    uuid_dispositivo=abono_in.uuid_dispositivo,
                    abono_id=existente.id,
                    estado_sincronizacion="YA_SINCRONIZADO"
                )
            )
            continue
            
        factura = db.get(FacturaPendiente, abono_in.factura_id)
        if not factura:
            # Factura not found, could be an error or we just skip
            continue
            
        nuevo_abono = Abono(
            uuid_dispositivo=abono_in.uuid_dispositivo,
            factura_id=abono_in.factura_id,
            vendedor_id=abono_in.vendedor_id,
            monto=abono_in.monto,
            fecha=abono_in.fecha if abono_in.fecha else datetime.utcnow(),
            metodo_pago=abono_in.metodo_pago,
            notas=abono_in.notas
        )
        db.add(nuevo_abono)
        
        # Deduct from factura
        factura.saldo_pendiente -= abono_in.monto
        if factura.saldo_pendiente <= 0:
            factura.saldo_pendiente = 0
            factura.estado = "PAGADA"
            
        db.flush()
        
        total_insertados += 1
        abonos_respuesta.append(
            AbonoSyncItemOut(
                uuid_dispositivo=abono_in.uuid_dispositivo,
                abono_id=nuevo_abono.id,
                estado_sincronizacion="SINCRONIZADO"
            )
        )
        
    db.commit()
    return AbonoSyncBatchOut(
        total_recibidos=len(payload.abonos),
        total_insertados=total_insertados,
        total_duplicados=total_duplicados,
        abonos=abonos_respuesta
    )
