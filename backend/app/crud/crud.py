import hashlib
from typing import Optional, List
from datetime import date, timedelta, datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from dateutil.relativedelta import relativedelta
from app.models import models
from app.schemas import schemas

# --- Utilidades de Contraseña ---
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Soporte para contraseñas sembradas (hash_falso_123, etc.)
    if hashed_password.startswith("hash_falso_"):
        # Comparación directa del hash falso o de su versión limpia
        clean_seeded = hashed_password.replace("hash_falso_", "")
        return plain_password == hashed_password or plain_password == clean_seeded
    # Comparación de texto plano en caso de que se haya sembrado directamente
    if plain_password == hashed_password:
        return True
    # Comparación por Hash SHA256 estándar
    return hash_password(plain_password) == hashed_password

# --- Generación de IDs no AUTO_INCREMENT ---
def get_next_user_id(db: Session) -> int:
    max_id = db.query(func.max(models.Usuario.id_usuario)).scalar()
    return (max_id or 0) + 1

def get_next_direccion_id(db: Session) -> int:
    max_id = db.query(func.max(models.Direccion.id_direccion)).scalar()
    return (max_id or 0) + 1

def get_next_rutina_id(db: Session) -> int:
    max_id = db.query(func.max(models.Rutina.id_rutina)).scalar()
    return (max_id or 0) + 1

def get_next_detalle_rutina_id(db: Session) -> int:
    max_id = db.query(func.max(models.DetalleRutina.id_detalle)).scalar()
    return (max_id or 0) + 1

def get_next_pago_id(db: Session) -> int:
    max_id = db.query(func.max(models.Pago.id_pago)).scalar()
    return (max_id or 0) + 1

def get_next_cliente_membresia_id(db: Session) -> int:
    max_id = db.query(func.max(models.ClienteMembresia.id_cliente_membresia)).scalar()
    return (max_id or 0) + 1

# --- CRUD de Usuario ---
def get_user(db: Session, user_id: int):
    return db.query(models.Usuario).filter(
        models.Usuario.id_usuario == user_id,
        models.Usuario.activo == True
    ).first()

def get_user_by_login(db: Session, username: str):
    return db.query(models.Usuario).filter(
        models.Usuario.usuario_login == username,
        models.Usuario.activo == True
    ).first()

def get_user_by_identifier(db: Session, identificador: str):
    """
    Busca un usuario por su usuario_login.
    Si no lo encuentra, busca un Cliente por email y retorna su usuario asociado.
    """
    # 1. Buscar directamente por usuario_login (cubre DNI para clientes y username para staff)
    user = db.query(models.Usuario).filter(
        models.Usuario.usuario_login == identificador
    ).first()
    if user:
        return user

    # 2. Buscar por email del cliente, luego obtener su usuario (login = dni)
    cliente = db.query(models.Cliente).filter(
        models.Cliente.email == identificador
    ).first()
    if cliente:
        user = db.query(models.Usuario).filter(
            models.Usuario.usuario_login == cliente.dni
        ).first()
        return user

    return None

def get_email_for_user(db: Session, user: models.Usuario) -> str:
    """
    Obtiene el email registrado del cliente asociado al usuario.
    Si no tiene cliente o email cargado, devuelve un email sintético de fallback.
    """
    cliente = db.query(models.Cliente).filter(models.Cliente.dni == user.usuario_login).first()
    if cliente and cliente.email:
        return cliente.email

    if "@" in user.usuario_login:
        return user.usuario_login

    return f"{user.usuario_login}@somagym.com"

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Usuario).filter(
        models.Usuario.activo == True
    ).offset(skip).limit(limit).all()

def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    """Retorna todos los usuarios, incluyendo los dados de baja (activo=False)."""
    return db.query(models.Usuario).offset(skip).limit(limit).all()

def get_users_con_estado_pago(db: Session, skip: int = 0, limit: int = 100, incluir_inactivos: bool = False):
    """
    Retorna todos los usuarios enriquecidos con estado de pago para socios (rol Cliente).
    Para Admin, Secretaria, Entrenador y Recepcionista, estado_pago y fecha_vencimiento_cuota son None.
    """
    query = db.query(models.Usuario)
    if not incluir_inactivos:
        query = query.filter(models.Usuario.activo == True)
    usuarios = query.offset(skip).limit(limit).all()

    hoy = date.today()
    resultado = []
    for u in usuarios:
        estado_pago = None
        fecha_venc = None
        if u.rol.lower() == "cliente":
            membresia = get_membresia_activa_cliente(db, u.usuario_login)
            if membresia is None:
                estado_pago = "Sin membresía"
            elif membresia.fecha_fin < hoy:
                estado_pago = "Vencido"
                fecha_venc = membresia.fecha_fin
            else:
                estado_pago = "Al día"
                fecha_venc = membresia.fecha_fin
        resultado.append({
            "id_usuario": u.id_usuario,
            "nombre": u.nombre,
            "usuario_login": u.usuario_login,
            "rol": u.rol,
            "activo": u.activo,
            "debe_cambiar_password": u.debe_cambiar_password,
            "estado_pago": estado_pago,
            "fecha_vencimiento_cuota": fecha_venc,
        })
    return resultado

def reactivate_user(db: Session, user_id: int):
    """Reactiva un usuario dado de baja lógicamente."""
    db_user = db.query(models.Usuario).filter(
        models.Usuario.id_usuario == user_id
    ).first()
    if not db_user:
        return None
    db_user.activo = True
    db.commit()
    db.refresh(db_user)
    return db_user

def create_user(db: Session, user: schemas.UsuarioCreate):
    next_id = get_next_user_id(db)
    db_user = models.Usuario(
        id_usuario=next_id,
        nombre=user.nombre,
        usuario_login=user.usuario_login,
        password=hash_password(user.password),
        rol=user.rol,
        debe_cambiar_password=False
    )
    db.add(db_user)
    db.flush()

    # Si se crea un usuario de rol Cliente, asegurar ficha de Cliente y asignar rutina sugerida de iniciación
    if user.rol.strip().lower() == "cliente":
        cliente_existente = db.query(models.Cliente).filter(models.Cliente.dni == user.usuario_login).first()
        if not cliente_existente:
            partes = user.nombre.strip().split(" ", 1)
            nom = partes[0]
            ape = partes[1] if len(partes) > 1 else partes[0]
            db_cli = models.Cliente(
                dni=user.usuario_login,
                nombre=nom,
                apellido=ape,
                fecha_alta=date.today(),
                activo=True
            )
            db.add(db_cli)
            db.flush()
        asignar_rutina_iniciacion_automatica(db, dni_cliente=user.usuario_login)

    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user_update: schemas.UsuarioUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["password"] = hash_password(update_data["password"])
        
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user

