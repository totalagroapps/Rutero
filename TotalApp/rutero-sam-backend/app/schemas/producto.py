from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ProductoOut(BaseModel):
    id: int
    sku: str
    nombre: str
    precio_directo: Decimal
    precio_distribuidor: Decimal | None
    inventario_disponible: int
    activo: bool

    model_config = ConfigDict(from_attributes=True)
