from pydantic import BaseModel, ConfigDict


class LoginIn(BaseModel):
    username: str
    password: str


class LoginOut(BaseModel):
    id: int
    username: str
    rol: str
    debe_cambiar_clave: bool
    vendedor_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


class ChangePasswordIn(BaseModel):
    username: str
    password_actual: str
    password_nueva: str


class UsuarioCreateIn(BaseModel):
    username: str
    password: str
    rol: str
    vendedor_id: int | None = None
    debe_cambiar_clave: bool = True


class UsuarioUpdateIn(BaseModel):
    username: str
    password: str | None = None  # Optional to update password
    rol: str
    vendedor_id: int | None = None
    debe_cambiar_clave: bool = True


class UsuarioOut(BaseModel):
    id: int
    username: str
    rol: str
    vendedor_id: int | None = None
    debe_cambiar_clave: bool

    model_config = ConfigDict(from_attributes=True)
