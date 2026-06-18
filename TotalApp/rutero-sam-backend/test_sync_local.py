from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models.usuario import Usuario
from app.models.cliente import Cliente
from app.models.pedido import Pedido
from app.models.cartera import FacturaPendiente
from app.schemas.pedido import PedidoSyncBatchIn, PedidoSyncIn, DetallePedidoSyncIn
from app.api.v1.endpoints.pedidos import sincronizar_pedidos
import datetime

engine = create_engine("sqlite:///app/db/test.db")
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

# Add a vendor
# Wait, let's test if we can call the sync function directly
payload = PedidoSyncBatchIn(
    pedidos=[
        PedidoSyncIn(
            uuid_dispositivo="123e4567-e89b-12d3-a456-426614174000",
            cliente_id=7,
            vendedor_id=1,
            latitud_captura=0.0,
            longitud_captura=0.0,
            fecha_hora=datetime.datetime.now(datetime.timezone.utc),
            total=5000,
            tipo_cliente="distribuidor",
            detalles=[
                DetallePedidoSyncIn(
                    producto_id=1,
                    cantidad=1,
                    precio_unitario=5000
                )
            ]
        )
    ]
)

try:
    sincronizar_pedidos(payload, session)
    print("SYNC SUCCESS!")
except Exception as e:
    import traceback
    traceback.print_exc()

