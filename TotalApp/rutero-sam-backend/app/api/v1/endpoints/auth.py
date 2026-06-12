from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy import select

from app.dependencies import DbSession, create_access_token, get_current_user
from app.models.usuario import Usuario
from app.schemas.usuario import LoginIn, LoginOut, ChangePasswordIn

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=LoginOut)
def login(payload: LoginIn, db: DbSession):
    stmt = select(Usuario).where(Usuario.username == payload.username)
    usuario = db.scalar(stmt)
    
    if not usuario or usuario.password != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario o contraseña incorrectos.",
        )
        
    access_token = create_access_token(data={"sub": usuario.username, "rol": usuario.rol})
    
    return {
        "id": usuario.id,
        "username": usuario.username,
        "rol": usuario.rol,
        "debe_cambiar_clave": usuario.debe_cambiar_clave,
        "vendedor_id": usuario.vendedor_id,
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(payload: ChangePasswordIn, db: DbSession, current_user: Usuario = Depends(get_current_user)):
    current_user.password = payload.password_nueva
    current_user.debe_cambiar_clave = False
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}