def cambiar_password_usuario(db: Session, user: models.Usuario, password_nueva: str):
    user.password = hash_password(password_nueva)
    user.debe_cambiar_password = False
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    # Borrado lógico: se marca como inactivo, NO se elimina de la BD
    db_user.activo = False
    db.commit()
    db.refresh(db_user)
    return db_user

# --- CRUD de Cliente ---
def get_client(db: Session, dni: str):
    return db.query(models.Cliente).filter(models.Cliente.dni == dni).first()

def get_clients(db: Session, skip: int = 0, limit: int = 100, incluir_inactivos: bool = False):
    query = db.query(models.Cliente)
    if not incluir_inactivos:
        query = query.filter(models.Cliente.activo == True)
    clients = query.offset(skip).limit(limit).all()
    if not clients:
        return clients

    vencimientos = (
        db.query(
            models.ClienteMembresia.dni_cliente,
            func.max(models.ClienteMembresia.fecha_fin),
        )
        .filter(models.ClienteMembresia.dni_cliente.in_([client.dni for client in clients]))
        .group_by(models.ClienteMembresia.dni_cliente)
        .all()
    )
    vencimiento_por_dni = {dni: fecha_fin for dni, fecha_fin in vencimientos}
    for client in clients:
        client.fecha_vencimiento_cuota = vencimiento_por_dni.get(client.dni)

    return clients

# --- Lógica de Pagos y Vigencia de Membresía ---
def calcular_nuevo_vencimiento(fecha_fin_actual: date | None, fecha_pago: date, meses: int) -> date:
    """
    Calcula la nueva fecha de vencimiento de la membresía tras un pago.
    - Si el socio está al día (fecha_fin_actual >= fecha_pago): acumula desde fecha_fin_actual.
    - Si está vencido o sin membresía: calcula desde la fecha del pago.
    """
    if fecha_fin_actual and fecha_fin_actual >= fecha_pago:
        base = fecha_fin_actual
    else:
        base = fecha_pago
    return base + relativedelta(months=meses)

def get_membresia_activa_cliente(db: Session, dni_cliente: str):
    """Retorna el registro activo de ClienteMembresia o None si no existe."""
    return (
        db.query(models.ClienteMembresia)
        .filter(models.ClienteMembresia.dni_cliente == dni_cliente)
        .order_by(models.ClienteMembresia.fecha_fin.desc())
        .first()
    )

def registrar_pago(db: Session, pago_data: schemas.PagoCreate, flush_only: bool = False):
    """
    Registra un pago y actualiza (o crea) el registro de ClienteMembresia.
    Si flush_only=True, hace flush pero no commit (para usar dentro de otra transacción).
    """
    fecha_hoy = date.today()

    # Obtener la membresía activa actual del socio
    membresia = get_membresia_activa_cliente(db, pago_data.dni_cliente)
    fecha_fin_actual = membresia.fecha_fin if membresia else None

    # Calcular la nueva fecha de vencimiento
    nueva_fecha_fin = calcular_nuevo_vencimiento(fecha_fin_actual, fecha_hoy, pago_data.meses_abonados)

    # Crear el registro inmutable de pago
    next_pago_id = get_next_pago_id(db)
    db_pago = models.Pago(
        id_pago=next_pago_id,
        dni_cliente=pago_data.dni_cliente,
        fecha_pago=fecha_hoy,
        monto=pago_data.monto,
        metodo_pago=pago_data.metodo_pago,
        descripcion=pago_data.descripcion,
        meses_abonados=pago_data.meses_abonados,
        fecha_vencimiento_cuota=nueva_fecha_fin,
    )
    db.add(db_pago)

    # Upsert de ClienteMembresia
    if membresia:
        membresia.fecha_fin = nueva_fecha_fin
        membresia.estado = "Activo"
    else:
        next_cm_id = get_next_cliente_membresia_id(db)
        db_membresia = models.ClienteMembresia(
            id_cliente_membresia=next_cm_id,
            dni_cliente=pago_data.dni_cliente,
            id_membresia=1,  # Membresía genérica; ajustar si hay catálogo
            fecha_inicio=fecha_hoy,
            fecha_fin=nueva_fecha_fin,
            estado="Activo",
        )
        db.add(db_membresia)

    if flush_only:
        db.flush()
    else:
        db.commit()
        db.refresh(db_pago)

    return db_pago

def get_pagos_cliente(db: Session, dni_cliente: str):
    """Retorna el historial cronológico de pagos del socio."""
    return (
        db.query(models.Pago)
        .filter(models.Pago.dni_cliente == dni_cliente)
        .order_by(models.Pago.fecha_pago.desc())
        .all()
    )

def get_resumen_mensual_pagos(db: Session, anio: int, mes: int) -> dict:
    """Retorna el total recaudado y cantidad de cuotas cobradas en el mes indicado."""
    resultado = (
        db.query(
            func.sum(models.Pago.monto).label("total_recaudado"),
            func.count(models.Pago.id_pago).label("cantidad_cuotas"),
        )
        .filter(
            func.year(models.Pago.fecha_pago) == anio,
            func.month(models.Pago.fecha_pago) == mes,
        )
        .first()
    )
    return {
        "anio": anio,
        "mes": mes,
        "total_recaudado": resultado.total_recaudado or Decimal("0.00"),
        "cantidad_cuotas": resultado.cantidad_cuotas or 0,
    }

