from fastapi import APIRouter
from sqlalchemy import select

from app.dependencies import DbSession
from app.models.producto import Producto
from app.schemas.producto import ProductoOut


router = APIRouter(prefix="/catalogo", tags=["Catalogo"])


@router.get("", response_model=list[ProductoOut])
def obtener_catalogo(
    db: DbSession,
) -> list[Producto]:
    stmt = (
        select(Producto)
        .where(Producto.activo.is_(True))
        .order_by(Producto.nombre.asc())
    )
    return list(db.scalars(stmt).all())
