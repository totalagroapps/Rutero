from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError

from app.dependencies import DbSession
from app.models.detalle_pedido import DetallePedido
from app.models.pedido import Pedido
from app.schemas.pedido import PedidoSyncBatchIn, PedidoSyncBatchOut, PedidoSyncItemOut, PedidoOut


router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

@router.get("/vendedor/{vendedor_id}/stats")
def obtener_estadisticas_vendedor(vendedor_id: int, db: DbSession):
    pendientes = db.scalar(select(func.count(Pedido.id)).where(Pedido.vendedor_id == vendedor_id, Pedido.estado_sincronizacion == "PENDIENTE")) or 0
    despachados = db.scalar(select(func.count(Pedido.id)).where(Pedido.vendedor_id == vendedor_id, Pedido.estado_sincronizacion.in_(["DESPACHADO", "RECIBIDO"]))) or 0
    cancelados = db.scalar(select(func.count(Pedido.id)).where(Pedido.vendedor_id == vendedor_id, Pedido.estado_sincronizacion == "CANCELADO")) or 0
    return {"pendientes": pendientes, "despachados": despachados, "cancelados": cancelados}


@router.get("/vendedor/{vendedor_id}", response_model=list[PedidoOut])
def obtener_pedidos_por_vendedor(vendedor_id: int, db: DbSession) -> list[Pedido]:
    stmt = select(Pedido).where(Pedido.vendedor_id == vendedor_id).order_by(Pedido.fecha_creacion.desc())
    return list(db.scalars(stmt))


@router.post(
    "/sync",
    response_model=PedidoSyncBatchOut,
    status_code=status.HTTP_201_CREATED,
)
def sincronizar_pedidos(
    payload: PedidoSyncBatchIn,
    db: DbSession,
) -> PedidoSyncBatchOut:
    pedidos_respuesta: list[PedidoSyncItemOut] = []
    total_insertados = 0
    total_duplicados = 0

    try:
        for pedido_in in payload.pedidos:
            pedido_existente = db.scalar(
                select(Pedido).where(Pedido.uuid_dispositivo == pedido_in.uuid_dispositivo)
            )

            if pedido_existente is not None:
                total_duplicados += 1
                pedidos_respuesta.append(
                    PedidoSyncItemOut(
                        uuid_dispositivo=pedido_existente.uuid_dispositivo,
                        pedido_id=pedido_existente.id,
                        estado_sincronizacion="YA_SINCRONIZADO",
                    )
                )
                continue

            pedido = Pedido(
                uuid_dispositivo=pedido_in.uuid_dispositivo,
                cliente_id=pedido_in.cliente_id,
                vendedor_id=pedido_in.vendedor_id,
                latitud_captura=pedido_in.latitud_captura,
                longitud_captura=pedido_in.longitud_captura,
                fecha_hora=pedido_in.fecha_hora,
                total=pedido_in.total,
                tipo_cliente=pedido_in.tipo_cliente,
                estado_sincronizacion="SINCRONIZADO",
            )
            pedido.detalles = [
                DetallePedido(
                    producto_id=detalle.producto_id,
                    cantidad=detalle.cantidad,
                    precio_unitario=detalle.precio_unitario,
                )
                for detalle in pedido_in.detalles
            ]

            db.add(pedido)
            db.flush()

            # Autogenerar Cartera si es distribuidor
            if pedido_in.tipo_cliente == "distribuidor":
                from app.models.cartera import FacturaPendiente
                from datetime import timedelta
                from sqlalchemy import func
                
                # Obtener total de facturas para un consecutivo simple
                num = db.scalar(select(func.count(FacturaPendiente.id))) or 0
                
                nueva_factura = FacturaPendiente(
                    cliente_id=pedido.cliente_id,
                    numero_factura=f"F-{pedido.id}-{num+1}",
                    fecha_emision=pedido.fecha_hora,
                    fecha_vencimiento=pedido.fecha_hora + timedelta(days=30),
                    monto_total=pedido.total,
                    saldo_pendiente=pedido.total,
                    estado="VIGENTE"
                )
                db.add(nueva_factura)

            total_insertados += 1
            pedidos_respuesta.append(
                PedidoSyncItemOut(
                    uuid_dispositivo=pedido.uuid_dispositivo,
                    pedido_id=pedido.id,
                    estado_sincronizacion=pedido.estado_sincronizacion,
                )
            )

        db.commit()

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Error de integridad al sincronizar pedidos.",
        ) from exc

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error inesperado durante la sincronizacion.",
        ) from exc

    return PedidoSyncBatchOut(
        total_recibidos=len(payload.pedidos),
        total_insertados=total_insertados,
        total_duplicados=total_duplicados,
        pedidos=pedidos_respuesta,
    )


@router.get("/cliente/{cliente_id}", response_model=list[PedidoOut])
def obtener_pedidos_cliente(
    cliente_id: int,
    db: DbSession,
) -> list[Pedido]:
    stmt = (
        select(Pedido)
        .where(Pedido.cliente_id == cliente_id)
        .order_by(Pedido.fecha_hora.desc())
    )
    return list(db.scalars(stmt).all())


@router.put("/{pedido_id}/estado", response_model=PedidoOut)
def actualizar_estado_pedido(
    pedido_id: int,
    nuevo_estado: str,
    db: DbSession,
) -> Pedido:
    pedido = db.get(Pedido, pedido_id)
    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido no encontrado.",
        )
    
    pedido.estado_sincronizacion = nuevo_estado
    db.commit()
    db.refresh(pedido)
    return pedido
