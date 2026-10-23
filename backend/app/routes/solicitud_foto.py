import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.config import database
from app.crud import crud
from app.schemas import schemas
from app.models import models
from app.routes.auth import get_current_user, require_roles
from app.routes.cliente import check_client_data_access

router = APIRouter(tags=["Fotos de Perfil"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads", "perfiles")
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _save_upload_file(file: UploadFile) -> str:
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".jpg"
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato no permitido. Solo se aceptan: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return f"/uploads/perfiles/{filename}"


# --- Endpoints de Asignación y Carga Directa (Admin / Recepción) ---

@router.post("/api/clientes/{dni}/foto", response_model=schemas.ClienteResponse)
def asignar_foto_directa(
    dni: str,
    payload: schemas.CargaFotoDirectaRequest,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(require_roles(["Admin", "Recepcionista"]))
):
    cliente = crud.get_client(db, dni=dni)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    cliente_actualizado = crud.asignar_foto_cliente(db, dni=dni, foto_url=payload.foto_url)
    return cliente_actualizado


@router.post("/api/clientes/{dni}/subir-foto", response_model=schemas.ClienteResponse)
def subir_foto_directa(
    dni: str,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(require_roles(["Admin", "Recepcionista"]))
):
    cliente = crud.get_client(db, dni=dni)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    foto_url = _save_upload_file(file)
    cliente_actualizado = crud.asignar_foto_cliente(db, dni=dni, foto_url=foto_url)
    return cliente_actualizado


# --- Endpoints de Solicitud de Cambio de Foto (Portal Socio) ---

@router.post("/api/clientes/{dni}/solicitar-cambio-foto", response_model=schemas.SolicitudFotoPerfilResponse, status_code=status.HTTP_201_CREATED)
def solicitar_cambio_foto_url(
    dni: str,
    payload: schemas.SolicitudFotoPerfilCreate,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    check_client_data_access(dni, current_user)
    cliente = crud.get_client(db, dni=dni)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    solicitud = crud.crear_solicitud_foto(db, dni_cliente=dni, foto_propuesta_url=payload.foto_propuesta_url)
    return solicitud


@router.post("/api/clientes/{dni}/subir-solicitud-foto", response_model=schemas.SolicitudFotoPerfilResponse, status_code=status.HTTP_201_CREATED)
def subir_solicitud_foto_archivo(
    dni: str,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    check_client_data_access(dni, current_user)
    cliente = crud.get_client(db, dni=dni)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    foto_url = _save_upload_file(file)
    solicitud = crud.crear_solicitud_foto(db, dni_cliente=dni, foto_propuesta_url=foto_url)
    return solicitud


@router.get("/api/clientes/{dni}/solicitud-foto-activa", response_model=Optional[schemas.SolicitudFotoPerfilResponse])
def get_solicitud_foto_activa(
    dni: str,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    check_client_data_access(dni, current_user)
    return crud.get_solicitud_activa_cliente(db, dni_cliente=dni)


# --- Endpoints de Gestión y Aprobación (Admin / Recepción) ---

@router.get("/api/solicitudes-foto/", response_model=List[schemas.SolicitudFotoPerfilResponse])
def listar_solicitudes_foto(
    estado: Optional[str] = "Pendiente",
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(require_roles(["Admin", "Recepcionista"]))
):
    return crud.get_solicitudes_foto(db, estado=estado)


@router.post("/api/solicitudes-foto/{id_solicitud}/aprobar", response_model=schemas.SolicitudFotoPerfilResponse)
def aprobar_solicitud(
    id_solicitud: int,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(require_roles(["Admin", "Recepcionista"]))
):
    solicitud = crud.aprobar_solicitud_foto(db, id_solicitud=id_solicitud, id_usuario_revisor=current_user.id_usuario)
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    return solicitud


@router.post("/api/solicitudes-foto/{id_solicitud}/rechazar", response_model=schemas.SolicitudFotoPerfilResponse)
def rechazar_solicitud(
    id_solicitud: int,
    payload: Optional[schemas.SolicitudFotoRechazoRequest] = None,
    db: Session = Depends(database.get_db),
    current_user: models.Usuario = Depends(require_roles(["Admin", "Recepcionista"]))
):
    motivo = payload.motivo_rechazo if payload else None
    solicitud = crud.rechazar_solicitud_foto(
        db, id_solicitud=id_solicitud, id_usuario_revisor=current_user.id_usuario, motivo=motivo
    )
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    return solicitud
