import sys
from pathlib import Path
from decimal import Decimal
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.models.vendedor import Vendedor
from app.models.producto import Producto
from app.models.cliente import Cliente

def seed() -> None:
    print("Database URL:", settings.database_url)
    engine = create_engine(settings.database_url)
    
    with Session(engine) as session:
        # 1. Seed Vendedor
        vendedor_exists = session.scalar(select(Vendedor).where(Vendedor.id == 1))
        if not vendedor_exists:
            vendedor = Vendedor(
                id=1,
                nombre="Samuel Vendedor",
                zona="Santiago Oriente"
            )
            session.add(vendedor)
            print("Added Vendedor: Samuel Vendedor (ID: 1)")
        else:
            print("Vendedor (ID: 1) already exists")

        # 2. Seed Productos
        productos_data = [
            {"sku": "PROD001", "nombre": "Coca Cola 1.5L", "precio": Decimal("1500.00"), "inventario_disponible": 120},
            {"sku": "PROD002", "nombre": "Papa Frita Lay's Familiar", "precio": Decimal("2200.00"), "inventario_disponible": 80},
            {"sku": "PROD003", "nombre": "Galletas Club Social", "precio": Decimal("600.00"), "inventario_disponible": 200},
            {"sku": "PROD004", "nombre": "Jugo Watt's Naranja 1L", "precio": Decimal("1200.00"), "inventario_disponible": 150},
            {"sku": "PROD005", "nombre": "Chocolate Sahne-Nuss", "precio": Decimal("3500.00"), "inventario_disponible": 50},
            {"sku": "PROD006", "nombre": "Leche Soprole Entera 1L", "precio": Decimal("950.00"), "inventario_disponible": 300},
        ]
        
        for p_data in productos_data:
            prod_exists = session.scalar(select(Producto).where(Producto.sku == p_data["sku"]))
            if not prod_exists:
                producto = Producto(**p_data)
                session.add(producto)
                print(f"Added Producto: {p_data['nombre']}")
            else:
                print(f"Producto {p_data['sku']} already exists")

        # 3. Seed Clientes
        clientes_data = [
            {
                "codigo_pdv": "PDV001",
                "nombre": "Almacén Don Lucho",
                "encargado": "Luis Pérez",
                "direccion": "Av. Providencia 1250, Providencia",
                "latitud": -33.4372,
                "longitud": -70.6250,
                "frecuencia": "Semanal",
                "secuencia_ruta": 1,
                "activo": True,
                "vendedor_id": 1
            },
            {
                "codigo_pdv": "PDV002",
                "nombre": "Minimarket La Esquina",
                "encargado": "María Silva",
                "direccion": "Av. Nueva Providencia 1881, Providencia",
                "latitud": -33.4253,
                "longitud": -70.6120,
                "frecuencia": "Semanal",
                "secuencia_ruta": 2,
                "activo": True,
                "vendedor_id": 1
            },
            {
                "codigo_pdv": "PDV003",
                "nombre": "Botillería San Juan",
                "encargado": "Juan Soto",
                "direccion": "Av. Pedro de Valdivia 340, Providencia",
                "latitud": -33.4305,
                "longitud": -70.6080,
                "frecuencia": "Quincenal",
                "secuencia_ruta": 3,
                "activo": True,
                "vendedor_id": 1
            },
            {
                "codigo_pdv": "PDV004",
                "nombre": "Supermercado Express",
                "encargado": "Ana Gómez",
                "direccion": "Manuel Montt 88, Providencia",
                "latitud": -33.4350,
                "longitud": -70.6200,
                "frecuencia": "Semanal",
                "secuencia_ruta": 4,
                "activo": True,
                "vendedor_id": 1
            },
            {
                "codigo_pdv": "PDV005",
                "nombre": "Bazar El Sol",
                "encargado": "Carlos Ruiz",
                "direccion": "Salvador 450, Providencia",
                "latitud": -33.4402,
                "longitud": -70.6280,
                "frecuencia": "Mensual",
                "secuencia_ruta": 5,
                "activo": True,
                "vendedor_id": 1
            },
            {
                "codigo_pdv": "PDV006",
                "nombre": "Panadería La Espiga",
                "encargado": "Teresa Díaz",
                "direccion": "Av. Eliodoro Yáñez 1640, Providencia",
                "latitud": -33.4330,
                "longitud": -70.6030,
                "frecuencia": "Semanal",
                "secuencia_ruta": 6,
                "activo": True,
                "vendedor_id": 1
            }
        ]
        
        for c_data in clientes_data:
            cli_exists = session.scalar(select(Cliente).where(Cliente.codigo_pdv == c_data["codigo_pdv"]))
            if not cli_exists:
                cliente = Cliente(**c_data)
                session.add(cliente)
                print(f"Added Cliente: {c_data['nombre']}")
            else:
                print(f"Cliente {c_data['codigo_pdv']} already exists")
                
        session.commit()
        print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed()
