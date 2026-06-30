from datetime import datetime, timezone
import asyncio
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.pedido import Pedido
from sqlalchemy import text

async def main():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        db.execute(text("DELETE FROM pedidos"))
        db.commit()

        # Insert a Pedido exactly as in sync endpoint
        pedido = Pedido(
            uuid_dispositivo="test-1234",
            cliente_id=None,
            vendedor_id=1,
            fecha_hora=datetime.now(timezone.utc),
            total=100.0,
            tipo_cliente="directo",
            estado_sincronizacion="PENDIENTE"
        )
        db.add(pedido)
        db.commit()
        print("Insert successful!")
    except Exception as e:
        db.rollback()
        print("Error during insert:", str(e))
    finally:
        db.close()

if __name__ == '__main__':
    asyncio.run(main())
