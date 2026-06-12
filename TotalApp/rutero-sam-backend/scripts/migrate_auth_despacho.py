import sys
from pathlib import Path
from sqlalchemy import create_engine, text, select
from sqlalchemy.orm import Session

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.db.base import Base
from app.models.usuario import Usuario

def main() -> None:
    print("Database URL:", settings.database_url)
    engine = create_engine(settings.database_url)
    
    # 1. Add column to pedidos if not exists
    print("Checking and adding certificacion_despacho column to pedidos...")
    alter_statement = """
    ALTER TABLE pedidos 
    ADD COLUMN IF NOT EXISTS certificacion_despacho VARCHAR(250);
    """
    with engine.begin() as connection:
        connection.execute(text(alter_statement))
    print("Column checked/added.")

    # 2. Create tables (specifically usuarios)
    print("Creating tables defined in metadata...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    # 3. Seed users
    print("Seeding default users...")
    with Session(engine) as session:
        default_users = [
            {
                "username": "admin",
                "password": "1234",
                "rol": "admin",
                "vendedor_id": None,
                "debe_cambiar_clave": True
            },
            {
                "username": "despacho1",
                "password": "1234",
                "rol": "despacho",
                "vendedor_id": None,
                "debe_cambiar_clave": True
            },
            {
                "username": "vendedor1",
                "password": "1234",
                "rol": "vendedor",
                "vendedor_id": 1,
                "debe_cambiar_clave": True
            }
        ]

        for u_data in default_users:
            user_exists = session.scalar(select(Usuario).where(Usuario.username == u_data["username"]))
            if not user_exists:
                usuario = Usuario(**u_data)
                session.add(usuario)
                print(f"Added user: {u_data['username']}")
            else:
                print(f"User {u_data['username']} already exists")
        
        session.commit()
    print("Migration and seeding completed successfully!")

if __name__ == "__main__":
    main()
