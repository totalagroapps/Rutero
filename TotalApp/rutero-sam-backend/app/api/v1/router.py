from fastapi import APIRouter, Depends

from app.api.v1.endpoints import catalogo, clientes, pedidos, ruta, admin, auth, despacho, cartera, informes, tracking
from app.dependencies import get_current_user

api_router = APIRouter(prefix="/api/v1")

secure_dependencies = [Depends(get_current_user)]

api_router.include_router(ruta.router, dependencies=secure_dependencies)
api_router.include_router(catalogo.router, dependencies=secure_dependencies)
api_router.include_router(clientes.router, dependencies=secure_dependencies)
api_router.include_router(pedidos.router, dependencies=secure_dependencies)
api_router.include_router(admin.router, dependencies=secure_dependencies)
api_router.include_router(auth.router)
api_router.include_router(despacho.router, dependencies=secure_dependencies)
api_router.include_router(cartera.router, dependencies=secure_dependencies)
api_router.include_router(informes.router, prefix="/admin/informes", dependencies=secure_dependencies)

api_router.include_router(tracking.router, dependencies=secure_dependencies)
