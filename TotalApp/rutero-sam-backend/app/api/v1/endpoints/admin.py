from decimal import Decimal
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, func

from app.dependencies import DbSession
from app.models.vendedor import Vendedor
from app.models.cliente import Cliente
from app.models.producto import Producto
from app.models.pedido import Pedido
from app.models.usuario import Usuario
from app.schemas.admin import (
    VendedorCreate,
    VendedorUpdate,
    VendedorOut,
    ClienteCreate,
    ClienteUpdate,
    ProductoCreate,
    ProductoUpdate,
    StatsOut,
)
from app.schemas.cliente import ClienteOut
from app.schemas.producto import ProductoOut
from app.schemas.pedido import PedidoOut
from app.schemas.usuario import UsuarioOut, UsuarioCreateIn, UsuarioUpdateIn

router = APIRouter(prefix="/admin", tags=["AdministraciÃƒÂ³n"])


# 1. ESTADÃƒï¿½STICAS
@router.get("/stats", response_model=StatsOut)
def obtener_estadisticas(db: DbSession) -> StatsOut:
    # Ventas totales (suma de todos los pedidos)
    suma_ventas = db.scalar(select(func.sum(Pedido.total))) or Decimal("0.00")
    
    # Conteo de pedidos
    total_pedidos = db.scalar(select(func.count(Pedido.id))) or 0
    
    # Conteo de vendedores
    total_vendedores = db.scalar(select(func.count(Vendedor.id))) or 0
    
    # Conteo de clientes activos
    total_clientes = db.scalar(select(func.count(Cliente.id)).where(Cliente.activo.is_(True))) or 0

    # Pedidos por estado
    pendientes = db.scalar(
        select(func.count(Pedido.id)).where(Pedido.estado_sincronizacion == "PENDIENTE")
    ) or 0
    despachados = db.scalar(
        select(func.count(Pedido.id)).where(Pedido.estado_sincronizacion == "DESPACHADO")
    ) or 0
    cancelados = db.scalar(
        select(func.count(Pedido.id)).where(Pedido.estado_sincronizacion == "CANCELADO")
    ) or 0

    return StatsOut(
        total_ventas=suma_ventas,
        total_pedidos=total_pedidos,
        total_vendedores=total_vendedores,
        total_clientes=total_clientes,
        pedidos_pendientes=pendientes,
        pedidos_despachados=despachados,
        pedidos_cancelados=cancelados,
    )


# 2. CRUD VENDEDORES
@router.get("/vendedores", response_model=list[VendedorOut])
def listar_vendedores(db: DbSession) -> list[Vendedor]:
    stmt = select(Vendedor).order_by(Vendedor.nombre.asc())
    return list(db.scalars(stmt).all())


@router.get("/vendedores/{vendedor_id}", response_model=VendedorOut)
def obtener_vendedor(vendedor_id: int, db: DbSession) -> Vendedor:
    vendedor = db.get(Vendedor, vendedor_id)
    if not vendedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendedor no encontrado.",
        )
    return vendedor


@router.post("/vendedores", response_model=VendedorOut, status_code=status.HTTP_201_CREATED)
def crear_vendedor(payload: VendedorCreate, db: DbSession) -> Vendedor:
    vendedor = Vendedor(
        nombre=payload.nombre,
        zona=payload.zona,
    )
    db.add(vendedor)
    db.commit()
    db.refresh(vendedor)
    return vendedor


@router.put("/vendedores/{vendedor_id}", response_model=VendedorOut)
def actualizar_vendedor(vendedor_id: int, payload: VendedorUpdate, db: DbSession) -> Vendedor:
    vendedor = db.get(Vendedor, vendedor_id)
    if not vendedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendedor no encontrado.",
        )
    vendedor.nombre = payload.nombre
    vendedor.zona = payload.zona
    db.commit()
    db.refresh(vendedor)
    return vendedor


@router.delete("/vendedores/{vendedor_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_vendedor(vendedor_id: int, db: DbSession) -> None:
    vendedor = db.get(Vendedor, vendedor_id)
    if not vendedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendedor no encontrado.",
        )
    
    # Verificar si tiene pedidos o clientes asignados
    tiene_pedidos = db.scalar(select(Pedido).where(Pedido.vendedor_id == vendedor_id).limit(1))
    tiene_clientes = db.scalar(select(Cliente).where(Cliente.vendedor_id == vendedor_id).limit(1))
    
    if tiene_pedidos or tiene_clientes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el vendedor porque tiene pedidos o clientes asociados.",
        )
        
    db.delete(vendedor)
    db.commit()


