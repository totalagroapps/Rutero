from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class DetallePedidoSyncIn(BaseModel):
    producto_id: int
    cantidad: int = Field(gt=0)
    precio_unitario: Decimal = Field(gt=0)


class PedidoSyncIn(BaseModel):
    uuid_dispositivo: str = Field(min_length=10, max_length=80)
    cliente_id: int
    vendedor_id: int = 1
    latitud_captura: float | None = None
    longitud_captura: float | None = None
    fecha_hora: datetime
    total: Decimal = Field(gt=0)
    tipo_cliente: str = "directo"
    detalles: list[DetallePedidoSyncIn] = Field(min_length=1)


class PedidoSyncBatchIn(BaseModel):
    pedidos: list[PedidoSyncIn] = Field(min_length=1)


class PedidoSyncItemOut(BaseModel):
    uuid_dispositivo: str
    pedido_id: int
    estado_sincronizacion: str


class PedidoSyncBatchOut(BaseModel):
    total_recibidos: int
    total_insertados: int
    total_duplicados: int
    pedidos: list[PedidoSyncItemOut]


class DetallePedidoOut(BaseModel):
    id: int
    pedido_id: int
    producto_id: int
    cantidad: int
    precio_unitario: Decimal

    class Config:
        from_attributes = True


class PedidoOut(BaseModel):
    id: int
    uuid_dispositivo: str
    cliente_id: int
    vendedor_id: int
    latitud_captura: float | None
    longitud_captura: float | None
    fecha_hora: datetime
    total: Decimal
    tipo_cliente: str
    estado_sincronizacion: str
    certificacion_despacho: str | None = None
    detalles: list[DetallePedidoOut]

    class Config:
        from_attributes = True
