from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.dependencies import DbSession
from app.models.usuario import Usuario
from app.schemas.usuario import LoginIn, LoginOut, ChangePasswordIn

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=LoginOut)
def login(payload: LoginIn, db: DbSession) -> Usuario:
    stmt = select(Usuario).where(Usuario.username == payload.username)
    usuario = db.scalar(stmt)
    
    if not usuario or usuario.password != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario o contraseña incorrectos.",
        )
        
    return usuario


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(payload: ChangePasswordIn, db: DbSession):
    stmt = select(Usuario).where(Usuario.username == payload.username)
    usuario = db.scalar(stmt)
    
    if not usuario or usuario.password != payload.password_actual:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La contraseña actual es incorrecta.",
        )
        
    usuario.password = payload.password_nueva
    usuario.debe_cambiar_clave = False
    db.commit()
    
    return {"status": "success", "message": "Contraseña cambiada con éxito."}