# 3. CRUD CLIENTES (COMERCIOS)
@router.get("/clientes", response_model=list[ClienteOut])
def listar_clientes(db: DbSession) -> list[Cliente]:
    stmt = select(Cliente).order_by(Cliente.secuencia_ruta.asc())
    return list(db.scalars(stmt).all())


@router.post("/clientes", response_model=ClienteOut, status_code=status.HTTP_201_CREATED)
def crear_cliente(payload: ClienteCreate, db: DbSession) -> Cliente:
    # Verificar si el cÃƒÂ³digo_pdv ya existe
    existente = db.scalar(select(Cliente).where(Cliente.codigo_pdv == payload.codigo_pdv))
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El cÃƒÂ³digo PDV ya estÃƒÂ¡ registrado.",
        )
        
    cliente = Cliente(
        codigo_pdv=payload.codigo_pdv,
        nombre=payload.nombre,
        encargado=payload.encargado,
        direccion=payload.direccion,
        latitud=payload.latitud,
        longitud=payload.longitud,
        frecuencia=payload.frecuencia,
        secuencia_ruta=payload.secuencia_ruta,
        activo=payload.activo,
        vendedor_id=payload.vendedor_id,
    )
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


@router.put("/clientes/{cliente_id}", response_model=ClienteOut)
def actualizar_cliente(cliente_id: int, payload: ClienteUpdate, db: DbSession) -> Cliente:
    cliente = db.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado.",
        )
    
    cliente.codigo_pdv = payload.codigo_pdv
    cliente.nombre = payload.nombre
    cliente.encargado = payload.encargado
    cliente.direccion = payload.direccion
    cliente.latitud = payload.latitud
    cliente.longitud = payload.longitud
    cliente.frecuencia = payload.frecuencia
    cliente.secuencia_ruta = payload.secuencia_ruta
    cliente.activo = payload.activo
    cliente.vendedor_id = payload.vendedor_id
    
    db.commit()
    db.refresh(cliente)
    return cliente


@router.delete("/clientes/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_cliente(cliente_id: int, db: DbSession) -> None:
    cliente = db.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado.",
        )
    cliente.activo = False
    db.commit()


# 4. CRUD PRODUCTOS (CATÃƒLOGO)
@router.get("/productos", response_model=list[ProductoOut])
def listar_productos(db: DbSession) -> list[Producto]:
    stmt = select(Producto).order_by(Producto.nombre.asc())
    return list(db.scalars(stmt).all())


@router.post("/productos", response_model=ProductoOut, status_code=status.HTTP_201_CREATED)
def crear_producto(payload: ProductoCreate, db: DbSession) -> Producto:
    # Verificar si el SKU ya existe
    existente = db.scalar(select(Producto).where(Producto.sku == payload.sku))
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El SKU ya estÃ¡ registrado.",
        )
        
    producto = Producto(
        sku=payload.sku,
        nombre=payload.nombre,
        precio_directo=payload.precio_directo,
        precio_distribuidor=payload.precio_distribuidor,
        inventario_disponible=payload.inventario_disponible,
        activo=payload.activo,
    )
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


@router.put("/productos/{producto_id}", response_model=ProductoOut)
def actualizar_producto(producto_id: int, payload: ProductoUpdate, db: DbSession) -> Producto:
    producto = db.get(Producto, producto_id)
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )
        
    producto.sku = payload.sku
    producto.nombre = payload.nombre
    producto.precio_directo = payload.precio_directo
    producto.precio_distribuidor = payload.precio_distribuidor
    producto.inventario_disponible = payload.inventario_disponible
    producto.activo = payload.activo
    
    db.commit()
    db.refresh(producto)
    return producto


@router.delete("/productos/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_producto(producto_id: int, db: DbSession) -> None:
    producto = db.get(Producto, producto_id)
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )
    producto.activo = False
    db.commit()


# 5. PEDIDOS GLOBALES
@router.get("/pedidos", response_model=list[PedidoOut])
def listar_pedidos_globales(db: DbSession) -> list[Pedido]:
    stmt = select(Pedido).order_by(Pedido.fecha_hora.desc())
    return list(db.scalars(stmt).all())


# 6. CRUD USUARIOS
@router.get("/usuarios", response_model=list[UsuarioOut])
def listar_usuarios(db: DbSession) -> list[Usuario]:
    stmt = select(Usuario).order_by(Usuario.username.asc())
    return list(db.scalars(stmt).all())


