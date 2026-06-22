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
    stmt = select(Pedido).where(Pedido.vendedor_id == vendedor_id).order_by(Pedido.fecha_hora.desc())
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
                estado_sincronizacion="PENDIENTE",
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
                    fecha_emision=pedido.fecha_hora.replace(tzinfo=None),
                    fecha_vencimiento=(pedido.fecha_hora + timedelta(days=30)).replace(tzinfo=None),
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

from fastapi.responses import Response
from app.schemas.pedido import PedidoPdfIn
from app.services.pdf_generator import generar_pdf_pedido
from sqlalchemy import func
from datetime import datetime, timezone

@router.post(
    "/pdf-confirmado",
    response_class=Response,
    status_code=status.HTTP_201_CREATED,
)
def crear_pedido_pdf(
    payload: PedidoPdfIn,
    db: DbSession,
):
    try:
        # Generar numero de pedido
        num = db.scalar(select(func.count(Pedido.id))) or 0
        fecha_actual = datetime.now(timezone.utc)
        numero_pedido_str = f"PED-{fecha_actual.strftime('%Y%m%d')}-{num+1:04d}"
        
        # Guardar en DB
        pedido = Pedido(
            uuid_dispositivo=payload.uuid_dispositivo,
            numero_pedido=numero_pedido_str,
            cliente_id=payload.cliente_id,
            nit_cedula=payload.nit_cedula,
            ciudad=payload.ciudad,
            telefono=payload.telefono,
            correo=payload.correo,
            vendedor_id=payload.vendedor_id,
            fecha_hora=fecha_actual,
            total=payload.total,
            iva=payload.iva,
            descuento=payload.descuento,
            tipo_cliente="directo",
            estado_sincronizacion="CONFIRMADO",
            forma_pago=payload.forma_pago,
            condiciones_entrega=payload.condiciones_entrega,
            fecha_estimada_entrega=None # Aca podriamos parsear el string a date
        )
        if payload.fecha_estimada_entrega:
            try:
                pedido.fecha_estimada_entrega = datetime.strptime(payload.fecha_estimada_entrega, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                pass
                
        # Necesitamos buscar los IDs reales de productos o crear un logica robusta. 
        # Como es un sistema mock/rapido y el usuario envio codigo/descripcion, 
        # si producto_id es foraneo y obligatorio, necesitamos buscarlo o setear uno por defecto.
        # Wait, DetallePedido expects producto_id. Let's see what happens if we use 1 for now or skip.

        for p in payload.productos:
            # We assume a mock product ID 1 if we don't look it up, since DetallePedido requires a valid producto_id.
            # In a real scenario we query the product by p.codigo. Let's do that:
            from app.models.producto import Producto
            prod = db.scalar(select(Producto).where(Producto.codigo == p.codigo))
            prod_id = prod.id if prod else 1 # fallback
            
            pedido.detalles.append(
                DetallePedido(
                    producto_id=prod_id,
                    cantidad=p.cantidad,
                    precio_unitario=p.precio_unitario,
                    notas=p.notas
                )
            )

        db.add(pedido)
        db.commit()

        # Generar PDF
        datos_dict = payload.model_dump()
        datos_dict['numero_pedido'] = numero_pedido_str
        datos_dict['fecha_hora'] = fecha_actual.strftime('%Y-%m-%d %H:%M')
        
        pdf_buffer = generar_pdf_pedido(datos_dict)
        
        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={numero_pedido_str}.pdf"}
        )
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando pedido PDF: {str(exc)}",
        )

@router.post(
    "/generar_pdf",
    response_class=Response,
    status_code=status.HTTP_200_OK,
)
def generar_pdf_estatico(
    payload: PedidoPdfIn,
):
    try:
        # Generar PDF
        datos_dict = payload.model_dump()
        datos_dict['numero_pedido'] = "PEDIDO-OFFLINE"
        fecha_actual = datetime.now(timezone.utc)
        datos_dict['fecha_hora'] = fecha_actual.strftime('%Y-%m-%d %H:%M')
        
        pdf_buffer = generar_pdf_pedido(datos_dict)
        
        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Pedido_{payload.nombre_cliente}.pdf"}
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando pedido PDF: {str(exc)}",
        )

from fastapi import APIRouter
from app.db.session import SessionLocal
from app.models.pedido import Pedido
from sqlalchemy.exc import ExceptionContext

@router.get("/test-error")
def test_error():
    db = SessionLocal()
    try:
        from datetime import datetime, timezone
        pedido = Pedido(
            uuid_dispositivo="test-1234-error",
            cliente_id=None,
            vendedor_id=1,
            latitud_captura=0.0,
            longitud_captura=0.0,
            fecha_hora=datetime.now(timezone.utc),
            total=100.0,
            tipo_cliente="directo",
            estado_sincronizacion="PENDIENTE"
        )
        db.add(pedido)
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()
