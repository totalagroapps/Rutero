import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from datetime import datetime, timedelta
import random

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.db.database import engine, SessionLocal
from app.db.base import Base
from app.models import Visita, Devolucion, Vendedor, Pedido, Cliente, Producto

def migrate_and_seed():
    print("Applying schema migrations...")
    
    # We will use raw SQL to alter tables and create new ones (or let create_all do the new ones)
    with engine.connect() as conn:
        try:
            # Add cuota_mensual to vendedores if it doesn't exist
            conn.execute(text("ALTER TABLE vendedores ADD COLUMN cuota_mensual NUMERIC(12, 2) NOT NULL DEFAULT 0;"))
            print("Added cuota_mensual to vendedores.")
        except Exception as e:
            print("cuota_mensual column might already exist:", e)

        try:
            # Add tracking columns to pedidos
            conn.execute(text("ALTER TABLE pedidos ADD COLUMN fecha_aprobacion TIMESTAMP WITH TIME ZONE;"))
            conn.execute(text("ALTER TABLE pedidos ADD COLUMN fecha_despacho TIMESTAMP WITH TIME ZONE;"))
            conn.execute(text("ALTER TABLE pedidos ADD COLUMN fecha_entrega TIMESTAMP WITH TIME ZONE;"))
            conn.execute(text("ALTER TABLE pedidos ADD COLUMN fecha_cancelacion TIMESTAMP WITH TIME ZONE;"))
            print("Added tracking dates to pedidos.")
        except Exception as e:
            print("tracking columns might already exist:", e)

        conn.commit()

    # Create new tables (visitas, devoluciones) if they don't exist
    Base.metadata.create_all(bind=engine)
    print("New tables (visitas, devoluciones) created if they didn't exist.")

    print("Seeding mock data for reports...")
    db = SessionLocal()

    vendedores = db.query(Vendedor).all()
    clientes = db.query(Cliente).all()
    productos = db.query(Producto).all()
    pedidos = db.query(Pedido).all()

    if not vendedores or not clientes or not productos:
        print("Not enough base data to seed.")
        db.close()
        return

    # Assign random quotas to vendors
    for v in vendedores:
        v.cuota_mensual = random.randint(10000000, 50000000)
    
    now = datetime.utcnow()

    # Seed Visitas (including no sales)
    motivos_no_venta = ["Cliente cerrado", "Sin dinero", "Stock lleno", "Dueño no estaba", "Rechazo de precio"]
    
    for _ in range(50):
        v = random.choice(vendedores)
        c = random.choice(clientes)
        dias_atras = random.randint(0, 30)
        # 60% chance of no sale
        genero = random.random() > 0.6
        motivo = random.choice(motivos_no_venta) if not genero else None
        
        visita = Visita(
            vendedor_id=v.id,
            cliente_id=c.id,
            fecha_hora=now - timedelta(days=dias_atras, hours=random.randint(1, 8)),
            genero_pedido=genero,
            motivo_no_venta=motivo
        )
        db.add(visita)

    # Create dummy pedidos if none exist
    if not pedidos:
        print("No pedidos found, creating some...")
        for _ in range(30):
            v = random.choice(vendedores)
            c = random.choice(clientes)
            p = Pedido(
                uuid_dispositivo=f"mock-{random.randint(1000, 9999)}",
                cliente_id=c.id,
                vendedor_id=v.id,
                fecha_hora=now - timedelta(days=random.randint(1, 30)),
                total=random.randint(50000, 500000),
                estado_sincronizacion=random.choice(["SINCRONIZADO", "CANCELADO"])
            )
            db.add(p)
        db.commit()
        pedidos = db.query(Pedido).all()

    # Seed tracking times for orders
    for p in pedidos:
        if p.estado_sincronizacion == "CANCELADO":
            p.fecha_cancelacion = p.fecha_hora + timedelta(days=random.randint(1, 3))
        else:
            # Simulate normal flow
            p.fecha_aprobacion = p.fecha_hora + timedelta(hours=random.randint(1, 12))
            p.fecha_despacho = p.fecha_aprobacion + timedelta(days=random.randint(1, 2))
            # 80% chance it's delivered
            if random.random() > 0.2:
                p.fecha_entrega = p.fecha_despacho + timedelta(hours=random.randint(4, 24))

    # Seed Devoluciones
    if pedidos and productos:
        motivos_dev = ["Producto vencido", "Empaque dañado", "Error en pedido", "Producto equivocado"]
        for _ in range(10):
            p = random.choice(pedidos)
            prod = random.choice(productos)
            
            dev = Devolucion(
                pedido_id=p.id,
                producto_id=prod.id,
                vendedor_id=p.vendedor_id,
                cantidad=random.randint(1, 5),
                valor_total=prod.precio * random.randint(1, 5),
                motivo=random.choice(motivos_dev),
                fecha=p.fecha_hora + timedelta(days=random.randint(1, 10))
            )
            db.add(dev)

    db.commit()
    db.close()
    print("Mock data seeded successfully!")

if __name__ == "__main__":
    migrate_and_seed()