def create_client(db: Session, client: schemas.ClienteConPagoCreate):
    # 1. Crear direccion si se especificaron datos de la misma
    direccion_id = None
    if client.calle or client.numero or client.ciudad:
        next_dir_id = get_next_direccion_id(db)
        db_dir = models.Direccion(
            id_direccion=next_dir_id,
            calle=client.calle,
            numero=client.numero,
            ciudad=client.ciudad
        )
        db.add(db_dir)
        db.flush()
        direccion_id = next_dir_id
        
    # 2. Crear cliente
    db_client = models.Cliente(
        dni=client.dni,
        nombre=client.nombre,
        apellido=client.apellido,
        edad=client.edad,
        id_direccion=direccion_id,
        email=client.email,
        telefono=client.telefono,
        fecha_alta=date.today(),
        activo=client.activo if client.activo is not None else True,
        apto_medico_vigente=client.apto_medico_vigente if client.apto_medico_vigente is not None else False,
        fecha_vencimiento_apto=client.fecha_vencimiento_apto,
        foto_url=client.foto_url
    )
    db.add(db_client)
    db.flush()

    # 3. Autogenerar cuenta de usuario para el socio si no existe
    existing_user = db.query(models.Usuario).filter(models.Usuario.usuario_login == client.dni).first()
    if not existing_user:
        next_user_id = get_next_user_id(db)
        db_user = models.Usuario(
            id_usuario=next_user_id,
            nombre=f"{client.nombre} {client.apellido}",
            usuario_login=client.dni,
            password=hash_password("clave1234"),
            rol="Cliente",
            debe_cambiar_password=True
        )
        db.add(db_user)
        db.flush()

    # 4. Registrar el primer pago (crea también el ClienteMembresia)
    pago_inicial = schemas.PagoCreate(
        dni_cliente=client.dni,
        monto=client.primer_pago.monto,
        metodo_pago=client.primer_pago.metodo_pago,
        meses_abonados=client.primer_pago.meses_abonados,
        descripcion=client.primer_pago.descripcion or "Pago inicial al dar de alta el socio",
    )
    registrar_pago(db=db, pago_data=pago_inicial, flush_only=True)

    # 5. Asignar automáticamente rutina sugerida de iniciación
    asignar_rutina_iniciacion_automatica(db, dni_cliente=client.dni)

    db.commit()
    db.refresh(db_client)
    return db_client


def update_client(db: Session, dni: str, client_update: schemas.ClienteUpdate):
    db_client = get_client(db, dni)
    if not db_client:
        return None
        
    update_data = client_update.model_dump(exclude_unset=True)
    
    # Manejar direccion si se especificaron cambios
    dir_fields = {"calle", "numero", "ciudad"}
    has_dir_update = any(field in update_data for field in dir_fields)
    
    if has_dir_update:
        if db_client.id_direccion:
            db_dir = db.query(models.Direccion).filter(models.Direccion.id_direccion == db_client.id_direccion).first()
            if db_dir:
                if "calle" in update_data: db_dir.calle = update_data["calle"]
                if "numero" in update_data: db_dir.numero = update_data["numero"]
                if "ciudad" in update_data: db_dir.ciudad = update_data["ciudad"]
        else:
            next_dir_id = get_next_direccion_id(db)
            db_dir = models.Direccion(
                id_direccion=next_dir_id,
                calle=update_data.get("calle"),
                numero=update_data.get("numero"),
                ciudad=update_data.get("ciudad")
            )
            db.add(db_dir)
            db.flush()
            db_client.id_direccion = next_dir_id
            
    # Limpiar campos de direccion del payload del cliente
    for field in dir_fields:
        update_data.pop(field, None)
        
    for key, value in update_data.items():
        setattr(db_client, key, value)
        
    # Si cambió el nombre o apellido, sincronizar con el nombre del usuario socio si existe
    if "nombre" in update_data or "apellido" in update_data:
        db_user = db.query(models.Usuario).filter(models.Usuario.usuario_login == dni, models.Usuario.rol == "Cliente").first()
        if db_user:
            db_user.nombre = f"{db_client.nombre} {db_client.apellido}"
        
    db.commit()
    db.refresh(db_client)
    return db_client

def delete_client(db: Session, dni: str):
    """Borrado lógico del cliente: marca activo=False. No elimina ningún registro de la BD."""
    db_client = get_client(db, dni)
    if not db_client:
        return None
    db_client.activo = False
    # Dar de baja también el usuario asociado si existe
    db_user = db.query(models.Usuario).filter(
        models.Usuario.usuario_login == dni,
        models.Usuario.rol == "Cliente"
    ).first()
    if db_user:
        db_user.activo = False
    db.commit()
    db.refresh(db_client)
    return db_client

def reactivate_client(db: Session, dni: str):
    """Reactiva un cliente dado de baja lógicamente."""
    db_client = db.query(models.Cliente).filter(models.Cliente.dni == dni).first()
    if not db_client:
        return None
    db_client.activo = True
    db_user = db.query(models.Usuario).filter(
        models.Usuario.usuario_login == dni,
        models.Usuario.rol == "Cliente"
    ).first()
    if db_user:
        db_user.activo = True
    db.commit()
    db.refresh(db_client)
    return db_client

# --- CRUD de Evolución Física ---
def get_client_evolucion_fisica(db: Session, dni_cliente: str):
    return db.query(models.EvolucionFisica).filter(models.EvolucionFisica.dni_cliente == dni_cliente).order_by(models.EvolucionFisica.fecha_medicion.desc()).all()

def create_client_evolucion_fisica(db: Session, dni_cliente: str, evolucion: schemas.EvolucionFisicaCreate):
    db_ev = models.EvolucionFisica(
        dni_cliente=dni_cliente,
        fecha_medicion=evolucion.fecha_medicion,
        peso_kg=evolucion.peso_kg,
        porcentaje_grasa=evolucion.porcentaje_grasa,
        observaciones=evolucion.observaciones
    )
    db.add(db_ev)
    db.commit()
    db.refresh(db_ev)
    return db_ev

# --- CRUD de Registro de Entrenamiento ---
def get_client_registro_entrenamiento(db: Session, dni_cliente: str):
    return db.query(models.RegistroEntrenamiento).filter(models.RegistroEntrenamiento.dni_cliente == dni_cliente).order_by(models.RegistroEntrenamiento.fecha_entrenamiento.desc()).all()

def create_client_registro_entrenamiento(db: Session, dni_cliente: str, registro: schemas.RegistroEntrenamientoCreate):
    db_reg = models.RegistroEntrenamiento(
        dni_cliente=dni_cliente,
        id_ejercicio=registro.id_ejercicio,
        fecha_entrenamiento=registro.fecha_entrenamiento,
        carga_real=registro.carga_real,
        repeticiones_logradas=registro.repeticiones_logradas
    )
    db.add(db_reg)
    db.commit()
    db.refresh(db_reg)
    return db_reg

# --- CRUD de Ejercicios ---
def get_ejercicios(db: Session):
    return db.query(models.Ejercicio).filter(models.Ejercicio.activo == True).order_by(models.Ejercicio.nombre_ejercicio.asc()).all()

