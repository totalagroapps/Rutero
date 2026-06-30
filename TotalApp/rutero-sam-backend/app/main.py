import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models
from app.api.v1.router import api_router
from app.db.base import Base
from app.db.database import engine
from app.core.config import settings

def create_app() -> FastAPI:
    app = FastAPI(
        title="Rutero SAM API",
        version="1.0.0",
        description="Backend para rutero de vendedores en terreno con sincronizacion offline-first.",
    )
    
    # Configure CORS appropriately for production
    origins = [
    "https://rutero-sam-frontend-production.up.railway.app",
    "http://localhost",
    "https://localhost",
    "capacitor://localhost",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.include_router(api_router)
    
    @app.get("/health", tags=["Health"])
    def health_check():
        return {"status": "ok"}
        
    return app

app = create_app()
