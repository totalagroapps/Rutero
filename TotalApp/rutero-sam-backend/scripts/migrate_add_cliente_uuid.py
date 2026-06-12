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
        ADD COLUMN IF NOT EXISTS uuid_dispositivo VARCHAR(80)
        """,
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ix_clientes_uuid_dispositivo_unique
        ON clientes (uuid_dispositivo)
        WHERE uuid_dispositivo IS NOT NULL
        """,
    ]

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))

    print("migracion_clientes_uuid_ok")


if __name__ == "__main__":
    main()