def create_ejercicio(db: Session, ejercicio: schemas.EjercicioCreate):
    nombre = ejercicio.nombre_ejercicio.strip()
    grupo_muscular = ejercicio.grupo_muscular.strip()
    existente = db.query(models.Ejercicio).filter(
        func.lower(models.Ejercicio.nombre_ejercicio) == nombre.lower(),
        models.Ejercicio.activo == True,
    ).first()
    if existente:
        return None

    max_id = db.query(func.max(models.Ejercicio.id_ejercicio)).scalar()
    db_ejercicio = models.Ejercicio(
        id_ejercicio=(max_id or 0) + 1,
        nombre_ejercicio=nombre,
        grupo_muscular=grupo_muscular,
        activo=True,
    )
    db.add(db_ejercicio)
    db.commit()
    db.refresh(db_ejercicio)
    return db_ejercicio

def update_ejercicio(db: Session, id_ejercicio: int, ejercicio: schemas.EjercicioUpdate):
    db_ejercicio = db.query(models.Ejercicio).filter(
        models.Ejercicio.id_ejercicio == id_ejercicio,
        models.Ejercicio.activo == True,
    ).first()
    if not db_ejercicio:
        return None

    nombre = ejercicio.nombre_ejercicio.strip()
    duplicado = db.query(models.Ejercicio).filter(
        models.Ejercicio.id_ejercicio != id_ejercicio,
        models.Ejercicio.activo == True,
        func.lower(models.Ejercicio.nombre_ejercicio) == nombre.lower(),
    ).first()
    if duplicado:
        return False

    db_ejercicio.nombre_ejercicio = nombre
    db_ejercicio.grupo_muscular = ejercicio.grupo_muscular.strip()
    db.commit()
    db.refresh(db_ejercicio)
    return db_ejercicio

def delete_ejercicio(db: Session, id_ejercicio: int):
    db_ejercicio = db.query(models.Ejercicio).filter(
        models.Ejercicio.id_ejercicio == id_ejercicio,
        models.Ejercicio.activo == True,
    ).first()
    if not db_ejercicio:
        return None
    db_ejercicio.activo = False
    db.commit()
    db.refresh(db_ejercicio)
    return db_ejercicio

# --- CRUD de Noticias / Muro de Novedades ---
def get_noticias(db: Session, limit: int = 50):
    limite_vencimiento = date.today() - timedelta(days=60)
    return (
        db.query(models.Noticia)
        .filter(models.Noticia.fecha_publicacion >= limite_vencimiento)
        .order_by(models.Noticia.fecha_publicacion.desc(), models.Noticia.id_noticia.desc())
        .limit(limit)
        .all()
    )

def create_noticia(db: Session, noticia: schemas.NoticiaCreate, id_usuario_autor: int):
    db_noticia = models.Noticia(
        titulo=noticia.titulo,
        contenido=noticia.contenido,
        categoria=noticia.categoria or "General",
        imagen_url=noticia.imagen_url,
        fecha_publicacion=date.today(),
        id_usuario_autor=id_usuario_autor
    )
    db.add(db_noticia)
    db.commit()
    db.refresh(db_noticia)
    return db_noticia

def delete_noticia(db: Session, id_noticia: int):
    db_noticia = db.query(models.Noticia).filter(models.Noticia.id_noticia == id_noticia).first()
    if not db_noticia:
        return None
    db.delete(db_noticia)
    db.commit()
    return db_noticia

def limpiar_noticias_vencidas(db: Session, dias: int = 60) -> int:
    limite_vencimiento = date.today() - timedelta(days=dias)
    registros_eliminados = (
        db.query(models.Noticia)
        .filter(models.Noticia.fecha_publicacion < limite_vencimiento)
        .delete(synchronize_session=False)
    )
    db.commit()
    return registros_eliminados

# --- CRUD de Rutinas ---
def get_rutina_activa_cliente(db: Session, dni_cliente: str):
    return db.query(models.Rutina).filter(models.Rutina.dni_cliente == dni_cliente, models.Rutina.activa == True).order_by(models.Rutina.id_rutina.desc()).first()

def save_or_update_rutina_cliente(db: Session, dni_cliente: str, rutina_data: schemas.RutinaCreate, id_usuario_entrenador: int):
    detalles_por_dia = (
        [dia.detalles for dia in rutina_data.dias]
        if rutina_data.dias is not None
        else [rutina_data.detalles]
    )

    # Desactivar rutinas anteriores
    rutinas_ant = db.query(models.Rutina).filter(models.Rutina.dni_cliente == dni_cliente).all()
    for r in rutinas_ant:
        r.activa = False
        
    next_rutina_id = get_next_rutina_id(db)
    db_rutina = models.Rutina(
        id_rutina=next_rutina_id,
        dni_cliente=dni_cliente,
        fecha_inicio=rutina_data.fecha_inicio,
        periodo=rutina_data.periodo,
        objetivo=rutina_data.objetivo,
        activa=True,
        observaciones=rutina_data.observaciones
    )
    db.add(db_rutina)
    db.flush()
    
    # Insertar detalles de ejercicios incrementando secuencialmente el ID
    base_det_id = get_next_detalle_rutina_id(db)
    detalle_index = 0
    for numero_dia, detalles in enumerate(detalles_por_dia, start=1):
        for detalle in detalles:
            db_det = models.DetalleRutina(
                id_detalle=base_det_id + detalle_index,
                id_rutina=next_rutina_id,
                id_usuario=id_usuario_entrenador,
                id_ejercicio=detalle.id_ejercicio,
                dia=numero_dia,
                series=detalle.series,
                repeticiones=detalle.repeticiones,
                carga=detalle.carga,
                descanso=detalle.descanso
            )
            db.add(db_det)
            detalle_index += 1
        
    db.commit()
    db.refresh(db_rutina)
    return db_rutina


