from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class SeguimientoVendedor(Base):
    __tablename__ = "seguimiento_vendedor"

    id = Column(Integer, primary_key=True, index=True)
    uuid_dispositivo = Column(String(80), nullable=False, unique=True, index=True)
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=False, index=True)
    latitud = Column(Float, nullable=False)
    longitud = Column(Float, nullable=False)
    fecha_hora = Column(DateTime, default=datetime.utcnow, nullable=False)
    bateria = Column(Integer, nullable=True)

    vendedor = relationship("Vendedor")
