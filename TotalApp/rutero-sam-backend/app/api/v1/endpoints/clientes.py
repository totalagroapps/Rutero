from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.dependencies import DbSession
from app.models.cliente import Cliente
from app.schemas.cliente import (
    ClienteSyncBatchIn,
    ClienteSyncBatchOut,
    ClienteSyncItemOut,
)


router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.post(
    "/sync",
    response_model=ClienteSyncBatchOut,
    status_code=status.HTTP_201_CREATED,
)
def sincronizar_clientes(
    payload: ClienteSyncBatchIn,
    db: DbSession,
) -> ClienteSyncBatchOut:
    clientes_respuesta: list[ClienteSyncItemOut] = []
    total_insertados = 0
    total_duplicados = 0

    try:
        for cliente_in in payload.clientes:
            from sqlalchemy import or_
            cliente_existente = db.scalar(
                select(Cliente).where(
                    or_(
                        Cliente.uuid_dispositivo == cliente_in.uuid_dispositivo,
                        Cliente.codigo_pdv == cliente_in.codigo_pdv
                    )
                )
            )

            if cliente_existente is not None:
                # If we matched by codigo_pdv but uuid_dispositivo was null, we could update it.
                # But simply returning the existing client_id is enough for frontend mapping!
                changed = False
                if not cliente_existente.uuid_dispositivo and cliente_in.uuid_dispositivo:
                    cliente_existente.uuid_dispositivo = cliente_in.uuid_dispositivo
                    changed = True
                
                # Auto-assign if unassigned
                if cliente_existente.vendedor_id is None and cliente_in.vendedor_id is not None:
                    cliente_existente.vendedor_id = cliente_in.vendedor_id
                    changed = True

                if changed:
                    db.add(cliente_existente)
                    db.flush()
                total_duplicados += 1
                clientes_respuesta.append(
                    ClienteSyncItemOut(
                        uuid_dispositivo=cliente_existente.uuid_dispositivo or cliente_in.uuid_dispositivo,
                        cliente_id=cliente_existente.id,
                        codigo_pdv=cliente_existente.codigo_pdv,
                        estado_sincronizacion="YA_SINCRONIZADO",
                    )
                )
                continue

            cliente = Cliente(
                uuid_dispositivo=cliente_in.uuid_dispositivo,
                codigo_pdv=cliente_in.codigo_pdv,
                nombre=cliente_in.nombre,
                encargado=cliente_in.encargado,
                direccion=cliente_in.direccion,
                municipio=cliente_in.municipio,
                referencia=cliente_in.referencia,
                latitud=cliente_in.latitud,
                longitud=cliente_in.longitud,
                frecuencia=cliente_in.frecuencia,
                secuencia_ruta=cliente_in.secuencia_ruta,
                activo=cliente_in.activo,
                vendedor_id=cliente_in.vendedor_id,
            )

            db.add(cliente)
            db.flush()

            total_insertados += 1
            clientes_respuesta.append(
                ClienteSyncItemOut(
                    uuid_dispositivo=cliente.uuid_dispositivo or cliente_in.uuid_dispositivo,
                    cliente_id=cliente.id,
                    codigo_pdv=cliente.codigo_pdv,
                    estado_sincronizacion="SINCRONIZADO",
                )
            )

        db.commit()

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Error de integridad al sincronizar clientes. Verifique codigo_pdv o uuid_dispositivo duplicado.",
        ) from exc

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error inesperado durante la sincronizacion de clientes.",
        ) from exc

    return ClienteSyncBatchOut(
        total_recibidos=len(payload.clientes),
        total_insertados=total_insertados,
        total_duplicados=total_duplicados,
        clientes=clientes_respuesta,
    )
