from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional
from decimal import Decimal

class FacturaPendienteBase(BaseModel):
    cliente_id: int
    numero_factura: str
    fecha_emision: Optional[datetime] = None
    fecha_vencimiento: datetime
    monto_total: Decimal
    saldo_pendiente: Decimal
    estado: str = "VIGENTE"
    pedido_id: Optional[int] = None

class FacturaPendienteCreate(FacturaPendienteBase):
    pass

class FacturaPendienteOut(FacturaPendienteBase):
    id: int
    fecha_emision: datetime
    model_config = ConfigDict(from_attributes=True)

class AbonoBase(BaseModel):
    factura_id: int
    vendedor_id: int
    monto: Decimal
    fecha: Optional[datetime] = None
    metodo_pago: str
    notas: Optional[str] = None

class AbonoCreate(AbonoBase):
    pass

class AbonoOut(AbonoBase):
    id: int
    fecha: datetime
    model_config = ConfigDict(from_attributes=True)

class AbonoSyncIn(AbonoBase):
    uuid_dispositivo: str

class AbonoSyncBatchIn(BaseModel):
    abonos: List[AbonoSyncIn]

class AbonoSyncItemOut(BaseModel):
    uuid_dispositivo: str
    abono_id: int
    estado_sincronizacion: str

class AbonoSyncBatchOut(BaseModel):
    total_recibidos: int
    total_insertados: int
    total_duplicados: int
    abonos: List[AbonoSyncItemOut]

class CarteraClienteOut(BaseModel):
    cliente_id: int
    total_adeudado: Decimal
    total_vencido: Decimal
    facturas: List[FacturaPendienteOut]