@router.post("/usuarios", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear_usuario(payload: UsuarioCreateIn, db: DbSession) -> Usuario:
    # Verificar si el username ya existe
    existente = db.scalar(select(Usuario).where(Usuario.username == payload.username))
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya estÃƒÂ¡ registrado.",
        )
    
    # Validar que si el rol es vendedor, tenga vendedor_id asignado
    if payload.rol == "vendedor" and not payload.vendedor_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los usuarios con rol 'vendedor' deben tener un vendedor_id asociado.",
        )
        
    usuario = Usuario(
        username=payload.username,
        password=payload.password,
        rol=payload.rol,
        vendedor_id=payload.vendedor_id,
        debe_cambiar_clave=payload.debe_cambiar_clave,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.put("/usuarios/{usuario_id}", response_model=UsuarioOut)
def actualizar_usuario(usuario_id: int, payload: UsuarioUpdateIn, db: DbSession) -> Usuario:
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )
    
    # Verificar si el nuevo username estÃƒÂ¡ en uso por otro usuario
    existente = db.scalar(
        select(Usuario)
        .where(Usuario.username == payload.username)
        .where(Usuario.id != usuario_id)
    )
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya estÃƒÂ¡ registrado.",
        )
        
    if payload.rol == "vendedor" and not payload.vendedor_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los usuarios con rol 'vendedor' deben tener un vendedor_id asociado.",
        )
        
    usuario.username = payload.username
    if payload.password:
        usuario.password = payload.password
    usuario.rol = payload.rol
    usuario.vendedor_id = payload.vendedor_id
    usuario.debe_cambiar_clave = payload.debe_cambiar_clave
    
    db.commit()
    db.refresh(usuario)
    return usuario


@router.delete("/usuarios/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_usuario(usuario_id: int, db: DbSession) -> None:
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )
        
    db.delete(usuario)
    db.commit()

from fastapi import UploadFile, File
import pandas as pd
from io import BytesIO
from app.models.cartera import FacturaPendiente

@router.post("/upload-cartera")
async def upload_cartera_siigo(db: DbSession, file: UploadFile = File(...)):
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Debe ser un archivo Excel (.xlsx)")
    
    contents = await file.read()
    try:
        df = pd.read_excel(BytesIO(contents))
        
        # Example processing logic (requires standard Siigo export columns)
        # Assuming columns: 'Codigo PDV' or 'NIT', 'Numero', 'Vencimiento', 'Total', 'Saldo'
        
        count_added = 0
        for index, row in df.iterrows():
            # This is a stub for processing. We will refine it later when the user provides the Excel.
            pass

        db.commit()
        return {"message": "Cartera procesada con Ã©xito", "nuevas_facturas": count_added}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.models.cliente import Cliente

@router.post("/upload-clientes")
async def upload_clientes_siigo(db: DbSession, file: UploadFile = File(...)):
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Debe ser un archivo Excel (.xlsx)")
    
    contents = await file.read()
    try:
        df = pd.read_excel(BytesIO(contents))
        count_added = 0
        for index, row in df.iterrows():
            # Obtener datos de las columnas
            # Handles different variations of 'Identificación'
            identificacion = str(row.get('Identificación', row.get('Identificacion', row.get('IdentificaciÃ³n', row.get('NIT', ''))))).strip()
            
            # Validar que exista identificacion
            if not identificacion or identificacion.lower() == 'nan':
                continue
                
            sucursal = str(row.get('Sucursal', '')).strip()
            # Combinamos identificacion y sucursal si existe para el codigo pdv
            codigo = f"{identificacion}-{sucursal}" if (sucursal and sucursal.lower() != 'nan') else identificacion
            
            nombre = str(row.get('Nombre tercero', row.get('Nombre', 'Cliente sin nombre'))).strip()
            
            direccion_base = str(row.get('Dirección', row.get('Direccion', row.get('Direccion ', row.get('DirecciÃ³n', ''))))).strip()
            ciudad = str(row.get('Ciudad', row.get('ciudad', ''))).strip()
            direccion = f"{direccion_base}, {ciudad}".strip(", ")
            if not direccion or direccion.lower() == 'nan':
                direccion = 'No registrada'
                
            encargado = str(row.get('Nombres contacto', row.get('Contacto', ''))).strip()
            if encargado.lower() == 'nan' or not encargado:
                encargado = None
                
            estado = str(row.get('Estado', '')).strip().lower()
            activo = estado == 'activo' if estado else True
            
            existente = db.scalar(select(Cliente).where(Cliente.codigo_pdv == codigo))
            if not existente:
                nuevo = Cliente(
                    codigo_pdv=codigo,
                    nombre=nombre,
                    direccion=direccion,
                    encargado=encargado,
                    activo=activo,
                    frecuencia="Semanal",
                    secuencia_ruta=999
                )
                db.add(nuevo)
                count_added += 1
        db.commit()
        return {"message": "Clientes procesados con Ã©xito", "nuevos_clientes": count_added}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-productos")
