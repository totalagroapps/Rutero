from decimal import Decimal

from sqlalchemy import Boolean, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Producto(Base):
    __tablename__ = "productos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    sku: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    precio_directo: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    precio_distribuidor: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    inventario_disponible: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    detalles_pedido = relationship("DetallePedido", back_populates="producto")
