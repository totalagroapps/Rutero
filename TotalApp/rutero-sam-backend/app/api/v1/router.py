from fastapi import APIRouter

from app.api.v1.endpoints import catalogo, clientes, pedidos, ruta, admin, auth, despacho, cartera, informes

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(ruta.router)
api_router.include_router(catalogo.router)
api_router.include_router(clientes.router)
api_router.include_router(pedidos.router)
api_router.include_router(admin.router)
api_router.include_router(auth.router)
api_router.include_router(despacho.router)
api_router.include_router(cartera.router)
api_router.include_router(informes.router, prefix="/admin/informes")
