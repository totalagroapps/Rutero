from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class Visita(Base):
    __tablename__ = "visitas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    vendedor_id: Mapped[int] = mapped_column(ForeignKey("vendedores.id"), nullable=False, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"), nullable=False, index=True)
    fecha_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    genero_pedido: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    motivo_no_venta: Mapped[str | None] = mapped_column(String(150), nullable=True)

    vendedor = relationship("Vendedor")
    cliente = relationship("Cliente")
