from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models
from app.api.v1.router import api_router
from app.db.base import Base
from app.db.database import engine


def create_app() -> FastAPI:
    app = FastAPI(
        title="Rutero SAM API",
        version="1.0.0",
        description="Backend para rutero de vendedores en terreno con sincronizacion offline-first.",
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.include_router(api_router)
    return app


app = create_app()


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
