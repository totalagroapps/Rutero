from sqlalchemy import Boolean, Float, Integer, String, ForeignKey, Date, DateTime, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.db.base import Base

class FacturaPendiente(Base):
    __tablename__ = "facturas_pendientes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"), nullable=False, index=True)
    numero_factura: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    fecha_emision: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_vencimiento: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    monto_total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    saldo_pendiente: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="VIGENTE") # VIGENTE, VENCIDA, PAGADA
    
    # Optional relation to a specific order if generated from app
    pedido_id: Mapped[int | None] = mapped_column(ForeignKey("pedidos.id"), nullable=True)

    abonos = relationship("Abono", back_populates="factura")
    cliente = relationship("Cliente")

class Abono(Base):
    __tablename__ = "abonos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    factura_id: Mapped[int] = mapped_column(ForeignKey("facturas_pendientes.id"), nullable=False, index=True)
    vendedor_id: Mapped[int] = mapped_column(ForeignKey("vendedores.id"), nullable=False)
    monto: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    fecha: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    metodo_pago: Mapped[str] = mapped_column(String(50), nullable=False) # EFECTIVO, TRANSFERENCIA
    notas: Mapped[str | None] = mapped_column(String(250), nullable=True)

    factura = relationship("FacturaPendiente", back_populates="abonos")
