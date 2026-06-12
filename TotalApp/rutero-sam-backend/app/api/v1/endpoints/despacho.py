from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.dependencies import DbSession
from app.models.pedido import Pedido
from app.models.producto import Producto
from app.schemas.pedido import PedidoOut
from app.schemas.producto import ProductoOut

router = APIRouter(prefix="/despacho", tags=["Despacho"])


@router.get("/pedidos", response_model=list[PedidoOut])
def listar_pedidos_despacho(db: DbSession) -> list[Pedido]:
    stmt = select(Pedido).order_by(Pedido.fecha_hora.desc())
    return list(db.scalars(stmt).all())


@router.put("/pedidos/{pedido_id}/certificar", response_model=PedidoOut)
def certificar_pedido(
    pedido_id: int,
    certificacion: str,
    db: DbSession,
) -> Pedido:
    pedido = db.get(Pedido, pedido_id)
    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido no encontrado.",
        )
        
    pedido.estado_sincronizacion = "DESPACHADO"
    pedido.certificacion_despacho = certificacion
    db.commit()
    db.refresh(pedido)
    return pedido


@router.put("/productos/{producto_id}/stock", response_model=ProductoOut)
def actualizar_stock_producto(
    producto_id: int,
    stock: int,
    db: DbSession,
) -> Producto:
    producto = db.get(Producto, producto_id)
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )
        
    producto.inventario_disponible = stock
    db.commit()
    db.refresh(producto)
    return producto
