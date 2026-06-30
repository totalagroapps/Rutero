import asyncio
from app.db.database import SessionLocal
from app.api.v1.endpoints.tracking import obtener_ultima_ubicacion_vendedores

def test():
    db = SessionLocal()
    try:
        res = obtener_ultima_ubicacion_vendedores(db)
        print("SUCCESS:", res)
    except Exception as e:
        print("ERROR:", e)
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test()
