from fastapi import APIRouter
from sqlalchemy import select

from app.dependencies import DbSession
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteOut


router = APIRouter(prefix="/ruta", tags=["Ruta"])


@router.get("/{vendedor_id}", response_model=list[ClienteOut])
def obtener_ruta_vendedor(
    vendedor_id: int,
    db: DbSession,
) -> list[Cliente]:
    stmt = (
        select(Cliente)
        .where(Cliente.activo.is_(True))
        .order_by(Cliente.secuencia_ruta.asc())
    )
    return list(db.scalars(stmt).all())
