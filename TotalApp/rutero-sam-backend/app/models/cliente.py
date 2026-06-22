from sqlalchemy import Boolean, Float, Integer, String, UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Cliente(Base):
    __tablename__ = "clientes"

    __table_args__ = (
        UniqueConstraint("uuid_dispositivo", name="uq_clientes_uuid_dispositivo"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    uuid_dispositivo: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    codigo_pdv: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    encargado: Mapped[str | None] = mapped_column(String(120), nullable=True)
    direccion: Mapped[str] = mapped_column(String(250), nullable=False)
    municipio: Mapped[str | None] = mapped_column(String(150), nullable=True)
    referencia: Mapped[str | None] = mapped_column(String(250), nullable=True)
    latitud: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitud: Mapped[float | None] = mapped_column(Float, nullable=True)
    frecuencia: Mapped[str] = mapped_column(String(50), nullable=False)
    secuencia_ruta: Mapped[int] = mapped_column(Integer, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    vendedor_id: Mapped[int | None] = mapped_column(ForeignKey("vendedores.id"), nullable=True)

    pedidos = relationship("Pedido", back_populates="cliente")
    vendedor = relationship("Vendedor", back_populates="clientes")
