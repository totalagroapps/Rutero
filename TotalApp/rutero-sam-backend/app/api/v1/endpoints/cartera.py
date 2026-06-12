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
