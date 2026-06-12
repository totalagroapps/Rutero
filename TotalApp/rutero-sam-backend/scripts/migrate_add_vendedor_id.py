from pathlib import Path
import sys
from sqlalchemy import text

sys.path.append(str(Path(__file__).resolve().parents[1]))

import app.models
from app.db.database import engine

def main() -> None:
    statements = [
        """
        ALTER TABLE clientes
        ADD COLUMN IF NOT EXISTS vendedor_id INTEGER REFERENCES vendedores(id) ON DELETE SET NULL
        """
    ]

    print("Running migration to add vendedor_id column to clientes table...")
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))

    print("Migration completed successfully!")

if __name__ == "__main__":
    main()
