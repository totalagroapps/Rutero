from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TrackingItemIn(BaseModel):
    uuid_dispositivo: str
    latitud: float
    longitud: float
    fecha_hora: datetime
    bateria: Optional[int] = None

class TrackingSyncBatchIn(BaseModel):
    vendedor_id: int
    puntos: List[TrackingItemIn]

class TrackingSyncItemOut(BaseModel):
    uuid_dispositivo: str
    estado_sincronizacion: str

class TrackingSyncBatchOut(BaseModel):
    total_recibidos: int
    total_insertados: int
    puntos: List[TrackingSyncItemOut]

class VendedorTrackingOut(BaseModel):
    vendedor_id: int
    nombre: str
    latitud: float
    longitud: float
    fecha_hora: datetime
    bateria: Optional[int] = None