def asegurar_historico_mensual_rutina(db: Session, dni_cliente: str):
    """
    Verifica si han transcurrido meses calendario desde la fecha de inicio de la rutina activa
    y genera automáticamente instantáneas históricas (snapshots mensuales con activa=False)
    para cada mes transcurrido sin registro de rutina.
    """
    rutina_activa = (
        db.query(models.Rutina)
        .filter(models.Rutina.dni_cliente == dni_cliente, models.Rutina.activa == True)
        .order_by(models.Rutina.id_rutina.desc())
        .first()
    )
    if not rutina_activa:
        return

    rutinas = db.query(models.Rutina).filter(models.Rutina.dni_cliente == dni_cliente).all()
    meses_registrados = {(r.fecha_inicio.year, r.fecha_inicio.month) for r in rutinas}

    hoy = date.today()
    y = rutina_activa.fecha_inicio.year
    m = rutina_activa.fecha_inicio.month

    cambios = False
    while True:
        m += 1
        if m > 12:
            m = 1
            y += 1
        if (y, m) > (hoy.year, hoy.month):
            break

        if (y, m) not in meses_registrados:
            next_rutina_id = get_next_rutina_id(db)
            snapshot = models.Rutina(
                id_rutina=next_rutina_id,
                dni_cliente=dni_cliente,
                fecha_inicio=date(y, m, 1),
                periodo=rutina_activa.periodo,
                objetivo=rutina_activa.objetivo,
                activa=False,
                observaciones=f"Instantánea mensual automática ({m:02d}/{y})"
            )
            db.add(snapshot)
            db.flush()

            detalles_activa = db.query(models.DetalleRutina).filter(models.DetalleRutina.id_rutina == rutina_activa.id_rutina).all()
            base_det_id = get_next_detalle_rutina_id(db)
            for idx, det in enumerate(detalles_activa):
                db_det = models.DetalleRutina(
                    id_detalle=base_det_id + idx,
                    id_rutina=next_rutina_id,
                    id_usuario=det.id_usuario,
                    id_ejercicio=det.id_ejercicio,
                    dia=det.dia,
                    series=det.series,
                    repeticiones=det.repeticiones,
                    carga=det.carga,
                    descanso=det.descanso
                )
                db.add(db_det)

            meses_registrados.add((y, m))
            cambios = True

    if cambios:
        db.commit()


def get_ejercicios_historico_rutinas(db: Session, dni_cliente: str):
    """
    Retorna la lista de ejercicios que forman parte del historial de rutinas del socio
    (tanto activas como archivadas/históricas).
    """
    asegurar_historico_mensual_rutina(db, dni_cliente)

    ejercicios = (
        db.query(
            models.Ejercicio.id_ejercicio,
            models.Ejercicio.nombre_ejercicio,
            models.Ejercicio.grupo_muscular
        )
        .join(models.DetalleRutina, models.DetalleRutina.id_ejercicio == models.Ejercicio.id_ejercicio)
        .join(models.Rutina, models.Rutina.id_rutina == models.DetalleRutina.id_rutina)
        .filter(models.Rutina.dni_cliente == dni_cliente)
        .distinct()
        .order_by(models.Ejercicio.nombre_ejercicio.asc())
        .all()
    )

    return [
        {
            "id_ejercicio": e.id_ejercicio,
            "nombre_ejercicio": e.nombre_ejercicio,
            "grupo_muscular": e.grupo_muscular
        }
        for e in ejercicios
    ]


def get_progreso_ejercicio_rutinas(db: Session, dni_cliente: str, id_ejercicio: int, anio: Optional[int] = None):
    """
    Retorna la evolución mensual del ejercicio seleccionado a partir de las rutinas históricas.
    Calcula el PR (Personal Record) como el máximo de los últimos 3 meses cargados (si no se
    alcanza en 3 meses consecutivos, baja automáticamente).
    Permite paginación por año calendario (máximo 12 meses en pantalla).
    """
    asegurar_historico_mensual_rutina(db, dni_cliente)

    ejercicio = db.query(models.Ejercicio).filter(models.Ejercicio.id_ejercicio == id_ejercicio).first()
    if not ejercicio:
        return None

    registros = (
        db.query(
            models.Rutina.id_rutina,
            models.Rutina.fecha_inicio,
            models.Rutina.objetivo,
            models.Rutina.activa,
            models.DetalleRutina.carga,
            models.DetalleRutina.series,
            models.DetalleRutina.repeticiones
        )
        .join(models.DetalleRutina, models.DetalleRutina.id_rutina == models.Rutina.id_rutina)
        .filter(
            models.Rutina.dni_cliente == dni_cliente,
            models.DetalleRutina.id_ejercicio == id_ejercicio
        )
        .order_by(models.Rutina.fecha_inicio.asc(), models.Rutina.id_rutina.asc())
        .all()
    )

    MESES_ES = {
        1: "Ene", 2: "Feb", 3: "Mar", 4: "Abr", 5: "May", 6: "Jun",
        7: "Jul", 8: "Ago", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic"
    }

    puntos_por_mes = {}
    for r in registros:
        periodo_mes = f"{r.fecha_inicio.year}-{r.fecha_inicio.month:02d}"
        etiqueta_mes = f"{MESES_ES.get(r.fecha_inicio.month, '')} {r.fecha_inicio.year}"
        carga_val = float(r.carga) if r.carga is not None else 0.0
        volumen = round(carga_val * r.series * r.repeticiones, 2)

        if periodo_mes in puntos_por_mes:
            prev = puntos_por_mes[periodo_mes]
            if prev["id_rutina"] == r.id_rutina:
                if carga_val > prev["carga"]:
                    prev["carga"] = carga_val
                    prev["series"] = r.series
                    prev["repeticiones"] = r.repeticiones
                    prev["volumen_total"] = volumen
                continue

        puntos_por_mes[periodo_mes] = {
            "id_rutina": r.id_rutina,
            "fecha": r.fecha_inicio,
            "periodo_mes": periodo_mes,
            "etiqueta_mes": etiqueta_mes,
            "carga": carga_val,
            "series": r.series,
            "repeticiones": r.repeticiones,
            "volumen_total": volumen,
            "objetivo": r.objetivo or "General",
            "activa": bool(r.activa)
        }

    puntos_ordenados = [puntos_por_mes[k] for k in sorted(puntos_por_mes.keys())]

    # Calcular PR rodante de los últimos 3 meses para cada punto de la serie histórica
    for idx, p in enumerate(puntos_ordenados):
        ventana = puntos_ordenados[max(0, idx - 2) : idx + 1]
        cargas_ventana = [pt["carga"] for pt in ventana]
        pr_ventana = max(cargas_ventana) if cargas_ventana else 0.0
        p["pr_ventana"] = pr_ventana
        p["es_pr"] = (p["carga"] == pr_ventana and pr_ventana > 0)

    # Calcular PR vigente actual (máximo de los últimos 3 meses registrados)
    ultimos_3 = puntos_ordenados[-3:] if len(puntos_ordenados) >= 3 else puntos_ordenados
    pr_vigente = max([pt["carga"] for pt in ultimos_3]) if ultimos_3 else 0.0
    pr_vigente_mes = next((pt["etiqueta_mes"] for pt in reversed(ultimos_3) if pt["carga"] == pr_vigente), None)

    # Años disponibles para paginación
    anios_disponibles = sorted(list({p["fecha"].year for p in puntos_ordenados}))
    if not anios_disponibles:
        anios_disponibles = [date.today().year]

    if anio is None or anio not in anios_disponibles:
        anio = anios_disponibles[-1]

    # Filtrar puntos exclusivamente para el año seleccionado (máximo 12 meses en pantalla)
    puntos_anio = [p for p in puntos_ordenados if p["fecha"].year == anio]

    return {
        "id_ejercicio": ejercicio.id_ejercicio,
        "nombre_ejercicio": ejercicio.nombre_ejercicio,
        "grupo_muscular": ejercicio.grupo_muscular,
        "anios_disponibles": anios_disponibles,
        "anio_seleccionado": anio,
        "pr_vigente": pr_vigente,
        "pr_vigente_mes": pr_vigente_mes,
        "puntos": puntos_anio
    }




