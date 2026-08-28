import hashlib
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
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

# --- CRUD de Usuario ---
def get_user(db: Session, user_id: int):
    return db.query(models.Usuario).filter(models.Usuario.id_usuario == user_id).first()

def get_user_by_login(db: Session, username: str):
    return db.query(models.Usuario).filter(models.Usuario.usuario_login == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Usuario).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UsuarioCreate):
    next_id = get_next_user_id(db)
    db_user = models.Usuario(
        id_usuario=next_id,
        nombre=user.nombre,
        usuario_login=user.usuario_login,
        password=hash_password(user.password),
        rol=user.rol
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

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    db.delete(db_user)
    db.commit()
    return db_user

# --- CRUD de Cliente ---
def get_client(db: Session, dni: str):
    return db.query(models.Cliente).filter(models.Cliente.dni == dni).first()

def get_clients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Cliente).offset(skip).limit(limit).all()

def create_client(db: Session, client: schemas.ClienteCreate):
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
        
    db.commit()
    db.refresh(db_client)
    return db_client

def delete_client(db: Session, dni: str):
    db_client = get_client(db, dni)
    if not db_client:
        return None
        
    # Eliminar registros de evolución e historial relacionados primero
    db.query(models.EvolucionFisica).filter(models.EvolucionFisica.dni_cliente == dni).delete()
    db.query(models.RegistroEntrenamiento).filter(models.RegistroEntrenamiento.dni_cliente == dni).delete()

    # Eliminar relacion de direccion asociada si existe
    dir_id = db_client.id_direccion
    db.delete(db_client)
    
    if dir_id:
        db_dir = db.query(models.Direccion).filter(models.Direccion.id_direccion == dir_id).first()
        if db_dir:
            db.delete(db_dir)
            
    db.commit()
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

