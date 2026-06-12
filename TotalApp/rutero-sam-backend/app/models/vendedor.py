from sqlalchemy import String, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Vendedor(Base):
    __tablename__ = "vendedores"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    zona: Mapped[str] = mapped_column(String(80), nullable=False)
    cuota_mensual: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)

    pedidos = relationship("Pedido", back_populates="vendedor")
    clientes = relationship("Cliente", back_populates="vendedor")
