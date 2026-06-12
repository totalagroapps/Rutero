# Rutero SAM Backend

Backend FastAPI para gestionar ruta de clientes, catalogo de productos y sincronizacion offline-first de pedidos.

## Requisitos

- Python 3.12+
- PostgreSQL

## Configuracion local

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edita `.env` con tu conexion local de PostgreSQL.

Si quieres usar una base local aislada con Docker:

```bash
docker compose up -d
copy .env.example .env
```

La conexion por defecto queda en:

```txt
postgresql+psycopg://rutero:rutero123@localhost:5433/rutero_db
```

## Ejecutar

```bash
uvicorn app.main:app --reload
```

Swagger:

```txt
http://127.0.0.1:8000/docs
```

## Error comun de conexion PostgreSQL

Si ves un error como:

```txt
password authentication failed for user "postgres"
```

significa que el archivo `.env` tiene usuario o contrasena incorrectos para tu PostgreSQL local. Puedes resolverlo de una de estas formas:

- Cambiar `DATABASE_URL` en `.env` con la clave real de tu PostgreSQL.
- Usar el `docker-compose.yml` incluido, que levanta PostgreSQL en el puerto `5433` con las credenciales del `.env.example`.

## Endpoints principales

- `GET /api/v1/ruta/1`
- `GET /api/v1/catalogo`
- `POST /api/v1/pedidos/sync`
