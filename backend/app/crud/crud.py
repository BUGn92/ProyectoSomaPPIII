import hashlib
import json
import re
from datetime import date
from decimal import Decimal
from typing import Any, List, Optional, Tuple
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
        fecha_vencimiento_apto=client.fecha_vencimiento_apto
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

# --- CRUD de Noticias / Muro de Novedades ---
def get_noticias(db: Session, limit: int = 50):
    return db.query(models.Noticia).order_by(models.Noticia.fecha_publicacion.desc(), models.Noticia.id_noticia.desc()).limit(limit).all()

def create_noticia(db: Session, noticia: schemas.NoticiaCreate, id_usuario_autor: int):
    db_noticia = models.Noticia(
        titulo=noticia.titulo,
        contenido=noticia.contenido,
        categoria=noticia.categoria or "General",
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

# --- CRUD de Rutinas ---
_RUTINA_DIAS_MARKER = "\n<!--soma-rutina-dias:v1:"
_RUTINA_DIAS_SUFFIX = "-->"


def _encode_rutina_days(observaciones: Optional[str], dias: List[List[Any]]) -> Optional[str]:
    # Persist day boundaries in a versioned suffix to avoid requiring a new database column.
    counts = [len(dia) for dia in dias]
    if not counts or any(count < 1 for count in counts):
        return observaciones
    marker = f"{_RUTINA_DIAS_MARKER}{json.dumps(counts, separators=(',', ':'))}{_RUTINA_DIAS_SUFFIX}"
    return f"{observaciones or ''}{marker}"


def decode_rutina_days(
    observaciones: Optional[str],
    detalles: List[Any]
) -> Tuple[Optional[str], List[List[Any]]]:
    notes = observaciones or ""
    marker_pattern = re.compile(r"\n?<!--soma-rutina-dias:v1:(\[[0-9,]*\])-->$")
    match = marker_pattern.search(notes)
    if not match:
        return observaciones, [detalles] if detalles else []

    try:
        counts = json.loads(match.group(1))
    except json.JSONDecodeError:
        return observaciones, [detalles] if detalles else []

    if not isinstance(counts, list) or any(not isinstance(count, int) for count in counts):
        return observaciones, [detalles] if detalles else []

    clean_notes = notes[:match.start()] or None
    if not counts or len(counts) > 7 or any(count < 1 for count in counts) or sum(counts) != len(detalles):
        return observaciones, [detalles] if detalles else []

    days = []
    offset = 0
    for count in counts:
        days.append(detalles[offset:offset + count])
        offset += count
    return clean_notes, days


def get_rutina_activa_cliente(db: Session, dni_cliente: str):
    return db.query(models.Rutina).filter(models.Rutina.dni_cliente == dni_cliente, models.Rutina.activa == True).order_by(models.Rutina.id_rutina.desc()).first()

def save_or_update_rutina_cliente(db: Session, dni_cliente: str, rutina_data: schemas.RutinaCreate, id_usuario_entrenador: int):
    detalles_por_dia = (
        [dia.detalles for dia in rutina_data.dias]
        if rutina_data.dias is not None
        else [rutina_data.detalles]
    )
    detalles_rutina = [detalle for dia in detalles_por_dia for detalle in dia]

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
        observaciones=_encode_rutina_days(rutina_data.observaciones, detalles_por_dia)
    )
    db.add(db_rutina)
    db.flush()
    
    # Insertar detalles de ejercicios incrementando secuencialmente el ID
    base_det_id = get_next_detalle_rutina_id(db)
    for i, detalle in enumerate(detalles_rutina):
        db_det = models.DetalleRutina(
            id_detalle=base_det_id + i,
            id_rutina=next_rutina_id,
            id_usuario=id_usuario_entrenador,
            id_ejercicio=detalle.id_ejercicio,
            series=detalle.series,
            repeticiones=detalle.repeticiones,
            carga=detalle.carga,
            descanso=detalle.descanso
        )
        db.add(db_det)
        
    db.commit()
    db.refresh(db_rutina)
    return db_rutina
