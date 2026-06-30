from app.db.database import SessionLocal
from app.models.seguimiento import SeguimientoVendedor
from sqlalchemy import select

db = SessionLocal()
records = db.scalars(select(SeguimientoVendedor)).all()
print(f"Total tracking records: {len(records)}")
for r in records:
    print(r.vendedor_id, r.latitud, r.longitud, r.fecha_hora)
db.close()
