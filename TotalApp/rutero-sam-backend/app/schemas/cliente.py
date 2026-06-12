from pydantic import BaseModel, ConfigDict, Field


class ClienteSyncIn(BaseModel):
    uuid_dispositivo: str = Field(min_length=10, max_length=80)
    codigo_pdv: str = Field(min_length=1, max_length=50)
    nombre: str = Field(min_length=1, max_length=150)
    encargado: str | None = Field(default=None, max_length=120)
    direccion: str = Field(min_length=1, max_length=250)
    latitud: float | None = None
    longitud: float | None = None
    frecuencia: str = Field(min_length=1, max_length=50)
    secuencia_ruta: int = Field(ge=0)
    activo: bool = True
    vendedor_id: int | None = None


class ClienteSyncBatchIn(BaseModel):
    clientes: list[ClienteSyncIn] = Field(min_length=1)


class ClienteOut(BaseModel):
    id: int
    uuid_dispositivo: str | None
    codigo_pdv: str
    nombre: str
    encargado: str | None
    direccion: str
    latitud: float | None
    longitud: float | None
    frecuencia: str
    secuencia_ruta: int
    activo: bool
    vendedor_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


class ClienteSyncItemOut(BaseModel):
    uuid_dispositivo: str
    cliente_id: int
    codigo_pdv: str
    estado_sincronizacion: str


class ClienteSyncBatchOut(BaseModel):
    total_recibidos: int
    total_insertados: int
    total_duplicados: int
    clientes: list[ClienteSyncItemOut]

class ClienteReorderIn(BaseModel):
    id: int
    secuencia_ruta: int = Field(ge=0)

class ClienteReorderBatchIn(BaseModel):
    clientes: list[ClienteReorderIn] = Field(min_length=1)