# --- CRUD de Fotos de Perfil y Solicitudes (SOMA-09) ---

def asignar_foto_cliente(db: Session, dni: str, foto_url: str):
    cliente = db.query(models.Cliente).filter(models.Cliente.dni == dni).first()
    if not cliente:
        return None
    cliente.foto_url = foto_url
    db.commit()
    db.refresh(cliente)
    return cliente


def crear_solicitud_foto(db: Session, dni_cliente: str, foto_propuesta_url: str):
    # Si existía alguna solicitud pendiente previa, la cancelamos/reemplazamos
    solicitudes_previas = db.query(models.SolicitudFotoPerfil).filter(
        models.SolicitudFotoPerfil.dni_cliente == dni_cliente,
        models.SolicitudFotoPerfil.estado == "Pendiente"
    ).all()
    for s in solicitudes_previas:
        s.estado = "Reemplazada"
        s.fecha_resolucion = datetime.utcnow()

    nueva_solicitud = models.SolicitudFotoPerfil(
        dni_cliente=dni_cliente,
        foto_propuesta_url=foto_propuesta_url,
        fecha_solicitud=datetime.utcnow(),
        estado="Pendiente"
    )
    db.add(nueva_solicitud)
    db.commit()
    db.refresh(nueva_solicitud)
    return nueva_solicitud


def get_solicitudes_foto(db: Session, estado: str = None):
    query = db.query(models.SolicitudFotoPerfil)
    if estado:
        query = query.filter(models.SolicitudFotoPerfil.estado == estado)
    return query.order_by(models.SolicitudFotoPerfil.fecha_solicitud.desc()).all()


def get_solicitud_foto(db: Session, id_solicitud: int):
    return db.query(models.SolicitudFotoPerfil).filter(
        models.SolicitudFotoPerfil.id_solicitud == id_solicitud
    ).first()


def get_solicitud_activa_cliente(db: Session, dni_cliente: str):
    return db.query(models.SolicitudFotoPerfil).filter(
        models.SolicitudFotoPerfil.dni_cliente == dni_cliente,
        models.SolicitudFotoPerfil.estado == "Pendiente"
    ).order_by(models.SolicitudFotoPerfil.fecha_solicitud.desc()).first()


def aprobar_solicitud_foto(db: Session, id_solicitud: int, id_usuario_revisor: int):
    solicitud = get_solicitud_foto(db, id_solicitud)
    if not solicitud:
        return None
    solicitud.estado = "Aprobada"
    solicitud.id_usuario_revisor = id_usuario_revisor
    solicitud.fecha_resolucion = datetime.utcnow()

    cliente = db.query(models.Cliente).filter(models.Cliente.dni == solicitud.dni_cliente).first()
    if cliente:
        cliente.foto_url = solicitud.foto_propuesta_url

    db.commit()
    db.refresh(solicitud)
    return solicitud


def rechazar_solicitud_foto(db: Session, id_solicitud: int, id_usuario_revisor: int, motivo: str = None):
    solicitud = get_solicitud_foto(db, id_solicitud)
    if not solicitud:
        return None
    solicitud.estado = "Rechazada"
    solicitud.motivo_rechazo = motivo
    solicitud.id_usuario_revisor = id_usuario_revisor
    solicitud.fecha_resolucion = datetime.utcnow()

    db.commit()
    db.refresh(solicitud)
    return solicitud


# --- CRUD de Plantillas de Rutinas (Iniciación y Objetivos) ---

