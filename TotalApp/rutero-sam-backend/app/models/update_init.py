with open("TotalApp/rutero-sam-backend/app/models/__init__.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("from app.models.devolucion import Devolucion", "from app.models.devolucion import Devolucion\nfrom app.models.seguimiento import SeguimientoVendedor")
content = content.replace("    \"Devolucion\",", "    \"Devolucion\",\n    \"SeguimientoVendedor\",")

with open("TotalApp/rutero-sam-backend/app/models/__init__.py", "w", encoding="utf-8") as f:
    f.write(content)
