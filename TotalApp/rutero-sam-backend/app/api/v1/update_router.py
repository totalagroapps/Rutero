with open("TotalApp/rutero-sam-backend/app/api/v1/router.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "from app.api.v1.endpoints import catalogo, clientes, pedidos, ruta, admin, auth, despacho, cartera, informes",
    "from app.api.v1.endpoints import catalogo, clientes, pedidos, ruta, admin, auth, despacho, cartera, informes, tracking"
)
content += "\napi_router.include_router(tracking.router, dependencies=secure_dependencies)\n"

with open("TotalApp/rutero-sam-backend/app/api/v1/router.py", "w", encoding="utf-8") as f:
    f.write(content)
