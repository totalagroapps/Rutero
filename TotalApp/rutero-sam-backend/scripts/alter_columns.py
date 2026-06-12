import os
import sys
from sqlalchemy import create_engine, text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.db.database import engine

def main():
    with engine.connect() as conn:
        print("Migrating Pedido...")
        try:
            conn.execute(text("ALTER TABLE pedidos ADD COLUMN tipo_cliente VARCHAR(50) DEFAULT 'directo' NOT NULL;"))
            print("Added tipo_cliente to pedidos.")
        except Exception as e:
            print("Skipped tipo_cliente:", str(e))
            
        print("Migrating Producto...")
        try:
            conn.execute(text("ALTER TABLE productos RENAME COLUMN precio TO precio_directo;"))
            print("Renamed precio to precio_directo.")
        except Exception as e:
            print("Skipped rename precio:", str(e))
            
        try:
            conn.execute(text("ALTER TABLE productos ADD COLUMN precio_distribuidor NUMERIC(12, 2);"))
            print("Added precio_distribuidor to productos.")
        except Exception as e:
            print("Skipped precio_distribuidor:", str(e))

        conn.commit()
        print("Done.")

if __name__ == "__main__":
    main()
