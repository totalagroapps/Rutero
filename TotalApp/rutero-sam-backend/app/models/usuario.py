from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String(100), nullable=False)
    rol: Mapped[str] = mapped_column(String(30), nullable=False)  # 'admin', 'despacho', 'vendedor'
    vendedor_id: Mapped[int | None] = mapped_column(ForeignKey("vendedores.id"), nullable=True)
    debe_cambiar_clave: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    vendedor = relationship("Vendedor")