PLANTILLAS_SEMILLA = [
    {
        "id_plantilla": 1,
        "nombre": "Iniciación y Acondicionamiento (3 Días)",
        "objetivo": "Iniciación / Acondicionamiento Físico General",
        "nivel": "Principiante",
        "dias_semana": 3,
        "duracion_estimada_min": 50,
        "observaciones": "Rutina full-body de 3 días para adaptación anatómica y técnica. Calentamiento previo de 8-10 min y vuelta a la calma de 5 min. Cargas moderadas (RPE 6-7).",
        "activo": True,
        "detalles": [
            # Día 1
            {"dia": 1, "id_ejercicio": 2, "series": 3, "repeticiones": 10, "carga_sugerida": Decimal("20.00"), "descanso": "90 seg"},
            {"dia": 1, "id_ejercicio": 1, "series": 3, "repeticiones": 10, "carga_sugerida": Decimal("25.00"), "descanso": "90 seg"},
            {"dia": 1, "id_ejercicio": 3, "series": 3, "repeticiones": 10, "carga_sugerida": Decimal("0.00"), "descanso": "60 seg"},
            {"dia": 1, "id_ejercicio": 4, "series": 3, "repeticiones": 10, "carga_sugerida": Decimal("15.00"), "descanso": "60 seg"},
            {"dia": 1, "id_ejercicio": 6, "series": 3, "repeticiones": 12, "carga_sugerida": Decimal("15.00"), "descanso": "60 seg"},
            # Día 2
            {"dia": 2, "id_ejercicio": 7, "series": 3, "repeticiones": 10, "carga_sugerida": Decimal("30.00"), "descanso": "90 seg"},
            {"dia": 2, "id_ejercicio": 3, "series": 3, "repeticiones": 8, "carga_sugerida": Decimal("0.00"), "descanso": "90 seg"},
            {"dia": 2, "id_ejercicio": 1, "series": 3, "repeticiones": 12, "carga_sugerida": Decimal("20.00"), "descanso": "60 seg"},
            {"dia": 2, "id_ejercicio": 4, "series": 3, "repeticiones": 10, "carga_sugerida": Decimal("15.00"), "descanso": "60 seg"},
            {"dia": 2, "id_ejercicio": 5, "series": 3, "repeticiones": 12, "carga_sugerida": Decimal("15.00"), "descanso": "60 seg"},
            # Día 3
            {"dia": 3, "id_ejercicio": 2, "series": 3, "repeticiones": 12, "carga_sugerida": Decimal("20.00"), "descanso": "90 seg"},
            {"dia": 3, "id_ejercicio": 1, "series": 3, "repeticiones": 10, "carga_sugerida": Decimal("25.00"), "descanso": "90 seg"},
            {"dia": 3, "id_ejercicio": 3, "series": 3, "repeticiones": 10, "carga_sugerida": Decimal("90.00"), "descanso": "90 seg"},
            {"dia": 3, "id_ejercicio": 5, "series": 3, "repeticiones": 12, "carga_sugerida": Decimal("15.00"), "descanso": "60 seg"},
            {"dia": 3, "id_ejercicio": 6, "series": 3, "repeticiones": 12, "carga_sugerida": Decimal("15.00"), "descanso": "60 seg"},
        ]
    },
    {
        "id_plantilla": 2,
        "nombre": "Pérdida de Peso y Tonificación (3 Días)",
        "objetivo": "Pérdida de Peso / Tonificación",
        "nivel": "Principiante / Intermedio",
        "dias_semana": 3,
        "duracion_estimada_min": 45,
        "observaciones": "Rutina dinámica de alta densidad metabólica para optimizar gasto calórico. Respetar descansos cortos de 45 a 60 segundos.",
        "activo": True,
        "detalles": [
            # Día 1
            {"dia": 1, "id_ejercicio": 2, "series": 4, "repeticiones": 15, "carga_sugerida": Decimal("20.00"), "descanso": "45 seg"},
            {"dia": 1, "id_ejercicio": 1, "series": 3, "repeticiones": 12, "carga_sugerida": Decimal("20.00"), "descanso": "45 seg"},
            {"dia": 1, "id_ejercicio": 3, "series": 3, "repeticiones": 10, "carga_sugerida": Decimal("0.00"), "descanso": "45 seg"},
            {"dia": 1, "id_ejercicio": 6, "series": 3, "repeticiones": 15, "carga_sugerida": Decimal("10.00"), "descanso": "45 seg"},
            # Día 2
            {"dia": 2, "id_ejercicio": 7, "series": 4, "repeticiones": 12, "carga_sugerida": Decimal("30.00"), "descanso": "60 seg"},
            {"dia": 2, "id_ejercicio": 4, "series": 3, "repeticiones": 12, "carga_sugerida": Decimal("15.00"), "descanso": "45 seg"},
            {"dia": 2, "id_ejercicio": 5, "series": 3, "repeticiones": 15, "carga_sugerida": Decimal("10.00"), "descanso": "45 seg"},
            {"dia": 2, "id_ejercicio": 6, "series": 3, "repeticiones": 15, "carga_sugerida": Decimal("10.00"), "descanso": "45 seg"},
            # Día 3
            {"dia": 3, "id_ejercicio": 2, "series": 3, "repeticiones": 15, "carga_sugerida": Decimal("25.00"), "descanso": "45 seg"},
            {"dia": 3, "id_ejercicio": 3, "series": 3, "repeticiones": 12, "carga_sugerida": Decimal("0.00"), "descanso": "45 seg"},
            {"dia": 3, "id_ejercicio": 1, "series": 3, "repeticiones": 12, "carga_sugerida": Decimal("20.00"), "descanso": "45 seg"},
            {"dia": 3, "id_ejercicio": 5, "series": 3, "repeticiones": 15, "carga_sugerida": Decimal("10.00"), "descanso": "45 seg"},
        ]
    },
    {
        "id_plantilla": 3,
        "nombre": "Musculación e Hipertrofia (4 Días)",
        "objetivo": "Hipertrofia Muscular",
        "nivel": "Intermedio",
        "dias_semana": 4,
        "duracion_estimada_min": 55,
        "observaciones": "Distribución torso/pierna para sobrecarga progresiva y volumen efectivo. Descansos controlados de 90 segundos.",
        "activo": True,
        "detalles": [
            # Día 1: Torso A
            {"dia": 1, "id_ejercicio": 1, "series": 4, "repeticiones": 8, "carga_sugerida": Decimal("50.00"), "descanso": "90 seg"},
            {"dia": 1, "id_ejercicio": 3, "series": 4, "repeticiones": 8, "carga_sugerida": Decimal("0.00"), "descanso": "90 seg"},
            {"dia": 1, "id_ejercicio": 4, "series": 3, "repeticiones": 10, "carga_sugerida": Decimal("25.00"), "descanso": "90 seg"},
            {"dia": 1, "id_ejercicio": 5, "series": 3, "repeticiones": 10, "carga_sugerida": Decimal("20.00"), "descanso": "60 seg"},
            # Día 2: Pierna A
            {"dia": 2, "id_ejercicio": 2, "series": 4, "repeticiones": 8, "carga_sugerida": Decimal("60.00"), "descanso": "90 seg"},
            {"dia": 2, "id_ejercicio": 7, "series": 3, "repeticiones": 8, "carga_sugerida": Decimal("60.00"), "descanso": "90 seg"},
            {"dia": 2, "id_ejercicio": 6, "series": 3, "repeticiones": 12, "carga_sugerida": Decimal("20.00"), "descanso": "60 seg"},
            # Día 3: Torso B
            {"dia": 3, "id_ejercicio": 3, "series": 4, "repeticiones": 10, "carga_sugerida": Decimal("0.00"), "descanso": "90 seg"},
            {"dia": 3, "id_ejercicio": 1, "series": 4, "repeticiones": 10, "carga_sugerida": Decimal("45.00"), "descanso": "90 seg"},
            {"dia": 3, "id_ejercicio": 4, "series": 3, "repeticiones": 8, "carga_sugerida": Decimal("30.00"), "descanso": "90 seg"},
            {"dia": 3, "id_ejercicio": 6, "series": 3, "repeticiones": 10, "carga_sugerida": Decimal("25.00"), "descanso": "60 seg"},
            # Día 4: Pierna B
            {"dia": 4, "id_ejercicio": 7, "series": 4, "repeticiones": 6, "carga_sugerida": Decimal("70.00"), "descanso": "90 seg"},
            {"dia": 4, "id_ejercicio": 2, "series": 4, "repeticiones": 10, "carga_sugerida": Decimal("50.00"), "descanso": "90 seg"},
            {"dia": 4, "id_ejercicio": 5, "series": 3, "repeticiones": 10, "carga_sugerida": Decimal("20.00"), "descanso": "60 seg"},
        ]
    },
    {
        "id_plantilla": 4,
        "nombre": "Fuerza y Halterofilia (3 Días)",
        "objetivo": "Fuerza / Halterofilia",
        "nivel": "Avanzado",
        "dias_semana": 3,
        "duracion_estimada_min": 60,
        "observaciones": "Enfoque en levantamientos básicos pesados multiarticulares. Descansos completos de 2 minutos para reposición energética.",
        "activo": True,
        "detalles": [
            # Día 1
            {"dia": 1, "id_ejercicio": 2, "series": 5, "repeticiones": 5, "carga_sugerida": Decimal("75.00"), "descanso": "120 seg"},
            {"dia": 1, "id_ejercicio": 1, "series": 5, "repeticiones": 5, "carga_sugerida": Decimal("65.00"), "descanso": "120 seg"},
            {"dia": 1, "id_ejercicio": 3, "series": 3, "repeticiones": 6, "carga_sugerida": Decimal("0.00"), "descanso": "90 seg"},
            # Día 2
            {"dia": 2, "id_ejercicio": 7, "series": 5, "repeticiones": 5, "carga_sugerida": Decimal("85.00"), "descanso": "120 seg"},
            {"dia": 2, "id_ejercicio": 4, "series": 5, "repeticiones": 5, "carga_sugerida": Decimal("40.00"), "descanso": "120 seg"},
            {"dia": 2, "id_ejercicio": 5, "series": 3, "repeticiones": 8, "carga_sugerida": Decimal("25.00"), "descanso": "90 seg"},
            # Día 3
            {"dia": 3, "id_ejercicio": 2, "series": 4, "repeticiones": 4, "carga_sugerida": Decimal("80.00"), "descanso": "120 seg"},
            {"dia": 3, "id_ejercicio": 1, "series": 4, "repeticiones": 4, "carga_sugerida": Decimal("70.00"), "descanso": "120 seg"},
            {"dia": 3, "id_ejercicio": 7, "series": 3, "repeticiones": 4, "carga_sugerida": Decimal("90.00"), "descanso": "120 seg"},
        ]
    }
]


