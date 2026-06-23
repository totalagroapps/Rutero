from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class VendedorCreate(BaseModel):
    nombre: str
    zona: str


class VendedorUpdate(BaseModel):
    nombre: str
    zona: str


class VendedorOut(BaseModel):
    id: int
    nombre: str
    zona: str

    model_config = ConfigDict(from_attributes=True)


class ClienteCreate(BaseModel):
    codigo_pdv: str
    nombre: str
    encargado: str | None = None
    direccion: str
    latitud: float | None = None
    longitud: float | None = None
    frecuencia: str
    secuencia_ruta: int
    activo: bool = True
    vendedor_id: int | None = None


class ClienteUpdate(BaseModel):
    codigo_pdv: str
    nombre: str
    encargado: str | None = None
    direccion: str
    latitud: float | None = None
    longitud: float | None = None
    frecuencia: str
    secuencia_ruta: int
    activo: bool = True
    vendedor_id: int | None = None


class ProductoCreate(BaseModel):
    sku: str = Field(max_length=80)
    nombre: str = Field(max_length=150)
    precio_directo: Decimal = Field(gt=0)
    precio_distribuidor: Decimal | None = None
    inventario_disponible: int = 0
    activo: bool = True


class ProductoUpdate(BaseModel):
    sku: str = Field(max_length=80)
    nombre: str = Field(max_length=150)
    precio_directo: Decimal = Field(gt=0)
    precio_distribuidor: Decimal | None = None
    inventario_disponible: int
    activo: bool = True


class StatsOut(BaseModel):
    total_ventas: Decimal
    total_pedidos: int
    total_vendedores: int
    total_clientes: int
    pedidos_pendientes: int
    pedidos_despachados: int
    pedidos_cancelados: int


class PurgeDataIn(BaseModel):
    purge_pedidos: bool = False
    purge_visitas: bool = False
    purge_clientes: bool = False