async def upload_productos_excel(db: DbSession, file: UploadFile = File(...)):
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Debe ser un archivo Excel (.xlsx)")
    
    contents = await file.read()
    try:
        df = pd.read_excel(BytesIO(contents))
        count_added = 0
        count_updated = 0
        for index, row in df.iterrows():
            sku = str(row.get('SKU', row.get('Referencia', row.get('Codigo', '')))).strip()
            if not sku or sku.lower() == 'nan':
                continue
                
            nombre = str(row.get('Nombre', row.get('Descripcion', row.get('Producto', 'Producto sin nombre')))).strip()
            precio_directo = float(row.get('Precio Directo', row.get('Precio', 0)))
            precio_distribuidor_val = row.get('Precio Distribuidor')
            precio_distribuidor = float(precio_distribuidor_val) if pd.notna(precio_distribuidor_val) else None
            inventario = int(row.get('Inventario', row.get('Stock', 0)))
            
            existente = db.scalar(select(Producto).where(Producto.sku == sku))
            if existente:
                existente.nombre = nombre
                existente.precio_directo = precio_directo
                existente.precio_distribuidor = precio_distribuidor
                existente.inventario_disponible = inventario
                count_updated += 1
            else:
                nuevo = Producto(
                    sku=sku,
                    nombre=nombre,
                    precio_directo=precio_directo,
                    precio_distribuidor=precio_distribuidor,
                    inventario_disponible=inventario,
                    activo=True
                )
                db.add(nuevo)
                count_added += 1
        db.commit()
        return {"message": "Productos procesados con Ã©xito", "agregados": count_added, "actualizados": count_updated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-vendedores")
async def upload_vendedores_excel(db: DbSession, file: UploadFile = File(...)):
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Debe ser un archivo Excel (.xlsx)")
    
    contents = await file.read()
    try:
        df = pd.read_excel(BytesIO(contents))
        count_added = 0
        for index, row in df.iterrows():
            nombre = str(row.get('Nombre', row.get('Vendedor', row.get('Asesor', '')))).strip()
            if not nombre or nombre.lower() == 'nan':
                continue
            zona = str(row.get('Zona', 'General')).strip()
            
            existente = db.scalar(select(Vendedor).where(Vendedor.nombre == nombre))
            if not existente:
                nuevo = Vendedor(
                    nombre=nombre,
                    zona=zona
                )
                db.add(nuevo)
                count_added += 1
        db.commit()
        return {"message": "Vendedores procesados con Ã©xito", "nuevos_vendedores": count_added}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.schemas.cliente import ClienteReorderBatchIn

@router.put("/clientes/reordenar", status_code=status.HTTP_200_OK)
def reordenar_clientes(payload: ClienteReorderBatchIn, db: DbSession):
    # Process reordering
    for c_in in payload.clientes:
        cliente_db = db.get(Cliente, c_in.id)
        if cliente_db:
            cliente_db.secuencia_ruta = c_in.secuencia_ruta
    db.commit()
    return {"message": "Ruta reordenada con éxito"}


from sqlalchemy import delete
from app.models.pedido import Pedido
from app.models.detalle_pedido import DetallePedido
from app.models.visita import Visita
from app.models.cliente import Cliente
from app.models.devolucion import Devolucion
from app.models.cartera import FacturaPendiente, Abono
from app.schemas.admin import PurgeDataIn

@router.post("/purge-data", status_code=status.HTTP_200_OK)
def purge_test_data(payload: PurgeDataIn, db: DbSession):
    try:
        if payload.purge_pedidos:
            db.execute(delete(Devolucion))
            db.execute(delete(DetallePedido))
            db.execute(delete(Pedido))
        
        if payload.purge_visitas:
            db.execute(delete(Visita))
            
        if payload.purge_clientes:
            # Foreign keys to pedidos and visitas must be cleared first.
            db.execute(delete(Abono))
            db.execute(delete(FacturaPendiente))
            db.execute(delete(Devolucion))
            db.execute(delete(DetallePedido))
            db.execute(delete(Pedido))
            db.execute(delete(Visita))
            db.execute(delete(Cliente))
            
        db.commit()
        return {"message": "Datos eliminados exitosamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