def seed_plantillas_rutina_if_empty(db: Session):
    count = db.query(models.PlantillaRutina).count()
    if count == 0:
        for p in PLANTILLAS_SEMILLA:
            plantilla_db = models.PlantillaRutina(
                id_plantilla=p["id_plantilla"],
                nombre=p["nombre"],
                objetivo=p["objetivo"],
                nivel=p["nivel"],
                dias_semana=p["dias_semana"],
                duracion_estimada_min=p["duracion_estimada_min"],
                observaciones=p["observaciones"],
                activo=p["activo"]
            )
            db.add(plantilla_db)
            db.flush()

            for det in p["detalles"]:
                detalle_db = models.DetallePlantillaRutina(
                    id_plantilla=plantilla_db.id_plantilla,
                    id_ejercicio=det["id_ejercicio"],
                    dia=det["dia"],
                    series=det["series"],
                    repeticiones=det["repeticiones"],
                    carga_sugerida=det["carga_sugerida"],
                    descanso=det["descanso"]
                )
                db.add(detalle_db)
        db.commit()


def get_plantillas_rutina(db: Session, objetivo: Optional[str] = None):
    seed_plantillas_rutina_if_empty(db)
    query = db.query(models.PlantillaRutina).filter(models.PlantillaRutina.activo == True)
    if objetivo:
        query = query.filter(models.PlantillaRutina.objetivo.ilike(f"%{objetivo}%"))
    return query.order_by(models.PlantillaRutina.id_plantilla.asc()).all()


def get_plantilla_rutina_by_id(db: Session, id_plantilla: int):
    seed_plantillas_rutina_if_empty(db)
    return db.query(models.PlantillaRutina).filter(
        models.PlantillaRutina.id_plantilla == id_plantilla,
        models.PlantillaRutina.activo == True
    ).first()


def asignar_rutina_iniciacion_automatica(db: Session, dni_cliente: str, id_usuario_entrenador: Optional[int] = None):
    """
    Asigna automáticamente la rutina sugerida de iniciación (Plantilla 1 - 3 días)
    a un cliente nuevo o que no tenga una rutina activa asignada.
    """
    # Si el cliente ya tiene una rutina activa, no duplicar
    rutina_existente = db.query(models.Rutina).filter(
        models.Rutina.dni_cliente == dni_cliente,
        models.Rutina.activa == True
    ).first()
    if rutina_existente:
        return rutina_existente

    # Asegurar plantillas sembradas y obtener plantilla de iniciación
    seed_plantillas_rutina_if_empty(db)
    plantilla = db.query(models.PlantillaRutina).filter(
        models.PlantillaRutina.id_plantilla == 1
    ).first()
    if not plantilla:
        return None

    # Entrenador responsable por defecto
    if not id_usuario_entrenador:
        trainer = db.query(models.Usuario).filter(models.Usuario.rol == "Entrenador", models.Usuario.activo == True).first()
        if not trainer:
            trainer = db.query(models.Usuario).filter(models.Usuario.rol == "Admin", models.Usuario.activo == True).first()
        id_usuario_entrenador = trainer.id_usuario if trainer else 1

    next_rutina_id = get_next_rutina_id(db)
    db_rutina = models.Rutina(
        id_rutina=next_rutina_id,
        dni_cliente=dni_cliente,
        fecha_inicio=date.today(),
        periodo=4,
        objetivo=plantilla.objetivo,
        activa=True,
        observaciones=plantilla.observaciones
    )
    db.add(db_rutina)
    db.flush()

    base_det_id = get_next_detalle_rutina_id(db)
    detalle_index = 0
    for det_p in plantilla.detalles:
        db_det = models.DetalleRutina(
            id_detalle=base_det_id + detalle_index,
            id_rutina=next_rutina_id,
            id_usuario=id_usuario_entrenador,
            id_ejercicio=det_p.id_ejercicio,
            dia=det_p.dia,
            series=det_p.series,
            repeticiones=det_p.repeticiones,
            carga=det_p.carga_sugerida,
            descanso=det_p.descanso
        )
        db.add(db_det)
        detalle_index += 1

    db.flush()
    return db_rutina


