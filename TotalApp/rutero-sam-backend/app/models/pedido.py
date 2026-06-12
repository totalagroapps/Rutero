from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Float, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Pedido(Base):
    __tablename__ = "pedidos"

    __table_args__ = (
        UniqueConstraint("uuid_dispositivo", name="uq_pedidos_uuid_dispositivo"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    uuid_dispositivo: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"), nullable=False)
    vendedor_id: Mapped[int] = mapped_column(ForeignKey("vendedores.id"), nullable=False)
    latitud_captura: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitud_captura: Mapped[float | None] = mapped_column(Float, nullable=True)
    fecha_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    tipo_cliente: Mapped[str] = mapped_column(String(50), nullable=False, default="directo")
    estado_sincronizacion: Mapped[str] = mapped_column(String(30), nullable=False, default="SINCRONIZADO")
    fecha_aprobacion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fecha_despacho: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fecha_entrega: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fecha_cancelacion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    certificacion_despacho: Mapped[str | None] = mapped_column(String(250), nullable=True)

    cliente = relationship("Cliente", back_populates="pedidos")
    vendedor = relationship("Vendedor", back_populates="pedidos")
    detalles = relationship(
        "DetallePedido",
        back_populates="pedido",
        cascade="all, delete-orphan",
    )
