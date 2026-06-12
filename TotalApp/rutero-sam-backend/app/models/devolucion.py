from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, String, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class Devolucion(Base):
    __tablename__ = "devoluciones"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    pedido_id: Mapped[int] = mapped_column(ForeignKey("pedidos.id"), nullable=False, index=True)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False, index=True)
    vendedor_id: Mapped[int] = mapped_column(ForeignKey("vendedores.id"), nullable=False, index=True)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    valor_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    motivo: Mapped[str] = mapped_column(String(150), nullable=False)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    pedido = relationship("Pedido")
    producto = relationship("Producto")
    vendedor = relationship("Vendedor")
